import { useState } from "react";
import {
  LayoutDashboard, Building2, PlusSquare, Settings,
  LogOut, ChevronRight, Bell, Search, User, Menu, X
} from "lucide-react";
import { DashboardOverview } from "./DashboardOverview";
import { ListingsTable } from "./ListingsTable";
import { ListingFormView } from "./ListingFormView";

type DashView = "overview" | "listings" | "new-listing" | "edit-listing" | "settings";

interface DashboardShellProps {
  onLogout: () => void;
}

const NAV_ITEMS: { id: DashView; icon: typeof LayoutDashboard; label: string }[] = [
  { id: "overview", icon: LayoutDashboard, label: "Resumen" },
  { id: "listings", icon: Building2, label: "Propiedades" },
  { id: "new-listing", icon: PlusSquare, label: "Nueva propiedad" },
  { id: "settings", icon: Settings, label: "Configuración" },
];

export function DashboardShell({ onLogout }: DashboardShellProps) {
  const [view, setView] = useState<DashView>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pageTitle: Record<DashView, string> = {
    overview: "Resumen",
    listings: "Propiedades",
    "new-listing": "Nueva propiedad",
    "edit-listing": "Editar propiedad",
    settings: "Configuración",
  };

  return (
    <div className="flex h-screen bg-[#F8F7F4] overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ─────────────────────────────────────── */}
      <aside
        className={`fixed md:relative top-0 left-0 h-full z-40 flex flex-col w-[220px] bg-[#0B1F3A] transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#C9A84C] flex items-center justify-center shrink-0">
              <span className="text-[#0B1F3A] font-black text-xs tracking-tighter">C21</span>
            </div>
            <div>
              <p
                className="text-white text-sm font-semibold leading-none"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Aura Urrea
              </p>
              <p className="text-[#C9A84C] text-[10px] mt-0.5">Century 21 Colombia</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <p className="text-white/30 text-[9px] font-bold uppercase tracking-[0.15em] px-3 py-2 mt-1">
            Panel de control
          </p>
          {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => { setView(id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all group ${
                view === id || (id === "listings" && view === "edit-listing")
                  ? "bg-[#C9A84C]/15 text-[#C9A84C] border-l-2 border-[#C9A84C]"
                  : "text-white/60 hover:text-white hover:bg-white/5 border-l-2 border-transparent"
              }`}
            >
              <Icon size={15} />
              <span>{label}</span>
              {(view === id) && <ChevronRight size={11} className="ml-auto text-[#C9A84C]" />}
            </button>
          ))}

          <div className="border-t border-white/8 mt-4 pt-4">
            <p className="text-white/30 text-[9px] font-bold uppercase tracking-[0.15em] px-3 py-2">
              Estado
            </p>
            <div className="px-3 py-2 space-y-2">
              {[
                { label: "Publicadas", val: "32", color: "bg-green-400" },
                { label: "Borradores", val: "11", color: "bg-amber-400" },
                { label: "Archivadas", val: "4", color: "bg-gray-400" },
              ].map(({ label, val, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
                    <span className="text-white/50 text-xs">{label}</span>
                  </div>
                  <span className="text-white/70 text-xs font-semibold">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-white/8">
          <div className="flex items-center gap-2.5 mb-3">
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=40&h=40&fit=crop&auto=format"
              alt="Aura Urrea"
              className="w-8 h-8 object-cover rounded-full"
            />
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">Aura Urrea</p>
              <p className="text-white/40 text-[10px] truncate">Agente Senior</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 text-white/50 hover:text-red-400 text-xs py-1.5 transition-colors"
          >
            <LogOut size={12} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-[#E8E4DB] px-6 h-14 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-[#6B7280]"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-1.5 text-[#6B7280] text-xs">
              <span>Panel</span>
              <ChevronRight size={11} />
              <span className="text-[#1F2937] font-medium">{pageTitle[view]}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 border border-[#E8E4DB] px-3 py-1.5 text-[#6B7280]">
              <Search size={12} />
              <input
                placeholder="Buscar propiedades..."
                className="text-xs w-36 focus:outline-none text-[#1F2937] placeholder-[#9CA3AF] bg-transparent"
              />
            </div>

            {/* Notifications */}
            <div className="relative">
              <button className="text-[#6B7280] hover:text-[#0B1F3A] transition-colors">
                <Bell size={16} />
              </button>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#C9A84C] text-[#0B1F3A] text-[8px] font-bold flex items-center justify-center rounded-full">
                4
              </span>
            </div>

            {/* Avatar */}
            <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=32&h=32&fit=crop&auto=format"
                alt="Aura"
                className="w-7 h-7 object-cover rounded-full"
              />
            </button>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto p-6">
          {view === "overview" && <DashboardOverview />}
          {view === "listings" && (
            <ListingsTable
              onNewListing={() => setView("new-listing")}
              onEditListing={() => setView("edit-listing")}
            />
          )}
          {(view === "new-listing" || view === "edit-listing") && (
            <ListingFormView onBack={() => setView("listings")} />
          )}
          {view === "settings" && <SettingsView />}
        </main>
      </div>
    </div>
  );
}

function SettingsView() {
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

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white border border-[#E8E4DB] p-5 text-center">
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&auto=format"
              alt="Aura Urrea"
              className="w-20 h-20 object-cover rounded-full mx-auto mb-3"
            />
            <p className="text-[#0B1F3A] font-semibold text-sm">Aura Urrea</p>
            <p className="text-[#6B7280] text-xs">Agente Senior · Century 21</p>
            <button className="mt-3 w-full border border-[#E8E4DB] text-[#6B7280] text-xs py-2 hover:border-[#0B1F3A] hover:text-[#0B1F3A] transition-colors">
              Cambiar foto
            </button>
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          {[
            { label: "Nombre completo", val: "Aura Urrea", type: "text" },
            { label: "Correo electrónico", val: "aura.urrea@century21.com.co", type: "email" },
            { label: "Teléfono", val: "+57 300 123 4567", type: "tel" },
            { label: "Matrícula profesional", val: "LONJA Nº 12.847", type: "text" },
          ].map(({ label, val, type }) => (
            <div key={label} className="bg-white border border-[#E8E4DB] p-4">
              <label className="text-[#6B7280] text-xs font-semibold block mb-1.5">{label}</label>
              <input
                type={type}
                defaultValue={val}
                className="w-full border border-[#E8E4DB] text-[#1F2937] text-sm px-3 py-2 focus:outline-none focus:border-[#0B1F3A] transition-colors bg-white"
              />
            </div>
          ))}
          <button className="bg-[#0B1F3A] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#C9A84C] hover:text-[#0B1F3A] transition-colors">
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}
