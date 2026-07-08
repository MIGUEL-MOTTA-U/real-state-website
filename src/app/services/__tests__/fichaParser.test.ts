import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseFicha, parseCoNumber, collapseLigatures } from "../fichaParser";

// Fixtures generados desde las fichas PDF reales con el MISMO pdf.js del
// front (scripts/extract-ficha-text.mjs). Si Century 21 cambia la plantilla,
// regenerarlos con: node scripts/extract-ficha-text.mjs <carpeta-pdfs>
const fixture = (id: string) =>
  readFileSync(new URL(`./fixtures/ficha-${id}.txt`, import.meta.url), "utf-8");

describe("parseCoNumber", () => {
  it("interpreta el formato numérico colombiano", () => {
    expect(parseCoNumber("$9.600.000.000,00")).toBe(9_600_000_000);
    expect(parseCoNumber("1.231,0 M²")).toBe(1231);
    expect(parseCoNumber("167,0")).toBe(167);
    expect(parseCoNumber("5")).toBe(5);
    expect(parseCoNumber("")).toBe(0);
  });
});

describe("collapseLigatures", () => {
  it("recompone ligaduras dentro de palabra (un espacio a cada lado)", () => {
    expect(collapseLigatures("Edi fi cio")).toBe("Edificio");
    expect(collapseLigatures("O fi cinas")).toBe("Oficinas");
    expect(collapseLigatures("Su con fi guración permite una operación e fi ciente"))
      .toBe("Su configuración permite una operación eficiente");
  });

  it("preserva el límite de palabra cuando la ligadura inicia la palabra", () => {
    // "alto   fl ujo": el gap ancho es un espacio real entre palabras.
    expect(collapseLigatures("alto   fl ujo de clientes").replace(/\s+/g, " "))
      .toBe("alto flujo de clientes");
  });
});

describe("ficha 148686 — Edificio en venta (La Castellana)", () => {
  const { listing, warnings } = parseFicha(fixture("148686"));

  it("reconoce el tipo pese a la ligadura rota ('Edi fi cio')", () => {
    expect(listing.property_type).toBe("building");
    expect(listing.classification).toBe("commercial");
    expect(listing.title).toBe("Edificio en La Castellana");
  });

  it("mapea identificación, precio y operación", () => {
    expect(listing.external_id).toBe("148686");
    expect(listing.pricing.sale_price).toBe(9_600_000_000);
    expect(listing.pricing.currency).toBe("COP");
    expect(listing.operation_type).toBe("sale");
  });

  it("mapea áreas, distribución y estructura", () => {
    expect(listing.location.stratum).toBe(5);
    expect(listing.areas.land_area_m2).toBe(167);
    expect(listing.areas.built_area_m2).toBe(1231);
    expect(listing.layout.bathrooms).toBe(9);
    expect(listing.layout.half_bathrooms).toBe(3);
    expect(listing.layout.unit_floor).toBe(1);
    expect(listing.structure.year_built).toBe(2019);
    expect(listing.structure.built_levels).toBe(6);
    expect(listing.structure.construction_quality).toBe("Alta"); // valor en línea aparte
    expect(listing.structure.floor_type).toBe("Baldosa");
  });

  it("mapea la ubicación", () => {
    expect(listing.location.neighborhood).toBe("La Castellana");
    expect(listing.location.city).toBe("Bogotá");
    expect(listing.location.state).toBe("Cundinamarca");
    expect(listing.location.country).toBe("Colombia");
  });

  it("recoge tags, incluida la continuación de la página 2, sin datos del asesor", () => {
    expect(listing.features.tags).toContain("Agua Caliente");
    expect(listing.features.tags).toContain("Vista Panorámica");
    expect(listing.features.tags).toContain("Recepción");
    expect(listing.features.tags).toContain("Acabados: AA");
    expect(listing.features.tags.some((t) => /asesor|correo|urrea/i.test(t))).toBe(false);
  });

  it("arma la descripción con las ligaduras recompuestas", () => {
    expect(listing.description_long).toContain("Exclusivo edificio esquinero");
    expect(listing.description_long).toContain("configuración");
    expect(listing.description_long).toContain("eficiente");
    expect(listing.description_short.length).toBeLessThanOrEqual(300);
  });

  it("no genera advertencias para una ficha completa", () => {
    expect(warnings).toEqual([]);
  });
});

describe("ficha 147995 — Casa en venta (Niza Suba)", () => {
  const { listing } = parseFicha(fixture("147995"));

  it("mapea los campos residenciales", () => {
    expect(listing.property_type).toBe("house");
    expect(listing.classification).toBe("residential");
    expect(listing.title).toBe("Casa en Niza Suba");
    expect(listing.pricing.sale_price).toBe(1_200_000_000);
    expect(listing.layout.bedrooms).toBe(4);
    expect(listing.layout.rooms).toBe(7);
    expect(listing.structure.conservation_status).toBe("Bueno");
    expect(listing.structure.floor_type).toBe("Marmol");
  });

  it("conserva los datos sin campo propio como tags", () => {
    expect(listing.features.tags).toContain("Cocina: Integral");
    expect(listing.features.tags).toContain("Regaderas: 3");
  });
});

describe("ficha 149344 — Oficinas en arriendo (ligadura 'O fi cinas')", () => {
  const { listing, warnings } = parseFicha(fixture("149344"));

  it("reconoce el tipo en plural con ligadura y la operación de arriendo", () => {
    expect(listing.property_type).toBe("office");
    expect(listing.classification).toBe("commercial");
    expect(listing.pricing.rent_price).toBe(3_550_000);
    expect(listing.pricing.sale_price).toBe(0);
    expect(listing.operation_type).toBe("rent");
    expect(warnings).toEqual([]);
  });

  it("mapea terreno y conservación con valor en línea aparte", () => {
    expect(listing.structure.terrain_type).toBe("Regular");
    expect(listing.structure.conservation_status).toBe("Excelente");
  });
});

describe("ficha 149538 — Apartamento en arriendo (Mazurén)", () => {
  const { listing } = parseFicha(fixture("149538"));

  it("mapea renta, piso en línea aparte y ambientes", () => {
    expect(listing.property_type).toBe("apartment");
    expect(listing.pricing.rent_price).toBe(1_900_000);
    expect(listing.operation_type).toBe("rent");
    expect(listing.layout.unit_floor).toBe(11); // "Piso En Que Se Encuentra:" + "11"
    expect(listing.layout.rooms).toBe(3);
    expect(listing.structure.conservation_status).toBe("Nuevo");
  });

  it("deriva pets_allowed del tag 'Acepta Mascotas'", () => {
    expect(listing.features.tags).toContain("Acepta Mascotas");
    expect(listing.features.pets_allowed).toBe(true);
  });

  it("conserva las etiquetas sin campo propio como tags", () => {
    expect(listing.features.tags).toContain("Número De Elevadores: 2");
  });
});

describe("ficha 150047 — Local en arriendo (Spring)", () => {
  const { listing } = parseFicha(fixture("150047"));

  it("mapea el local con administración incluida en el precio", () => {
    expect(listing.property_type).toBe("commercial_space");
    expect(listing.pricing.rent_price).toBe(10_500_000);
    expect(listing.pricing.admin_fee).toBe(2_280_000); // "Incluido En El Precio:" + "2280000"
    expect(listing.operation_type).toBe("rent");
  });

  it("la etiqueta partida no contamina el estrato ni otros pares", () => {
    expect(listing.location.stratum).toBe(4);
    expect(listing.structure.conservation_status).toBe("Muy Bueno"); // "Muy" + "Bueno"
  });
});

describe("ficha 139869 — Casa en venta (Cedritos)", () => {
  const { listing, warnings } = parseFicha(fixture("139869"));

  it("mapea la casa completa sin advertencias", () => {
    expect(listing.property_type).toBe("house");
    expect(listing.pricing.sale_price).toBe(798_000_000);
    expect(listing.layout.bedrooms).toBe(5);
    expect(listing.layout.rooms).toBe(8);
    expect(listing.structure.built_levels).toBe(3);
    expect(listing.location.neighborhood).toBe("Cedritos");
    expect(warnings).toEqual([]);
  });
});

describe("parseFicha — fichas incompletas", () => {
  it("advierte cuando faltan precio, ID o ciudad", () => {
    const { listing, warnings } = parseFicha("DATOS DE LA PROPIEDAD\nTipo: Casa\nDESCRIPCIÓN\nCasa bonita.");
    expect(listing.property_type).toBe("house");
    expect(warnings.some((w) => w.includes("ID externo"))).toBe(true);
    expect(warnings.some((w) => w.includes("precio"))).toBe(true);
    expect(warnings.some((w) => w.includes("ciudad"))).toBe(true);
  });

  it("advierte tipos de inmueble desconocidos", () => {
    const { warnings } = parseFicha("ID: 1\nDATOS DE LA PROPIEDAD\nTipo: Castillo\nPrecio De Venta: $100");
    expect(warnings.some((w) => w.includes("Castillo"))).toBe(true);
  });
});
