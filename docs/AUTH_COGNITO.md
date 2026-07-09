# Autenticación con AWS Cognito (Etapa 2)

Estado del proyecto, decisiones y pasos pendientes para retomar la
implementación en cualquier momento.

## Estado actual (2026-07-09)

| Pieza | Estado |
|---|---|
| Cliente de auth en el front (`src/app/services/auth.ts`) | ✅ Implementado y testeado |
| Login real en `LoginPage` (email + contraseña) | ✅ Con fallback a login simulado sin env vars |
| Token Bearer en todas las peticiones (`api.ts`) | ✅ ID token renovado automáticamente |
| Sesión persistente por pestaña + logout | ✅ `sessionStorage`, recarga vuelve al panel |
| User Pool + App client en AWS | ⬜ Pendiente (pasos abajo) |
| JWT authorizer en API Gateway | ⬜ Pendiente (pasos abajo) |
| Challenge `NEW_PASSWORD_REQUIRED` en el front | ⬜ No implementado: hoy muestra mensaje explicativo |

## Decisiones de diseño

- **Sin SDK**: el API de Cognito IDP se invoca con `fetch` directo
  (`InitiateAuth`, cabecera `X-Amz-Target`). Evita sumar `aws-amplify`
  (~100 kB+) al bundle. Flujos usados: `USER_PASSWORD_AUTH` (login) y
  `REFRESH_TOKEN_AUTH` (renovación).
- **ID token como Bearer**: el JWT authorizer de API Gateway (HTTP API)
  valida el claim `aud`, que en el ID token es el client id. Si en el futuro
  se prefiere el access token, hay que configurar el authorizer para validar
  `client_id` en su lugar.
- **`sessionStorage`** (no `localStorage`): la sesión sobrevive recargas pero
  no persiste al cerrar el navegador — menor exposición ante XSS.
- **Fallback local**: sin `VITE_COGNITO_REGION`/`VITE_COGNITO_CLIENT_ID`, el
  login vuelve al modo simulado para no bloquear el desarrollo local.

## Variables de entorno (front)

```bash
# .env (local) o variables del proyecto en Vercel
VITE_COGNITO_REGION=us-east-1                 # región del User Pool
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx   # app client SIN secret
VITE_COGNITO_USER_POOL_ID=us-east-1_XxXxXxXxX # informativa / issuer del authorizer
```

## Pasos pendientes en AWS (en orden)

1. **Crear el User Pool** (Cognito → User pools → Create):
   - Sign-in con email; políticas de contraseña por defecto están bien.
   - Sin MFA obligatorio (opcional según criterio).
2. **Crear el App client**: tipo "Public client", **sin client secret**, y en
   *Authentication flows* habilitar `ALLOW_USER_PASSWORD_AUTH` y
   `ALLOW_REFRESH_TOKEN_AUTH`.
3. **Crear el usuario del agente** (Aura) con su email; al crearlo con
   contraseña temporal, marcar la contraseña como permanente
   (`admin-set-user-password --permanent`) porque el front aún no implementa
   el challenge `NEW_PASSWORD_REQUIRED`.
4. **JWT authorizer en API Gateway (HTTP API)**:
   - Issuer: `https://cognito-idp.<región>.amazonaws.com/<user-pool-id>`
   - Audience: el client id del paso 2.
   - Adjuntarlo SOLO a las rutas de mutación: `POST/PUT/DELETE /listings`,
     `PUT /users/{id}`, `POST /uploads`, `DELETE /uploads/{id}`.
   - Las lecturas públicas quedan abiertas: `GET /listings`,
     `GET /listings/{id}`, `GET /listings/{id}/media`, `GET /users`,
     `GET /users/{id}` (las usa el sitio público sin sesión).
5. **Backend**: quitar `ALLOW_UNAUTHENTICATED_UPLOADS` de las variables de la
   Lambda; el `owner_id` de los assets ya se extrae del claim `sub` que el
   authorizer inyecta en el request context.
6. **Configurar las 3 variables** `VITE_COGNITO_*` en Vercel y redeploy.

## Cómo probarlo end-to-end

1. Configura las 3 variables en `.env` y reinicia `pnpm dev`.
2. Panel → login con el email/contraseña del usuario de Cognito.
3. Verifica en la pestaña Network que las peticiones llevan
   `Authorization: Bearer <jwt>` y que una edición de inmueble responde 200
   a través del API Gateway con authorizer activo.
4. El refresh se puede probar dejando la sesión abierta más de 1 hora
   (expiración del ID token) y haciendo una mutación.

## Siguientes pasos naturales (post-MVP)

- Implementar el challenge `NEW_PASSWORD_REQUIRED` (RespondToAuthChallenge)
  para no depender de la consola al crear usuarios.
- "Olvidé mi contraseña" (`ForgotPassword`/`ConfirmForgotPassword`).
- Ocultar los botones de login social del `LoginPage` o conectarlos a los
  identity providers federados del User Pool (Hosted UI).
- Expulsar al usuario al panel de login cuando una mutación devuelva 401.
