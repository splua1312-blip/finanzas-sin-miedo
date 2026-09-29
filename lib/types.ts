// Tipos compartidos de la aplicación "Presupuesto Sin Miedo".

/** Categorías de la metodología 50/30/20 usada para clasificar cada gasto. */
export type BudgetBucket = "necesidades" | "deseos" | "ahorro";

/** Categoría de gasto reconocida por la herramienta. */
export type ExpenseCategory =
  | "vivienda"
  | "alimentacion"
  | "transporte"
  | "servicios"
  | "salud"
  | "educacion"
  | "deudas"
  | "entretenimiento"
  | "compras"
  | "suscripciones"
  | "ahorro_inversion"
  | "otros";

/** Una transacción registrada por el usuario. */
export interface Transaction {
  id: string;
  /** Descripción libre escrita por el usuario (ej. "Renta departamento"). */
  description: string;
  /** Monto en la moneda local. Siempre positivo. */
  amount: number;
  /** Tipo de movimiento. */
  type: "ingreso" | "gasto";
  /** Categoría asignada (por el usuario o por la IA). Opcional al crear. */
  category?: ExpenseCategory;
  /** Bucket 50/30/20 asignado por la IA. Opcional al crear. */
  bucket?: BudgetBucket;
}

/** Datos financieros adicionales para los indicadores de salud. */
export interface FinancialContext {
  /** Ahorros líquidos disponibles (fondo de emergencia actual). */
  liquidSavings: number;
  /** Pago mensual total de deudas (tarjetas, préstamos, etc.). */
  monthlyDebtPayments: number;
  /** Meta de ahorro mensual (opcional). */
  savingsGoal?: number;
}

/** Resultado de una categorización individual devuelta por la IA. */
export interface CategorizedTransaction {
  id: string;
  category: ExpenseCategory;
  bucket: BudgetBucket;
}

/** Una recomendación de ahorro generada por la IA. */
export interface Recommendation {
  titulo: string;
  detalle: string;
  /** Ahorro mensual potencial estimado, en moneda local. */
  ahorroMensualEstimado: number;
}

/** Respuesta completa del endpoint /api/analyze. */
export interface AnalysisResult {
  categorized: CategorizedTransaction[];
  recommendations: Recommendation[];
  /** Resumen breve en lenguaje natural. */
  resumen: string;
}
