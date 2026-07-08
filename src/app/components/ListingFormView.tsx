import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle, CheckCircle2, Upload, X, MapPin,
  Video, Layout, Camera, ArrowLeft, Eye,
  ChevronRight, Info, Loader2, AlertTriangle, Star
} from "lucide-react";
import { listingsApi, uploadsApi, ApiError } from "../services/api";
import type { ApiAsset, ApiListing } from "../services/types";
import { emptyListing, normalizeListing } from "../services/types";
import {
  PROPERTY_TYPE_LABELS,
  CLASSIFICATION_LABELS,
  OPERATION_TYPE_LABELS,
  PUBLICATION_STATUS_LABELS,
  CURRENCY_OPTIONS,
  labelFor,
  formatMoney,
} from "../services/mappers";
import {
  validateListing,
  ageFromYearBuilt,
  pricePerM2,
  lotAreaFromDimensions,
  MAX_DESCRIPTION_SHORT,
} from "../services/validation";

type Tab = "general" | "location" | "pricing" | "areas" | "features" | "media";

const TABS: { id: Tab; label: string; num: number }[] = [
  { id: "general", label: "General", num: 1 },
  { id: "location", label: "Ubicación", num: 2 },
  { id: "pricing", label: "Precios", num: 3 },
  { id: "areas", label: "Áreas y distribución", num: 4 },
  { id: "features", label: "Estructura y Características", num: 5 },
  { id: "media", label: "Medios y Comercial", num: 6 },
];

const INDOOR_FEATURES = ["Cocina integral", "Cocina americana", "Sala-comedor", "Cuarto de servicio", "Estudio", "Depósito", "Chimenea", "Jacuzzi", "Sauna", "Vestier", "Balcón", "Terraza privada"];
const OUTDOOR_FEATURES = ["Piscina", "Jardín privado", "Cancha de tenis", "Cancha multifuncional", "BBQ", "Vista al mar", "Vista a montaña", "Zona verde", "Parqueadero visitantes"];
const AMENITIES = ["Gimnasio", "Salón social", "Piscina comunal", "Vigilancia 24h", "Portería", "Ascensor", "Parqueadero bicicletas", "Zona de mascotas", "Coworking"];
// "Datos generales" del inmueble tal como llegan del proveedor (features.tags).
const GENERAL_TAGS = [
  "Agua Caliente", "Alarma De Incendios", "Ascensor", "Calentador De Agua Gas Natural",
  "Circuito Cerrado De TV", "Mezanine", "Parqueadero Visitantes", "Portón Eléctrico",
  "Puerta Seguridad", "Vista Panorámica", "Zona Residencial", "Trans. Público Cercano",
  "Parques Cercanos", "PentHouse", "Servicios Públicos", "Sobre Vía Secundaria",
  "Todos Los Servicios", "Ventilación Natural", "Recepción", "Cubículos",
  "Buenos Accesos", "Rampa De Acceso", "Iluminación Natural",
];
const FLOOR_TYPES = ["Baldosa", "Cerámica", "Porcelanato", "Madera", "Laminado", "Mármol", "Alfombra", "Concreto", "Vinilo"];

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  warning?: string;
  children: React.ReactNode;
}

function Field({ label, required, hint, error, warning, children }: FieldProps) {
  return (
    <div>
      <div className="flex items-center gap-1 mb-1.5">
        <label className="text-[#1F2937] text-xs font-semibold">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {hint && (
          <div className="relative group">
            <Info size={11} className="text-[#6B7280] cursor-help" />
            <div className="absolute left-4 top-0 hidden group-hover:block bg-[#1F2937] text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
              {hint}
            </div>
          </div>
        )}
      </div>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-red-500 text-xs mt-1">
          <AlertCircle size={10} /> {error}
        </p>
      )}
      {!error && warning && (
        <p className="flex items-center gap-1 text-amber-600 text-xs mt-1">
          <AlertTriangle size={10} /> {warning}
        </p>
      )}
    </div>
  );
}

function Input({ placeholder, value, onChange, type = "text", className = "" }: {
  placeholder?: string; value?: string; onChange?: (v: string) => void;
  type?: string; className?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className={`w-full border border-[#E8E4DB] bg-white text-[#1F2937] text-sm px-3 py-2.5 focus:outline-none focus:border-[#0B1F3A] transition-colors placeholder-[#9CA3AF] ${className}`}
    />
  );
}

interface SelectOption {
  value: string;
  label: string;
}

function Textarea({ placeholder, value, onChange, rows = 4 }: {
  placeholder?: string; value?: string; onChange?: (v: string) => void; rows?: number;
}) {
  return (
    <textarea
      rows={rows}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className="w-full border border-[#E8E4DB] bg-white text-[#1F2937] text-sm px-3 py-2.5 focus:outline-none focus:border-[#0B1F3A] transition-colors placeholder-[#9CA3AF] resize-y"
    />
  );
}

function Select({ options, value, onChange, placeholder }: {
  options: (string | SelectOption)[]; value?: string; onChange?: (v: string) => void; placeholder?: string;
}) {
  const normalized: SelectOption[] = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o,
  );
  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className="w-full border border-[#E8E4DB] bg-white text-[#1F2937] text-sm px-3 py-2.5 focus:outline-none focus:border-[#0B1F3A] transition-colors"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {normalized.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function ChipGroup({ options, selected, onToggle }: {
  options: string[]; selected: string[]; onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onToggle(o)}
          className={`text-xs px-3 py-1.5 border transition-all ${
            selected.includes(o)
              ? "bg-[#0B1F3A] text-white border-[#0B1F3A]"
              : "bg-white text-[#6B7280] border-[#E8E4DB] hover:border-[#0B1F3A] hover:text-[#0B1F3A]"
          }`}
        >
          {selected.includes(o) && <span className="mr-1">✓</span>}
          {o}
        </button>
      ))}
    </div>
  );
}

const dictOptions = (dict: Record<string, string>): SelectOption[] =>
  Object.entries(dict).map(([value, label]) => ({ value, label }));

const numeric = (v: string): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const numStr = (n: number): string => (n === 0 ? "" : String(n));

interface ListingFormViewProps {
  listing: ApiListing | null;
  onBack: () => void;
  onSaved: (saved: ApiListing) => void;
}

export function ListingFormView({ listing, onBack, onSaved }: ListingFormViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [previewMode, setPreviewMode] = useState(false);
  const [form, setForm] = useState<ApiListing>(() =>
    listing ? normalizeListing(listing) : emptyListing(),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // Media state
  const [assets, setAssets] = useState<ApiAsset[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const isEdit = form.listing_id !== "";

  const patch = (partial: Partial<ApiListing>) => setForm((f) => ({ ...f, ...partial }));
  const patchLocation = (partial: Partial<ApiListing["location"]>) =>
    setForm((f) => ({ ...f, location: { ...f.location, ...partial } }));
  const patchPricing = (partial: Partial<ApiListing["pricing"]>) =>
    setForm((f) => ({ ...f, pricing: { ...f.pricing, ...partial } }));
  const patchAreas = (partial: Partial<ApiListing["areas"]>) =>
    setForm((f) => ({ ...f, areas: { ...f.areas, ...partial } }));
  const patchLayout = (partial: Partial<ApiListing["layout"]>) =>
    setForm((f) => ({ ...f, layout: { ...f.layout, ...partial } }));
  const patchStructure = (partial: Partial<ApiListing["structure"]>) =>
    setForm((f) => ({ ...f, structure: { ...f.structure, ...partial } }));
  const patchFeatures = (partial: Partial<ApiListing["features"]>) =>
    setForm((f) => ({ ...f, features: { ...f.features, ...partial } }));
  const patchMedia = (partial: Partial<ApiListing["media"]>) =>
    setForm((f) => ({ ...f, media: { ...f.media, ...partial } }));
  const patchCommercial = (partial: Partial<ApiListing["commercial"]>) =>
    setForm((f) => ({ ...f, commercial: { ...f.commercial, ...partial } }));

  const toggleFeature = (group: "indoor" | "outdoor" | "commercial" | "tags") => (val: string) => {
    const list = form.features[group];
    patchFeatures({
      [group]: list.includes(val) ? list.filter((x) => x !== val) : [...list, val],
    });
  };

  // Validación lógica centralizada (services/validation.ts).
  const { errors, warnings } = useMemo(() => validateListing(form), [form]);
  const errorCount = Object.keys(errors).length;
  const isValid = errorCount === 0;

  // Errores agrupados por pestaña para señalizar dónde falta corregir.
  const tabOfField = (field: string): Tab => {
    if (field.startsWith("location.")) return "location";
    if (field.startsWith("pricing.")) return "pricing";
    if (field.startsWith("areas.") || field.startsWith("layout.")) return "areas";
    if (field.startsWith("structure.")) return "features";
    return "general";
  };
  const errorsByTab = useMemo(() => {
    const counts: Record<Tab, number> = { general: 0, location: 0, pricing: 0, areas: 0, features: 0, media: 0 };
    for (const field of Object.keys(errors)) counts[tabOfField(field)] += 1;
    return counts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errors]);

  // Cálculos derivados.
  const priceM2 = pricePerM2(form);
  const suggestedLotArea = lotAreaFromDimensions(form.areas.front_m, form.areas.back_m);

  // ── Media loading ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    listingsApi
      .listMedia(form.listing_id)
      .then((data) => {
        if (!cancelled) setAssets(data ?? []);
      })
      .catch(() => {
        /* media es opcional: no bloquea el formulario */
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.listing_id]);

  const syncPhotos = async (updatedAssets: ApiAsset[]) => {
    // Mantiene listing.media.photos (lo que consume el sitio público)
    // alineado con los assets reales de R2.
    const photos = updatedAssets.map((a) => a.url).filter((u): u is string => Boolean(u));
    const next = {
      ...form,
      media: { ...form.media, photos, photo_count: photos.length },
    };
    setForm(next);
    if (next.listing_id) {
      const saved = await listingsApi.update(next.listing_id, next);
      setForm(saved);
      onSaved(saved);
    }
  };

  const handleUpload = async (files: FileList | File[]) => {
    if (!isEdit || uploading) return;
    const list = Array.from(files);
    if (list.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      await uploadsApi.upload("listing_photo", form.listing_id, list);
      const updated = await listingsApi.listMedia(form.listing_id);
      setAssets(updated ?? []);
      await syncPhotos(updated ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? `${err.message} (${err.code})` : "No se pudieron subir los archivos");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAsset = async (asset: ApiAsset) => {
    setUploading(true);
    setError(null);
    try {
      await uploadsApi.remove(asset.id);
      const updated = assets.filter((a) => a.id !== asset.id);
      setAssets(updated);
      await syncPhotos(updated);
    } catch (err) {
      setError(err instanceof ApiError ? `${err.message} (${err.code})` : "No se pudo eliminar la foto");
    } finally {
      setUploading(false);
    }
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const save = async (status: string) => {
    setSaving(true);
    setError(null);
    try {
      const slug =
        form.slug.trim() ||
        form.title.trim().toLowerCase().replace(/[^a-z0-9áéíóúñü]+/gi, "-").replace(/^-|-$/g, "");
      const payload: ApiListing = { ...form, slug, publication_status: status, language: form.language || "es" };
      const saved = isEdit
        ? await listingsApi.update(form.listing_id, payload)
        : await listingsApi.create(payload);
      setForm(saved);
      onSaved(saved);
      setSavedAt(new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      setError(err instanceof ApiError ? `${err.message} (${err.code})` : "No se pudo guardar la propiedad");
    } finally {
      setSaving(false);
    }
  };

  const tabContent: Record<Tab, React.ReactNode> = {
    general: (
      <div className="grid md:grid-cols-2 gap-5">
        <Field label="ID de propiedad" hint="Generado automáticamente al guardar">
          <Input value={form.listing_id || "(se genera al guardar)"} className="bg-[#F8F7F4] text-[#6B7280] cursor-not-allowed" />
        </Field>
        <Field label="ID externo" hint="Identificador del inmueble en el sistema de origen">
          <Input value={form.external_id} onChange={(v) => patch({ external_id: v })} placeholder="C21-12345" />
        </Field>
        <Field label="Slug / URL" error={errors["slug"]}>
          <Input
            value={form.slug}
            onChange={(v) => patch({ slug: v.toLowerCase().replace(/\s+/g, "-") })}
            placeholder="apartamento-lujo-el-poblado"
          />
        </Field>
        <Field label="Título del anuncio" required error={errors["title"]}>
          <Input value={form.title} onChange={(v) => patch({ title: v })} placeholder="Ej. Apartamento de Lujo en El Poblado" />
        </Field>
        <Field label="Idioma">
          <Select
            options={[{ value: "es", label: "Español" }, { value: "en", label: "English" }]}
            value={form.language || "es"}
            onChange={(v) => patch({ language: v })}
          />
        </Field>
        <Field label="Tipo de propiedad" required error={errors["property_type"]}>
          <Select
            options={dictOptions(PROPERTY_TYPE_LABELS)}
            value={form.property_type}
            onChange={(v) => patch({ property_type: v })}
            placeholder="Seleccionar..."
          />
        </Field>
        <Field label="Subtipo">
          <Select
            options={["Dúplex", "Estudio", "Loft", "Villa", "Townhouse"]}
            value={form.subtype}
            onChange={(v) => patch({ subtype: v })}
            placeholder="Seleccionar..."
          />
        </Field>
        <Field label="Clasificación" hint="Uso del inmueble según su destinación">
          <Select
            options={dictOptions(CLASSIFICATION_LABELS)}
            value={form.classification}
            onChange={(v) => patch({ classification: v })}
            placeholder="Seleccionar..."
          />
        </Field>
        <Field label="Tipo de operación" required error={errors["operation_type"]}>
          <Select
            options={dictOptions(OPERATION_TYPE_LABELS)}
            value={form.operation_type}
            onChange={(v) => patch({ operation_type: v })}
            placeholder="Seleccionar..."
          />
        </Field>
        <Field label="Estado de publicación">
          <Select
            options={dictOptions(PUBLICATION_STATUS_LABELS)}
            value={form.publication_status}
            onChange={(v) => patch({ publication_status: v })}
          />
        </Field>
        <div className="md:col-span-2">
          <Field
            label="Descripción corta"
            hint="Resumen que se muestra en tarjetas y listados"
            warning={warnings["description_short"]}
          >
            <Textarea
              rows={3}
              value={form.description_short}
              onChange={(v) => patch({ description_short: v })}
              placeholder="Exclusivo edificio esquinero ubicado en el sector de La Castellana..."
            />
            <p className={`text-xs mt-1 text-right ${form.description_short.length > MAX_DESCRIPTION_SHORT ? "text-amber-600" : "text-[#9CA3AF]"}`}>
              {form.description_short.length}/{MAX_DESCRIPTION_SHORT}
            </p>
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Descripción larga" hint="Opcional: si se deja vacía se usa la descripción corta">
            <Textarea
              rows={6}
              value={form.description_long}
              onChange={(v) => patch({ description_long: v })}
              placeholder="Descripción completa del inmueble (opcional)"
            />
          </Field>
        </div>
        <div className="md:col-span-2">
          <label className="flex items-center gap-3 border border-[#E8E4DB] px-4 py-3 cursor-pointer hover:border-[#0B1F3A] transition-colors w-fit">
            <input
              type="checkbox"
              className="accent-[#0B1F3A]"
              checked={form.featured}
              onChange={(e) => patch({ featured: e.target.checked })}
            />
            <Star size={14} className="text-[#C9A84C]" />
            <span className="text-[#1F2937] text-sm">Propiedad destacada (aparece primero en el sitio público)</span>
          </label>
        </div>
      </div>
    ),

    location: (
      <div className="grid md:grid-cols-2 gap-5">
        <Field label="País" required>
          <Select options={["Colombia", "Panamá", "México"]} value={form.location.country} onChange={(v) => patchLocation({ country: v })} placeholder="Seleccionar..." />
        </Field>
        <Field label="Departamento / Estado" required>
          <Input value={form.location.state} onChange={(v) => patchLocation({ state: v })} placeholder="Antioquia" />
        </Field>
        <Field label="Ciudad" required error={errors["location.city"]}>
          <Input value={form.location.city} onChange={(v) => patchLocation({ city: v })} placeholder="Medellín" />
        </Field>
        <Field label="Barrio / Urbanización">
          <Input value={form.location.neighborhood} onChange={(v) => patchLocation({ neighborhood: v })} placeholder="El Poblado" />
        </Field>
        <Field label="Dirección" required>
          <Input value={form.location.address} onChange={(v) => patchLocation({ address: v })} placeholder="Calle 8 Sur # 43A-75" />
        </Field>
        <Field label="Estrato" hint="Estrato socioeconómico en Colombia (1–6)" error={errors["location.stratum"]}>
          <Select
            options={["1", "2", "3", "4", "5", "6"]}
            value={form.location.stratum ? String(form.location.stratum) : ""}
            onChange={(v) => patchLocation({ stratum: numeric(v) })}
            placeholder="Seleccionar..."
          />
        </Field>
        <Field label="Latitud" error={errors["location.lat"]}>
          <Input type="number" value={form.location.coordinates.lat ? String(form.location.coordinates.lat) : ""} onChange={(v) => patchLocation({ coordinates: { ...form.location.coordinates, lat: numeric(v) } })} placeholder="6.2022" />
        </Field>
        <Field label="Longitud" error={errors["location.lng"]}>
          <Input type="number" value={form.location.coordinates.lng ? String(form.location.coordinates.lng) : ""} onChange={(v) => patchLocation({ coordinates: { ...form.location.coordinates, lng: numeric(v) } })} placeholder="-75.5741" />
        </Field>
      </div>
    ),

    pricing: (
      <div className="grid md:grid-cols-2 gap-5">
        <Field label="Moneda">
          <Select options={CURRENCY_OPTIONS} value={form.pricing.currency} onChange={(v) => patchPricing({ currency: v })} />
        </Field>
        <Field
          label="Precio de venta"
          required={form.operation_type === "sale" || form.operation_type === "sale_rent"}
          error={errors["pricing.sale_price"]}
        >
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-sm">$</span>
            <Input type="number" value={numStr(form.pricing.sale_price)} onChange={(v) => patchPricing({ sale_price: numeric(v) })} className="pl-7" placeholder="850000000" />
          </div>
        </Field>
        <Field
          label="Precio de arriendo / mes"
          required={form.operation_type === "rent" || form.operation_type === "sale_rent"}
          error={errors["pricing.rent_price"]}
          warning={warnings["pricing.rent_price"]}
        >
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-sm">$</span>
            <Input type="number" value={numStr(form.pricing.rent_price)} onChange={(v) => patchPricing({ rent_price: numeric(v) })} className="pl-7" placeholder="5500000" />
          </div>
        </Field>
        <Field label="Cuota de administración / mes" error={errors["pricing.admin_fee"]} warning={warnings["pricing.admin_fee"]}>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-sm">$</span>
            <Input type="number" value={numStr(form.pricing.admin_fee)} onChange={(v) => patchPricing({ admin_fee: numeric(v) })} className="pl-7" placeholder="450000" />
          </div>
        </Field>
        <Field label="Impuestos anuales (predial)" error={errors["pricing.taxes"]}>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-sm">$</span>
            <Input type="number" value={numStr(form.pricing.taxes)} onChange={(v) => patchPricing({ taxes: numeric(v) })} className="pl-7" placeholder="1200000" />
          </div>
        </Field>
        <Field label="Texto de precio visible" hint="Ej. Precio a convenir">
          <Input value={form.pricing.display_price_text} onChange={(v) => patchPricing({ display_price_text: v })} placeholder="Precio a convenir" />
        </Field>
        {priceM2 > 0 && (
          <div className="md:col-span-2 bg-[#F0EDE6] border-l-2 border-[#0B1F3A] p-3">
            <p className="text-[#1F2937] text-xs">
              <strong>Precio por m²:</strong> {formatMoney(priceM2, form.pricing.currency)} / m²
              {" "}(calculado sobre {form.areas.built_area_m2 > 0 ? "el área construida" : "el área de lote/terreno"})
            </p>
          </div>
        )}
      </div>
    ),

    areas: (
      <div className="grid md:grid-cols-2 gap-5">
        <Field
          label="Área construida (m²)"
          required={form.property_type !== "lot"}
          error={errors["areas.built_area_m2"]}
          warning={warnings["areas.built_area_m2"]}
        >
          <div className="relative">
            <Input type="number" value={numStr(form.areas.built_area_m2)} onChange={(v) => patchAreas({ built_area_m2: numeric(v) })} placeholder="180" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-xs">m²</span>
          </div>
        </Field>
        <Field label="Área privada (m²)" error={errors["areas.private_area_m2"]}>
          <div className="relative">
            <Input type="number" value={numStr(form.areas.private_area_m2)} onChange={(v) => patchAreas({ private_area_m2: numeric(v) })} placeholder="165" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-xs">m²</span>
          </div>
        </Field>
        <Field label="Área de lote (m²)" required={form.property_type === "lot"} error={errors["areas.lot_area_m2"]}>
          <div className="relative">
            <Input type="number" value={numStr(form.areas.lot_area_m2)} onChange={(v) => patchAreas({ lot_area_m2: numeric(v) })} placeholder="200" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-xs">m²</span>
          </div>
          {suggestedLotArea > 0 && form.areas.lot_area_m2 !== suggestedLotArea && (
            <button
              type="button"
              onClick={() => patchAreas({ lot_area_m2: suggestedLotArea })}
              className="text-[#0B1F3A] text-xs mt-1 underline hover:text-[#C9A84C]"
            >
              Usar frente × fondo = {suggestedLotArea.toLocaleString("es-CO")} m²
            </button>
          )}
        </Field>
        <Field label="Área total terreno (m²)" error={errors["areas.land_area_m2"]}>
          <div className="relative">
            <Input type="number" value={numStr(form.areas.land_area_m2)} onChange={(v) => patchAreas({ land_area_m2: numeric(v) })} placeholder="200" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-xs">m²</span>
          </div>
        </Field>
        <Field label="Frente (m)" error={errors["areas.front_m"]}>
          <Input type="number" value={numStr(form.areas.front_m)} onChange={(v) => patchAreas({ front_m: numeric(v) })} placeholder="12" />
        </Field>
        <Field label="Fondo (m)" error={errors["areas.back_m"]}>
          <Input type="number" value={numStr(form.areas.back_m)} onChange={(v) => patchAreas({ back_m: numeric(v) })} placeholder="16" />
        </Field>

        <div className="md:col-span-2 border-t border-[#E8E4DB] pt-5 mt-1">
          <p className="text-[#0B1F3A] text-xs font-semibold uppercase tracking-wide mb-4">Distribución</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Ambientes" hint="Número total de ambientes del inmueble" error={errors["layout.rooms"]}>
              <Input type="number" value={numStr(form.layout.rooms)} onChange={(v) => patchLayout({ rooms: numeric(v) })} placeholder="0" />
            </Field>
            <Field label="Habitaciones" error={errors["layout.bedrooms"]}>
              <Input type="number" value={numStr(form.layout.bedrooms)} onChange={(v) => patchLayout({ bedrooms: numeric(v) })} placeholder="0" />
            </Field>
            <Field label="Baños completos" error={errors["layout.bathrooms"]}>
              <Input type="number" value={numStr(form.layout.bathrooms)} onChange={(v) => patchLayout({ bathrooms: numeric(v) })} placeholder="0" />
            </Field>
            <Field label="Medios baños" error={errors["layout.half_bathrooms"]}>
              <Input type="number" value={numStr(form.layout.half_bathrooms)} onChange={(v) => patchLayout({ half_bathrooms: numeric(v) })} placeholder="0" />
            </Field>
            <Field label="Parqueaderos" error={errors["layout.parking_spaces"]}>
              <Input type="number" value={numStr(form.layout.parking_spaces)} onChange={(v) => patchLayout({ parking_spaces: numeric(v) })} placeholder="0" />
            </Field>
            <Field label="Pisos del inmueble" error={errors["layout.floors"]}>
              <Input type="number" value={numStr(form.layout.floors)} onChange={(v) => patchLayout({ floors: numeric(v) })} placeholder="0" />
            </Field>
            <Field label="Piso de la unidad" error={errors["layout.unit_floor"]}>
              <Input type="number" value={numStr(form.layout.unit_floor)} onChange={(v) => patchLayout({ unit_floor: numeric(v) })} placeholder="0" />
            </Field>
          </div>
        </div>
      </div>
    ),

    features: (
      <div className="space-y-7">
        <div className="grid md:grid-cols-2 gap-5">
          <Field label="Año de construcción" error={errors["structure.year_built"]}>
            <Input
              type="number"
              value={numStr(form.structure.year_built)}
              onChange={(v) => {
                const y = numeric(v);
                patchStructure({ year_built: y, age_years: ageFromYearBuilt(y) });
              }}
              placeholder="2019"
            />
          </Field>
          <Field
            label="Antigüedad (años)"
            hint={form.structure.year_built > 0 ? "Calculada automáticamente desde el año de construcción" : undefined}
            error={errors["structure.age_years"]}
          >
            <Input
              type="number"
              value={numStr(form.structure.age_years)}
              onChange={form.structure.year_built > 0 ? undefined : (v) => patchStructure({ age_years: numeric(v) })}
              className={form.structure.year_built > 0 ? "bg-[#F8F7F4] text-[#6B7280] cursor-not-allowed" : ""}
              placeholder="6"
            />
          </Field>
          <Field label="Niveles construidos" error={errors["structure.built_levels"]}>
            <Input type="number" value={numStr(form.structure.built_levels)} onChange={(v) => patchStructure({ built_levels: numeric(v) })} placeholder="6" />
          </Field>
          <Field label="Calidad de construcción">
            <Select
              options={["Alta", "Media-alta", "Media", "Media-baja"]}
              value={form.structure.construction_quality}
              onChange={(v) => patchStructure({ construction_quality: v })}
              placeholder="Seleccionar..."
            />
          </Field>
          <Field label="Estado de conservación">
            <Select
              options={["Excelente", "Muy bueno", "Bueno", "Regular", "Para remodelar"]}
              value={form.structure.conservation_status}
              onChange={(v) => patchStructure({ conservation_status: v })}
              placeholder="Seleccionar..."
            />
          </Field>
          <Field label="Tipo de terreno">
            <Select
              options={["Plano", "Inclinado", "Irregular", "Esquinero"]}
              value={form.structure.terrain_type}
              onChange={(v) => patchStructure({ terrain_type: v })}
              placeholder="Seleccionar..."
            />
          </Field>
          <Field label="Tipo de estructura">
            <Select
              options={["Concreto reforzado", "Metálica", "Mixta", "Mampostería"]}
              value={form.structure.structure_type}
              onChange={(v) => patchStructure({ structure_type: v })}
              placeholder="Seleccionar..."
            />
          </Field>
          <Field label="Tipo de piso">
            <Select
              options={FLOOR_TYPES}
              value={form.structure.floor_type}
              onChange={(v) => patchStructure({ floor_type: v })}
              placeholder="Seleccionar..."
            />
          </Field>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <label className="flex items-center gap-3 border border-[#E8E4DB] px-4 py-3 cursor-pointer hover:border-[#0B1F3A] transition-colors">
            <input
              type="checkbox"
              className="accent-[#0B1F3A]"
              checked={form.features.has_pool}
              onChange={(e) => patchFeatures({ has_pool: e.target.checked })}
            />
            <span className="text-[#1F2937] text-sm">Alberca / Piscina</span>
          </label>
          <label className="flex items-center gap-3 border border-[#E8E4DB] px-4 py-3 cursor-pointer hover:border-[#0B1F3A] transition-colors">
            <input
              type="checkbox"
              className="accent-[#0B1F3A]"
              checked={form.features.pets_allowed}
              onChange={(e) => patchFeatures({ pets_allowed: e.target.checked })}
            />
            <span className="text-[#1F2937] text-sm">Acepta mascotas</span>
          </label>
        </div>

        <div>
          <p className="text-[#0B1F3A] text-xs font-semibold uppercase tracking-wide mb-3">
            Características interiores
          </p>
          <ChipGroup
            options={INDOOR_FEATURES}
            selected={form.features.indoor}
            onToggle={toggleFeature("indoor")}
          />
        </div>

        <div>
          <p className="text-[#0B1F3A] text-xs font-semibold uppercase tracking-wide mb-3">
            Características exteriores
          </p>
          <ChipGroup
            options={OUTDOOR_FEATURES}
            selected={form.features.outdoor}
            onToggle={toggleFeature("outdoor")}
          />
        </div>

        <div>
          <p className="text-[#0B1F3A] text-xs font-semibold uppercase tracking-wide mb-3">
            Zonas comunes / amenidades
          </p>
          <ChipGroup
            options={AMENITIES}
            selected={form.features.commercial}
            onToggle={toggleFeature("commercial")}
          />
        </div>

        <div>
          <p className="text-[#0B1F3A] text-xs font-semibold uppercase tracking-wide mb-3">
            Datos generales (tags)
          </p>
          <ChipGroup
            options={GENERAL_TAGS}
            selected={form.features.tags}
            onToggle={toggleFeature("tags")}
          />
        </div>
      </div>
    ),

    media: (
      <div className="space-y-7">
        {/* Media uploader */}
        <div>
          <p className="text-[#0B1F3A] text-xs font-semibold uppercase tracking-wide mb-3">
            Fotos y archivos
          </p>
          {!isEdit ? (
            <div className="bg-[#F0EDE6] border-l-2 border-[#C9A84C] p-4 flex items-start gap-3">
              <Info size={14} className="text-[#C9A84C] mt-0.5 shrink-0" />
              <p className="text-[#1F2937] text-xs leading-relaxed">
                Guarda primero la propiedad (borrador o publicada) para poder subir fotos.
              </p>
            </div>
          ) : (
            <div
              className={`border-2 border-dashed p-10 text-center transition-colors ${
                isDragging ? "border-[#C9A84C] bg-[#C9A84C]/5" : "border-[#E8E4DB] hover:border-[#0B1F3A]"
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                void handleUpload(e.dataTransfer.files);
              }}
            >
              {uploading
                ? <Loader2 size={24} className="text-[#6B7280] mx-auto mb-3 animate-spin" />
                : <Upload size={24} className="text-[#6B7280] mx-auto mb-3" />}
              <p className="text-[#1F2937] text-sm font-medium mb-1">Arrastra archivos aquí</p>
              <p className="text-[#6B7280] text-xs mb-3">JPG, PNG, WebP · máx. 10MB por foto · hasta 30 fotos</p>
              <label className="inline-block bg-[#0B1F3A] text-white px-4 py-2 text-xs font-semibold hover:bg-[#C9A84C] hover:text-[#0B1F3A] transition-colors cursor-pointer">
                Seleccionar archivos
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) void handleUpload(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          )}
        </div>

        {/* Uploaded photos */}
        {isEdit && assets.length > 0 && (
          <div>
            <p className="text-[#0B1F3A] text-xs font-semibold uppercase tracking-wide mb-3">
              Fotos cargadas ({assets.length})
            </p>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {assets.map((asset, i) => (
                <div key={asset.id} className="relative group">
                  <img src={asset.url} alt={`Foto ${i + 1}`} className="w-full aspect-[4/3] object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => void handleDeleteAsset(asset)}
                      disabled={uploading}
                      className="w-6 h-6 bg-white/20 flex items-center justify-center text-white hover:bg-red-500 transition-colors"
                      title="Eliminar foto"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  {i === 0 && (
                    <span className="absolute top-1 left-1 bg-[#C9A84C] text-[#0B1F3A] text-xs px-1.5 py-0.5 font-semibold">
                      Principal
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Media toggles */}
        <div>
          <p className="text-[#0B1F3A] text-xs font-semibold uppercase tracking-wide mb-3">
            Multimedia adicional
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            {([
              { icon: MapPin, label: "Tiene mapa / ubicación", key: "has_map" },
              { icon: Video, label: "Tiene video de la propiedad", key: "has_video" },
              { icon: Layout, label: "Tiene planos arquitectónicos", key: "has_floorplans" },
              { icon: Camera, label: "Tiene tour virtual 360°", key: "has_virtual_tour_360" },
            ] as const).map(({ icon: Icon, label, key }) => (
              <label key={label} className="flex items-center gap-3 border border-[#E8E4DB] px-4 py-3 cursor-pointer hover:border-[#0B1F3A] transition-colors">
                <input
                  type="checkbox"
                  className="accent-[#0B1F3A]"
                  checked={form.media[key]}
                  onChange={(e) => patchMedia({ [key]: e.target.checked })}
                />
                <Icon size={14} className="text-[#6B7280]" />
                <span className="text-[#1F2937] text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Commercial info */}
        <div className="border-t border-[#E8E4DB] pt-7">
          <p className="text-[#0B1F3A] text-xs font-semibold uppercase tracking-wide mb-4">
            Información comercial del agente
          </p>
          <div className="grid md:grid-cols-2 gap-5">
            <Field label="Nombre del agente">
              <Input value={form.commercial.agent_name} onChange={(v) => patchCommercial({ agent_name: v })} />
            </Field>
            <Field label="Nombre de la oficina">
              <Input value={form.commercial.office_name} onChange={(v) => patchCommercial({ office_name: v })} />
            </Field>
            <Field label="Teléfono de contacto">
              <Input type="tel" value={form.commercial.phone} onChange={(v) => patchCommercial({ phone: v })} />
            </Field>
            <Field label="Correo electrónico">
              <Input type="email" value={form.commercial.email} onChange={(v) => patchCommercial({ email: v })} />
            </Field>
            <Field label="Link de WhatsApp">
              <Input value={form.commercial.whatsapp_link} onChange={(v) => patchCommercial({ whatsapp_link: v })} placeholder="https://wa.me/573001234567" />
            </Field>
            <Field label="Horario de atención">
              <Input value={form.commercial.office_hours} onChange={(v) => patchCommercial({ office_hours: v })} placeholder="Lun–Vie 8am–6pm · Sáb 9am–1pm" />
            </Field>
          </div>

          {isEdit && (
            <div className="mt-4 bg-[#F0EDE6] border-l-2 border-[#C9A84C] p-3">
              <p className="text-[#6B7280] text-xs">
                <strong className="text-[#1F2937]">Metadatos:</strong> Actualizado el {form.metadata.updated_at?.slice(0, 10) || "—"} · Origen: {form.metadata.source_system || "Manual"} · ID: {form.listing_id}
              </p>
            </div>
          )}
        </div>
      </div>
    ),
  };

  if (previewMode) {
    const previewImg =
      form.media.photos[0] ||
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=500&fit=crop&auto=format";
    return (
      <div style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setPreviewMode(false)}
            className="flex items-center gap-1.5 text-[#6B7280] hover:text-[#0B1F3A] text-sm transition-colors"
          >
            <ArrowLeft size={13} /> Volver al formulario
          </button>
        </div>
        <div className="bg-[#F8F7F4] border border-[#E8E4DB]">
          <div className="relative h-72 overflow-hidden">
            <img src={previewImg} alt="Vista previa" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F3A]/80 to-transparent" />
            <div className="absolute bottom-6 left-6">
              <div className="flex gap-2 mb-2">
                {form.featured && <span className="bg-[#C9A84C] text-[#0B1F3A] text-xs font-bold px-2 py-0.5">Destacado</span>}
                <span className="bg-[#0B1F3A] text-white text-xs font-bold px-2 py-0.5">
                  {labelFor(OPERATION_TYPE_LABELS, form.operation_type)}
                </span>
              </div>
              <h2 className="text-white mb-1" style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem" }}>
                {form.title || "Sin título"}
              </h2>
              <p className="text-white/70 text-sm flex items-center gap-1">
                <MapPin size={12} /> {[form.location.neighborhood, form.location.city].filter(Boolean).join(", ")}
              </p>
            </div>
          </div>
          <div className="p-6 grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <p className="text-[#C9A84C] font-bold text-xl mb-1">
                ${(form.pricing.sale_price || form.pricing.rent_price).toLocaleString("es-CO")} {form.pricing.currency}
              </p>
              {form.pricing.admin_fee > 0 && (
                <p className="text-[#6B7280] text-xs mb-4">Adm: ${form.pricing.admin_fee.toLocaleString("es-CO")}/mes</p>
              )}
              <div className="flex gap-6 mb-4 text-sm text-[#1F2937]">
                <span>{form.areas.built_area_m2} m² construidos</span>
                <span>{form.layout.bedrooms} hab.</span>
                <span>{form.layout.bathrooms} baños</span>
                <span>{form.layout.parking_spaces} parq.</span>
              </div>
              <p className="text-[#6B7280] text-xs">
                {form.location.stratum > 0 && `Estrato ${form.location.stratum} · `}
                {labelFor(PROPERTY_TYPE_LABELS, form.property_type)} · {labelFor(OPERATION_TYPE_LABELS, form.operation_type)}
                {form.structure.year_built > 0 && ` · Año ${form.structure.year_built}`}
              </p>
            </div>
            <div className="bg-[#0B1F3A] p-4 text-center">
              <p className="text-white text-sm font-semibold">{form.commercial.agent_name || "Agente"}</p>
              <p className="text-[#C9A84C] text-xs mb-3">{form.commercial.office_name || "Century 21 Colombia"}</p>
              <button className="w-full bg-[#C9A84C] text-[#0B1F3A] text-xs py-2 font-semibold mb-2">WhatsApp</button>
              <button className="w-full border border-white/30 text-white text-xs py-2">Llamar</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[#6B7280] hover:text-[#0B1F3A] text-sm transition-colors"
        >
          <ArrowLeft size={13} /> Propiedades
        </button>
        <ChevronRight size={14} className="text-[#E8E4DB]" />
        <span className="text-[#1F2937] text-sm font-medium">
          {isEdit ? "Editar propiedad" : "Nueva propiedad"}
        </span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-[#0B1F3A]" style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 600 }}>
            Formulario de propiedad
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="bg-[#E8E4DB] text-[#6B7280] text-xs px-2 py-0.5">
              {labelFor(PUBLICATION_STATUS_LABELS, form.publication_status)}
            </span>
            <span className="text-[#6B7280] text-xs">
              {form.listing_id ? `${form.listing_id}` : "Sin guardar"}
              {savedAt && ` · Guardado ${savedAt}`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isValid && (
            <span className="text-red-500 text-xs font-medium">
              {errorCount} {errorCount === 1 ? "error por corregir" : "errores por corregir"}
            </span>
          )}
          <button
            onClick={() => setPreviewMode(true)}
            className="flex items-center gap-1.5 border border-[#E8E4DB] text-[#6B7280] px-3 py-2 text-sm hover:border-[#0B1F3A] hover:text-[#0B1F3A] transition-colors"
          >
            <Eye size={13} /> Vista previa
          </button>
          <button
            onClick={() => void save("draft")}
            disabled={saving || !form.title.trim()}
            className="border border-[#E8E4DB] text-[#6B7280] px-3 py-2 text-sm hover:border-[#0B1F3A] transition-colors disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar borrador"}
          </button>
          <button
            disabled={!isValid || saving}
            onClick={() => void save("published")}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-colors ${
              isValid && !saving
                ? "bg-[#0B1F3A] text-white hover:bg-[#C9A84C] hover:text-[#0B1F3A]"
                : "bg-[#E8E4DB] text-[#9CA3AF] cursor-not-allowed"
            }`}
          >
            {isValid ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
            Publicar
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-4 flex items-center gap-2 text-sm">
          <AlertTriangle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Sticky tab bar */}
      <div className="sticky top-0 z-30 bg-[#F8F7F4] border-b border-[#E8E4DB] mb-6 -mx-6 px-6">
        <div className="flex overflow-x-auto gap-0 scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-[#0B1F3A] text-[#0B1F3A]"
                  : "border-transparent text-[#6B7280] hover:text-[#1F2937]"
              }`}
            >
              <span className={`w-4 h-4 flex items-center justify-center text-[10px] font-bold ${
                activeTab === tab.id ? "bg-[#0B1F3A] text-white" : "bg-[#E8E4DB] text-[#6B7280]"
              }`}>
                {tab.num}
              </span>
              {tab.label}
              {errorsByTab[tab.id] > 0 && (
                <span
                  className="min-w-4 h-4 px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full"
                  title={`${errorsByTab[tab.id]} error(es) en esta pestaña`}
                >
                  {errorsByTab[tab.id]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="bg-white border border-[#E8E4DB] p-6 min-h-[400px]">
        {tabContent[activeTab]}
      </div>

      {/* Bottom nav */}
      <div className="flex items-center justify-between mt-4 py-3 border-t border-[#E8E4DB]">
        <button
          onClick={() => {
            const idx = TABS.findIndex((t) => t.id === activeTab);
            if (idx > 0) setActiveTab(TABS[idx - 1].id);
          }}
          disabled={activeTab === "general"}
          className="flex items-center gap-1.5 text-[#6B7280] hover:text-[#0B1F3A] text-sm disabled:opacity-30"
        >
          <ArrowLeft size={13} /> Anterior
        </button>
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`w-2 h-2 transition-all ${activeTab === t.id ? "bg-[#0B1F3A] w-5" : "bg-[#E8E4DB]"}`}
            />
          ))}
        </div>
        <button
          onClick={() => {
            const idx = TABS.findIndex((t) => t.id === activeTab);
            if (idx < TABS.length - 1) setActiveTab(TABS[idx + 1].id);
          }}
          disabled={activeTab === "media"}
          className="flex items-center gap-1.5 text-[#6B7280] hover:text-[#0B1F3A] text-sm disabled:opacity-30"
        >
          Siguiente <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}
