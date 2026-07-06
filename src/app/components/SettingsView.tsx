import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { usersApi, ApiError } from "../services/api";
import type { ApiUser } from "../services/types";

interface ProfileForm {
  name: string;
  email: string;
  phone: string;
  license: string;
  headline: string;
  whatsapp_link: string;
}

const EMPTY_FORM: ProfileForm = {
  name: "",
  email: "",
  phone: "",
  license: "",
  headline: "",
  whatsapp_link: "",
};

/**
 * Perfil del agente inmobiliario, respaldado por /users del backend.
 * Se asume un único agente: se edita el primer usuario existente o se
 * crea uno nuevo al guardar si aún no existe.
 */
export function SettingsView() {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const users = await usersApi.list();
        if (cancelled) return;
        const agent = users?.[0] ?? null;
        setUser(agent);
        if (agent) {
          setForm({
            name: agent.name ?? "",
            email: agent.email ?? "",
            phone: agent.phone ?? "",
            license: agent.license ?? "",
            headline: agent.headline ?? "",
            whatsapp_link: agent.whatsapp_link ?? "",
          });
        }
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
        role: user?.role ?? "agent",
        username: user?.username ?? form.email,
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

  const fields: { key: keyof ProfileForm; label: string; type: string }[] = [
    { key: "name", label: "Nombre completo", type: "text" },
    { key: "email", label: "Correo electrónico", type: "email" },
    { key: "phone", label: "Teléfono", type: "tel" },
    { key: "license", label: "Matrícula profesional", type: "text" },
    { key: "headline", label: "Titular profesional", type: "text" },
    { key: "whatsapp_link", label: "Link de WhatsApp", type: "url" },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="mb-8">
        <h1
          className="text-[#0B1F3A]"
          style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 600 }}
        >
          Configuración
        </h1>
        <p className="text-[#6B7280] text-sm mt-1">Gestiona tu perfil y preferencias del panel.</p>
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
              <img
                src={user?.avatar_url || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&auto=format"}
                alt={form.name || "Agente"}
                className="w-20 h-20 object-cover rounded-full mx-auto mb-3"
              />
              <p className="text-[#0B1F3A] font-semibold text-sm">{form.name || "Agente"}</p>
              <p className="text-[#6B7280] text-xs">{form.headline || "Century 21 Colombia"}</p>
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            {fields.map(({ key, label, type }) => (
              <div key={key} className="bg-white border border-[#E8E4DB] p-4">
                <label className="text-[#6B7280] text-xs font-semibold block mb-1.5">{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full border border-[#E8E4DB] text-[#1F2937] text-sm px-3 py-2 focus:outline-none focus:border-[#0B1F3A] transition-colors bg-white"
                />
              </div>
            ))}
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
