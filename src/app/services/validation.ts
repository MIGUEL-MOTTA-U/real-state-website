// Validación lógica del formulario de inmuebles.
// Reglas puras sin dependencia de React: reciben el listing y devuelven
// errores (bloquean publicar) y advertencias (informativas, no bloquean).
import type { ApiListing } from "./types";

export const MIN_YEAR_BUILT = 1900;
/** Margen para preventas/proyectos sobre plano. */
export const MAX_YEAR_AHEAD = 2;
export const MAX_DESCRIPTION_SHORT = 300;
export const MAX_TITLE_LENGTH = 150;
export const SLUG_PATTERN = /^[a-z0-9ñáéíóúü]+(-[a-z0-9ñáéíóúü]+)*$/;

export interface ListingValidation {
  /** campo → mensaje. Bloquean la publicación. */
  errors: Record<string, string>;
  /** campo → mensaje. Solo informativas. */
  warnings: Record<string, string>;
}

const isInt = (n: number) => Number.isInteger(n);

function checkCount(
  errors: Record<string, string>,
  field: string,
  value: number,
  label: string,
  max = 999,
) {
  if (value < 0) errors[field] = `${label} no puede ser negativo`;
  else if (!isInt(value)) errors[field] = `${label} debe ser un número entero`;
  else if (value > max) errors[field] = `${label} no puede superar ${max}`;
}

function checkMeasure(
  errors: Record<string, string>,
  field: string,
  value: number,
  label: string,
  max = 1_000_000,
) {
  if (value < 0) errors[field] = `${label} no puede ser negativo`;
  else if (value > max) errors[field] = `${label} supera el máximo razonable (${max.toLocaleString("es-CO")})`;
}

export function validateListing(l: ApiListing, today = new Date()): ListingValidation {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};
  const year = today.getFullYear();

  // ── General ────────────────────────────────────────────────────────────────
  if (!l.title.trim()) errors["title"] = "El título es requerido";
  else if (l.title.trim().length > MAX_TITLE_LENGTH)
    errors["title"] = `El título no puede superar ${MAX_TITLE_LENGTH} caracteres`;

  if (l.slug && !SLUG_PATTERN.test(l.slug))
    errors["slug"] = "Solo minúsculas, números y guiones (ej. apartamento-el-poblado)";

  if (!l.property_type) errors["property_type"] = "Selecciona el tipo de propiedad";
  if (!l.operation_type) errors["operation_type"] = "Selecciona el tipo de operación";

  if (l.description_short.length > MAX_DESCRIPTION_SHORT)
    warnings["description_short"] = `La descripción corta supera ${MAX_DESCRIPTION_SHORT} caracteres; se recomienda resumirla`;

  // ── Ubicación ──────────────────────────────────────────────────────────────
  if (!l.location.city.trim()) errors["location.city"] = "La ciudad es requerida";
  if (l.location.stratum !== 0 && (l.location.stratum < 1 || l.location.stratum > 6))
    errors["location.stratum"] = "El estrato debe estar entre 1 y 6";
  const { lat, lng } = l.location.coordinates;
  if (lat < -90 || lat > 90) errors["location.lat"] = "La latitud debe estar entre -90 y 90";
  if (lng < -180 || lng > 180) errors["location.lng"] = "La longitud debe estar entre -180 y 180";

  // ── Precios ────────────────────────────────────────────────────────────────
  const { sale_price, rent_price, admin_fee, taxes } = l.pricing;
  if (sale_price < 0) errors["pricing.sale_price"] = "El precio de venta no puede ser negativo";
  if (rent_price < 0) errors["pricing.rent_price"] = "El precio de arriendo no puede ser negativo";
  if (admin_fee < 0) errors["pricing.admin_fee"] = "La administración no puede ser negativa";
  if (taxes < 0) errors["pricing.taxes"] = "Los impuestos no pueden ser negativos";

  const needsSale = l.operation_type === "sale" || l.operation_type === "sale_rent";
  const needsRent = l.operation_type === "rent" || l.operation_type === "sale_rent";
  if (needsSale && sale_price <= 0)
    errors["pricing.sale_price"] = "La operación de venta requiere un precio de venta";
  if (needsRent && rent_price <= 0)
    errors["pricing.rent_price"] = "La operación de arriendo requiere un precio de arriendo";
  if (!needsSale && !needsRent && sale_price <= 0 && rent_price <= 0)
    errors["pricing.sale_price"] = "Ingresa al menos un precio (venta o arriendo)";

  if (rent_price > 0 && admin_fee > rent_price)
    warnings["pricing.admin_fee"] = "La administración es mayor que el arriendo mensual; verifica el valor";
  if (sale_price > 0 && rent_price > 0 && rent_price > sale_price)
    warnings["pricing.rent_price"] = "El arriendo mensual es mayor que el precio de venta; verifica los valores";

  // ── Áreas ──────────────────────────────────────────────────────────────────
  const a = l.areas;
  checkMeasure(errors, "areas.built_area_m2", a.built_area_m2, "El área construida");
  checkMeasure(errors, "areas.private_area_m2", a.private_area_m2, "El área privada");
  checkMeasure(errors, "areas.lot_area_m2", a.lot_area_m2, "El área de lote");
  checkMeasure(errors, "areas.land_area_m2", a.land_area_m2, "El área de terreno");
  checkMeasure(errors, "areas.front_m", a.front_m, "El frente", 10_000);
  checkMeasure(errors, "areas.back_m", a.back_m, "El fondo", 10_000);

  const isLot = l.property_type === "lot";
  if (isLot) {
    if (a.lot_area_m2 <= 0 && a.land_area_m2 <= 0)
      errors["areas.lot_area_m2"] = "Un lote/terreno requiere área de lote o de terreno";
  } else if (l.property_type && a.built_area_m2 <= 0) {
    errors["areas.built_area_m2"] = "El área construida es requerida";
  }

  if (!errors["areas.private_area_m2"] && a.private_area_m2 > 0 && a.built_area_m2 > 0 && a.private_area_m2 > a.built_area_m2)
    errors["areas.private_area_m2"] = "El área privada no puede ser mayor que el área construida";
  if (a.built_area_m2 > 0 && a.land_area_m2 > 0 && l.structure.built_levels <= 1 && a.built_area_m2 > a.land_area_m2)
    warnings["areas.built_area_m2"] = "El área construida supera el terreno en un solo nivel; verifica los valores";

  // ── Distribución ───────────────────────────────────────────────────────────
  const lay = l.layout;
  checkCount(errors, "layout.rooms", lay.rooms, "Ambientes");
  checkCount(errors, "layout.bedrooms", lay.bedrooms, "Habitaciones");
  checkCount(errors, "layout.bathrooms", lay.bathrooms, "Baños");
  checkCount(errors, "layout.half_bathrooms", lay.half_bathrooms, "Medios baños");
  checkCount(errors, "layout.parking_spaces", lay.parking_spaces, "Parqueaderos");
  checkCount(errors, "layout.floors", lay.floors, "Pisos del inmueble", 200);
  checkCount(errors, "layout.unit_floor", lay.unit_floor, "El piso de la unidad", 200);

  if (!errors["layout.rooms"] && lay.rooms > 0 && lay.bedrooms > lay.rooms)
    errors["layout.rooms"] = "Los ambientes no pueden ser menos que las habitaciones";
  if (!errors["layout.unit_floor"] && lay.unit_floor > 0 && l.structure.built_levels > 0 && lay.unit_floor > l.structure.built_levels)
    errors["layout.unit_floor"] = "El piso de la unidad no puede superar los niveles construidos";

  // ── Estructura ─────────────────────────────────────────────────────────────
  const s = l.structure;
  if (s.year_built !== 0 && (s.year_built < MIN_YEAR_BUILT || s.year_built > year + MAX_YEAR_AHEAD))
    errors["structure.year_built"] = `El año de construcción debe estar entre ${MIN_YEAR_BUILT} y ${year + MAX_YEAR_AHEAD}`;
  if (s.age_years < 0) errors["structure.age_years"] = "La antigüedad no puede ser negativa";
  checkCount(errors, "structure.built_levels", s.built_levels, "Niveles construidos", 200);

  return { errors, warnings };
}

// ── Cálculos básicos ──────────────────────────────────────────────────────────

/** Antigüedad derivada del año de construcción (0 si no aplica). */
export function ageFromYearBuilt(yearBuilt: number, today = new Date()): number {
  if (yearBuilt < MIN_YEAR_BUILT) return 0;
  return Math.max(0, today.getFullYear() - yearBuilt);
}

/** Precio por m² sobre el área construida (o lote para terrenos). */
export function pricePerM2(l: ApiListing): number {
  const price = l.pricing.sale_price > 0 ? l.pricing.sale_price : l.pricing.rent_price;
  const area = l.areas.built_area_m2 > 0 ? l.areas.built_area_m2 : l.areas.lot_area_m2 || l.areas.land_area_m2;
  if (price <= 0 || area <= 0) return 0;
  return Math.round(price / area);
}

/** Área de lote estimada a partir de frente × fondo. */
export function lotAreaFromDimensions(frontM: number, backM: number): number {
  if (frontM <= 0 || backM <= 0) return 0;
  return Math.round(frontM * backM * 100) / 100;
}
