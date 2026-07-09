// Autenticación con AWS Cognito vía OIDC (Hosted UI) — único método de
// acceso al panel. Flujo: código de autorización + PKCE; el intercambio y la
// renovación de tokens van contra {dominio}/oauth2/token.
//
// Variables de entorno (ver .env.example y docs/AUTH_COGNITO.md):
//   VITE_COGNITO_DOMAIN         dominio del Hosted UI
//                               (ej. https://xxxx.auth.us-east-1.amazoncognito.com)
//   VITE_COGNITO_CLIENT_ID      app client del User Pool
//   VITE_COGNITO_CLIENT_SECRET  secret del app client (Basic auth en /oauth2/token)
//
// La URL de redirección registrada en Cognito debe ser la raíz del sitio:
// http://localhost:5173/ en desarrollo y https://<dominio-productivo>/ en prod.
// Sin estas variables la app conserva el acceso simulado (desarrollo local).

const STORAGE_KEY = "rs.auth.session";
const PKCE_KEY = "rs.auth.pkce";
/** Margen para renovar el token antes de que expire de verdad. */
const EXPIRY_MARGIN_MS = 60_000;
const OAUTH_SCOPES = "email openid phone";

export interface AuthSession {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  /** Epoch ms en el que expira el idToken. */
  expiresAt: number;
}

interface TokenResponse {
  id_token?: string;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

function cognitoConfig() {
  const domain = ((import.meta.env?.VITE_COGNITO_DOMAIN as string | undefined) ?? "")
    .trim()
    .replace(/\/+$/, "");
  const clientId = ((import.meta.env?.VITE_COGNITO_CLIENT_ID as string | undefined) ?? "").trim();
  const clientSecret = ((import.meta.env?.VITE_COGNITO_CLIENT_SECRET as string | undefined) ?? "").trim();
  return { domain, clientId, clientSecret };
}

/** true cuando hay Hosted UI configurado; false = acceso simulado local. */
export function cognitoEnabled(): boolean {
  const { domain, clientId } = cognitoConfig();
  return Boolean(domain && clientId);
}

/** URL de redirección OAuth: la raíz del sitio (registrarla en Cognito). */
export function redirectUri(): string {
  return `${window.location.origin}/`;
}

// ── PKCE ──────────────────────────────────────────────────────────────────────

function randomString(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"[b % 62]).join("");
}

async function pkceChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// ── Flujo OIDC ────────────────────────────────────────────────────────────────

/** Redirige al Hosted UI de Cognito para iniciar sesión. */
export async function signInRedirect(): Promise<void> {
  const { domain, clientId } = cognitoConfig();
  const verifier = randomString(64);
  const state = randomString(24);
  sessionStorage.setItem(PKCE_KEY, JSON.stringify({ verifier, state }));

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    scope: OAUTH_SCOPES,
    redirect_uri: redirectUri(),
    state,
    code_challenge_method: "S256",
    code_challenge: await pkceChallenge(verifier),
  });
  window.location.assign(`${domain}/oauth2/authorize?${params.toString()}`);
}

/**
 * Procesa el retorno del Hosted UI (?code=...&state=...): intercambia el
 * código por tokens y limpia la URL. Devuelve true si quedó sesión activa.
 */
export async function handleAuthCallback(): Promise<boolean> {
  if (!cognitoEnabled()) return false;
  const query = new URLSearchParams(window.location.search);
  const code = query.get("code");
  if (!code) return false;

  // La URL se limpia siempre para no re-procesar el código en recargas.
  window.history.replaceState({}, "", window.location.pathname);

  let pkce: { verifier: string; state: string } | null = null;
  try {
    pkce = JSON.parse(sessionStorage.getItem(PKCE_KEY) ?? "null");
  } catch {
    pkce = null;
  }
  sessionStorage.removeItem(PKCE_KEY);
  if (!pkce || query.get("state") !== pkce.state) return false;

  const tokens = await tokenRequest({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri(),
    code_verifier: pkce.verifier,
  });
  saveSession(sessionFromTokens(tokens));
  return true;
}

async function tokenRequest(params: Record<string, string>): Promise<TokenResponse> {
  const { domain, clientId, clientSecret } = cognitoConfig();
  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  // App client confidencial: el secret viaja como Basic auth.
  if (clientSecret) {
    headers.Authorization = `Basic ${btoa(`${clientId}:${clientSecret}`)}`;
  }
  const response = await fetch(`${domain}/oauth2/token`, {
    method: "POST",
    headers,
    body: new URLSearchParams({ client_id: clientId, ...params }).toString(),
  });
  const data = (await response.json()) as TokenResponse;
  if (!response.ok || data.error) {
    throw new Error(friendlyTokenError(data.error ?? "", data.error_description ?? ""));
  }
  return data;
}

function friendlyTokenError(error: string, description: string): string {
  switch (error) {
    case "invalid_grant":
      return "El código de acceso expiró o ya fue usado: inicia sesión de nuevo.";
    case "invalid_client":
      return "Configuración del cliente inválida: revisa VITE_COGNITO_CLIENT_ID y el secret.";
    default:
      return description || "No se pudo completar el inicio de sesión.";
  }
}

function sessionFromTokens(tokens: TokenResponse, previous?: AuthSession): AuthSession {
  if (!tokens.id_token || !tokens.access_token) {
    throw new Error("Cognito no devolvió los tokens esperados.");
  }
  return {
    idToken: tokens.id_token,
    accessToken: tokens.access_token,
    // El grant de refresh no devuelve refresh token: se conserva el previo.
    refreshToken: tokens.refresh_token ?? previous?.refreshToken ?? "",
    expiresAt: Date.now() + (tokens.expires_in ?? 3600) * 1000,
  };
}

// ── Sesión ────────────────────────────────────────────────────────────────────

function saveSession(session: AuthSession): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function getSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

/** Cierra la sesión local y en el Hosted UI (requiere logout URL registrada). */
export function signOut(): void {
  sessionStorage.removeItem(STORAGE_KEY);
  if (!cognitoEnabled()) return;
  const { domain, clientId } = cognitoConfig();
  const params = new URLSearchParams({ client_id: clientId, logout_uri: redirectUri() });
  window.location.assign(`${domain}/logout?${params.toString()}`);
}

async function refreshSession(session: AuthSession): Promise<AuthSession | null> {
  if (!session.refreshToken) return null;
  try {
    const tokens = await tokenRequest({
      grant_type: "refresh_token",
      refresh_token: session.refreshToken,
    });
    const refreshed = sessionFromTokens(tokens, session);
    saveSession(refreshed);
    return refreshed;
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

/**
 * Devuelve un ID token vigente (renovándolo si está por expirar) o null si
 * no hay sesión. El API adjunta este token como Bearer en cada petición.
 */
export async function getIdToken(): Promise<string | null> {
  if (!cognitoEnabled()) return null;
  const session = getSession();
  if (!session) return null;
  if (Date.now() < session.expiresAt - EXPIRY_MARGIN_MS) return session.idToken;
  const refreshed = await refreshSession(session);
  return refreshed?.idToken ?? null;
}
