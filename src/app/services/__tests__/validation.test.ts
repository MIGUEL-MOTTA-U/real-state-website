import { describe, expect, it } from "vitest";
import {
  validateListing,
  ageFromYearBuilt,
  pricePerM2,
  lotAreaFromDimensions,
  MAX_DESCRIPTION_SHORT,
} from "../validation";
import { emptyListing } from "../types";
import type { ApiListing } from "../types";

const TODAY = new Date("2026-07-07T12:00:00Z");

/** Listing mínimo válido para publicar. */
function validListing(overrides: Partial<ApiListing> = {}): ApiListing {
  const base = emptyListing();
  return {
    ...base,
    title: "Apartamento El Poblado",
    property_type: "apartment",
    operation_type: "sale",
    location: { ...base.location, city: "Medellín" },
    pricing: { ...base.pricing, sale_price: 850_000_000 },
    areas: { ...base.areas, built_area_m2: 180 },
    ...overrides,
  };
}

function errorsOf(l: ApiListing) {
  return validateListing(l, TODAY).errors;
}

function warningsOf(l: ApiListing) {
  return validateListing(l, TODAY).warnings;
}

describe("validateListing — caso válido", () => {
  it("no reporta errores para un listing completo", () => {
    expect(errorsOf(validListing())).toEqual({});
  });
});

describe("validateListing — general", () => {
  it("requiere título, tipo y operación", () => {
    const errors = errorsOf(validListing({ title: "  ", property_type: "", operation_type: "" }));
    expect(errors["title"]).toBeDefined();
    expect(errors["property_type"]).toBeDefined();
    expect(errors["operation_type"]).toBeDefined();
  });

  it("rechaza títulos de más de 150 caracteres", () => {
    expect(errorsOf(validListing({ title: "x".repeat(151) }))["title"]).toBeDefined();
  });

  it("valida el formato del slug", () => {
    expect(errorsOf(validListing({ slug: "Apto El Poblado!" }))["slug"]).toBeDefined();
    expect(errorsOf(validListing({ slug: "apto-el-poblado-3" }))["slug"]).toBeUndefined();
  });

  it("advierte cuando la descripción corta es demasiado larga", () => {
    const l = validListing({ description_short: "x".repeat(MAX_DESCRIPTION_SHORT + 1) });
    expect(warningsOf(l)["description_short"]).toBeDefined();
  });
});

describe("validateListing — precios según operación", () => {
  it("venta exige precio de venta", () => {
    const l = validListing();
    l.pricing.sale_price = 0;
    expect(errorsOf(l)["pricing.sale_price"]).toBeDefined();
  });

  it("arriendo exige precio de arriendo", () => {
    const l = validListing({ operation_type: "rent" });
    expect(errorsOf(l)["pricing.rent_price"]).toBeDefined();
    l.pricing.rent_price = 5_500_000;
    expect(errorsOf(l)["pricing.rent_price"]).toBeUndefined();
  });

  it("venta y arriendo exige ambos precios", () => {
    const l = validListing({ operation_type: "sale_rent" });
    expect(errorsOf(l)["pricing.rent_price"]).toBeDefined();
    expect(errorsOf(l)["pricing.sale_price"]).toBeUndefined();
  });

  it("rechaza precios negativos", () => {
    const l = validListing();
    l.pricing.admin_fee = -1;
    l.pricing.taxes = -1;
    const errors = errorsOf(l);
    expect(errors["pricing.admin_fee"]).toBeDefined();
    expect(errors["pricing.taxes"]).toBeDefined();
  });

  it("advierte administración mayor que el arriendo", () => {
    const l = validListing({ operation_type: "rent" });
    l.pricing.rent_price = 1_000_000;
    l.pricing.admin_fee = 2_000_000;
    expect(warningsOf(l)["pricing.admin_fee"]).toBeDefined();
  });
});

describe("validateListing — áreas y metraje", () => {
  it("rechaza metrajes negativos", () => {
    const l = validListing();
    l.areas.front_m = -3;
    expect(errorsOf(l)["areas.front_m"]).toBeDefined();
  });

  it("el área privada no puede superar la construida", () => {
    const l = validListing();
    l.areas.private_area_m2 = 200;
    expect(errorsOf(l)["areas.private_area_m2"]).toBeDefined();
  });

  it("un inmueble construido requiere área construida", () => {
    const l = validListing();
    l.areas.built_area_m2 = 0;
    expect(errorsOf(l)["areas.built_area_m2"]).toBeDefined();
  });

  it("un lote requiere área de lote o terreno pero no construida", () => {
    const l = validListing({ property_type: "lot" });
    l.areas.built_area_m2 = 0;
    expect(errorsOf(l)["areas.built_area_m2"]).toBeUndefined();
    expect(errorsOf(l)["areas.lot_area_m2"]).toBeDefined();
    l.areas.lot_area_m2 = 200;
    expect(errorsOf(l)["areas.lot_area_m2"]).toBeUndefined();
  });

  it("advierte construcción mayor al terreno en un solo nivel", () => {
    const l = validListing();
    l.areas.land_area_m2 = 100;
    l.areas.built_area_m2 = 500;
    l.structure.built_levels = 1;
    expect(warningsOf(l)["areas.built_area_m2"]).toBeDefined();
    l.structure.built_levels = 6;
    expect(warningsOf(l)["areas.built_area_m2"]).toBeUndefined();
  });
});

describe("validateListing — distribución", () => {
  it("rechaza conteos negativos o no enteros", () => {
    const l = validListing();
    l.layout.bathrooms = 2.5;
    l.layout.parking_spaces = -1;
    const errors = errorsOf(l);
    expect(errors["layout.bathrooms"]).toBeDefined();
    expect(errors["layout.parking_spaces"]).toBeDefined();
  });

  it("los ambientes no pueden ser menos que las habitaciones", () => {
    const l = validListing();
    l.layout.rooms = 2;
    l.layout.bedrooms = 4;
    expect(errorsOf(l)["layout.rooms"]).toBeDefined();
  });

  it("el piso de la unidad no puede superar los niveles construidos", () => {
    const l = validListing();
    l.layout.unit_floor = 10;
    l.structure.built_levels = 6;
    expect(errorsOf(l)["layout.unit_floor"]).toBeDefined();
  });
});

describe("validateListing — estructura y fechas", () => {
  it("valida el rango del año de construcción", () => {
    const l = validListing();
    l.structure.year_built = 1899;
    expect(errorsOf(l)["structure.year_built"]).toBeDefined();
    l.structure.year_built = 2029; // más de 2 años en el futuro respecto a 2026
    expect(errorsOf(l)["structure.year_built"]).toBeDefined();
    l.structure.year_built = 2028; // preventa dentro del margen
    expect(errorsOf(l)["structure.year_built"]).toBeUndefined();
    l.structure.year_built = 0; // sin dato: válido
    expect(errorsOf(l)["structure.year_built"]).toBeUndefined();
  });

  it("valida estrato y coordenadas", () => {
    const l = validListing();
    l.location.stratum = 9;
    l.location.coordinates = { lat: 95, lng: -200 };
    const errors = errorsOf(l);
    expect(errors["location.stratum"]).toBeDefined();
    expect(errors["location.lat"]).toBeDefined();
    expect(errors["location.lng"]).toBeDefined();
  });
});

describe("cálculos básicos", () => {
  it("calcula la antigüedad desde el año de construcción", () => {
    expect(ageFromYearBuilt(2019, TODAY)).toBe(7);
    expect(ageFromYearBuilt(2026, TODAY)).toBe(0);
    expect(ageFromYearBuilt(0, TODAY)).toBe(0);
  });

  it("calcula el precio por m² sobre el área construida", () => {
    const l = validListing();
    expect(pricePerM2(l)).toBe(Math.round(850_000_000 / 180));
  });

  it("usa el área de lote para terrenos sin construcción", () => {
    const l = validListing({ property_type: "lot" });
    l.areas.built_area_m2 = 0;
    l.areas.lot_area_m2 = 200;
    expect(pricePerM2(l)).toBe(Math.round(850_000_000 / 200));
  });

  it("devuelve 0 sin precio o sin área", () => {
    const l = validListing();
    l.areas.built_area_m2 = 0;
    expect(pricePerM2(l)).toBe(0);
  });

  it("estima el área de lote desde frente × fondo", () => {
    expect(lotAreaFromDimensions(12, 16)).toBe(192);
    expect(lotAreaFromDimensions(0, 16)).toBe(0);
    expect(lotAreaFromDimensions(12.5, 10.1)).toBe(126.25);
  });
});
