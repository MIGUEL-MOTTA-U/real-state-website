import { useState } from "react";
import {
  AlertCircle, CheckCircle2, Upload, X, MapPin,
  Image, Video, Layout, Camera, ArrowLeft, Eye,
  ChevronRight, Info
} from "lucide-react";

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

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ label, required, hint, error, children }: FieldProps) {
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

function Select({ options, value, onChange, placeholder }: {
  options: string[]; value?: string; onChange?: (v: string) => void; placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className="w-full border border-[#E8E4DB] bg-white text-[#1F2937] text-sm px-3 py-2.5 focus:outline-none focus:border-[#0B1F3A] transition-colors"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
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

const MOCK_PHOTOS = [
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=200&h=150&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=200&h=150&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=200&h=150&fit=crop&auto=format",
];

interface ListingFormViewProps {
  onBack: () => void;
}

export function ListingFormView({ onBack }: ListingFormViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [previewMode, setPreviewMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Form state
  const [title, setTitle] = useState("Apartamento de Lujo El Poblado");
  const [slug, setSlug] = useState("apartamento-lujo-el-poblado");
  const [propertyType, setPropertyType] = useState("Apartamento");
  const [subtype, setSubtype] = useState("");
  const [operationType, setOperationType] = useState("Venta");
  const [pubStatus, setPubStatus] = useState("Borrador");
  const [country, setCountry] = useState("Colombia");
  const [state, setState] = useState("Antioquia");
  const [city, setCity] = useState("Medellín");
  const [neighborhood, setNeighborhood] = useState("El Poblado");
  const [address, setAddress] = useState("Calle 8 Sur # 43A-75");
  const [stratum, setStratum] = useState("6");
  const [salePrice, setSalePrice] = useState("850000000");
  const [currency, setCurrency] = useState("COP");
  const [adminFee, setAdminFee] = useState("450000");
  const [builtArea, setBuiltArea] = useState("180");
  const [landArea, setLandArea] = useState("200");
  const [bedrooms, setBedrooms] = useState("3");
  const [bathrooms, setBathrooms] = useState("3");
  const [parking, setParking] = useState("2");
  const [yearBuilt, setYearBuilt] = useState("2019");
  const [constructionQuality, setConstructionQuality] = useState("Alta");
  const [indoorFeatures, setIndoorFeatures] = useState<string[]>(["Cocina integral", "Balcón", "Vestier"]);
  const [outdoorFeatures, setOutdoorFeatures] = useState<string[]>(["Vista a montaña"]);
  const [amenities, setAmenities] = useState<string[]>(["Gimnasio", "Vigilancia 24h", "Ascensor"]);
  const [agentName, setAgentName] = useState("Aura Urrea");
  const [agentPhone, setAgentPhone] = useState("+57 300 123 4567");
  const [agentEmail, setAgentEmail] = useState("aura.urrea@century21.com.co");

  const toggle = (list: string[], setList: (v: string[]) => void) => (val: string) => {
    setList(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);
  };

  // Validation: required fields
  const isValid = title.trim() && propertyType && operationType && city && salePrice;

  const tabContent: Record<Tab, React.ReactNode> = {
    general: (
      <div className="grid md:grid-cols-2 gap-5">
        <Field label="ID de propiedad" hint="Generado automáticamente">
          <Input value="INM-009" className="bg-[#F8F7F4] text-[#6B7280] cursor-not-allowed" />
        </Field>
        <Field label="Slug / URL">
          <Input
            value={slug}
            onChange={(v) => setSlug(v.toLowerCase().replace(/\s+/g, "-"))}
            placeholder="apartamento-lujo-el-poblado"
          />
        </Field>
        <Field label="Título del anuncio" required error={!title ? "Este campo es requerido" : ""}>
          <Input value={title} onChange={setTitle} placeholder="Ej. Apartamento de Lujo en El Poblado" />
        </Field>
        <Field label="Idioma">
          <Select options={["Español"]} value="Español" />
        </Field>
        <Field label="Tipo de propiedad" required>
          <Select
            options={["Apartamento", "Casa", "Penthouse", "Finca", "Local", "Oficina", "Lote", "Bodega"]}
            value={propertyType}
            onChange={setPropertyType}
          />
        </Field>
        <Field label="Subtipo">
          <Select
            options={["", "Dúplex", "Estudio", "Loft", "Villa", "Townhouse"]}
            value={subtype}
            onChange={setSubtype}
            placeholder="Seleccionar..."
          />
        </Field>
        <Field label="Tipo de operación" required>
          <Select
            options={["Venta", "Arriendo", "Venta y Arriendo", "Permuta"]}
            value={operationType}
            onChange={setOperationType}
          />
        </Field>
        <Field label="Estado de publicación">
          <Select
            options={["Borrador", "Publicado", "Archivado"]}
            value={pubStatus}
            onChange={setPubStatus}
          />
        </Field>
      </div>
    ),

    location: (
      <div className="grid md:grid-cols-2 gap-5">
        <Field label="País" required>
          <Select options={["Colombia", "Panamá", "México"]} value={country} onChange={setCountry} />
        </Field>
        <Field label="Departamento / Estado" required>
          <Select
            options={["Antioquia", "Cundinamarca", "Bolívar", "Valle del Cauca", "Atlántico"]}
            value={state}
            onChange={setState}
          />
        </Field>
        <Field label="Ciudad" required error={!city ? "Este campo es requerido" : ""}>
          <Select
            options={["Medellín", "Bogotá", "Cartagena", "Cali", "Barranquilla", "Santa Marta"]}
            value={city}
            onChange={setCity}
          />
        </Field>
        <Field label="Barrio / Urbanización">
          <Input value={neighborhood} onChange={setNeighborhood} placeholder="El Poblado" />
        </Field>
        <Field label="Dirección" required>
          <Input value={address} onChange={setAddress} placeholder="Calle 8 Sur # 43A-75" />
        </Field>
        <Field label="Estrato" hint="Estrato socioeconómico en Colombia (1–6)">
          <Select options={["1", "2", "3", "4", "5", "6"]} value={stratum} onChange={setStratum} />
        </Field>
        <div className="md:col-span-2">
          <Field label="Coordenadas (mapa)">
            <div className="border border-[#E8E4DB] bg-[#F0EDE6] relative overflow-hidden" style={{ height: "200px" }}>
              <img
                src="https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=800&h=200&fit=crop&auto=format"
                alt="Mapa"
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="bg-white/90 px-4 py-2 flex items-center gap-2 shadow">
                  <MapPin size={14} className="text-[#C9A84C]" />
                  <span className="text-[#0B1F3A] text-xs font-semibold">El Poblado, Medellín · 6.2022° N, 75.5741° W</span>
                </div>
                <p className="text-[#6B7280] text-xs mt-2 bg-white/80 px-2 py-1">
                  Integración con Google Maps disponible en producción
                </p>
              </div>
            </div>
          </Field>
        </div>
      </div>
    ),

    pricing: (
      <div className="grid md:grid-cols-2 gap-5">
        <Field label="Moneda">
          <Select options={["COP", "USD", "EUR"]} value={currency} onChange={setCurrency} />
        </Field>
        <Field label="Precio de venta" required error={!salePrice ? "Requerido" : ""}>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-sm">$</span>
            <Input type="number" value={salePrice} onChange={setSalePrice} className="pl-7" placeholder="850000000" />
          </div>
        </Field>
        <Field label="Precio de arriendo / mes">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-sm">$</span>
            <Input type="number" className="pl-7" placeholder="5500000" />
          </div>
        </Field>
        <Field label="Cuota de administración / mes">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-sm">$</span>
            <Input type="number" value={adminFee} onChange={setAdminFee} className="pl-7" placeholder="450000" />
          </div>
        </Field>
        <Field label="Impuestos anuales (predial)">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-sm">$</span>
            <Input type="number" className="pl-7" placeholder="1200000" />
          </div>
        </Field>
        <Field label="Texto de precio visible" hint="Ej. Precio a convenir">
          <Input placeholder="Precio a convenir" />
        </Field>
        <div className="md:col-span-2">
          <div className="bg-[#F0EDE6] border border-[#C9A84C]/30 p-4 flex items-start gap-3">
            <Info size={14} className="text-[#C9A84C] mt-0.5 shrink-0" />
            <p className="text-[#1F2937] text-xs leading-relaxed">
              Los precios se muestran en la moneda seleccionada. Para propiedades internacionales,
              asegúrese de incluir la tasa de cambio vigente. La administración y los impuestos
              son opcionales pero mejoran la conversión del anuncio.
            </p>
          </div>
        </div>
      </div>
    ),

    areas: (
      <div className="grid md:grid-cols-2 gap-5">
        <Field label="Área construida (m²)" required>
          <div className="relative">
            <Input type="number" value={builtArea} onChange={setBuiltArea} placeholder="180" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-xs">m²</span>
          </div>
        </Field>
        <Field label="Área privada (m²)">
          <div className="relative">
            <Input type="number" placeholder="165" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-xs">m²</span>
          </div>
        </Field>
        <Field label="Área de lote (m²)">
          <div className="relative">
            <Input type="number" value={landArea} onChange={setLandArea} placeholder="200" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-xs">m²</span>
          </div>
        </Field>
        <Field label="Área total terreno (m²)">
          <div className="relative">
            <Input type="number" placeholder="200" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-xs">m²</span>
          </div>
        </Field>
        <Field label="Frente (m)">
          <Input type="number" placeholder="12" />
        </Field>
        <Field label="Fondo (m)">
          <Input type="number" placeholder="16" />
        </Field>

        <div className="md:col-span-2 border-t border-[#E8E4DB] pt-5 mt-1">
          <p className="text-[#0B1F3A] text-xs font-semibold uppercase tracking-wide mb-4">Distribución</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "Habitaciones", val: bedrooms, set: setBedrooms },
              { label: "Baños completos", val: bathrooms, set: setBathrooms },
              { label: "Medios baños", val: "1", set: () => {} },
              { label: "Parqueaderos", val: parking, set: setParking },
              { label: "Pisos del inmueble", val: "14", set: () => {} },
              { label: "Piso de la unidad", val: "12", set: () => {} },
            ].map(({ label, val, set }) => (
              <Field key={label} label={label}>
                <Input type="number" value={val} onChange={set} placeholder="0" />
              </Field>
            ))}
          </div>
        </div>
      </div>
    ),

    features: (
      <div className="space-y-7">
        <div className="grid md:grid-cols-2 gap-5">
          <Field label="Año de construcción">
            <Input type="number" value={yearBuilt} onChange={setYearBuilt} placeholder="2019" />
          </Field>
          <Field label="Antigüedad (años)" hint="Se calcula automáticamente si hay año de construcción">
            <Input type="number" placeholder="6" className="bg-[#F8F7F4]" />
          </Field>
          <Field label="Calidad de construcción">
            <Select
              options={["Alta", "Media-alta", "Media", "Media-baja"]}
              value={constructionQuality}
              onChange={setConstructionQuality}
            />
          </Field>
          <Field label="Estado de conservación">
            <Select options={["Excelente", "Muy bueno", "Bueno", "Regular", "Para remodelar"]} />
          </Field>
          <Field label="Tipo de terreno">
            <Select options={["Plano", "Inclinado", "Irregular", "Esquinero"]} />
          </Field>
          <Field label="Tipo de estructura">
            <Select options={["Concreto reforzado", "Metálica", "Mixta", "Mampostería"]} />
          </Field>
        </div>

        <div>
          <p className="text-[#0B1F3A] text-xs font-semibold uppercase tracking-wide mb-3">
            Características interiores
          </p>
          <ChipGroup
            options={INDOOR_FEATURES}
            selected={indoorFeatures}
            onToggle={toggle(indoorFeatures, setIndoorFeatures)}
          />
        </div>

        <div>
          <p className="text-[#0B1F3A] text-xs font-semibold uppercase tracking-wide mb-3">
            Características exteriores
          </p>
          <ChipGroup
            options={OUTDOOR_FEATURES}
            selected={outdoorFeatures}
            onToggle={toggle(outdoorFeatures, setOutdoorFeatures)}
          />
        </div>

        <div>
          <p className="text-[#0B1F3A] text-xs font-semibold uppercase tracking-wide mb-3">
            Zonas comunes / amenidades
          </p>
          <ChipGroup
            options={AMENITIES}
            selected={amenities}
            onToggle={toggle(amenities, setAmenities)}
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
          <div
            className={`border-2 border-dashed p-10 text-center transition-colors ${
              isDragging ? "border-[#C9A84C] bg-[#C9A84C]/5" : "border-[#E8E4DB] hover:border-[#0B1F3A]"
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); }}
          >
            <Upload size={24} className="text-[#6B7280] mx-auto mb-3" />
            <p className="text-[#1F2937] text-sm font-medium mb-1">Arrastra archivos aquí</p>
            <p className="text-[#6B7280] text-xs mb-3">JPG, PNG, MP4, PDF · máx. 20MB por archivo</p>
            <button className="bg-[#0B1F3A] text-white px-4 py-2 text-xs font-semibold hover:bg-[#C9A84C] hover:text-[#0B1F3A] transition-colors">
              Seleccionar archivos
            </button>
          </div>
        </div>

        {/* Uploaded photos */}
        <div>
          <p className="text-[#0B1F3A] text-xs font-semibold uppercase tracking-wide mb-3">
            Fotos cargadas (3) — arrastra para reordenar
          </p>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {MOCK_PHOTOS.map((src, i) => (
              <div key={i} className="relative group">
                <img src={src} alt={`Foto ${i + 1}`} className="w-full aspect-[4/3] object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button className="w-6 h-6 bg-white/20 flex items-center justify-center text-white hover:bg-[#C9A84C] transition-colors">
                    <X size={12} />
                  </button>
                </div>
                {i === 0 && (
                  <span className="absolute top-1 left-1 bg-[#C9A84C] text-[#0B1F3A] text-xs px-1.5 py-0.5 font-semibold">
                    Principal
                  </span>
                )}
                <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5">
                  {["Foto", "Foto", "Foto"][i]}
                </div>
              </div>
            ))}
            <div className="border border-dashed border-[#E8E4DB] aspect-[4/3] flex flex-col items-center justify-center text-[#6B7280] hover:border-[#0B1F3A] transition-colors cursor-pointer">
              <Image size={18} className="mb-1" />
              <span className="text-xs">Agregar</span>
            </div>
          </div>
        </div>

        {/* Media toggles */}
        <div>
          <p className="text-[#0B1F3A] text-xs font-semibold uppercase tracking-wide mb-3">
            Multimedia adicional
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { icon: MapPin, label: "Tiene mapa / ubicación" },
              { icon: Video, label: "Tiene video de la propiedad" },
              { icon: Layout, label: "Tiene planos arquitectónicos" },
              { icon: Camera, label: "Tiene tour virtual 360°" },
            ].map(({ icon: Icon, label }) => (
              <label key={label} className="flex items-center gap-3 border border-[#E8E4DB] px-4 py-3 cursor-pointer hover:border-[#0B1F3A] transition-colors">
                <input type="checkbox" className="accent-[#0B1F3A]" />
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
              <Input value={agentName} onChange={setAgentName} />
            </Field>
            <Field label="Nombre de la oficina">
              <Input value="Century 21 Premium Bogotá" />
            </Field>
            <Field label="Teléfono de contacto">
              <Input type="tel" value={agentPhone} onChange={setAgentPhone} />
            </Field>
            <Field label="Correo electrónico">
              <Input type="email" value={agentEmail} onChange={setAgentEmail} />
            </Field>
            <Field label="Link de WhatsApp">
              <Input placeholder="https://wa.me/573001234567" />
            </Field>
            <Field label="Horario de atención">
              <Input placeholder="Lun–Vie 8am–6pm · Sáb 9am–1pm" />
            </Field>
          </div>

          <div className="mt-4 bg-[#F0EDE6] border-l-2 border-[#C9A84C] p-3">
            <p className="text-[#6B7280] text-xs">
              <strong className="text-[#1F2937]">Metadatos:</strong> Actualizado el 13/06/2025 · Origen: Manual · ID interno: INM-009
            </p>
          </div>
        </div>
      </div>
    ),
  };

  if (previewMode) {
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
            <img
              src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=500&fit=crop&auto=format"
              alt="Vista previa"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F3A]/80 to-transparent" />
            <div className="absolute bottom-6 left-6">
              <div className="flex gap-2 mb-2">
                <span className="bg-[#C9A84C] text-[#0B1F3A] text-xs font-bold px-2 py-0.5">Destacado</span>
                <span className="bg-[#0B1F3A] text-white text-xs font-bold px-2 py-0.5">Venta</span>
              </div>
              <h2 className="text-white mb-1" style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem" }}>
                {title}
              </h2>
              <p className="text-white/70 text-sm flex items-center gap-1">
                <MapPin size={12} /> {neighborhood}, {city}
              </p>
            </div>
          </div>
          <div className="p-6 grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <p className="text-[#C9A84C] font-bold text-xl mb-1">
                ${parseInt(salePrice || "0").toLocaleString("es-CO")} {currency}
              </p>
              <p className="text-[#6B7280] text-xs mb-4">Adm: ${parseInt(adminFee || "0").toLocaleString("es-CO")}/mes</p>
              <div className="flex gap-6 mb-4 text-sm text-[#1F2937]">
                <span>{builtArea} m² construidos</span>
                <span>{bedrooms} hab.</span>
                <span>{bathrooms} baños</span>
                <span>{parking} parq.</span>
              </div>
              <p className="text-[#6B7280] text-xs">Estrato {stratum} · {propertyType} · {operationType} · Año {yearBuilt}</p>
            </div>
            <div className="bg-[#0B1F3A] p-4 text-center">
              <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=60&h=60&fit=crop&auto=format" alt="Aura" className="w-12 h-12 object-cover rounded-full mx-auto mb-2" />
              <p className="text-white text-sm font-semibold">{agentName}</p>
              <p className="text-[#C9A84C] text-xs mb-3">Century 21 Colombia</p>
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
        <span className="text-[#1F2937] text-sm font-medium">Nueva propiedad</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-[#0B1F3A]" style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 600 }}>
            Formulario de propiedad
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="bg-[#E8E4DB] text-[#6B7280] text-xs px-2 py-0.5">Borrador</span>
            <span className="text-[#6B7280] text-xs">INM-009 · Guardado hace 2 min</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewMode(true)}
            className="flex items-center gap-1.5 border border-[#E8E4DB] text-[#6B7280] px-3 py-2 text-sm hover:border-[#0B1F3A] hover:text-[#0B1F3A] transition-colors"
          >
            <Eye size={13} /> Vista previa
          </button>
          <button className="border border-[#E8E4DB] text-[#6B7280] px-3 py-2 text-sm hover:border-[#0B1F3A] transition-colors">
            Guardar borrador
          </button>
          <button
            disabled={!isValid}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-colors ${
              isValid
                ? "bg-[#0B1F3A] text-white hover:bg-[#C9A84C] hover:text-[#0B1F3A]"
                : "bg-[#E8E4DB] text-[#9CA3AF] cursor-not-allowed"
            }`}
          >
            {isValid ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
            Publicar
          </button>
        </div>
      </div>

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
          {TABS.map((t, i) => (
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
