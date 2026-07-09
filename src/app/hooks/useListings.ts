import { useCallback, useEffect, useState } from "react";
import { ApiError, listingsApi } from "../services/api";
import type { ApiListing } from "../services/types";

interface UseListingsResult {
  listings: ApiListing[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Varios componentes montan este hook a la vez (shell, resumen, tabla):
// la petición en vuelo se comparte para no repetir el mismo GET /listings.
let inflight: Promise<ApiListing[]> | null = null;

function loadListings(): Promise<ApiListing[]> {
  if (!inflight) {
    inflight = listingsApi.list().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

/** Carga la lista de inmuebles del backend con estados de carga y error. */
export function useListings(): UseListingsResult {
  const [listings, setListings] = useState<ApiListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadListings();
      setListings(data ?? []);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? `${err.message} (${err.code})`
          : "No se pudo conectar con el servidor",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { listings, loading, error, refresh };
}
