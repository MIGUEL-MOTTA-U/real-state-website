// Parser de fichas técnicas de Century 21 (texto extraído del PDF).
// Estructura esperada de la ficha:
//   ID: <external_id>
//   DATOS DE LA PROPIEDAD   → pares "Etiqueta: valor"
//   DATOS GENERALES         → lista de tags
//   UBICACIÓN DEL INMUEBLE  → barrio + "Ciudad, Departamento"
//   DESCRIPCIÓN             → texto libre (puede continuar en la página 2)
//   Asesor: ... / CATÁLOGO DE FOTOS (se ignoran)
// El parser es puro (texto → listing) para poder testearlo sin PDF.
import { emptyListing, type ApiListing } from "./types";
import { PROPERTY_TYPE_LABELS } from "./mappers";
import { ageFromYearBuilt, MAX_DESCRIPTION_SHORT } from "./validation";

export interface FichaImportResult {
  listing: ApiListing;
  /** Datos que no se pudieron mapear o que requieren revisión manual. */
  warnings: string[];
}

/** Separador de páginas que inserta extractPdfText. */
export const PAGE_BREAK = "\f";

// ── Normalización ─────────────────────────────────────────────────────────────

// NFKD además de quitar acentos descompone las ligaduras tipográficas de
// los PDF ("Ediﬁcio" → "Edificio", "Oﬁcinas" → "Oficinas").
const stripAccents = (s: string) =>
  s.normalize("NFKD").replace(/[̀-ͯ]/g, "");

const normalizeLabel = (s: string) =>
  stripAccents(s).toLowerCase().replace(/\s+/g, " ").trim();

/** Números en formato colombiano: "1.231,0" → 1231; "$9.600.000.000,00" → 9600000000. */
export function parseCoNumber(raw: string): number {
  const cleaned = raw.replace(/[^\d.,-]/g, "");
  if (!cleaned) return 0;
  const n = Number(cleaned.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

const parseIntCo = (raw: string): number => Math.round(parseCoNumber(raw));

// ── Diccionarios ──────────────────────────────────────────────────────────────

/** Tipo de la ficha (español) → código canónico del backend. */
const PROPERTY_TYPE_BY_FICHA: Record<string, string> = {
  "casa": "house",
  "departamento": "apartment",
  "apartamento": "apartment",
  "edificio de apartamentos": "apartment_building",
  "suite": "suite",
  "apartaestudio": "studio_apartment",
  "lote/terreno": "lot",
  "lote": "lot",
  "terreno": "lot",
  "finca de recreacion": "recreational_farm",
  "consultorio": "medical_office",
  "edificio": "building",
  "finca de produccion": "production_farm",
  "hotel": "hotel",
  "local comercial": "commercial_space",
  "local": "commercial_space",
  "oficina": "office",
  "oficinas": "office",
  "bodega": "warehouse",
};

/** Clasificación sugerida según el tipo (revisable en el formulario). */
const CLASSIFICATION_BY_TYPE: Record<string, string> = {
  house: "residential",
  apartment: "residential",
  apartment_building: "residential",
  suite: "residential",
  studio_apartment: "residential",
  recreational_farm: "residential",
  medical_office: "commercial",
  building: "commercial",
  hotel: "commercial",
  commercial_space: "commercial",
  office: "commercial",
  warehouse: "industrial",
  production_farm: "industrial",
};

/** Líneas de encabezado/pie de la ficha que no son contenido. */
const NOISE_PATTERN = /century\s?21|www\.|@|^T\s*[\d(+]|^C\s*\+?\d|habitat$/i;

const isNoise = (line: string) => NOISE_PATTERN.test(stripAccents(line));

// ── Secciones ─────────────────────────────────────────────────────────────────

interface Sections {
  propertyPairs: [string, string][];
  tags: string[];
  locationLines: string[];
  description: string;
  externalId: string;
}

function splitSections(text: string): Sections {
  const externalId = /ID:\s*(\d+)/.exec(text)?.[1] ?? "";

  const marker = (l: string, name: string) => normalizeLabel(l).startsWith(normalizeLabel(name));

  type Zone = "before" | "props" | "tags" | "location" | "description" | "done";
  let zone: Zone = "before";
  let afterDescriptionPageBreak = false;

  const propertyPairs: [string, string][] = [];
  const tags: string[] = [];
  const locationLines: string[] = [];
  const descriptionParts: string[] = [];
  let currentLabel: string | null = null;

  const rawLines = text.split(/\r?\n/);
  for (let i = 0; i < rawLines.length; i++) {
    // El trim elimina \f (es whitespace): detectar el salto ANTES de limpiar.
    const isPageBreak = rawLines[i].includes(PAGE_BREAK);
    const line = rawLines[i].replace(PAGE_BREAK, "").trim();
    if (isPageBreak && zone === "description") afterDescriptionPageBreak = true;
    if (!line) continue;

    if (marker(line, "DATOS DE LA PROPIEDAD")) { zone = "props"; currentLabel = null; continue; }
    if (marker(line, "DATOS GENERALES")) { zone = "tags"; continue; }
    if (marker(line, "UBICACION DEL INMUEBLE")) { zone = "location"; continue; }
    if (marker(line, "DESCRIPCION")) { zone = "description"; continue; }
    if (marker(line, "Asesor:") || marker(line, "CATALOGO DE FOTOS")) { zone = "done"; }
    if (zone === "done") continue;
    if (isNoise(line) || /^ID:\s*\d+$/.test(line)) continue;

    switch (zone) {
      case "props": {
        const pair = /^(.+?):\s*(.*)$/.exec(line);
        if (pair) {
          propertyPairs.push([pair[1], pair[2]]);
          currentLabel = pair[1];
        } else if (currentLabel) {
          // Valor que continúa en la línea siguiente (ej. el precio).
          const last = propertyPairs[propertyPairs.length - 1];
          last[1] = `${last[1]} ${line}`.trim();
        }
        break;
      }
      case "tags":
        tags.push(line);
        break;
      case "location":
        locationLines.push(line);
        break;
      case "description": {
        // Tras un salto de página, las líneas cortas sin puntuación son la
        // continuación de los tags de la columna lateral.
        const looksLikeTag = afterDescriptionPageBreak && line.length <= 45 && !/[.]\s|[.]$/.test(line);
        if (looksLikeTag) tags.push(line);
        else descriptionParts.push(line);
        break;
      }
      default:
        break;
    }
  }

  return {
    propertyPairs,
    tags,
    locationLines,
    description: descriptionParts.join(" ").replace(/\s+/g, " ").trim(),
    externalId,
  };
}

// ── Mapeo al esquema ─────────────────────────────────────────────────────────

export function parseFicha(text: string): FichaImportResult {
  const { propertyPairs, tags, locationLines, description, externalId } = splitSections(text);
  const warnings: string[] = [];
  const listing = emptyListing();

  listing.external_id = externalId;
  if (!externalId) warnings.push("No se encontró el ID externo de la ficha.");

  let saleOnRequest = false;
  for (const [rawLabel, rawValue] of propertyPairs) {
    const label = normalizeLabel(rawLabel);
    const value = rawValue.trim();
    switch (label) {
      case "tipo": {
        const code = PROPERTY_TYPE_BY_FICHA[normalizeLabel(value)];
        if (code) {
          listing.property_type = code;
          listing.classification = CLASSIFICATION_BY_TYPE[code] ?? "";
        } else {
          warnings.push(`Tipo de inmueble no reconocido: "${value}".`);
        }
        break;
      }
      case "precio de venta":
        listing.pricing.sale_price = parseCoNumber(value);
        saleOnRequest ||= /convenir|consultar/i.test(value);
        break;
      case "precio de arriendo":
      case "precio de renta":
      case "canon de arrendamiento":
        listing.pricing.rent_price = parseCoNumber(value);
        break;
      case "administracion":
      case "admon":
        listing.pricing.admin_fee = parseCoNumber(value);
        break;
      case "estrato":
        listing.location.stratum = parseIntCo(value);
        break;
      case "terreno":
        listing.areas.land_area_m2 = parseCoNumber(value);
        break;
      case "construccion":
        listing.areas.built_area_m2 = parseCoNumber(value);
        break;
      case "area privada":
        listing.areas.private_area_m2 = parseCoNumber(value);
        break;
      case "habitaciones":
      case "alcobas":
        listing.layout.bedrooms = parseIntCo(value);
        break;
      case "banos":
        listing.layout.bathrooms = parseIntCo(value);
        break;
      case "medios banos":
        listing.layout.half_bathrooms = parseIntCo(value);
        break;
      case "parqueaderos":
      case "garajes":
        listing.layout.parking_spaces = parseIntCo(value);
        break;
      case "ambientes":
        listing.layout.rooms = parseIntCo(value);
        break;
      case "ano de construccion":
        listing.structure.year_built = parseIntCo(value);
        listing.structure.age_years = ageFromYearBuilt(listing.structure.year_built);
        break;
      case "niveles construidos":
        listing.structure.built_levels = parseIntCo(value);
        break;
      case "piso en que se encuentra":
        listing.layout.unit_floor = parseIntCo(value);
        break;
      case "calidad de la construccion":
        listing.structure.construction_quality = value;
        break;
      case "edo. conservacion":
      case "estado de conservacion":
        listing.structure.conservation_status = value;
        break;
      case "tipo de piso":
        listing.structure.floor_type = value;
        break;
      case "tipo terreno":
      case "tipo de terreno":
        listing.structure.terrain_type = value;
        break;
      default:
        // Datos sin campo propio (Cocina, Regaderas, Acabados...) se
        // conservan como tags para no perder información.
        tags.push(`${rawLabel}: ${value}`);
        break;
    }
  }

  // Operación derivada de los precios presentes.
  const { sale_price, rent_price } = listing.pricing;
  if (sale_price > 0 && rent_price > 0) listing.operation_type = "sale_rent";
  else if (rent_price > 0) listing.operation_type = "rent";
  else if (sale_price > 0 || saleOnRequest) listing.operation_type = "sale";
  if (sale_price <= 0 && rent_price <= 0)
    warnings.push("La ficha no trae precio: complétalo antes de publicar.");

  listing.pricing.currency = "COP";
  listing.features.tags = [...new Set(tags)];

  // Ubicación: "Barrio" + "Ciudad, Departamento".
  listing.location.country = "Colombia";
  if (locationLines[0]) listing.location.neighborhood = locationLines[0];
  if (locationLines[1]) {
    const [city, state] = locationLines[1].split(",").map((s) => s.trim());
    listing.location.city = city ?? "";
    listing.location.state = state ?? "";
  } else {
    warnings.push("No se encontró la ciudad: complétala antes de publicar.");
  }

  // Descripciones: la larga es el texto completo; la corta, su inicio.
  listing.description_long = description;
  listing.description_short = truncateAtWord(description, MAX_DESCRIPTION_SHORT);

  // Título sugerido: "Casa en Niza Suba".
  const typeLabel = PROPERTY_TYPE_LABELS[listing.property_type];
  if (typeLabel) {
    listing.title = listing.location.neighborhood
      ? `${typeLabel} en ${listing.location.neighborhood}`
      : typeLabel;
  }

  return { listing, warnings };
}

function truncateAtWord(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}
