// Mapeos entre los códigos canónicos del backend y las etiquetas de la UI.
// Convención acordada (ver ai-notes.md del backend):
//   publication_status: published | draft | archived
//   operation_type:     sale | rent | sale_rent | exchange
//   property_type:      house | apartment | apartment_building | suite | studio_apartment |
//                       lot | recreational_farm | medical_office | building | production_farm |
//                       hotel | commercial_space | office | warehouse
//   classification:     residential | commercial | industrial |
//                       mixed_residential_commercial | mixed_commercial_industrial
//   currency:           COP | USD
import type { ApiListing } from "./types";

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  house: "Casa",
  apartment: "Departamento",
  apartment_building: "Edificio de Apartamentos",
  suite: "Suite",
  studio_apartment: "Apartaestudio",
  lot: "Lote/Terreno",
  recreational_farm: "Finca de Recreación",
  medical_office: "Consultorio",
  building: "Edificio",
  production_farm: "Finca de Producción",
  hotel: "Hotel",
  commercial_space: "Local Comercial",
  office: "Oficina",
  warehouse: "Bodega",
};

export const CLASSIFICATION_LABELS: Record<string, string> = {
  residential: "Habitacional",
  commercial: "Comercial",
  industrial: "Industrial",
  mixed_residential_commercial: "Mixto Habitacional Comercial",
  mixed_commercial_industrial: "Mixto Comercial Industrial",
};

export const CURRENCY_OPTIONS = ["COP", "USD"];

export const OPERATION_TYPE_LABELS: Record<string, string> = {
  sale: "Venta",
  rent: "Arriendo",
  sale_rent: "Venta y Arriendo",
  exchange: "Permuta",
};

export const PUBLICATION_STATUS_LABELS: Record<string, string> = {
  published: "Publicado",
  draft: "Borrador",
  archived: "Archivado",
};

export function labelFor(dictionary: Record<string, string>, code: string): string {
  return dictionary[code] ?? code;
}

export function codeFor(dictionary: Record<string, string>, label: string): string {
  const entry = Object.entries(dictionary).find(([, value]) => value === label);
  return entry ? entry[0] : label;
}

/** Precio a mostrar: venta si existe; si no, arriendo con sufijo "/mes". */
export function displayPrice(listing: ApiListing): string {
  const { sale_price, rent_price, display_price_text, currency } = listing.pricing;
  if (display_price_text) return display_price_text;
  if (sale_price > 0) return formatMoney(sale_price, currency);
  if (rent_price > 0) return `${formatMoney(rent_price, currency)}/mes`;
  return "Precio a convenir";
}

export function formatMoney(value: number, currency: string): string {
  const formatted = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(value);
  const symbol = currency === "USD" ? "USD $" : currency === "EUR" ? "€" : "$";
  return `${symbol}${formatted}`;
}

/** Fila que consume ListingsTable. */
export interface ListingRow {
  id: string;
  externalId: string;
  title: string;
  location: string;
  price: string;
  type: string;
  operation: string;
  status: string;
  featured: boolean;
  area: number;
  beds: number;
  updated: string;
  img: string;
  raw: ApiListing;
}

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=120&h=90&fit=crop&auto=format";

export function toListingRow(listing: ApiListing): ListingRow {
  return {
    id: listing.listing_id,
    externalId: listing.external_id ?? "",
    title: listing.title,
    location: listing.location?.city ?? "",
    price: displayPrice(listing),
    type: labelFor(PROPERTY_TYPE_LABELS, listing.property_type),
    operation: labelFor(OPERATION_TYPE_LABELS, listing.operation_type),
    status: labelFor(PUBLICATION_STATUS_LABELS, listing.publication_status),
    featured: listing.featured,
    area: listing.areas?.built_area_m2 || listing.areas?.land_area_m2 || 0,
    beds: listing.layout?.bedrooms ?? 0,
    updated: (listing.metadata?.updated_at ?? "").slice(0, 10),
    img: listing.media?.photos?.[0] || PLACEHOLDER_IMG,
    raw: listing,
  };
}

/** Tarjeta del sitio público. */
export interface PublicListingCard {
  id: string;
  title: string;
  price: string;
  area: number;
  location: string;
  featured: boolean;
  operation: string;
  beds: number;
  baths: number;
  img: string;
}

export function toPublicCard(listing: ApiListing): PublicListingCard {
  const neighborhood = listing.location?.neighborhood;
  const city = listing.location?.city;
  return {
    id: listing.listing_id,
    title: listing.title,
    price: displayPrice(listing),
    area: listing.areas?.built_area_m2 || listing.areas?.land_area_m2 || 0,
    location: [neighborhood, city].filter(Boolean).join(", "),
    featured: listing.featured,
    operation: labelFor(OPERATION_TYPE_LABELS, listing.operation_type),
    beds: listing.layout?.bedrooms ?? 0,
    baths: listing.layout?.bathrooms ?? 0,
    img:
      listing.media?.photos?.[0] ||
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop&auto=format",
  };
}

/** Solo los inmuebles publicados, destacados primero. */
export function publishedFirst(listings: ApiListing[]): ApiListing[] {
  return listings
    .filter((l) => l.publication_status === "published")
    .sort((a, b) => Number(b.featured) - Number(a.featured));
}
