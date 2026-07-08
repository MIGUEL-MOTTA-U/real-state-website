import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchProfileUser, initialsOf, profileUserId, toAgentProfile, whatsappHref } from "../profile";
import type { ApiUser } from "../types";

const AURA_ID = "936a9e97eec013dd9d41baefd6ddf944";

function sampleUser(overrides: Partial<ApiUser> = {}): ApiUser {
  return {
    id: AURA_ID,
    name: "Aura Urrea",
    email: "aura.urrea@century21.com.co",
    username: "aura.urrea",
    birthdate: "1985-04-12",
    creationdate: "2026-01-01T00:00:00Z",
    phone: "+57 300 123 4567",
    headline: "Agente Inmobiliaria de Lujo",
    bio: "Con más de 12 años de experiencia.",
    avatar_url: "https://cdn.example.com/avatar.jpg",
    whatsapp_link: "https://wa.me/573001234567",
    metadata: {
      presentation: "Acompaño a mis clientes en cada paso.",
      about_extra: "Mi enfoque combina datos y negociación.",
      award_text: "Agente destacada 2024",
      stats: { sold: "+250", experience: "13", satisfied: "99%", ranking: "#1" },
    },
    ...overrides,
  };
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

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("profileUserId", () => {
  it("lee VITE_PROFILE_USER_ID del entorno", () => {
    vi.stubEnv("VITE_PROFILE_USER_ID", AURA_ID);
    expect(profileUserId()).toBe(AURA_ID);
  });

  it("devuelve cadena vacía sin variable definida", () => {
    vi.stubEnv("VITE_PROFILE_USER_ID", "");
    expect(profileUserId()).toBe("");
  });
});

describe("fetchProfileUser", () => {
  it("carga el usuario por el ID configurado", async () => {
    vi.stubEnv("VITE_PROFILE_USER_ID", AURA_ID);
    const spy = mockFetch(200, sampleUser());

    const user = await fetchProfileUser();

    expect(spy.mock.calls[0][0]).toBe(`http://localhost:8080/users/${AURA_ID}`);
    expect(user?.id).toBe(AURA_ID);
  });

  it("cae al primer usuario de la lista sin ID configurado", async () => {
    vi.stubEnv("VITE_PROFILE_USER_ID", "");
    const spy = mockFetch(200, [sampleUser({ id: "u1" })]);

    const user = await fetchProfileUser();

    expect(spy.mock.calls[0][0]).toBe("http://localhost:8080/users");
    expect(user?.id).toBe("u1");
  });

  it("devuelve null cuando no hay usuarios", async () => {
    vi.stubEnv("VITE_PROFILE_USER_ID", "");
    mockFetch(200, []);
    expect(await fetchProfileUser()).toBeNull();
  });
});

describe("toAgentProfile", () => {
  it("aplana usuario y metadata al modelo de vista", () => {
    const profile = toAgentProfile(sampleUser());
    expect(profile.name).toBe("Aura Urrea");
    expect(profile.presentation).toBe("Acompaño a mis clientes en cada paso.");
    expect(profile.aboutExtra).toBe("Mi enfoque combina datos y negociación.");
    expect(profile.awardText).toBe("Agente destacada 2024");
    expect(profile.avatarUrl).toBe("https://cdn.example.com/avatar.jpg");
    expect(profile.stats.sold).toBe("+250");
  });

  it("devuelve cadenas vacías con usuario nulo (las vistas aplican su fallback)", () => {
    const profile = toAgentProfile(null);
    expect(profile.name).toBe("");
    expect(profile.presentation).toBe("");
    expect(profile.stats.sold).toBe("");
  });
});

describe("initialsOf", () => {
  it("toma las iniciales de las dos primeras palabras", () => {
    expect(initialsOf("Aura Urrea")).toBe("AU");
    expect(initialsOf("Aura María Urrea")).toBe("AM");
    expect(initialsOf("  aura  ")).toBe("A");
    expect(initialsOf("")).toBe("");
  });
});

describe("whatsappHref", () => {
  it("prefiere el link configurado", () => {
    expect(whatsappHref(toAgentProfile(sampleUser()))).toBe("https://wa.me/573001234567");
  });

  it("lo construye desde el teléfono si no hay link", () => {
    const profile = toAgentProfile(sampleUser({ whatsapp_link: "" }));
    expect(whatsappHref(profile)).toBe("https://wa.me/573001234567");
  });

  it("devuelve vacío sin teléfono ni link", () => {
    const profile = toAgentProfile(sampleUser({ whatsapp_link: "", phone: "" }));
    expect(whatsappHref(profile)).toBe("");
  });
});
