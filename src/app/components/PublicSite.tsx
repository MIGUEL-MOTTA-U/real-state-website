import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Phone, MessageCircle, Mail, MapPin, ChevronDown,
  Home, Key, TrendingUp, Shield, Star, Award,
  Instagram, Linkedin, Facebook, ArrowRight, Menu, X, Building2
} from "lucide-react";
import { listingsApi } from "../services/api";
import { publishedFirst, toPublicCard } from "../services/mappers";
import { whatsappHref } from "../services/profile";
import { useAgentProfile } from "../hooks/useAgentProfile";
import { AgentAvatar } from "./AgentAvatar";

interface PublicSiteProps {
  onNavigateToDashboard: () => void;
}

/** Tarjeta que renderiza la grilla de propiedades destacadas. */
interface ListingCardData {
  id: string | number;
  title: string;
  price: string;
  area: number;
  location: string;
  status: string[];
  beds: number;
  baths: number;
  img: string;
}

  /* LISTINGS moved inside component */

  /* SERVICES moved inside component */

function StatusBadge({ label }: { label: string }) {
  const styles: Record<string, string> = {
    Destacado: "bg-[#C9A84C] text-[#0B1F3A]",
    Venta: "bg-[#0B1F3A] text-[#F8F7F4]",
    Arriendo: "bg-[#1F2937] text-[#F8F7F4]",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-semibold tracking-wide uppercase rounded-sm ${styles[label] ?? "bg-gray-200 text-gray-800"}`}
    >
      {label}
    </span>
  );
}

export function PublicSite({ onNavigateToDashboard }: PublicSiteProps) {
  const { t } = useTranslation();
  const [remoteListings, setRemoteListings] = useState<ListingCardData[] | null>(null);

  // Perfil real del agente (VITE_PROFILE_USER_ID). Los datos personales sin
  // valor no se muestran: no hay información mockeada de perfil.
  const profile = useAgentProfile();
  const agentName = profile.name;
  const agentOffice = profile.officeName || "Century 21 Colombia";
  const agentHeadline = profile.headline || t("public.hero.subtitle");
  const agentEmail = profile.email;
  const agentPhone = profile.phone;
  const agentAddress = profile.officeAddress;
  // Imagen de fondo genérica del hero (no es foto de perfil); se reemplaza
  // configurando metadata.hero_image_url en el perfil.
  const heroPoster =
    profile.heroImageUrl ||
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&h=900&fit=crop&auto=format";
  const waLink = whatsappHref(profile);
  const telLink = agentPhone ? `tel:${agentPhone.replace(/[^\d+]/g, "")}` : "";
  const STATS = [
    { n: profile.stats.sold, label: t("public.stats.sold") },
    { n: profile.stats.experience, label: t("public.stats.experience") },
    { n: profile.stats.satisfied, label: t("public.stats.satisfied") },
    { n: profile.stats.ranking, label: t("public.stats.topAgent") },
  ].filter(({ n }) => n);
  const SOCIALS = [
    { Icon: Instagram, href: profile.instagramUrl },
    { Icon: Linkedin, href: profile.linkedinUrl },
    { Icon: Facebook, href: profile.facebookUrl },
  ].filter(({ href }) => href);
  const CONTACT_ROWS = [
    { icon: Phone, label: t("public.contact.phone"), val: agentPhone },
    { icon: MessageCircle, label: t("public.contact.whatsapp"), val: agentPhone },
    { icon: Mail, label: t("public.contact.email"), val: agentEmail },
    { icon: MapPin, label: t("public.contact.office"), val: agentAddress },
  ].filter(({ val }) => val);

  // Carga los inmuebles publicados desde el backend. Si el API no está
  // disponible se mantienen las tarjetas estáticas de demostración.
  useEffect(() => {
    let cancelled = false;
    listingsApi
      .list()
      .then((all) => {
        if (cancelled) return;
        const cards = publishedFirst(all ?? [])
          .slice(0, 6)
          .map((l) => {
            const card = toPublicCard(l);
            return {
              id: card.id,
              title: card.title,
              price: card.price,
              area: card.area,
              location: card.location,
              status: [
                ...(card.featured ? [t("public.listings.status.featured")] : []),
                card.operation,
              ],
              beds: card.beds,
              baths: card.baths,
              img: card.img,
            } satisfies ListingCardData;
          });
        if (cards.length > 0) setRemoteListings(cards);
      })
      .catch(() => {
        /* sin API: se conservan las tarjetas estáticas */
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  const LISTINGS: ListingCardData[] = remoteListings ?? [
    {
      id: 1,
      title: t('public.listings.title_1'),
      price: "$850.000.000",
      area: 180,
      location: t('public.listings.loc_1'),
      status: [t('public.listings.status.featured'), t('public.listings.status.sale')],
      beds: 3,
      baths: 3,
      img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&auto=format",
    },
    {
      id: 2,
      title: t('public.listings.title_2'),
      price: "$2.400.000.000",
      area: 320,
      location: t('public.listings.loc_2'),
      status: [t('public.listings.status.sale')],
      beds: 5,
      baths: 4,
      img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop&auto=format",
    },
    {
      id: 3,
      title: t('public.listings.title_3'),
      price: "$3.200.000.000",
      area: 280,
      location: t('public.listings.loc_3'),
      status: [t('public.listings.status.sale'), t('public.listings.status.rent')],
      beds: 4,
      baths: 4,
      img: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop&auto=format",
    },
  ];

  const SERVICES = [
    {
      icon: Home,
      title: t('public.services.buySell'),
      desc: t('public.services.buySellDesc'),
    },
    {
      icon: Key,
      title: t('public.services.rent'),
      desc: t('public.services.rentDesc'),
    },
    {
      icon: TrendingUp,
      title: t('public.services.valuation'),
      desc: t('public.services.valuationDesc'),
    },
    {
      icon: Shield,
      title: t('public.services.legalAdvice'),
      desc: t('public.services.legalAdviceDesc'),
    },
  ];
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", message: "" });
  const [formSent, setFormSent] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSent(true);
    setTimeout(() => setFormSent(false), 4000);
    setFormData({ name: "", phone: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4]" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── NAV ─────────────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-[#0B1F3A]/95 backdrop-blur-sm shadow-lg" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#C9A84C] flex items-center justify-center">
              <span className="text-[#0B1F3A] font-black text-xs tracking-tighter">C21</span>
            </div>
            <div>
              <span className="text-white font-semibold text-sm tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>
                {agentName || agentOffice}
              </span>
              <span className="text-[#C9A84C] text-xs block leading-none">{agentName ? agentOffice : ""}</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {["inicio", "nosotros", "propiedades", "servicios", "contacto"].map((key, i) => {
              const ids = ["hero", "about", "listings", "services", "contact"];
              return (
                <button
                  key={key}
                  onClick={() => scrollTo(ids[i])}
                  className="text-white/80 hover:text-[#C9A84C] text-sm font-medium transition-colors"
                >
                  {t(`public.nav.${key}`)}
                </button>
              );
            })}
            <button
              onClick={onNavigateToDashboard}
              className="text-xs border border-[#C9A84C]/50 text-[#C9A84C] px-3 py-1.5 hover:bg-[#C9A84C] hover:text-[#0B1F3A] transition-all"
            >
              {t('common.panel')}
            </button>
          </nav>

          <button
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0B1F3A] border-t border-white/10 px-6 py-4 flex flex-col gap-4">
            {["inicio", "nosotros", "propiedades", "servicios", "contacto"].map((key, i) => {
              const ids = ["hero", "about", "listings", "services", "contact"];
              return (
                <button
                  key={key}
                  onClick={() => scrollTo(ids[i])}
                  className="text-white/80 text-sm font-medium text-left"
                >
                  {t(`public.nav.${key}`)}
                </button>
              );
            })}
            <button
              onClick={onNavigateToDashboard}
              className="text-[#C9A84C] text-sm font-medium text-left"
            >
              {t('common.dashboard')} →
            </button>
          </div>
        )}
      </header>

      {/* ── HERO ────────────────────────────────────────── */}
      <section id="hero" className="relative h-screen overflow-hidden">
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster={heroPoster}
        >
          <source src="" type="video/mp4" />
        </video>

        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(160deg, rgba(11,31,58,0.85) 0%, rgba(11,31,58,0.55) 50%, rgba(11,31,58,0.75) 100%)",
          }}
        />

        <div className="relative h-full flex flex-col justify-center max-w-7xl mx-auto px-6">
          <div className="max-w-2xl">
            <p className="text-[#C9A84C] text-sm font-semibold tracking-[0.2em] uppercase mb-4">
              {t('public.hero.premium')}
            </p>
            <h1
              className="text-white mb-4 leading-tight"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(2.8rem, 6vw, 5rem)",
                fontWeight: 600,
              }}
            >
              {agentName || agentOffice}
            </h1>
            <p className="text-white/70 text-lg mb-2">
              {agentHeadline}
            </p>
            <p className="text-white/50 text-sm mb-10 max-w-lg">
              {profile.presentation || t('public.hero.description')}
            </p>

            <div className="flex flex-wrap gap-3">
              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-[#25D366] text-white px-5 py-3 text-sm font-semibold hover:bg-[#1da855] transition-colors"
                >
                  <MessageCircle size={16} />
                  {t('public.hero.whatsapp')}
                </a>
              )}
              {telLink && (
                <a
                  href={telLink}
                  className="flex items-center gap-2 bg-[#C9A84C] text-[#0B1F3A] px-5 py-3 text-sm font-semibold hover:bg-[#e8c97a] transition-colors"
                >
                  <Phone size={16} />
                  {t('public.hero.call')}
                </a>
              )}
              <button
                onClick={() => scrollTo("contact")}
                className="flex items-center gap-2 border border-white/40 text-white px-5 py-3 text-sm font-semibold hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors"
              >
                <Mail size={16} />
                {t('public.hero.contact')}
              </button>
            </div>
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40">
            <span className="text-xs tracking-widest uppercase">{t('public.hero.explore')}</span>
            <ChevronDown size={16} className="animate-bounce" />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24"
          style={{ background: "linear-gradient(to top, #F8F7F4, transparent)" }}
        />
      </section>

      {/* ── STATS BAR ───────────────────────────────────── */}
      {STATS.length > 0 && (
        <section className="bg-[#0B1F3A] py-6">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 divide-x divide-white/10">
            {STATS.map(({ n, label }) => (
              <div key={label} className="pl-6 first:pl-0">
                <p
                  className="text-[#C9A84C] mb-0.5"
                  style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.75rem", fontWeight: 600 }}
                >
                  {n}
                </p>
                <p className="text-white/50 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── ABOUT ───────────────────────────────────────── */}
      <section id="about" className="py-24 max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="absolute -top-4 -left-4 w-full h-full border border-[#C9A84C]/30" />
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={`${agentName}, Agente ${agentOffice}`}
                className="relative w-full object-cover"
                style={{ aspectRatio: "3/4" }}
              />
            ) : (
              <AgentAvatar
                name={agentName}
                className="relative w-full aspect-[3/4]"
                textClass="text-7xl"
              />
            )}
            {profile.awardText && (
              <div
                className="absolute bottom-0 left-0 right-0 p-6"
                style={{ background: "linear-gradient(to top, rgba(11,31,58,0.95), transparent)" }}
              >
                <div className="flex items-center gap-2">
                  <Award size={16} className="text-[#C9A84C]" />
                  <span className="text-white/90 text-sm">{profile.awardText}</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <p className="text-[#C9A84C] text-xs font-semibold tracking-[0.2em] uppercase mb-4">
              {t('public.about.title')}
            </p>
            <h2
              className="text-[#0B1F3A] mb-6 leading-tight"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(2rem, 3.5vw, 2.75rem)",
                fontWeight: 600,
              }}
            >
              {t('public.about.heroTitle')}
            </h2>
            <p className="text-[#6B7280] mb-4 leading-relaxed">
              {profile.bio || t('public.about.desc1')}
            </p>
            <p className="text-[#6B7280] mb-8 leading-relaxed">
              {profile.aboutExtra || t('public.about.desc2')}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                { icon: Star, text: t('public.about.gold') },
                { icon: Award, text: t('public.about.certified') },
                { icon: Building2, text: t('public.about.luxury') },
                { icon: Shield, text: t('public.about.legal') },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2">
                  <Icon size={14} className="text-[#C9A84C] shrink-0" />
                  <span className="text-[#1F2937] text-sm">{text}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 p-4 bg-[#F0EDE6] border-l-2 border-[#C9A84C]">
              <AgentAvatar
                src={profile.avatarUrl}
                name={agentName}
                className="w-12 h-12 rounded-full shrink-0"
              />
              <div>
                <p className="text-[#0B1F3A] text-sm font-semibold">{agentName || agentOffice}</p>
                <p className="text-[#6B7280] text-xs">{agentHeadline}</p>
              </div>
              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto bg-[#0B1F3A] text-[#F8F7F4] text-xs px-4 py-2 hover:bg-[#C9A84C] hover:text-[#0B1F3A] transition-colors"
                >
                  {t('public.about.write')}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURED LISTINGS ───────────────────────────── */}
      <section id="listings" className="py-24 bg-[#F0EDE6]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <p className="text-[#C9A84C] text-xs font-semibold tracking-[0.2em] uppercase mb-3">
                {t('public.listings.title')}
              </p>
              <h2
                className="text-[#0B1F3A] leading-tight"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                  fontWeight: 600,
                }}
              >
                {t('public.listings.heroTitle')}
              </h2>
            </div>
            <button className="flex items-center gap-2 text-[#C9A84C] text-sm font-semibold border-b border-[#C9A84C]/40 hover:border-[#C9A84C] pb-0.5 transition-colors">
              {t('public.listings.all')} <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {LISTINGS.map((p) => (
              <article
                key={p.id}
                className="bg-white group overflow-hidden cursor-pointer hover:shadow-xl transition-shadow duration-300"
              >
                <div className="relative overflow-hidden" style={{ aspectRatio: "4/3" }}>
                  <img
                    src={p.img}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {p.status.map((s) => (
                      <StatusBadge key={s} label={s} />
                    ))}
                  </div>
                </div>

                <div className="p-5">
                  <p className="text-[#6B7280] text-xs mb-1 flex items-center gap-1">
                    <MapPin size={10} /> {p.location}
                  </p>
                  <h3
                    className="text-[#0B1F3A] mb-3 leading-snug"
                    style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.05rem", fontWeight: 600 }}
                  >
                    {p.title}
                  </h3>
                  <p className="text-[#C9A84C] font-bold mb-3" style={{ fontSize: "1.1rem" }}>
                    {p.price}
                  </p>

                  <div className="flex items-center gap-4 pt-3 border-t border-[#E8E4DB] text-[#6B7280] text-xs">
                    <span>{p.area} m²</span>
                    <span>{p.beds} {t('public.listings.beds')}</span>
                    <span>{p.baths} {t('public.listings.baths')}</span>
                    <button className="ml-auto text-[#0B1F3A] font-medium hover:text-[#C9A84C] transition-colors text-xs">
                      {t('public.listings.more')}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ────────────────────────────────────── */}
      <section id="services" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-[#C9A84C] text-xs font-semibold tracking-[0.2em] uppercase mb-3">
            Servicios
          </p>
          <h2
            className="text-[#0B1F3A] leading-tight"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
              fontWeight: 600,
            }}
          >
            Un servicio completo, a su medida
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group p-8 border border-[#E8E4DB] hover:border-[#C9A84C] bg-white hover:bg-[#F8F7F4] transition-all duration-200 cursor-pointer"
            >
              <div className="w-10 h-10 bg-[#0B1F3A] flex items-center justify-center mb-5 group-hover:bg-[#C9A84C] transition-colors">
                <Icon size={18} className="text-white group-hover:text-[#0B1F3A] transition-colors" />
              </div>
              <h3
                className="text-[#0B1F3A] mb-3"
                style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.05rem", fontWeight: 600 }}
              >
                {title}
              </h3>
              <p className="text-[#6B7280] text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CONTACT ─────────────────────────────────────── */}
      <section id="contact" className="bg-[#0B1F3A] py-24">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-start">
          <div>
            <p className="text-[#C9A84C] text-xs font-semibold tracking-[0.2em] uppercase mb-4">
              {t('public.contact.title')}
            </p>
            <h2
              className="text-white mb-6 leading-tight"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                fontWeight: 600,
              }}
            >
              {t('public.contact.heroTitle')}
            </h2>
            <p className="text-white/60 mb-10 leading-relaxed">
              {t('public.contact.desc')}
            </p>

            <div className="space-y-5">
              {CONTACT_ROWS.map(({ icon: Icon, label, val }) => (
                <div key={label} className="flex items-center gap-4">
                  <div className="w-8 h-8 border border-[#C9A84C]/40 flex items-center justify-center shrink-0">
                    <Icon size={14} className="text-[#C9A84C]" />
                  </div>
                  <div>
                    <p className="text-white/40 text-xs">{label}</p>
                    <p className="text-white/90 text-sm">{val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-8">
            {formSent ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-[#C9A84C]/20 flex items-center justify-center mx-auto mb-4">
                  <Mail size={20} className="text-[#C9A84C]" />
                </div>
                <p className="text-white font-semibold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {t('public.contact.formTitle')}
                </p>
                <p className="text-white/60 text-sm">{t('public.contact.formSubtitle')}</p>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-5">
                <div>
                  <label className="text-white/60 text-xs block mb-1.5">{t('public.contact.labelName')}</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white/8 border border-white/15 text-white placeholder-white/30 px-4 py-3 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors"
                    placeholder="María García"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-xs block mb-1.5">{t('public.contact.labelPhone')}</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-white/8 border border-white/15 text-white placeholder-white/30 px-4 py-3 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors"
                    placeholder="+57 300 000 0000"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-xs block mb-1.5">{t('public.contact.labelMessage')}</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-white/8 border border-white/15 text-white placeholder-white/30 px-4 py-3 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors resize-none"
                    placeholder="Estoy interesado en..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#C9A84C] text-[#0B1F3A] py-3 text-sm font-semibold hover:bg-[#e8c97a] transition-colors"
                >
                  {t('public.contact.btnSend')}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <footer className="bg-[#071526] py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-[#C9A84C] flex items-center justify-center">
                  <span className="text-[#0B1F3A] font-black text-xs tracking-tighter">C21</span>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>{agentName || agentOffice}</p>
                  <p className="text-[#C9A84C] text-xs">{agentName ? agentOffice : ""}</p>
                </div>
              </div>
              <p className="text-white/40 text-xs leading-relaxed max-w-xs">
                {profile.presentation || t('public.hero.description')}
              </p>
            </div>

            <div>
              <p className="text-white/60 text-xs font-semibold tracking-widest uppercase mb-4">{t('public.footer.nav')}</p>
              <div className="space-y-2">
                {["inicio", "nosotros", "propiedades", "servicios", "contacto"].map((key, i) => {
                  const ids = ["hero", "about", "listings", "services", "contact"];
                  return (
                    <button
                      key={key}
                      onClick={() => scrollTo(ids[i])}
                      className="text-white/50 hover:text-[#C9A84C] text-sm block transition-colors"
                    >
                      {t(`public.nav.${key}`)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-white/60 text-xs font-semibold tracking-widest uppercase mb-4">{t('public.footer.contact')}</p>
              <div className="space-y-2">
                {agentPhone && <p className="text-white/50 text-sm">{agentPhone}</p>}
                {agentEmail && <p className="text-white/50 text-sm">{agentEmail}</p>}
                {agentAddress && <p className="text-white/50 text-sm">{agentAddress}</p>}
              </div>
              {SOCIALS.length > 0 && (
                <div className="flex gap-3 mt-5">
                  {SOCIALS.map(({ Icon, href }, i) => (
                    <a
                      key={i}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 border border-white/15 flex items-center justify-center text-white/40 hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors"
                    >
                      <Icon size={14} />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-white/30 text-xs">
            <p>{t('public.footer.rights', { year: new Date().getFullYear(), name: [agentName, agentOffice].filter(Boolean).join(" · ") })}</p>
            <p>{t('public.footer.license')}</p>
          </div>
        </div>
      </footer>

      {/* ── FLOATING WHATSAPP ────────────────────────────── */}
      {waLink && (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] flex items-center justify-center shadow-lg hover:bg-[#1da855] transition-colors"
          style={{ borderRadius: "50%" }}
          title="Escribir por WhatsApp"
        >
          <MessageCircle size={24} className="text-white" />
        </a>
      )}
    </div>
  );
}
