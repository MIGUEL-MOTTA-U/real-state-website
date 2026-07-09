// Autenticación contra AWS Cognito (Etapa 2) sin SDK: el API de Cognito IDP
// se invoca directamente con fetch (InitiateAuth), lo que evita sumar
// dependencias pesadas al bundle.
//
// Variables de entorno (ver .env.example y docs/AUTH_COGNITO.md):
//   VITE_COGNITO_REGION     región del User Pool (ej. us-east-1)
//   VITE_COGNITO_CLIENT_ID  App client SIN secret y con USER_PASSWORD_AUTH
//   VITE_COGNITO_USER_POOL_ID  informativa (issuer del JWT authorizer)
//
// Sin estas variables la app conserva el login simulado (desarrollo local).
//
// Tokens en sessionStorage: sobreviven recargas pero no cierran sesión en
// otras pestañas ni persisten al cerrar el navegador (menor exposición que
// localStorage frente a XSS).

const STORAGE_KEY = "rs.auth.session";
/** Margen para renovar el token antes de que expire de verdad. */
const EXPIRY_MARGIN_MS = 60_000;

export interface AuthSession {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  /** Epoch ms en el que expira el idToken. */
  expiresAt: number;
  email: string;
}

interface CognitoAuthResult {
  AuthenticationResult?: {
    IdToken: string;
    AccessToken: string;
    RefreshToken?: string;
    ExpiresIn: number;
  };
  ChallengeName?: string;
  __type?: string;
  message?: string;
}

function cognitoConfig() {
  const region = ((import.meta.env?.VITE_COGNITO_REGION as string | undefined) ?? "").trim();
  const clientId = ((import.meta.env?.VITE_COGNITO_CLIENT_ID as string | undefined) ?? "").trim();
  return { region, clientId };
}

/** true cuando hay User Pool configurado; false = login simulado local. */
export function cognitoEnabled(): boolean {
  const { region, clientId } = cognitoConfig();
  return Boolean(region && clientId);
}

async function cognitoCall(target: string, body: unknown): Promise<CognitoAuthResult> {
  const { region } = cognitoConfig();
  const response = await fetch(`https://cognito-idp.${region}.amazonaws.com/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": `AWSCognitoIdentityProviderService.${target}`,
    },
    body: JSON.stringify(body),
  });
  const result = (await response.json()) as CognitoAuthResult;
  if (!response.ok) {
    throw new Error(friendlyAuthError(result.__type ?? "", result.message ?? ""));
  }
  return result;
}

function friendlyAuthError(type: string, message: string): string {
  switch (type) {
    case "NotAuthorizedException":
      return "Correo o contraseña incorrectos.";
    case "UserNotFoundException":
      return "El usuario no existe en el sistema.";
    case "UserNotConfirmedException":
      return "El usuario aún no está confirmado: revisa tu correo.";
    case "PasswordResetRequiredException":
      return "Debes restablecer tu contraseña antes de ingresar.";
    case "TooManyRequestsException":
      return "Demasiados intentos: espera un momento y vuelve a intentarlo.";
    default:
      return message || "No se pudo iniciar sesión.";
  }
}

function sessionFromResult(result: CognitoAuthResult, email: string, previous?: AuthSession): AuthSession {
  const auth = result.AuthenticationResult;
  if (!auth) {
    if (result.ChallengeName === "NEW_PASSWORD_REQUIRED") {
      throw new Error(
        "Tu cuenta requiere cambiar la contraseña temporal. Pide al administrador completarla desde la consola de Cognito.",
      );
    }
    throw new Error(`Autenticación incompleta (challenge: ${result.ChallengeName ?? "desconocido"}).`);
  }
  return {
    idToken: auth.IdToken,
    accessToken: auth.AccessToken,
    // El flujo de refresh no devuelve refresh token: se conserva el previo.
    refreshToken: auth.RefreshToken ?? previous?.refreshToken ?? "",
    expiresAt: Date.now() + auth.ExpiresIn * 1000,
    email,
  };
}

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

export function signOut(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

/** Inicia sesión con email y contraseña (flujo USER_PASSWORD_AUTH). */
export async function signIn(email: string, password: string): Promise<AuthSession> {
  const { clientId } = cognitoConfig();
  const result = await cognitoCall("InitiateAuth", {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: clientId,
    AuthParameters: { USERNAME: email, PASSWORD: password },
  });
  const session = sessionFromResult(result, email);
  saveSession(session);
  return session;
}

async function refreshSession(session: AuthSession): Promise<AuthSession | null> {
  if (!session.refreshToken) return null;
  const { clientId } = cognitoConfig();
  try {
    const result = await cognitoCall("InitiateAuth", {
      AuthFlow: "REFRESH_TOKEN_AUTH",
      ClientId: clientId,
      AuthParameters: { REFRESH_TOKEN: session.refreshToken },
    });
    const refreshed = sessionFromResult(result, session.email, session);
    saveSession(refreshed);
    return refreshed;
  } catch {
    signOut();
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
