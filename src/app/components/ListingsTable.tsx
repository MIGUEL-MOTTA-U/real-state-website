import { useMemo, useState } from "react";
import {
  Search, ChevronUp, ChevronDown, ChevronsUpDown,
  Edit, Archive, Trash2, Star,
  Plus, Filter, CheckSquare, Square, Loader2, AlertTriangle, RefreshCw
} from "lucide-react";
import { useListings } from "../hooks/useListings";
import { listingsApi, ApiError } from "../services/api";
import type { ApiListing } from "../services/types";
import { toListingRow, type ListingRow } from "../services/mappers";

type SortKey = Exclude<keyof ListingRow, "raw" | "img">;
type SortDir = "asc" | "desc" | null;

function statusStyle(s: string) {
  if (s === "Publicado") return "bg-green-100 text-green-800";
  if (s === "Borrador") return "bg-[#E8E4DB] text-[#6B7280]";
  if (s === "Archivado") return "bg-gray-100 text-gray-500";
  return "";
}

interface ListingsTableProps {
  onNewListing: () => void;
  onEditListing: (listing: ApiListing) => void;
}

export function ListingsTable({ onNewListing, onEditListing }: ListingsTableProps) {
  const { listings, loading, error, refresh } = useListings();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Todos");
  const [operationFilter, setOperationFilter] = useState<string>("Todos");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => listings.map(toListingRow), [listings]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : sortDir === "desc" ? null : "asc");
      if (sortDir === "desc") setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const runAction = async (action: () => Promise<void>) => {
    setBusy(true);
    setActionError(null);
    try {
      await action();
      await refresh();
      setSelected(new Set());
    } catch (err) {
      setActionError(
        err instanceof ApiError ? `${err.message} (${err.code})` : "Error de conexión con el servidor",
      );
    } finally {
      setBusy(false);
    }
  };

  const archiveListing = (row: ListingRow) =>
    runAction(async () => {
      await listingsApi.update(row.id, { ...row.raw, publication_status: "archived" });
    });

  const deleteListing = (row: ListingRow) => {
    if (!window.confirm(`¿Eliminar definitivamente "${row.title}"?`)) return;
    void runAction(async () => {
      await listingsApi.remove(row.id);
    });
  };

  const archiveSelected = () =>
    runAction(async () => {
      const targets = rows.filter((r) => selected.has(r.id));
      for (const row of targets) {
        await listingsApi.update(row.id, { ...row.raw, publication_status: "archived" });
      }
    });

  const deleteSelected = () => {
    if (!window.confirm(`¿Eliminar definitivamente ${selected.size} propiedades?`)) return;
    void runAction(async () => {
      for (const id of selected) {
        await listingsApi.remove(id);
      }
    });
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows
      .filter((l) => {
        const matchSearch =
          l.title.toLowerCase().includes(q) ||
          l.location.toLowerCase().includes(q) ||
          l.id.toLowerCase().includes(q) ||
          l.externalId.toLowerCase().includes(q);
        const matchStatus = statusFilter === "Todos" || l.status === statusFilter;
        const matchOp = operationFilter === "Todos" || l.operation === operationFilter;
        return matchSearch && matchStatus && matchOp;
      })
      .sort((a, b) => {
        if (!sortKey || !sortDir) return 0;
        const av = a[sortKey];
        const bv = b[sortKey];
        const cmp =
          typeof av === "string"
            ? av.localeCompare(bv as string)
            : Number(av) - Number(bv);
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [rows, search, statusFilter, operationFilter, sortKey, sortDir]);

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
          <p className="text-[#6B7280] text-sm">{rows.length} propiedades en total</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void refresh()}
            className="flex items-center gap-1.5 border border-[#E8E4DB] text-[#6B7280] px-3 py-2 text-sm hover:border-[#0B1F3A] transition-colors"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Actualizar
          </button>
          <button
            onClick={onNewListing}
            className="flex items-center gap-1.5 bg-[#0B1F3A] text-white px-4 py-2 text-sm font-semibold hover:bg-[#C9A84C] hover:text-[#0B1F3A] transition-colors"
          >
            <Plus size={13} /> Nueva propiedad
          </button>
        </div>
      </div>

      {/* API errors */}
      {(error || actionError) && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-4 flex items-center gap-2 text-sm">
          <AlertTriangle size={14} className="shrink-0" />
          <span>{error ?? actionError}</span>
          <button onClick={() => void refresh()} className="ml-auto underline text-xs">
            Reintentar
          </button>
        </div>
      )}

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
            <option>Venta y Arriendo</option>
            <option>Permuta</option>
          </select>
        </div>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="bg-[#0B1F3A] text-white px-4 py-2.5 mb-0 flex items-center gap-4 text-sm">
          <span className="text-[#C9A84C] font-semibold">{selected.size} seleccionadas</span>
          <button
            onClick={() => void archiveSelected()}
            disabled={busy}
            className="text-white/70 hover:text-white text-xs flex items-center gap-1 disabled:opacity-40"
          >
            <Archive size={12} /> Archivar
          </button>
          <button
            onClick={deleteSelected}
            disabled={busy}
            className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 disabled:opacity-40"
          >
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
                <td className="px-4 py-3 text-[#6B7280] text-xs font-mono truncate max-w-[110px]" title={l.id}>{l.id}</td>
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
                      className="p-1.5 hover:bg-[#F0EDE6] text-[#6B7280] hover:text-[#C9A84C] transition-colors"
                      title="Editar"
                      onClick={() => onEditListing(l.raw)}
                    >
                      <Edit size={13} />
                    </button>
                    <button
                      className="p-1.5 hover:bg-[#F0EDE6] text-[#6B7280] hover:text-[#6B7280] transition-colors disabled:opacity-40"
                      title="Archivar"
                      disabled={busy}
                      onClick={() => void archiveListing(l)}
                    >
                      <Archive size={13} />
                    </button>
                    <button
                      className="p-1.5 hover:bg-[#F0EDE6] text-[#6B7280] hover:text-red-500 transition-colors disabled:opacity-40"
                      title="Eliminar"
                      disabled={busy}
                      onClick={() => deleteListing(l)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loading && (
          <div className="text-center py-16 text-[#6B7280]">
            <Loader2 size={24} className="mx-auto mb-3 animate-spin opacity-60" />
            <p className="text-sm">Cargando propiedades...</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-[#6B7280]">
            <Search size={24} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No se encontraron propiedades</p>
            <p className="text-xs mt-1">
              {rows.length === 0
                ? "Crea tu primera propiedad con el botón «Nueva propiedad»"
                : "Intenta con otros filtros de búsqueda"}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-[#E8E4DB] px-4 py-3 flex items-center justify-between">
          <p className="text-[#6B7280] text-xs">{filtered.length} de {rows.length} propiedades</p>
        </div>
      </div>
    </div>
  );
}
