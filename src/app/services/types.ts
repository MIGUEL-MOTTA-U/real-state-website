// Tipos espejo del modelo JSON del backend Go (rs-lambda-go).
// Cualquier cambio de contrato debe reflejarse aquí y en los mappers.

export interface ApiCoordinates {
  lat: number;
  lng: number;
}

export interface ApiLocation {
  country: string;
  state: string;
  city: string;
  neighborhood: string;
  address: string;
  stratum: number;
  coordinates: ApiCoordinates;
}

export interface ApiPricing {
  sale_price: number;
  rent_price: number;
  admin_fee: number;
  taxes: number;
  currency: string;
  display_price_text: string;
}

export interface ApiAreas {
  land_area_m2: number;
  built_area_m2: number;
  private_area_m2: number;
  lot_area_m2: number;
  front_m: number;
  back_m: number;
}

export interface ApiLayout {
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  half_bathrooms: number;
  parking_spaces: number;
  floors: number;
  unit_floor: number;
}

export interface ApiStructure {
  year_built: number;
  age_years: number;
  construction_quality: string;
  conservation_status: string;
  terrain_type: string;
  structure_type: string;
  floor_type: string;
  built_levels: number;
}

export interface ApiFeatures {
  indoor: string[];
  outdoor: string[];
  commercial: string[];
  project: string[];
  tags: string[];
  has_pool: boolean;
  pets_allowed: boolean;
}

export interface ApiMedia {
  photos: string[];
  photo_count: number;
  has_map: boolean;
  has_video: boolean;
  has_floorplans: boolean;
  has_virtual_tour_360: boolean;
}

export interface ApiCommercial {
  agent_name: string;
  office_name: string;
  phone: string;
  email: string;
  whatsapp_link: string;
  office_hours: string;
}

export interface ApiListingMetadata {
  updated_at: string;
  updated_age_text: string;
  breadcrumbs: string[];
  source_system: string;
}

export type PublicationStatus = "published" | "draft" | "archived";
export type OperationType = "sale" | "rent" | "sale_rent" | "exchange";
export type Classification =
  | "residential"
  | "commercial"
  | "industrial"
  | "mixed_residential_commercial"
  | "mixed_commercial_industrial";

export interface ApiListing {
  listing_id: string;
  /** ID usado por el sistema externo de origen (ej. Century 21). */
  external_id: string;
  slug: string;
  url: string;
  language: string;
  title: string;
  description_short: string;
  /** Opcional: si se omite, el backend la iguala a description_short. */
  description_long: string;
  property_type: string;
  subtype: string;
  classification: string;
  operation_type: string;
  publication_status: string;
  featured: boolean;
  location: ApiLocation;
  pricing: ApiPricing;
  areas: ApiAreas;
  layout: ApiLayout;
  structure: ApiStructure;
  features: ApiFeatures;
  media: ApiMedia;
  commercial: ApiCommercial;
  metadata: ApiListingMetadata;
}

/** Cifras que se muestran en la barra de estadísticas del sitio público. */
export interface ApiUserStats {
  sold?: string;
  experience?: string;
  satisfied?: string;
  ranking?: string;
}

export interface ApiUserMetadata {
  stats?: ApiUserStats;
  badges?: unknown;
  services?: unknown;
  hero_image_url?: string;
  hero_video_url?: string;
  /** Párrafo descriptivo del hero del sitio público. */
  presentation?: string;
  /** Segundo párrafo de la sección "nosotros" (el primero es user.bio). */
  about_extra?: string;
  /** Banda de premios sobre la foto (ej. "Agente destacada 2022 · 2023"). */
  award_text?: string;
}

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  username: string;
  birthdate: string;
  creationdate: string;
  phone?: string;
  role?: string;
  company?: string;
  office_name?: string;
  office_address?: string;
  license?: string;
  bio?: string;
  headline?: string;
  avatar_url?: string;
  avatar_asset_id?: string;
  whatsapp_link?: string;
  instagram_url?: string;
  linkedin_url?: string;
  facebook_url?: string;
  metadata?: ApiUserMetadata;
}

export type AssetEntityType = "listing_photo" | "user_avatar" | "listing_pdf";

export interface ApiAsset {
  id: string;
  entity_type: AssetEntityType;
  entity_id: string;
  content_type: string;
  file_size: number;
  status: string;
  is_public: boolean;
  owner_id: string;
  created_at: string;
  url?: string;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  status: number;
}

/**
 * Rellena con valores por defecto los campos que registros antiguos del
 * backend no traen (ej. features.tags llega como null en listings creados
 * antes de que existiera el campo). Úsalo antes de editar un listing.
 */
export function normalizeListing(listing: ApiListing): ApiListing {
  const base = emptyListing();
  return {
    ...base,
    ...listing,
    location: {
      ...base.location,
      ...listing.location,
      coordinates: { ...base.location.coordinates, ...listing.location?.coordinates },
    },
    pricing: { ...base.pricing, ...listing.pricing },
    areas: { ...base.areas, ...listing.areas },
    layout: { ...base.layout, ...listing.layout },
    structure: { ...base.structure, ...listing.structure },
    features: {
      ...base.features,
      ...listing.features,
      indoor: listing.features?.indoor ?? [],
      outdoor: listing.features?.outdoor ?? [],
      commercial: listing.features?.commercial ?? [],
      project: listing.features?.project ?? [],
      tags: listing.features?.tags ?? [],
    },
    media: { ...base.media, ...listing.media, photos: listing.media?.photos ?? [] },
    commercial: { ...base.commercial, ...listing.commercial },
    metadata: {
      ...base.metadata,
      ...listing.metadata,
      breadcrumbs: listing.metadata?.breadcrumbs ?? [],
    },
  };
}

/** Plantilla de un listing vacío con todos los objetos anidados inicializados. */
export function emptyListing(): ApiListing {
  return {
    listing_id: "",
    external_id: "",
    slug: "",
    url: "",
    language: "es",
    title: "",
    description_short: "",
    description_long: "",
    property_type: "",
    subtype: "",
    classification: "",
    operation_type: "",
    publication_status: "draft",
    featured: false,
    location: {
      country: "",
      state: "",
      city: "",
      neighborhood: "",
      address: "",
      stratum: 0,
      coordinates: { lat: 0, lng: 0 },
    },
    pricing: {
      sale_price: 0,
      rent_price: 0,
      admin_fee: 0,
      taxes: 0,
      currency: "COP",
      display_price_text: "",
    },
    areas: {
      land_area_m2: 0,
      built_area_m2: 0,
      private_area_m2: 0,
      lot_area_m2: 0,
      front_m: 0,
      back_m: 0,
    },
    layout: {
      rooms: 0,
      bedrooms: 0,
      bathrooms: 0,
      half_bathrooms: 0,
      parking_spaces: 0,
      floors: 0,
      unit_floor: 0,
    },
    structure: {
      year_built: 0,
      age_years: 0,
      construction_quality: "",
      conservation_status: "",
      terrain_type: "",
      structure_type: "",
      floor_type: "",
      built_levels: 0,
    },
    features: {
      indoor: [],
      outdoor: [],
      commercial: [],
      project: [],
      tags: [],
      has_pool: false,
      pets_allowed: false,
    },
    media: {
      photos: [],
      photo_count: 0,
      has_map: false,
      has_video: false,
      has_floorplans: false,
      has_virtual_tour_360: false,
    },
    commercial: {
      agent_name: "",
      office_name: "",
      phone: "",
      email: "",
      whatsapp_link: "",
      office_hours: "",
    },
    metadata: {
      updated_at: "",
      updated_age_text: "",
      breadcrumbs: [],
      source_system: "",
    },
  };
}
