import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Lock } from "lucide-react";
import { useAgentProfile } from "../hooks/useAgentProfile";
import { useListings } from "../hooks/useListings";
import { cognitoEnabled, signInRedirect } from "../services/auth";

interface LoginPageProps {
  onLogin: () => void;
  onBack: () => void;
}

export function LoginPage({ onLogin, onBack }: LoginPageProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const profile = useAgentProfile();
  const { listings } = useListings();

  const firstName = profile.name.trim().split(/\s+/)[0] ?? "";
  const countByStatus = (status: string) =>
    listings.filter((l) => l.publication_status === status).length;
  // Cifras reales del backend; las que no existen no se muestran.
  const PANEL_STATS = [
    { n: String(countByStatus("published")), label: t('login.stats.active') },
    { n: String(countByStatus("draft")), label: t('login.stats.drafts') },
    { n: String(countByStatus("archived")), label: t('login.stats.archived') },
    { n: profile.stats.satisfied, label: t('login.stats.satisfaction') },
  ].filter(({ n }) => n);

  // Único método de acceso: OIDC con el Hosted UI de Cognito. Sin variables
  // configuradas (desarrollo local) el botón entra directo al panel.
  const handleSignIn = () => {
    setError("");
    setLoading(true);

    if (!cognitoEnabled()) {
      setTimeout(() => {
        setLoading(false);
        onLogin();
      }, 800);
      return;
    }

    void signInRedirect().catch((err: Error) => {
      setError(err.message || "No se pudo iniciar el proceso de autenticación.");
      setLoading(false);
    });
  };

  return (
    <div className="min-h-screen bg-[#0B1F3A] flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Left panel — decorative */}
      <div
        className="hidden lg:flex flex-1 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #071526 0%, #0B1F3A 50%, #12294F 100%)",
        }}
      >
        <img
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&h=1100&fit=crop&auto=format"
          alt="Propiedad de lujo"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 flex flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#C9A84C] flex items-center justify-center">
              <span className="text-[#0B1F3A] font-black text-xs tracking-tighter">C21</span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>
                {profile.name || profile.officeName || "Century 21 Colombia"}
              </p>
              <p className="text-[#C9A84C] text-xs">{profile.name ? profile.officeName || "Century 21 Colombia" : ""}</p>
            </div>
          </div>

          <div>
            <h2
              className="text-white mb-4 leading-tight"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "2.25rem",
                fontWeight: 600,
              }}
            >
              {t('login.panelTitle')}
            </h2>
            <p className="text-white/50 text-sm leading-relaxed max-w-sm">
              {t('login.panelDesc')}
            </p>

            <div className="mt-10 grid grid-cols-2 gap-4">
              {PANEL_STATS.map(({ n, label }) => (
                <div key={label} className="bg-white/5 border border-white/10 p-4">
                  <p
                    className="text-[#C9A84C] mb-0.5"
                    style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem" }}
                  >
                    {n}
                  </p>
                  <p className="text-white/40 text-xs">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="w-full lg:w-[480px] flex flex-col justify-center p-8 lg:p-12 bg-[#F8F7F4]">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#6B7280] hover:text-[#0B1F3A] text-sm mb-8 transition-colors w-fit"
        >
          <ArrowLeft size={14} />
          {t('login.back')}
        </button>

        <div className="mb-8">
          <p className="text-[#C9A84C] text-xs font-semibold tracking-[0.2em] uppercase mb-2">
            {t('login.private')}
          </p>
          <h1
            className="text-[#0B1F3A] mb-2"
            style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.75rem", fontWeight: 600 }}
          >
            {t('login.welcome', { name: firstName ? `, ${firstName}` : "" })}
          </h1>
          <p className="text-[#6B7280] text-sm">
            {t('login.subtitle')}
          </p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-[#0B1F3A] text-white py-3 text-sm font-semibold hover:bg-[#C9A84C] hover:text-[#0B1F3A] transition-colors disabled:opacity-60"
        >
          <Lock size={14} />
          {loading ? t('login.form.verifying') : t('login.form.submit')}
        </button>
        <p className="mt-3 text-[#6B7280] text-xs text-center">
          {cognitoEnabled()
            ? "Serás redirigido al inicio de sesión seguro de AWS Cognito."
            : "Modo local: acceso directo sin credenciales (Cognito no configurado)."}
        </p>

        <p className="mt-8 text-[#6B7280] text-xs text-center">
          {t('login.footer.restricted')} <br />
          ¿Problemas de acceso?{" "}
          <a href="mailto:soporte@century21.com.co" className="text-[#C9A84C] hover:underline">
            {t('login.footer.support')}
          </a>
        </p>
      </div>
    </div>
  );
}
