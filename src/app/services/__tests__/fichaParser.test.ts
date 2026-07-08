import { describe, expect, it } from "vitest";
import { parseFicha, parseCoNumber, PAGE_BREAK } from "../fichaParser";

// Texto extraído de la ficha real (148686) La Castellana.pdf — edificio en venta.
const FICHA_EDIFICIO = `CENTURY 21.
Habitat
Calle 140 # 7B - 49,Cedritos, Bogotá, Cundinamarca
T 6013579793 | solicitudes@century21habitat.com | www.century21habitat.com
ID: 148686
DATOS DE LA PROPIEDAD
Tipo: Edificio
Precio De Venta:
$9.600.000.000,00
Estrato: 5
Terreno: 167,0 M²
Construcción: 1.231,0 M²
Baños: 9
Medios Baños: 3
Año De Construcción: 2019
Niveles Construidos: 6
Piso En Que Se Encuentra: 1
Calidad De La Construcción:
Alta
Tipo De Piso: Baldosa
DATOS GENERALES
Agua Caliente
Alarma De Incendios
Ascensor
Circuito Cerrado De TV
Vista Panorámica
Zona Residencial
UBICACIÓN DEL INMUEBLE
La Castellana
Bogotá, Cundinamarca
DESCRIPCIÓN
Exclusivo edificio esquinero ubicado en el sector de La Castellana,
diseño contemporáneo y condiciones técnicas óptimas para la
prestación de servicios de salud. Cuenta con un área construida de
1.231 m², distribuidos en sótano y seis niveles, con espacios
concebidos para operación médica, administrativa y corporativa.
${PAGE_BREAK}
Recepción
Cubículos
Buenos Accesos
Rampa De Acceso
Acabados: AA
Asesor: Aura Nohemy Urrea
Calderon
Correo:
aura.urrea@century21habitat.com
T +(571) 357-97-93
C +573112664767
${PAGE_BREAK}
Calle 140 # 7B - 49,Cedritos, Bogotá, Cundinamarca
CATÁLOGO DE FOTOS ID 148686`;

// Texto extraído de la ficha real (147995) Niza Suba.pdf — casa en venta.
const FICHA_CASA = `Calle 140 # 7B - 49,Cedritos, Bogotá, Cundinamarca
T 6013579793 | solicitudes@century21habitat.com | www.century21habitat.com
ID: 147995
DATOS DE LA PROPIEDAD
Tipo: Casa
Precio De Venta:
$1.200.000.000,00
Estrato: 5
Terreno: 220,0 M²
Construcción: 220,0 M²
Habitaciones: 4
Baños: 1
Medios Baños: 3
Parqueaderos: 4
Año De Construcción: 1974
Niveles Construidos: 2
Cocina: Integral
Edo. Conservación: Bueno
Piso En Que Se Encuentra: 1
Regaderas: 3
Tipo De Piso: Marmol
Ambientes: 7
DATOS GENERALES
Agua Caliente
Jardín
Patio
Cocina Integral
Zonas Verdes
UBICACIÓN DEL INMUEBLE
Niza Suba
Bogotá, Cundinamarca
DESCRIPCIÓN
Descubre esta amplia y acogedora casa de dos pisos, ubicada en
uno de los sectores más tranquilos y valorizados de Suba.`;

describe("parseCoNumber", () => {
  it("interpreta el formato numérico colombiano", () => {
    expect(parseCoNumber("$9.600.000.000,00")).toBe(9_600_000_000);
    expect(parseCoNumber("1.231,0 M²")).toBe(1231);
    expect(parseCoNumber("167,0")).toBe(167);
    expect(parseCoNumber("5")).toBe(5);
    expect(parseCoNumber("")).toBe(0);
  });
});

describe("parseFicha — edificio (La Castellana)", () => {
  const { listing, warnings } = parseFicha(FICHA_EDIFICIO);

  it("mapea identificación, tipo y clasificación", () => {
    expect(listing.external_id).toBe("148686");
    expect(listing.property_type).toBe("building");
    expect(listing.classification).toBe("commercial");
    expect(listing.title).toBe("Edificio en La Castellana");
  });

  it("mapea precio y operación", () => {
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
    expect(listing.structure.construction_quality).toBe("Alta");
    expect(listing.structure.floor_type).toBe("Baldosa");
  });

  it("mapea ubicación", () => {
    expect(listing.location.neighborhood).toBe("La Castellana");
    expect(listing.location.city).toBe("Bogotá");
    expect(listing.location.state).toBe("Cundinamarca");
    expect(listing.location.country).toBe("Colombia");
  });

  it("recoge los tags, incluida la continuación de la página 2", () => {
    expect(listing.features.tags).toContain("Agua Caliente");
    expect(listing.features.tags).toContain("Vista Panorámica");
    expect(listing.features.tags).toContain("Recepción");
    expect(listing.features.tags).toContain("Acabados: AA");
    // Los datos del asesor no se cuelan como tags.
    expect(listing.features.tags.some((t) => t.includes("Asesor"))).toBe(false);
  });

  it("arma descripciones larga y corta", () => {
    expect(listing.description_long).toContain("Exclusivo edificio esquinero");
    expect(listing.description_long).toContain("operación médica");
    expect(listing.description_short.length).toBeLessThanOrEqual(300);
    expect(listing.description_short).toContain("Exclusivo edificio");
  });

  it("no genera advertencias para una ficha completa", () => {
    expect(warnings).toEqual([]);
  });
});

describe("parseFicha — casa (Niza Suba)", () => {
  const { listing } = parseFicha(FICHA_CASA);

  it("mapea los campos residenciales", () => {
    expect(listing.external_id).toBe("147995");
    expect(listing.property_type).toBe("house");
    expect(listing.classification).toBe("residential");
    expect(listing.title).toBe("Casa en Niza Suba");
    expect(listing.pricing.sale_price).toBe(1_200_000_000);
    expect(listing.layout.bedrooms).toBe(4);
    expect(listing.layout.bathrooms).toBe(1);
    expect(listing.layout.half_bathrooms).toBe(3);
    expect(listing.layout.parking_spaces).toBe(4);
    expect(listing.layout.rooms).toBe(7);
    expect(listing.structure.conservation_status).toBe("Bueno");
    expect(listing.structure.floor_type).toBe("Marmol");
  });

  it("calcula la antigüedad desde el año de construcción", () => {
    expect(listing.structure.year_built).toBe(1974);
    expect(listing.structure.age_years).toBe(new Date().getFullYear() - 1974);
  });

  it("conserva los datos sin campo propio como tags", () => {
    expect(listing.features.tags).toContain("Cocina: Integral");
    expect(listing.features.tags).toContain("Regaderas: 3");
    expect(listing.features.tags).toContain("Jardín");
  });
});

describe("parseFicha — arriendo y ligaduras tipográficas", () => {
  // Los PDF reales traen ligaduras: "Oﬁcinas" usa ﬁ (U+FB01).
  const FICHA_RENTA = `ID: 149344
DATOS DE LA PROPIEDAD
Tipo: Oﬁcinas
Precio De Renta:
$25.000.000,00
Estrato: 5
Tipo Terreno: Plano
DATOS GENERALES
Ascensor
UBICACIÓN DEL INMUEBLE
La Castellana
Bogotá, Cundinamarca
DESCRIPCIÓN
Oficinas corporativas en arriendo.`;

  const { listing, warnings } = parseFicha(FICHA_RENTA);

  it("normaliza la ligadura y mapea el tipo en plural", () => {
    expect(listing.property_type).toBe("office");
    expect(listing.classification).toBe("commercial");
  });

  it("mapea la renta como operación de arriendo", () => {
    expect(listing.pricing.rent_price).toBe(25_000_000);
    expect(listing.pricing.sale_price).toBe(0);
    expect(listing.operation_type).toBe("rent");
    expect(warnings).toEqual([]);
  });

  it("mapea el tipo de terreno", () => {
    expect(listing.structure.terrain_type).toBe("Plano");
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
