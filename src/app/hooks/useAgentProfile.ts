import { useEffect, useState } from "react";
import { fetchProfileUser, toAgentProfile, type AgentProfile } from "../services/profile";

/**
 * Carga el perfil del agente (VITE_PROFILE_USER_ID con fallback al primer
 * usuario). Devuelve un perfil con cadenas vacías mientras carga o si el API
 * no responde; cada vista decide qué ocultar o qué fallback mostrar.
 */
export function useAgentProfile(): AgentProfile {
  const [profile, setProfile] = useState<AgentProfile>(() => toAgentProfile(null));

  useEffect(() => {
    let cancelled = false;
    fetchProfileUser()
      .then((user) => {
        if (!cancelled && user) setProfile(toAgentProfile(user));
      })
      .catch(() => {
        /* sin API: el perfil queda vacío y las vistas ocultan esos bloques */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return profile;
}
