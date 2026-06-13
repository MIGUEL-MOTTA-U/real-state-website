import { useState } from "react";
import {
  Search, ChevronUp, ChevronDown, ChevronsUpDown,
  Eye, Edit, Archive, Trash2, Star, MoreHorizontal,
  Plus, Filter, Download, CheckSquare, Square
} from "lucide-react";

interface Listing {
  id: string;
  title: string;
  location: string;
  price: string;
  type: string;
  operation: string;
  status: "Publicado" | "Borrador" | "Archivado";
  featured: boolean;
  area: number;
  beds: number;
  created: string;
  updated: string;
  img: string;
}

const MOCK_LISTINGS: Listing[] = [
  { id: "INM-001", title: "Apto de Lujo El Poblado", location: "Medellín", price: "$850.000.000", type: "Apartamento", operation: "Venta", status: "Publicado", featured: true, area: 180, beds: 3, created: "2025-05-12", updated: "2025-06-10", img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=60&h=45&fit=crop&auto=format" },
  { id: "INM-002", title: "Casa Campestre La Calera", location: "Cundinamarca", price: "$2.400.000.000", type: "Casa", operation: "Venta", status: "Publicado", featured: false, area: 320, beds: 5, created: "2025-04-20", updated: "2025-06-08", img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=60&h=45&fit=crop&auto=format" },
  { id: "INM-003", title: "Penthouse Bocagrande", location: "Cartagena", price: "$2.980.000.000", type: "Penthouse", operation: "Venta", status: "Publicado", featured: true, area: 280, beds: 4, created: "2025-03-15", updated: "2025-06-11", img: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=60&h=45&fit=crop&auto=format" },
  { id: "INM-004", title: "Apto Laureles", location: "Medellín", price: "$490.000.000", type: "Apartamento", operation: "Venta", status: "Borrador", featured: false, area: 95, beds: 2, created: "2025-06-01", updated: "2025-06-05", img: "https://images.unsplash.com/photo-1567496898669-ee935191af30?w=60&h=45&fit=crop&auto=format" },
  { id: "INM-005", title: "Casa Rosales", location: "Bogotá", price: "$1.800.000.000", type: "Casa", operation: "Venta", status: "Borrador", featured: false, area: 260, beds: 4, created: "2025-06-05", updated: "2025-06-06", img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=60&h=45&fit=crop&auto=format" },
  { id: "INM-006", title: "Local Comercial Chapinero", location: "Bogotá", price: "$3.500.000/mes", type: "Local", operation: "Arriendo", status: "Publicado", featured: false, area: 140, beds: 0, created: "2025-02-10", updated: "2025-05-30", img: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=60&h=45&fit=crop&auto=format" },
  { id: "INM-007", title: "Oficina Piso 14 WTC", location: "Bogotá", price: "$8.500.000/mes", type: "Oficina", operation: "Arriendo", status: "Archivado", featured: false, area: 85, beds: 0, created: "2024-11-20", updated: "2025-04-15", img: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=60&h=45&fit=crop&auto=format" },
  { id: "INM-008", title: "Finca Santa Helena", location: "Antioquia", price: "$4.200.000.000", type: "Finca", operation: "Venta", status: "Publicado", featured: true, area: 1200, beds: 6, created: "2025-01-08", updated: "2025-06-09", img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=60&h=45&fit=crop&auto=format" },
];

type SortKey = keyof Listing;
type SortDir = "asc" | "desc" | null;

function statusStyle(s: string) {
  if (s === "Publicado") return "bg-green-100 text-green-800";
  if (s === "Borrador") return "bg-[#E8E4DB] text-[#6B7280]";
  if (s === "Archivado") return "bg-gray-100 text-gray-500";
  return "";
}

interface ListingsTableProps {
  onNewListing: () => void;
  onEditListing: () => void;
}

export function ListingsTable({ onNewListing, onEditListing }: ListingsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Todos");
  const [operationFilter, setOperationFilter] = useState<string>("Todos");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : sortDir === "desc" ? null : "asc");
      if (sortDir === "desc") setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = MOCK_LISTINGS
    .filter((l) => {
      const q = search.toLowerCase();
      const matchSearch = l.title.toLowerCase().includes(q) || l.location.toLowerCase().includes(q) || l.id.toLowerCase().includes(q);
      const matchStatus = statusFilter === "Todos" || l.status === statusFilter;
      const matchOp = operationFilter === "Todos" || l.operation === operationFilter;
      return matchSearch && matchStatus && matchOp;
    })
    .sort((a, b) => {
      if (!sortKey || !sortDir) return 0;
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });

  const toggleSelect = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const allSelected = filtered.length > 0 && filtered.every((l) => selected.has(l.id));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map((l) => l.id)));
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronsUpDown size={11} className="text-[#6B7280]" />;
    return sortDir === "asc"
      ? <ChevronUp size={11} className="text-[#C9A84C]" />
      : <ChevronDown size={11} className="text-[#C9A84C]" />;
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1
            className="text-[#0B1F3A]"
            style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 600 }}
          >
            Gestión de propiedades
          </h1>
          <p className="text-[#6B7280] text-sm">{MOCK_LISTINGS.length} propiedades en total</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 border border-[#E8E4DB] text-[#6B7280] px-3 py-2 text-sm hover:border-[#0B1F3A] transition-colors">
            <Download size={13} /> Exportar
          </button>
          <button
            onClick={onNewListing}
            className="flex items-center gap-1.5 bg-[#0B1F3A] text-white px-4 py-2 text-sm font-semibold hover:bg-[#C9A84C] hover:text-[#0B1F3A] transition-colors"
          >
            <Plus size={13} /> Nueva propiedad
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#E8E4DB] p-4 mb-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
          <input
            type="text"
            placeholder="Buscar por nombre, ciudad o ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-[#E8E4DB] text-sm text-[#1F2937] focus:outline-none focus:border-[#0B1F3A] transition-colors"
          />
        </div>

        <div className="flex gap-2">
          <div className="flex items-center gap-1.5">
            <Filter size={12} className="text-[#6B7280]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-[#E8E4DB] text-sm text-[#1F2937] px-3 py-2.5 focus:outline-none focus:border-[#0B1F3A] bg-white"
            >
              <option>Todos</option>
              <option>Publicado</option>
              <option>Borrador</option>
              <option>Archivado</option>
            </select>
          </div>
          <select
            value={operationFilter}
            onChange={(e) => setOperationFilter(e.target.value)}
            className="border border-[#E8E4DB] text-sm text-[#1F2937] px-3 py-2.5 focus:outline-none focus:border-[#0B1F3A] bg-white"
          >
            <option>Todos</option>
            <option>Venta</option>
            <option>Arriendo</option>
          </select>
        </div>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="bg-[#0B1F3A] text-white px-4 py-2.5 mb-0 flex items-center gap-4 text-sm">
          <span className="text-[#C9A84C] font-semibold">{selected.size} seleccionadas</span>
          <button className="text-white/70 hover:text-white text-xs flex items-center gap-1">
            <Archive size={12} /> Archivar
          </button>
          <button className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1">
            <Trash2 size={12} /> Eliminar
          </button>
          <button className="ml-auto text-white/40 hover:text-white text-xs" onClick={() => setSelected(new Set())}>
            Cancelar
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-[#E8E4DB] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E8E4DB] bg-[#F8F7F4]">
              <th className="px-4 py-3 w-8">
                <button onClick={toggleAll} className="text-[#6B7280]">
                  {allSelected
                    ? <CheckSquare size={14} className="text-[#0B1F3A]" />
                    : <Square size={14} />}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wide w-16">Foto</th>
              {[
                { key: "id" as SortKey, label: "ID" },
                { key: "title" as SortKey, label: "Propiedad" },
                { key: "location" as SortKey, label: "Ciudad" },
                { key: "type" as SortKey, label: "Tipo" },
                { key: "operation" as SortKey, label: "Operación" },
                { key: "price" as SortKey, label: "Precio" },
                { key: "area" as SortKey, label: "Área" },
                { key: "status" as SortKey, label: "Estado" },
                { key: "updated" as SortKey, label: "Actualizado" },
              ].map(({ key, label }) => (
                <th
                  key={key}
                  className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wide cursor-pointer hover:text-[#0B1F3A] transition-colors"
                  onClick={() => handleSort(key)}
                >
                  <div className="flex items-center gap-1">
                    {label}
                    <SortIcon col={key} />
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EDE6]">
            {filtered.map((l) => (
              <tr
                key={l.id}
                className={`hover:bg-[#F8F7F4] transition-colors ${selected.has(l.id) ? "bg-[#F8F7F4]" : ""}`}
              >
                <td className="px-4 py-3">
                  <button onClick={() => toggleSelect(l.id)} className="text-[#6B7280]">
                    {selected.has(l.id)
                      ? <CheckSquare size={14} className="text-[#0B1F3A]" />
                      : <Square size={14} />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <img src={l.img} alt={l.title} className="w-14 h-10 object-cover" />
                </td>
                <td className="px-4 py-3 text-[#6B7280] text-xs font-mono">{l.id}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {l.featured && <Star size={11} className="text-[#C9A84C] shrink-0" fill="currentColor" />}
                    <span className="text-[#1F2937] font-medium truncate max-w-[160px]">{l.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[#6B7280]">{l.location}</td>
                <td className="px-4 py-3 text-[#6B7280]">{l.type}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 ${l.operation === "Venta" ? "bg-[#0B1F3A]/10 text-[#0B1F3A]" : "bg-[#C9A84C]/15 text-[#7a5c1a]"}`}>
                    {l.operation}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#1F2937] font-semibold text-xs">{l.price}</td>
                <td className="px-4 py-3 text-[#6B7280] text-xs">{l.area} m²</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 ${statusStyle(l.status)}`}>
                    {l.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#6B7280] text-xs">{l.updated}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-0.5 relative">
                    <button
                      className="p-1.5 hover:bg-[#F0EDE6] text-[#6B7280] hover:text-[#0B1F3A] transition-colors"
                      title="Vista previa"
                    >
                      <Eye size={13} />
                    </button>
                    <button
                      className="p-1.5 hover:bg-[#F0EDE6] text-[#6B7280] hover:text-[#C9A84C] transition-colors"
                      title="Editar"
                      onClick={onEditListing}
                    >
                      <Edit size={13} />
                    </button>
                    <button
                      className="p-1.5 hover:bg-[#F0EDE6] text-[#6B7280] hover:text-[#6B7280] transition-colors"
                      title="Archivar"
                    >
                      <Archive size={13} />
                    </button>
                    <button
                      className="p-1.5 hover:bg-[#F0EDE6] text-[#6B7280] hover:text-red-500 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-[#6B7280]">
            <Search size={24} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No se encontraron propiedades</p>
            <p className="text-xs mt-1">Intenta con otros filtros de búsqueda</p>
          </div>
        )}

        {/* Pagination */}
        <div className="border-t border-[#E8E4DB] px-4 py-3 flex items-center justify-between">
          <p className="text-[#6B7280] text-xs">{filtered.length} de {MOCK_LISTINGS.length} propiedades</p>
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((p) => (
              <button
                key={p}
                className={`w-7 h-7 text-xs flex items-center justify-center transition-colors ${
                  p === 1 ? "bg-[#0B1F3A] text-white" : "text-[#6B7280] hover:bg-[#F0EDE6]"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
