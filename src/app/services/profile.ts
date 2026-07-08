// Perfil del agente que alimenta el sitio público y la configuración.
// El usuario se resuelve por VITE_PROFILE_USER_ID (ID de Aura por defecto);
// si no está definida, se usa el primer usuario del backend.
import { usersApi } from "./api";
import type { ApiUser } from "./types";

/** ID del agente configurado por entorno ("" si no está definido). */
export function profileUserId(): string {
  const id = import.meta.env?.VITE_PROFILE_USER_ID as string | undefined;
  return (id ?? "").trim();
}

/**
 * Carga el usuario del perfil: por ID de entorno si existe, con fallback al
 * primer usuario de la lista (comportamiento previo del panel).
 */
export async function fetchProfileUser(): Promise<ApiUser | null> {
  const id = profileUserId();
  if (id) {
    try {
      return await usersApi.get(id);
    } catch {
      // ID configurado pero inexistente: cae al primer usuario.
    }
  }
  const users = await usersApi.list();
  return users?.[0] ?? null;
}

/** Datos ya resueltos que consumen las vistas públicas. */
export interface AgentProfile {
  id: string;
  name: string;
  headline: string;
  presentation: string;
  bio: string;
  aboutExtra: string;
  awardText: string;
  avatarUrl: string;
  heroImageUrl: string;
  phone: string;
  email: string;
  whatsappLink: string;
  officeName: string;
  officeAddress: string;
  instagramUrl: string;
  linkedinUrl: string;
  facebookUrl: string;
  stats: { sold: string; experience: string; satisfied: string; ranking: string };
}

/**
 * Aplana un ApiUser al modelo de vista del sitio público. Devuelve cadenas
 * vacías donde no hay dato: cada vista decide su propio fallback (i18n o
 * contenido estático de demostración).
 */
export function toAgentProfile(user: ApiUser | null): AgentProfile {
  const m = user?.metadata;
  return {
    id: user?.id ?? "",
    name: user?.name ?? "",
    headline: user?.headline ?? "",
    presentation: m?.presentation ?? "",
    bio: user?.bio ?? "",
    aboutExtra: m?.about_extra ?? "",
    awardText: m?.award_text ?? "",
    avatarUrl: user?.avatar_url ?? "",
    heroImageUrl: m?.hero_image_url ?? "",
    phone: user?.phone ?? "",
    email: user?.email ?? "",
    whatsappLink: user?.whatsapp_link ?? "",
    officeName: user?.office_name || user?.company || "",
    officeAddress: user?.office_address ?? "",
    instagramUrl: user?.instagram_url ?? "",
    linkedinUrl: user?.linkedin_url ?? "",
    facebookUrl: user?.facebook_url ?? "",
    stats: {
      sold: m?.stats?.sold ?? "",
      experience: m?.stats?.experience ?? "",
      satisfied: m?.stats?.satisfied ?? "",
      ranking: m?.stats?.ranking ?? "",
    },
  };
}

/** Link de WhatsApp derivado: usa el configurado o lo construye del teléfono. */
export function whatsappHref(profile: AgentProfile): string {
  if (profile.whatsappLink) return profile.whatsappLink;
  const digits = profile.phone.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "";
}

/** Iniciales del nombre (máx. 2) para el avatar de reemplazo sin foto. */
export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}
