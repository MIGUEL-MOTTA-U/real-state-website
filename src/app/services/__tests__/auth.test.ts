import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cognitoEnabled, getIdToken, getSession, signIn, signOut } from "../auth";

const REGION = "us-east-1";
const CLIENT_ID = "test-client-id";

// vitest corre en Node: se simula sessionStorage en memoria.
function stubSessionStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal("sessionStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
}

function mockFetch(status: number, body: unknown) {
  const response = {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response;
  const spy = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", spy);
  return spy;
}

const AUTH_OK = {
  AuthenticationResult: {
    IdToken: "id-token",
    AccessToken: "access-token",
    RefreshToken: "refresh-token",
    ExpiresIn: 3600,
  },
};

beforeEach(() => {
  stubSessionStorage();
  vi.stubEnv("VITE_COGNITO_REGION", REGION);
  vi.stubEnv("VITE_COGNITO_CLIENT_ID", CLIENT_ID);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("cognitoEnabled", () => {
  it("es true con región y client id configurados", () => {
    expect(cognitoEnabled()).toBe(true);
  });

  it("es false sin configuración (login simulado local)", () => {
    vi.stubEnv("VITE_COGNITO_REGION", "");
    expect(cognitoEnabled()).toBe(false);
  });
});

describe("signIn", () => {
  it("invoca InitiateAuth con USER_PASSWORD_AUTH y guarda la sesión", async () => {
    const spy = mockFetch(200, AUTH_OK);

    const session = await signIn("aura@example.com", "secret");

    const [url, init] = spy.mock.calls[0];
    expect(url).toBe(`https://cognito-idp.${REGION}.amazonaws.com/`);
    expect(init.headers["X-Amz-Target"]).toBe("AWSCognitoIdentityProviderService.InitiateAuth");
    const body = JSON.parse(init.body);
    expect(body.AuthFlow).toBe("USER_PASSWORD_AUTH");
    expect(body.ClientId).toBe(CLIENT_ID);
    expect(body.AuthParameters.USERNAME).toBe("aura@example.com");

    expect(session.idToken).toBe("id-token");
    expect(getSession()?.refreshToken).toBe("refresh-token");
  });

  it("traduce NotAuthorizedException a un mensaje amable", async () => {
    mockFetch(400, { __type: "NotAuthorizedException", message: "Incorrect username or password." });
    await expect(signIn("a@b.co", "bad")).rejects.toThrow("Correo o contraseña incorrectos.");
  });

  it("explica el challenge NEW_PASSWORD_REQUIRED", async () => {
    mockFetch(200, { ChallengeName: "NEW_PASSWORD_REQUIRED" });
    await expect(signIn("a@b.co", "temp")).rejects.toThrow(/contraseña temporal/);
  });
});

describe("getIdToken", () => {
  it("devuelve null sin Cognito configurado", async () => {
    vi.stubEnv("VITE_COGNITO_REGION", "");
    expect(await getIdToken()).toBeNull();
  });

  it("devuelve null sin sesión", async () => {
    expect(await getIdToken()).toBeNull();
  });

  it("devuelve el token vigente sin llamar a Cognito", async () => {
    mockFetch(200, AUTH_OK);
    await signIn("a@b.co", "secret");
    const spy = mockFetch(500, {});

    expect(await getIdToken()).toBe("id-token");
    expect(spy).not.toHaveBeenCalled();
  });

  it("renueva el token expirado con REFRESH_TOKEN_AUTH conservando el refresh token", async () => {
    mockFetch(200, { AuthenticationResult: { ...AUTH_OK.AuthenticationResult, ExpiresIn: 0 } });
    await signIn("a@b.co", "secret");

    const spy = mockFetch(200, {
      AuthenticationResult: { IdToken: "new-id", AccessToken: "new-access", ExpiresIn: 3600 },
    });

    expect(await getIdToken()).toBe("new-id");
    const body = JSON.parse(spy.mock.calls[0][1].body);
    expect(body.AuthFlow).toBe("REFRESH_TOKEN_AUTH");
    expect(body.AuthParameters.REFRESH_TOKEN).toBe("refresh-token");
    expect(getSession()?.refreshToken).toBe("refresh-token");
  });

  it("cierra la sesión cuando el refresh falla", async () => {
    mockFetch(200, { AuthenticationResult: { ...AUTH_OK.AuthenticationResult, ExpiresIn: 0 } });
    await signIn("a@b.co", "secret");
    mockFetch(400, { __type: "NotAuthorizedException", message: "Refresh Token has expired" });

    expect(await getIdToken()).toBeNull();
    expect(getSession()).toBeNull();
  });
});

describe("signOut", () => {
  it("elimina la sesión almacenada", async () => {
    mockFetch(200, AUTH_OK);
    await signIn("a@b.co", "secret");
    signOut();
    expect(getSession()).toBeNull();
  });
});
