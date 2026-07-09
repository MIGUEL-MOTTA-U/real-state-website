import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cognitoEnabled,
  getIdToken,
  getSession,
  handleAuthCallback,
  signInRedirect,
} from "../auth";

const DOMAIN = "https://auth.example.auth.us-east-1.amazoncognito.com";
const CLIENT_ID = "41nl041ggahj0of3qsh6l0kkne";
const CLIENT_SECRET = "test-secret";
const ORIGIN = "http://localhost:5173";

// vitest corre en Node: se simulan sessionStorage, window y fetch.
function stubBrowserGlobals(search = "") {
  const store = new Map<string, string>();
  vi.stubGlobal("sessionStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
  const assign = vi.fn();
  const replaceState = vi.fn();
  vi.stubGlobal("window", {
    location: { origin: ORIGIN, search, pathname: "/", assign },
    history: { replaceState },
  });
  return { store, assign, replaceState };
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

const TOKENS_OK = {
  id_token: "id-token",
  access_token: "access-token",
  refresh_token: "refresh-token",
  expires_in: 3600,
};

beforeEach(() => {
  vi.stubEnv("VITE_COGNITO_DOMAIN", DOMAIN);
  vi.stubEnv("VITE_COGNITO_CLIENT_ID", CLIENT_ID);
  vi.stubEnv("VITE_COGNITO_CLIENT_SECRET", CLIENT_SECRET);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("cognitoEnabled", () => {
  it("es true con dominio y client id configurados", () => {
    expect(cognitoEnabled()).toBe(true);
  });

  it("es false sin configuración (acceso simulado local)", () => {
    vi.stubEnv("VITE_COGNITO_DOMAIN", "");
    expect(cognitoEnabled()).toBe(false);
  });
});

describe("signInRedirect", () => {
  it("redirige al Hosted UI con PKCE y guarda el verifier", async () => {
    const { store, assign } = stubBrowserGlobals();

    await signInRedirect();

    const url = new URL(assign.mock.calls[0][0] as string);
    expect(url.origin).toBe(DOMAIN);
    expect(url.pathname).toBe("/oauth2/authorize");
    expect(url.searchParams.get("client_id")).toBe(CLIENT_ID);
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("scope")).toBe("email openid phone");
    expect(url.searchParams.get("redirect_uri")).toBe(`${ORIGIN}/`);
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("code_challenge")).toBeTruthy();

    const pkce = JSON.parse(store.get("rs.auth.pkce")!);
    expect(pkce.verifier).toHaveLength(64);
    expect(url.searchParams.get("state")).toBe(pkce.state);
  });
});

describe("handleAuthCallback", () => {
  it("intercambia el código por tokens con Basic auth y guarda la sesión", async () => {
    const { store, replaceState } = stubBrowserGlobals("?code=c-123&state=s-1");
    store.set("rs.auth.pkce", JSON.stringify({ verifier: "v-1", state: "s-1" }));
    const spy = mockFetch(200, TOKENS_OK);

    expect(await handleAuthCallback()).toBe(true);

    const [url, init] = spy.mock.calls[0];
    expect(url).toBe(`${DOMAIN}/oauth2/token`);
    expect(init.headers.Authorization).toBe(`Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`);
    const body = new URLSearchParams(init.body as string);
    expect(body.get("grant_type")).toBe("authorization_code");
    expect(body.get("code")).toBe("c-123");
    expect(body.get("code_verifier")).toBe("v-1");
    expect(body.get("redirect_uri")).toBe(`${ORIGIN}/`);

    expect(getSession()?.idToken).toBe("id-token");
    // La URL queda limpia para no re-procesar el código.
    expect(replaceState).toHaveBeenCalled();
  });

  it("rechaza el retorno cuando el state no coincide (CSRF)", async () => {
    const { store } = stubBrowserGlobals("?code=c-123&state=otro");
    store.set("rs.auth.pkce", JSON.stringify({ verifier: "v-1", state: "s-1" }));
    const spy = mockFetch(200, TOKENS_OK);

    expect(await handleAuthCallback()).toBe(false);
    expect(spy).not.toHaveBeenCalled();
    expect(getSession()).toBeNull();
  });

  it("devuelve false sin código en la URL", async () => {
    stubBrowserGlobals("");
    expect(await handleAuthCallback()).toBe(false);
  });

  it("traduce invalid_grant a un mensaje amable", async () => {
    const { store } = stubBrowserGlobals("?code=c-viejo&state=s-1");
    store.set("rs.auth.pkce", JSON.stringify({ verifier: "v-1", state: "s-1" }));
    mockFetch(400, { error: "invalid_grant" });

    await expect(handleAuthCallback()).rejects.toThrow(/expiró o ya fue usado/);
  });
});

describe("getIdToken", () => {
  async function seedSession(expiresIn: number) {
    const { store } = stubBrowserGlobals("?code=c&state=s");
    store.set("rs.auth.pkce", JSON.stringify({ verifier: "v", state: "s" }));
    mockFetch(200, { ...TOKENS_OK, expires_in: expiresIn });
    await handleAuthCallback();
    return store;
  }

  it("devuelve null sin Cognito configurado", async () => {
    vi.stubEnv("VITE_COGNITO_DOMAIN", "");
    stubBrowserGlobals();
    expect(await getIdToken()).toBeNull();
  });

  it("devuelve el token vigente sin llamar a Cognito", async () => {
    await seedSession(3600);
    const spy = mockFetch(500, {});

    expect(await getIdToken()).toBe("id-token");
    expect(spy).not.toHaveBeenCalled();
  });

  it("renueva el token expirado conservando el refresh token", async () => {
    await seedSession(0);
    const spy = mockFetch(200, { id_token: "new-id", access_token: "new-access", expires_in: 3600 });

    expect(await getIdToken()).toBe("new-id");
    const body = new URLSearchParams(spy.mock.calls[0][1].body as string);
    expect(body.get("grant_type")).toBe("refresh_token");
    expect(body.get("refresh_token")).toBe("refresh-token");
    expect(getSession()?.refreshToken).toBe("refresh-token");
  });

  it("cierra la sesión cuando el refresh falla", async () => {
    await seedSession(0);
    mockFetch(400, { error: "invalid_grant" });

    expect(await getIdToken()).toBeNull();
    expect(getSession()).toBeNull();
  });
});
