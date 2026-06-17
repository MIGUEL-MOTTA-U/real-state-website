import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, ArrowLeft, Lock, Mail, Chrome } from "lucide-react";

interface LoginPageProps {
  onLogin: () => void;
  onBack: () => void;
}

export function LoginPage({ onLogin, onBack }: LoginPageProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(t('login.form.errorFields'));
      return;
    }
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 1200);
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
                Aura Urrea
              </p>
              <p className="text-[#C9A84C] text-xs">Century 21 Colombia</p>
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
              {[
                { n: "47", label: t('login.stats.active') },
                { n: "12", label: t('login.stats.negotiation') },
                { n: "8", label: t('login.stats.closings') },
                { n: "98%", label: t('login.stats.satisfaction') },
              ].map(({ n, label }) => (
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
            {t('login.welcome')}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[#1F2937] text-xs font-semibold block mb-1.5">
              {t('login.form.email')}
            </label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aura.urrea@century21.com.co"
                className="w-full pl-9 pr-4 py-3 border border-[#E8E4DB] bg-white text-[#1F2937] text-sm focus:outline-none focus:border-[#0B1F3A] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-[#1F2937] text-xs font-semibold block mb-1.5">
              {t('login.form.password')}
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                className="w-full pl-9 pr-10 py-3 border border-[#E8E4DB] bg-white text-[#1F2937] text-sm focus:outline-none focus:border-[#0B1F3A] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#1F2937]"
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="button" className="text-[#C9A84C] text-xs hover:underline">
              {t('login.form.forgot')}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0B1F3A] text-white py-3 text-sm font-semibold hover:bg-[#C9A84C] hover:text-[#0B1F3A] transition-colors disabled:opacity-60"
          >
            {loading ? t('login.form.verifying') : t('login.form.submit')}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-[#E8E4DB]" />
          <span className="text-[#6B7280] text-xs">{t('login.form.continueWith')}</span>
          <div className="flex-1 h-px bg-[#E8E4DB]" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 border border-[#E8E4DB] bg-white py-2.5 text-sm text-[#1F2937] hover:border-[#0B1F3A] transition-colors">
            <Chrome size={14} />
            {t('login.social.aws')}
          </button>
          <button className="flex items-center justify-center gap-2 border border-[#E8E4DB] bg-white py-2.5 text-sm text-[#1F2937] hover:border-[#0B1F3A] transition-colors">
            <svg width="14" height="14" viewBox="0 0 23 23" fill="none">
              <path d="M11.5 0C5.149 0 0 5.149 0 11.5S5.149 23 11.5 23 23 17.851 23 11.5 17.851 0 11.5 0z" fill="#00A4EF"/>
              <path d="M11.5 2.3A9.2 9.2 0 1 1 2.3 11.5 9.2 9.2 0 0 1 11.5 2.3z" fill="#fff"/>
              <path d="M11.5 5.75a5.75 5.75 0 1 0 0 11.5 5.75 5.75 0 0 0 0-11.5zm0 1.15a4.6 4.6 0 1 1 0 9.2 4.6 4.6 0 0 1 0-9.2z" fill="#00A4EF"/>
            </svg>
            {t('login.social.entraid')}
          </button>
        </div>

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
