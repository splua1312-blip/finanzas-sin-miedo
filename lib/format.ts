/** Formatea un número como moneda local (por defecto MXN, es-MX). */
export function formatoMoneda(
  n: number,
  moneda = "MXN",
  locale = "es-MX",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(n);
}

/** Formatea un porcentaje con un decimal. */
export function formatoPorcentaje(n: number): string {
  return `${n.toFixed(1)}%`;
}

/** Etiquetas legibles para las categorías de gasto. */
export const ETIQUETAS_CATEGORIA: Record<string, string> = {
  vivienda: "Vivienda",
  alimentacion: "Alimentación",
  transporte: "Transporte",
  servicios: "Servicios",
  salud: "Salud",
  educacion: "Educación",
  deudas: "Deudas",
  entretenimiento: "Entretenimiento",
  compras: "Compras",
  suscripciones: "Suscripciones",
  ahorro_inversion: "Ahorro / Inversión",
  otros: "Otros",
};

export const ETIQUETAS_BUCKET: Record<string, string> = {
  necesidades: "Necesidades",
  deseos: "Deseos",
  ahorro: "Ahorro",
};
