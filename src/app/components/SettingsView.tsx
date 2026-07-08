import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera, CheckCircle2, Loader2 } from "lucide-react";
import { usersApi, uploadsApi, ApiError } from "../services/api";
import { fetchProfileUser } from "../services/profile";
import { AgentAvatar } from "./AgentAvatar";
import type { ApiUser } from "../services/types";

interface ProfileForm {
  name: string;
  email: string;
  phone: string;
  license: string;
  headline: string;
  whatsapp_link: string;
  office_name: string;
  office_address: string;
  instagram_url: string;
  linkedin_url: string;
  facebook_url: string;
  bio: string;
  presentation: string;
  about_extra: string;
  award_text: string;
  stats_sold: string;
  stats_experience: string;
  stats_satisfied: string;
  stats_ranking: string;
}

const EMPTY_FORM: ProfileForm = {
  name: "",
  email: "",
  phone: "",
  license: "",
  headline: "",
  whatsapp_link: "",
  office_name: "",
  office_address: "",
  instagram_url: "",
  linkedin_url: "",
  facebook_url: "",
  bio: "",
  presentation: "",
  about_extra: "",
  award_text: "",
  stats_sold: "",
  stats_experience: "",
  stats_satisfied: "",
  stats_ranking: "",
};

function formFromUser(user: ApiUser): ProfileForm {
  const m = user.metadata;
  return {
    name: user.name ?? "",
    email: user.email ?? "",
    phone: user.phone ?? "",
    license: user.license ?? "",
    headline: user.headline ?? "",
    whatsapp_link: user.whatsapp_link ?? "",
    office_name: user.office_name ?? "",
    office_address: user.office_address ?? "",
    instagram_url: user.instagram_url ?? "",
    linkedin_url: user.linkedin_url ?? "",
    facebook_url: user.facebook_url ?? "",
    bio: user.bio ?? "",
    presentation: m?.presentation ?? "",
    about_extra: m?.about_extra ?? "",
    award_text: m?.award_text ?? "",
    stats_sold: m?.stats?.sold ?? "",
    stats_experience: m?.stats?.experience ?? "",
    stats_satisfied: m?.stats?.satisfied ?? "",
    stats_ranking: m?.stats?.ranking ?? "",
  };
}

interface TextField {
  key: keyof ProfileForm;
  label: string;
  type?: string;
  placeholder?: string;
}

const CONTACT_FIELDS: TextField[] = [
  { key: "name", label: "Nombre completo", type: "text" },
  { key: "email", label: "Correo electrónico", type: "email" },
  { key: "phone", label: "Teléfono", type: "tel", placeholder: "+57 300 123 4567" },
  { key: "license", label: "Matrícula profesional", type: "text" },
  { key: "headline", label: "Titular profesional", type: "text", placeholder: "Agente Inmobiliaria · Century 21 Colombia" },
  { key: "whatsapp_link", label: "Link de WhatsApp", type: "url", placeholder: "https://wa.me/573001234567" },
  { key: "office_name", label: "Nombre de la oficina", type: "text", placeholder: "Century 21 Colombia" },
  { key: "office_address", label: "Dirección de la oficina", type: "text", placeholder: "Calle 70 #10-56, Bogotá D.C." },
  { key: "instagram_url", label: "Instagram", type: "url", placeholder: "https://instagram.com/..." },
  { key: "linkedin_url", label: "LinkedIn", type: "url", placeholder: "https://linkedin.com/in/..." },
  { key: "facebook_url", label: "Facebook", type: "url", placeholder: "https://facebook.com/..." },
];

const SITE_TEXTAREAS: TextField[] = [
  { key: "presentation", label: "Presentación (párrafo del inicio del sitio público)", placeholder: "Acompaño a mis clientes en la compra y venta de propiedades exclusivas..." },
  { key: "bio", label: "Sobre mí (primer párrafo de la sección \"Nosotros\")", placeholder: "Con más de 12 años de experiencia en el mercado inmobiliario..." },
  { key: "about_extra", label: "Sobre mí — texto adicional (segundo párrafo)", placeholder: "Mi enfoque combina conocimiento del mercado, datos y negociación..." },
];

const STAT_FIELDS: TextField[] = [
  { key: "stats_sold", label: "Propiedades vendidas", placeholder: "+200" },
  { key: "stats_experience", label: "Años de experiencia", placeholder: "12" },
  { key: "stats_satisfied", label: "Clientes satisfechos", placeholder: "98%" },
  { key: "stats_ranking", label: "Ranking / distinción", placeholder: "#1" },
];

/**
 * Perfil del agente inmobiliario, respaldado por /users del backend.
 * El usuario se resuelve por VITE_PROFILE_USER_ID (con fallback al primero);
 * desde aquí se editan los datos y textos que muestra el sitio público.
 */
export function SettingsView() {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const agent = await fetchProfileUser();
        if (cancelled) return;
        setUser(agent);
        if (agent) setForm(formFromUser(agent));
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? `${err.message} (${err.code})` : "No se pudo conectar con el servidor",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const set = (key: keyof ProfileForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const payload: Partial<ApiUser> = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        license: form.license,
        headline: form.headline,
        whatsapp_link: form.whatsapp_link,
        office_name: form.office_name,
        office_address: form.office_address,
        instagram_url: form.instagram_url,
        linkedin_url: form.linkedin_url,
        facebook_url: form.facebook_url,
        bio: form.bio,
        role: user?.role ?? "agent",
        username: user?.username ?? form.email,
        metadata: {
          ...user?.metadata,
          presentation: form.presentation,
          about_extra: form.about_extra,
          award_text: form.award_text,
          stats: {
            sold: form.stats_sold,
            experience: form.stats_experience,
            satisfied: form.stats_satisfied,
            ranking: form.stats_ranking,
          },
        },
      };
      const result = user
        ? await usersApi.update(user.id, payload)
        : await usersApi.create(payload);
      setUser(result);
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      setError(
        err instanceof ApiError ? `${err.message} (${err.code})` : "No se pudo conectar con el servidor",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    setUploadingAvatar(true);
    setError(null);
    try {
      const assets = await uploadsApi.upload("user_avatar", user.id, [file]);
      const asset = assets?.[0];
      if (!asset?.url) throw new ApiError("UPLOAD_FAILED", "La subida no devolvió una URL", 500);
      const updated = await usersApi.update(user.id, {
        avatar_url: asset.url,
        avatar_asset_id: asset.id,
      });
      setUser(updated);
    } catch (err) {
      setError(
        err instanceof ApiError ? `${err.message} (${err.code})` : "No se pudo subir la foto de perfil",
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const inputClass =
    "w-full border border-[#E8E4DB] text-[#1F2937] text-sm px-3 py-2 focus:outline-none focus:border-[#0B1F3A] transition-colors bg-white placeholder-[#9CA3AF]";

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="mb-8">
        <h1
          className="text-[#0B1F3A]"
          style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 600 }}
        >
          Configuración
        </h1>
        <p className="text-[#6B7280] text-sm mt-1">
          Gestiona tu perfil: estos datos, textos y tu foto alimentan el sitio público.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-4 flex items-center gap-2 text-sm">
          <AlertTriangle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 mb-4 flex items-center gap-2 text-sm">
          <CheckCircle2 size={14} className="shrink-0" />
          <span>Perfil guardado correctamente.</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-[#6B7280]">
          <Loader2 size={24} className="mx-auto mb-3 animate-spin opacity-60" />
          <p className="text-sm">Cargando perfil...</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <div className="bg-white border border-[#E8E4DB] p-5 text-center">
              <div className="relative w-20 h-20 mx-auto mb-3">
                <AgentAvatar
                  src={user?.avatar_url}
                  name={form.name}
                  className="w-20 h-20 rounded-full"
                  textClass="text-xl"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!user || uploadingAvatar}
                  title={user ? "Cambiar foto de perfil" : "Guarda primero el perfil para subir tu foto"}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#0B1F3A] text-white rounded-full flex items-center justify-center hover:bg-[#C9A84C] hover:text-[#0B1F3A] transition-colors disabled:opacity-50"
                >
                  {uploadingAvatar ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleAvatarUpload(file);
                    e.target.value = "";
                  }}
                />
              </div>
              <p className="text-[#0B1F3A] font-semibold text-sm">{form.name || "Agente"}</p>
              <p className="text-[#6B7280] text-xs">{form.headline || "Century 21 Colombia"}</p>
              {!user && (
                <p className="text-[#6B7280] text-xs mt-3 bg-[#F0EDE6] p-2">
                  Guarda el perfil para habilitar la subida de tu foto.
                </p>
              )}
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <section className="bg-white border border-[#E8E4DB] p-5">
              <p className="text-[#0B1F3A] text-xs font-semibold uppercase tracking-wide mb-4">
                Datos de contacto
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                {CONTACT_FIELDS.map(({ key, label, type, placeholder }) => (
                  <div key={key}>
                    <label className="text-[#6B7280] text-xs font-semibold block mb-1.5">{label}</label>
                    <input
                      type={type}
                      value={form[key]}
                      placeholder={placeholder}
                      onChange={set(key)}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white border border-[#E8E4DB] p-5">
              <p className="text-[#0B1F3A] text-xs font-semibold uppercase tracking-wide mb-4">
                Textos del sitio público
              </p>
              <div className="space-y-4">
                {SITE_TEXTAREAS.map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="text-[#6B7280] text-xs font-semibold block mb-1.5">{label}</label>
                    <textarea
                      rows={3}
                      value={form[key]}
                      placeholder={placeholder}
                      onChange={set(key)}
                      className={`${inputClass} resize-y`}
                    />
                  </div>
                ))}
                <div>
                  <label className="text-[#6B7280] text-xs font-semibold block mb-1.5">
                    Reconocimientos (banda sobre la foto)
                  </label>
                  <input
                    type="text"
                    value={form.award_text}
                    placeholder="Agente destacada 2022 · 2023 · 2024"
                    onChange={set("award_text")}
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            <section className="bg-white border border-[#E8E4DB] p-5">
              <p className="text-[#0B1F3A] text-xs font-semibold uppercase tracking-wide mb-4">
                Estadísticas destacadas
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {STAT_FIELDS.map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="text-[#6B7280] text-xs font-semibold block mb-1.5">{label}</label>
                    <input
                      type="text"
                      value={form[key]}
                      placeholder={placeholder}
                      onChange={set(key)}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
            </section>

            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="bg-[#0B1F3A] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#C9A84C] hover:text-[#0B1F3A] transition-colors disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
