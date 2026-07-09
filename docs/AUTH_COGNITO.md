# Autenticación con AWS Cognito — OIDC / Hosted UI (Etapa 2)

Estado del proyecto, decisiones y pasos pendientes para retomar la
implementación en cualquier momento.

**Método único de acceso al panel**: OAuth 2.0 / OIDC con el Hosted UI de
Cognito (código de autorización + PKCE). El formulario de usuario/contraseña
embebido y los botones de login social fueron eliminados (2026-07-09).

## Estado actual (2026-07-09)

| Pieza | Estado |
|---|---|
| Flujo OIDC en el front (`src/app/services/auth.ts`) | ✅ Redirección + PKCE + intercambio y refresh de tokens |
| Botón único de acceso en `LoginPage` | ✅ Redirige al Hosted UI; modo simulado sin env vars |
| Retorno del Hosted UI (`?code=`) en `App.tsx` | ✅ Intercambia el código y entra al panel |
| Token Bearer (ID token) en todas las peticiones | ✅ Con renovación automática |
| Logout local + Hosted UI | ✅ Requiere logout URL registrada |
| User Pool | ✅ `us-east-1_jyq6Yp72h` |
| App client (con secret) | ✅ `41nl041ggahj0of3qsh6l0kkne` |
| Dominio del Hosted UI | ⬜ Crear y ponerlo en `VITE_COGNITO_DOMAIN` |
| Callback/logout URLs en el app client | ⬜ Registrar (ver abajo) |
| **Guard JWT en el backend Go** (rutas de mutación) | ✅ `internal/auth` valida firma RS256/JWKS, exp, issuer y audiencia |
| JWT authorizer en API Gateway | ⬜ Pendiente (defensa adicional; el guard del backend ya protege) |

## URLs a registrar en Cognito (App client → Hosted UI)

- **Allowed callback URLs**:
  - `http://localhost:5173/` (desarrollo)
  - `https://<dominio-productivo>/` (ej. `https://aura-urrea.vercel.app/`)
- **Allowed sign-out URLs**: las mismas dos URLs.
- **OAuth 2.0 grant types**: Authorization code grant.
- **OpenID Connect scopes**: `openid`, `email`, `phone`.

La app usa la **raíz del sitio** como ruta de redirección: al volver del
Hosted UI, `App.tsx` detecta `?code=...`, intercambia tokens y entra al panel.

## Decisiones de diseño

- **Sin SDK**: el flujo OIDC se implementa con `fetch` directo a
  `{dominio}/oauth2/authorize`, `/oauth2/token` y `/logout`. Evita sumar
  `aws-amplify`/`authlib`-equivalentes al bundle.
- **PKCE (S256)** + parámetro `state` (anti-CSRF) aunque el cliente tenga
  secret: defensa en profundidad.
- **App client confidencial**: el secret viaja como `Authorization: Basic`
  al endpoint de tokens. ⚠️ En una SPA el secret queda embebido en el bundle
  (todas las `VITE_*` son públicas). La alternativa recomendada a futuro es
  un app client **público** (sin secret): el flujo con PKCE funciona igual y
  solo habría que vaciar `VITE_COGNITO_CLIENT_SECRET`.
- **ID token como Bearer**: el JWT authorizer de API Gateway (HTTP API)
  valida el claim `aud`, que en el ID token es el client id.
- **`sessionStorage`**: la sesión sobrevive recargas, no persiste al cerrar
  el navegador (menor exposición ante XSS).
- **Fallback local SOLO en desarrollo**: sin `VITE_COGNITO_DOMAIN`/
  `VITE_COGNITO_CLIENT_ID`, el acceso directo funciona únicamente en
  `pnpm dev` (`import.meta.env.DEV`); un build de producción sin Cognito
  muestra "autenticación no configurada" y no permite entrar.
- **Protección real en el servidor**: el gate del front es solo UX. El
  backend Go (`internal/auth/verifier.go`) valida el JWT en TODA mutación
  (`POST/PUT/DELETE` de `/listings`, `/users`, `/uploads`): firma RS256
  contra el JWKS del pool, expiración, issuer y audiencia (ID o access
  token). Se activa con `COGNITO_ISSUER` + `COGNITO_AUDIENCE` en el backend
  y responde `401 UNAUTHORIZED` sin token válido. Los claims validados se
  inyectan al request con la misma forma que el authorizer del Gateway, así
  el `owner_id` de las subidas sale del claim `sub` (ya no hace falta
  `ALLOW_UNAUTHENTICATED_UPLOADS`). Las lecturas GET siguen públicas.

## Variables de entorno (front)

```bash
# .env (local) o variables del proyecto en Vercel
VITE_COGNITO_DOMAIN=https://<prefijo>.auth.us-east-1.amazoncognito.com
VITE_COGNITO_CLIENT_ID=41nl041ggahj0of3qsh6l0kkne
VITE_COGNITO_CLIENT_SECRET=<secret del app client>
```

Nota: `VITE_COGNITO_REGION` y `VITE_COGNITO_USER_POOL_ID` ya no las usa el
front. El User Pool ID sí define el **issuer** del JWT authorizer:
`https://cognito-idp.us-east-1.amazonaws.com/us-east-1_jyq6Yp72h`.

## Variables de entorno (backend Go / Lambda)

```bash
COGNITO_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_jyq6Yp72h
COGNITO_AUDIENCE=41nl041ggahj0of3qsh6l0kkne
ALLOW_UNAUTHENTICATED_UPLOADS=false   # ya no es necesario con el guard activo
```

El backend NO hace OAuth (no necesita el client secret ni redirect URL):
solo verifica los tokens que emite Cognito.

## Pasos pendientes en AWS (en orden)

1. **Crear el dominio del Hosted UI**: Cognito → User pool → App integration
   → Domain (un prefijo propio o un dominio custom). Copiar la URL completa
   a `VITE_COGNITO_DOMAIN`.
2. **Registrar las callback/sign-out URLs** en el app client (sección de
   arriba) y verificar que el grant "Authorization code" y los scopes
   `openid email phone` estén habilitados.
3. **JWT authorizer en API Gateway (HTTP API)**:
   - Issuer: `https://cognito-idp.us-east-1.amazonaws.com/us-east-1_jyq6Yp72h`
   - Audience: `41nl041ggahj0of3qsh6l0kkne`
   - Adjuntarlo SOLO a rutas de mutación: `POST/PUT/DELETE /listings`,
     `PUT /users/{id}`, `POST /uploads`, `DELETE /uploads/{id}`.
   - Las lecturas públicas quedan abiertas (las usa el sitio público).
4. **Backend**: quitar `ALLOW_UNAUTHENTICATED_UPLOADS` de la Lambda; el
   `owner_id` ya se extrae del claim `sub` del authorizer.
5. **Vercel**: configurar las 3 variables `VITE_COGNITO_*` y redeploy.

## Cómo probarlo end-to-end

1. Completa `VITE_COGNITO_DOMAIN` en `.env` y reinicia `pnpm dev`.
2. Panel → botón "Ingresar al panel" → redirige al Hosted UI → credenciales
   del usuario del pool → vuelve a `http://localhost:5173/?code=...` y entra
   al panel automáticamente.
3. En Network verifica `POST {dominio}/oauth2/token` (200) y que las
   peticiones al API llevan `Authorization: Bearer <jwt>`.
4. "Cerrar sesión" debe pasar por `{dominio}/logout` y volver al sitio.

## Siguientes pasos naturales (post-MVP)

- Migrar a app client **público** (sin secret) manteniendo PKCE.
- Expulsar al login cuando una mutación devuelva 401 (sesión revocada).
- Personalizar el look del Hosted UI (logo/colores de la marca).
