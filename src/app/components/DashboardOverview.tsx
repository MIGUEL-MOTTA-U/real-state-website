import { Building2, Eye, FileEdit, Star, TrendingUp, TrendingDown, Clock, CheckCircle2, AlertCircle, Edit3, Archive } from "lucide-react";
import { useTranslation } from "react-i18next";

export function DashboardOverview() {
  const { t } = useTranslation();

  const KPI_CARDS = [
    {
      label: t('dashboard.kpis.total'),
      value: "47",
      delta: t('dashboard.kpiDelta.thisMonth', { count: "+3" }),
      up: true,
      icon: Building2,
      color: "bg-[#0B1F3A]",
      iconColor: "text-[#C9A84C]",
    },
    {
      label: t('dashboard.kpis.published'),
      value: "32",
      delta: t('dashboard.kpiDelta.thisWeek', { count: "+2" }),
      up: true,
      icon: Eye,
      color: "bg-[#C9A84C]",
      iconColor: "text-[#0B1F3A]",
    },
    {
      label: t('dashboard.kpis.drafts'),
      value: "11",
      delta: t('dashboard.kpiDelta.pending', { count: "4" }),
      up: false,
      icon: FileEdit,
      color: "bg-[#1F2937]",
      iconColor: "text-white",
    },
    {
      label: t('dashboard.kpis.featured'),
      value: "8",
      delta: t('dashboard.kpiDelta.thisWeek', { count: "+1" }),
      up: true,
      icon: Star,
      color: "bg-[#E8E4DB]",
      iconColor: "text-[#0B1F3A]",
    },
  ];

  const ACTIVITY = [
    {
      id: 1,
      type: "published",
      title: "Apartamento El Poblado — publicado",
      sub: "Hace 2 horas · por Aura Urrea",
      icon: CheckCircle2,
      iconColor: "text-green-600",
      dot: "bg-green-500",
    },
    {
      id: 2,
      type: "edit",
      title: "Penthouse Cartagena — precio actualizado",
      sub: "Hace 5 horas · $3.200.000.000 → $2.980.000.000",
      icon: Edit3,
      iconColor: "text-[#C9A84C]",
      dot: "bg-[#C9A84C]",
    },
    {
      id: 3,
      type: "draft",
      title: "Casa La Calera — guardado como borrador",
      sub: "Ayer, 4:30 PM",
      icon: FileEdit,
      iconColor: "text-[#6B7280]",
      dot: "bg-[#6B7280]",
    },
    {
      id: 4,
      type: "alert",
      title: "Casa Rosales — fotos pendientes",
      sub: "Faltan 3 fotos para publicar",
      icon: AlertCircle,
      iconColor: "text-amber-500",
      dot: "bg-amber-400",
    },
    {
      id: 5,
      type: "archived",
      title: "Oficina Chapinero — archivada",
      sub: "Hace 2 días · vendida",
      icon: Archive,
      iconColor: "text-[#6B7280]",
      dot: "bg-[#E8E4DB]",
    },
  ];

  const RECENT_LISTINGS = [
    {
      title: "Apartamento El Poblado",
      price: "$850.000.000",
      status: t('dashboard.status.published'),
      views: 234,
      img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=80&h=60&fit=crop&auto=format",
    },
    {
      title: "Penthouse Cartagena",
      price: "$2.980.000.000",
      status: t('dashboard.status.featured'),
      views: 512,
      img: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=80&h=60&fit=crop&auto=format",
    },
    {
      title: "Casa La Calera",
      price: "$2.400.000.000",
      status: t('dashboard.status.draft'),
      views: 0,
      img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=80&h=60&fit=crop&auto=format",
    },
    {
      title: "Apartamento Laureles",
      price: "$490.000.000",
      status: t('dashboard.status.published'),
      views: 88,
      img: "https://images.unsplash.com/photo-1567496898669-ee93519 laT0?w=80&h=60&fit=crop&auto=format",
    },
  ];

  function statusStyle(s: string) {
    if (s === t('dashboard.status.published')) return "bg-green-100 text-green-800";
    if (s === t('dashboard.status.featured')) return "bg-[#C9A84C]/15 text-[#7a5c1a]";
    if (s === t('dashboard.status.draft')) return "bg-[#E8E4DB] text-[#6B7280]";
    if (s === t('dashboard.status.archived')) return "bg-gray-100 text-gray-500";
    return "bg-gray-100 text-gray-600";
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="mb-8">
        <p className="text-[#6B7280] text-xs mb-1">{t('dashboard.date')}</p>
        <h1
          className="text-[#0B1F3A]"
          style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.75rem", fontWeight: 600 }}
        >
          {t('dashboard.greeting')}
        </h1>
        <p className="text-[#6B7280] text-sm mt-1">
          {t('dashboard.summary')}
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {KPI_CARDS.map(({ label, value, delta, up, icon: Icon, color, iconColor }) => (
          <div key={label} className="bg-white border border-[#E8E4DB] p-5">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-9 h-9 ${color} flex items-center justify-center`}>
                <Icon size={16} className={iconColor} />
              </div>
              <div className="flex items-center gap-1">
                {up ? (
                  <TrendingUp size={11} className="text-green-500" />
                ) : (
                  <TrendingDown size={11} className="text-amber-500" />
                )}
              </div>
            </div>
            <p
              className="text-[#0B1F3A] mb-0.5"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.75rem", fontWeight: 600 }}
            >
              {value}
            </p>
            <p className="text-[#6B7280] text-xs mb-1">{label}</p>
            <p className={`text-xs ${up ? "text-green-600" : "text-amber-600"}`}>{delta}</p>
          </div>
        ))}
      </div>

      {/* Two-column: recent listings + activity feed */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Recent listings — 3 cols */}
        <div className="lg:col-span-3 bg-white border border-[#E8E4DB]">
          <div className="px-5 py-4 border-b border-[#E8E4DB] flex items-center justify-between">
            <h2 className="text-[#0B1F3A] text-sm font-semibold">{t('dashboard.recentListings')}</h2>
            <button className="text-[#C9A84C] text-xs hover:underline">{t('dashboard.viewAll')}</button>
          </div>
          <div className="divide-y divide-[#F0EDE6]">
            {RECENT_LISTINGS.map((l) => (
              <div key={l.title} className="flex items-center gap-4 px-5 py-3 hover:bg-[#F8F7F4] transition-colors">
                <img
                  src={l.img}
                  alt={l.title}
                  className="w-14 h-10 object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[#1F2937] text-sm font-medium truncate">{l.title}</p>
                  <p className="text-[#C9A84C] text-xs font-semibold">{l.price}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs px-2 py-0.5 ${statusStyle(l.status)}`}>
                    {l.status}
                  </span>
                  {l.views > 0 && (
                    <span className="text-[#6B7280] text-xs flex items-center gap-1">
                      <Eye size={10} /> {l.views}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity feed — 2 cols */}
        <div className="lg:col-span-2 bg-white border border-[#E8E4DB]">
          <div className="px-5 py-4 border-b border-[#E8E4DB]">
            <h2 className="text-[#0B1F3A] text-sm font-semibold">{t('dashboard.activity')}</h2>
          </div>
          <div className="p-5 space-y-4">
            {ACTIVITY.map((a) => {
              const Icon = a.icon;
              return (
                <div key={a.id} className="flex gap-3">
                  <div className="relative flex flex-col items-center">
                    <div className={`w-7 h-7 flex items-center justify-center bg-[#F0EDE6]`}>
                      <Icon size={13} className={a.iconColor} />
                    </div>
                    {a.id < ACTIVITY.length && (
                      <div className="w-px flex-1 bg-[#E8E4DB] mt-1" style={{ minHeight: "16px" }} />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className="text-[#1F2937] text-xs font-medium leading-snug">{a.title}</p>
                    <p className="text-[#6B7280] text-xs mt-0.5 flex items-center gap-1">
                      <Clock size={9} /> {a.sub}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick stats bar */}
      <div className="mt-6 bg-[#0B1F3A] p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('dashboard.quickStats.visits'), val: "1.247", icon: Eye },
          { label: t('dashboard.quickStats.queries'), val: "34", icon: Clock },
          { label: t('dashboard.quickStats.negotiation'), val: "12", icon: TrendingUp },
          { label: t('dashboard.quickStats.projected'), val: "4", icon: CheckCircle2 },
        ].map(({ label, val, icon: Icon }) => (
          <div key={label} className="flex items-center gap-3">
            <Icon size={14} className="text-[#C9A84C] shrink-0" />
            <div>
              <p className="text-white font-semibold text-sm">{val}</p>
              <p className="text-white/40 text-xs">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
