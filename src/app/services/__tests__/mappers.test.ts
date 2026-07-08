import { describe, expect, it } from "vitest";
import {
  PROPERTY_TYPE_LABELS,
  CLASSIFICATION_LABELS,
  OPERATION_TYPE_LABELS,
  CURRENCY_OPTIONS,
  codeFor,
  labelFor,
  displayPrice,
  toListingRow,
  toPublicCard,
  publishedFirst,
} from "../mappers";
import { emptyListing, normalizeListing } from "../types";
import type { ApiListing } from "../types";

function sampleListing(overrides: Partial<ApiListing> = {}): ApiListing {
  const base = emptyListing();
  return {
    ...base,
    listing_id: "l-1",
    title: "Apartamento El Poblado",
    property_type: "apartment",
    operation_type: "sale",
    publication_status: "published",
    featured: true,
    location: { ...base.location, city: "Medellín", neighborhood: "El Poblado" },
    pricing: { ...base.pricing, sale_price: 850000000, currency: "COP" },
    areas: { ...base.areas, built_area_m2: 180 },
    layout: { ...base.layout, bedrooms: 3, bathrooms: 3 },
    media: { ...base.media, photos: ["https://cdn.example.com/foto.jpg"], photo_count: 1 },
    metadata: { ...base.metadata, updated_at: "2026-07-06T12:00:00Z" },
    ...overrides,
  };
}

describe("diccionarios código ↔ etiqueta", () => {
  it("traduce códigos canónicos a etiquetas en español", () => {
    expect(labelFor(PROPERTY_TYPE_LABELS, "apartment")).toBe("Departamento");
    expect(labelFor(PROPERTY_TYPE_LABELS, "apartment_building")).toBe("Edificio de Apartamentos");
    expect(labelFor(PROPERTY_TYPE_LABELS, "medical_office")).toBe("Consultorio");
    expect(labelFor(OPERATION_TYPE_LABELS, "rent")).toBe("Arriendo");
  });

  it("cubre los 14 tipos de inmueble acordados con el backend", () => {
    expect(Object.keys(PROPERTY_TYPE_LABELS)).toHaveLength(14);
  });

  it("traduce las clasificaciones del inmueble", () => {
    expect(labelFor(CLASSIFICATION_LABELS, "residential")).toBe("Habitacional");
    expect(labelFor(CLASSIFICATION_LABELS, "mixed_residential_commercial")).toBe(
      "Mixto Habitacional Comercial",
    );
  });

  it("solo permite las monedas COP y USD", () => {
    expect(CURRENCY_OPTIONS).toEqual(["COP", "USD"]);
  });

  it("devuelve el código tal cual si no está en el diccionario", () => {
    expect(labelFor(PROPERTY_TYPE_LABELS, "castle")).toBe("castle");
  });

  it("invierte etiquetas a códigos", () => {
    expect(codeFor(OPERATION_TYPE_LABELS, "Venta")).toBe("sale");
  });
});

describe("displayPrice", () => {
  it("prefiere el texto de precio visible", () => {
    const l = sampleListing();
    l.pricing.display_price_text = "Precio a convenir";
    expect(displayPrice(l)).toBe("Precio a convenir");
  });

  it("formatea precio de venta en COP", () => {
    expect(displayPrice(sampleListing())).toBe("$850.000.000");
  });

  it("usa el arriendo con sufijo /mes cuando no hay venta", () => {
    const l = sampleListing();
    l.pricing.sale_price = 0;
    l.pricing.rent_price = 5500000;
    expect(displayPrice(l)).toBe("$5.500.000/mes");
  });
});

describe("toListingRow", () => {
  it("mapea un ApiListing a la fila de la tabla", () => {
    const row = toListingRow(sampleListing());
    expect(row).toMatchObject({
      id: "l-1",
      title: "Apartamento El Poblado",
      location: "Medellín",
      type: "Departamento",
      operation: "Venta",
      status: "Publicado",
      featured: true,
      area: 180,
      beds: 3,
      updated: "2026-07-06",
      img: "https://cdn.example.com/foto.jpg",
    });
    expect(row.raw.listing_id).toBe("l-1");
  });

  it("usa imagen placeholder cuando no hay fotos", () => {
    const l = sampleListing();
    l.media.photos = [];
    expect(toListingRow(l).img).toContain("unsplash.com");
  });
});

describe("toPublicCard", () => {
  it("compone la ubicación con barrio y ciudad", () => {
    const card = toPublicCard(sampleListing());
    expect(card.location).toBe("El Poblado, Medellín");
    expect(card.baths).toBe(3);
  });
});

describe("normalizeListing", () => {
  it("rellena los campos nuevos que registros antiguos no traen", () => {
    // Simula un listing guardado antes de agregar tags/has_pool/rooms/floor_type.
    const legacy = sampleListing();
    (legacy.features as unknown as Record<string, unknown>).tags = null;
    delete (legacy.features as unknown as Record<string, unknown>).has_pool;
    delete (legacy.layout as unknown as Record<string, unknown>).rooms;
    delete (legacy as unknown as Record<string, unknown>).external_id;

    const normalized = normalizeListing(legacy);

    expect(normalized.features.tags).toEqual([]);
    expect(normalized.features.has_pool).toBe(false);
    expect(normalized.layout.rooms).toBe(0);
    expect(normalized.external_id).toBe("");
    // No pisa los datos existentes.
    expect(normalized.title).toBe("Apartamento El Poblado");
    expect(normalized.layout.bedrooms).toBe(3);
  });
});

describe("publishedFirst", () => {
  it("filtra publicados y ordena destacados primero", () => {
    const published = sampleListing({ listing_id: "a", featured: false });
    const featured = sampleListing({ listing_id: "b", featured: true });
    const draft = sampleListing({ listing_id: "c", publication_status: "draft" });

    const result = publishedFirst([published, draft, featured]);

    expect(result.map((l) => l.listing_id)).toEqual(["b", "a"]);
  });
});
