// Exportación de movimientos a CSV (compatible con Excel).

import type { Transaction } from "./types.ts";
import { ETIQUETAS_BUCKET, ETIQUETAS_CATEGORIA } from "./format.ts";

/** Escapa un valor para CSV: entrecomilla si contiene coma, comilla o salto de línea. */
export function escaparCampoCSV(valor: string): string {
  if (/[",\n\r]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

/**
 * Convierte los movimientos a una cadena CSV con encabezados.
 * Columnas: Descripción, Tipo, Monto, Categoría, Bucket.
 */
export function movimientosACSV(transactions: Transaction[]): string {
  const encabezados = ["Descripción", "Tipo", "Monto", "Categoría", "Bucket"];
  const filas = transactions.map((t) => [
    escaparCampoCSV(t.description),
    t.type === "ingreso" ? "Ingreso" : "Gasto",
    String(t.amount),
    escaparCampoCSV(t.category ? (ETIQUETAS_CATEGORIA[t.category] ?? t.category) : ""),
    escaparCampoCSV(t.bucket ? (ETIQUETAS_BUCKET[t.bucket] ?? t.bucket) : ""),
  ]);
  return [encabezados, ...filas].map((fila) => fila.join(",")).join("\r\n");
}

/**
 * Descarga un CSV en el navegador. Antepone el BOM UTF-8 para que Excel
 * interprete correctamente los acentos.
 */
export function descargarCSV(nombreArchivo: string, contenido: string): void {
  const bom = "﻿";
  const blob = new Blob([bom + contenido], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}

/** Nombre de archivo sugerido con la fecha actual: presupuesto-AAAA-MM-DD.csv */
export function nombreArchivoCSV(): string {
  const hoy = new Date().toISOString().slice(0, 10);
  return `presupuesto-${hoy}.csv`;
}
