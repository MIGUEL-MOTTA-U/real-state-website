import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiBaseUrl, listingsApi, uploadsApi, usersApi } from "../api";
import { emptyListing } from "../types";

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
});

describe("apiBaseUrl", () => {
  it("usa localhost:8080 cuando VITE_API_URL no está definida", () => {
    expect(apiBaseUrl()).toBe("http://localhost:8080");
  });
});

describe("listingsApi", () => {
  it("lista inmuebles desde GET /listings", async () => {
    const listing = { ...emptyListing(), listing_id: "abc", title: "Apto" };
    const spy = mockFetch(200, [listing]);

    const result = await listingsApi.list();

    expect(spy.mock.calls[0][0]).toBe("http://localhost:8080/listings");
    expect(result).toHaveLength(1);
    expect(result[0].listing_id).toBe("abc");
  });

  it("crea un inmueble con POST /listings y cuerpo JSON", async () => {
    const listing = { ...emptyListing(), title: "Nuevo" };
    const spy = mockFetch(201, { ...listing, listing_id: "generated" });

    const created = await listingsApi.create(listing);

    const [url, init] = spy.mock.calls[0];
    expect(url).toBe("http://localhost:8080/listings");
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(init.body).title).toBe("Nuevo");
    expect(created.listing_id).toBe("generated");
  });

  it("propaga errores estructurados del backend como ApiError", async () => {
    mockFetch(400, { code: "BAD_REQUEST", message: "invalid listing", status: 400 });

    await expect(listingsApi.create(emptyListing())).rejects.toMatchObject({
      name: "ApiError",
      code: "BAD_REQUEST",
      status: 400,
      message: "invalid listing",
    });
  });

  it("maneja respuestas de error sin cuerpo JSON", async () => {
    const response = {
      ok: false,
      status: 502,
      json: () => Promise.reject(new Error("not json")),
    } as unknown as Response;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    await expect(listingsApi.list()).rejects.toBeInstanceOf(ApiError);
    await expect(listingsApi.list()).rejects.toMatchObject({ status: 502, code: "UNKNOWN_ERROR" });
  });

  it("DELETE devuelve void en 204 sin intentar parsear JSON", async () => {
    const response = {
      ok: true,
      status: 204,
      json: () => Promise.reject(new Error("no body")),
    } as unknown as Response;
    const spy = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", spy);

    await expect(listingsApi.remove("abc")).resolves.toBeUndefined();
    expect(spy.mock.calls[0][0]).toBe("http://localhost:8080/listings/abc");
    expect(spy.mock.calls[0][1]).toMatchObject({ method: "DELETE" });
  });

  it("codifica IDs con caracteres especiales en la URL", async () => {
    const spy = mockFetch(200, emptyListing());
    await listingsApi.get("id con espacios");
    expect(spy.mock.calls[0][0]).toBe("http://localhost:8080/listings/id%20con%20espacios");
  });
});

describe("usersApi", () => {
  it("actualiza el agente con PUT /users/{id}", async () => {
    const spy = mockFetch(200, { id: "u1", name: "Aura" });

    const updated = await usersApi.update("u1", { name: "Aura" });

    const [url, init] = spy.mock.calls[0];
    expect(url).toBe("http://localhost:8080/users/u1");
    expect(init.method).toBe("PUT");
    expect(updated.name).toBe("Aura");
  });
});

describe("uploadsApi", () => {
  it("sube archivos como multipart sin fijar Content-Type manualmente", async () => {
    const spy = mockFetch(201, []);
    const file = new File(["data"], "foto.jpg", { type: "image/jpeg" });

    await uploadsApi.upload("listing_photo", "abc", [file]);

    const [url, init] = spy.mock.calls[0];
    expect(url).toBe("http://localhost:8080/uploads");
    expect(init.method).toBe("POST");
    expect(init.headers).toBeUndefined();
    expect(init.body).toBeInstanceOf(FormData);
    const form = init.body as FormData;
    expect(form.get("entity_type")).toBe("listing_photo");
    expect(form.get("entity_id")).toBe("abc");
    expect(form.getAll("files")).toHaveLength(1);
  });
});
