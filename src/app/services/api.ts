// Cliente HTTP tipado hacia el backend rs-lambda-go (API Gateway HTTP API).
// Punto único de integración: cuando la Etapa 2 (Cognito) esté activa, el
// token Bearer se adjuntará aquí.
import type { ApiAsset, ApiErrorBody, ApiListing, ApiUser } from "./types";

const DEFAULT_LOCAL_API = "http://localhost:8080";

export function apiBaseUrl(): string {
  const configured = import.meta.env?.VITE_API_URL as string | undefined;
  const base = (configured && configured.trim()) || DEFAULT_LOCAL_API;
  return base.replace(/\/+$/, "");
}

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

/** Timeout por defecto; las subidas de archivos usan uno más holgado. */
const REQUEST_TIMEOUT_MS = 30_000;
const UPLOAD_TIMEOUT_MS = 120_000;

function timeoutSignal(ms: number): AbortSignal | undefined {
  // Evita spinners infinitos en redes colgadas; en navegadores sin
  // AbortSignal.timeout simplemente no se aplica timeout.
  return typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
    ? AbortSignal.timeout(ms)
    : undefined;
}

async function request<T>(path: string, init?: RequestInit, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> {
  const response = await fetch(`${apiBaseUrl()}${path}`, {
    signal: timeoutSignal(timeoutMs),
    ...init,
  });

  if (!response.ok) {
    let body: ApiErrorBody | null = null;
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      // Cuerpo no-JSON (p. ej. errores del propio gateway).
    }
    throw new ApiError(
      body?.code ?? "UNKNOWN_ERROR",
      body?.message ?? `Request failed with status ${response.status}`,
      body?.status ?? response.status,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

function jsonInit(method: string, payload: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };
}

// ─── Listings ────────────────────────────────────────────────────────────────

export const listingsApi = {
  list: () => request<ApiListing[]>("/listings"),
  get: (id: string) => request<ApiListing>(`/listings/${encodeURIComponent(id)}`),
  create: (listing: ApiListing) => request<ApiListing>("/listings", jsonInit("POST", listing)),
  update: (id: string, listing: ApiListing) =>
    request<ApiListing>(`/listings/${encodeURIComponent(id)}`, jsonInit("PUT", listing)),
  remove: (id: string) =>
    request<void>(`/listings/${encodeURIComponent(id)}`, { method: "DELETE" }),
  listMedia: (id: string) =>
    request<ApiAsset[]>(`/listings/${encodeURIComponent(id)}/media`),
};

// ─── Users (agente inmobiliario) ─────────────────────────────────────────────

export const usersApi = {
  list: () => request<ApiUser[]>("/users"),
  get: (id: string) => request<ApiUser>(`/users/${encodeURIComponent(id)}`),
  create: (user: Partial<ApiUser>) => request<ApiUser>("/users", jsonInit("POST", user)),
  update: (id: string, user: Partial<ApiUser>) =>
    request<ApiUser>(`/users/${encodeURIComponent(id)}`, jsonInit("PUT", user)),
  remove: (id: string) =>
    request<void>(`/users/${encodeURIComponent(id)}`, { method: "DELETE" }),
};

// ─── Uploads ─────────────────────────────────────────────────────────────────

export const uploadsApi = {
  /**
   * Sube uno o varios archivos como multipart/form-data.
   * El navegador fija el boundary automáticamente (no establecer Content-Type).
   */
  upload: (entityType: string, entityId: string, files: File[]) => {
    const form = new FormData();
    form.append("entity_type", entityType);
    form.append("entity_id", entityId);
    for (const file of files) {
      form.append("files", file, file.name);
    }
    return request<ApiAsset[]>("/uploads", { method: "POST", body: form }, UPLOAD_TIMEOUT_MS);
  },
  getUrl: (id: string) => request<ApiAsset>(`/uploads/${encodeURIComponent(id)}/url`),
  remove: (id: string) =>
    request<void>(`/uploads/${encodeURIComponent(id)}`, { method: "DELETE" }),
};
