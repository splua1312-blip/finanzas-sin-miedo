// Lógica financiera pura y testeable.
// Cada función documenta su fórmula para que la interfaz pueda mostrarla al usuario
// (preferencia de desglose detallado de fórmulas).

import type {
  BudgetBucket,
  ExpenseCategory,
  FinancialContext,
  Transaction,
} from "./types";

/** Redondea a 2 decimales evitando errores de punto flotante. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Suma de todos los ingresos. */
export function totalIngresos(transactions: Transaction[]): number {
  return round2(
    transactions
      .filter((t) => t.type === "ingreso")
      .reduce((acc, t) => acc + t.amount, 0),
  );
}

/** Suma de todos los gastos. */
export function totalGastos(transactions: Transaction[]): number {
  return round2(
    transactions
      .filter((t) => t.type === "gasto")
      .reduce((acc, t) => acc + t.amount, 0),
  );
}

/** Balance mensual = Ingresos − Gastos. */
export function balance(transactions: Transaction[]): number {
  return round2(totalIngresos(transactions) - totalGastos(transactions));
}

/**
 * Tasa de ahorro (%).
 * Fórmula: (Ingresos − Gastos) / Ingresos × 100
 * Interpretación: porcentaje del ingreso que no se gasta.
 */
export function tasaDeAhorro(transactions: Transaction[]): number {
  const ingresos = totalIngresos(transactions);
  if (ingresos <= 0) return 0;
  const gastos = totalGastos(transactions);
  return round2(((ingresos - gastos) / ingresos) * 100);
}

/**
 * Fondo de emergencia en meses.
 * Fórmula: Ahorros líquidos / Gastos mensuales esenciales
 * "Esenciales" = gastos clasificados como bucket "necesidades" (o el total de
 * gastos si aún no hay clasificación).
 */
export function mesesFondoEmergencia(
  transactions: Transaction[],
  ctx: FinancialContext,
): number {
  const esenciales = gastosEsenciales(transactions);
  const base = esenciales > 0 ? esenciales : totalGastos(transactions);
  if (base <= 0) return 0;
  return round2(ctx.liquidSavings / base);
}

/** Gastos marcados como bucket "necesidades". */
export function gastosEsenciales(transactions: Transaction[]): number {
  return round2(
    transactions
      .filter((t) => t.type === "gasto" && t.bucket === "necesidades")
      .reduce((acc, t) => acc + t.amount, 0),
  );
}

/**
 * Ratio de endeudamiento (%).
 * Fórmula: Pago mensual de deudas / Ingresos mensuales × 100
 * Referencia: por debajo de 36% se considera saludable.
 */
export function ratioEndeudamiento(
  transactions: Transaction[],
  ctx: FinancialContext,
): number {
  const ingresos = totalIngresos(transactions);
  if (ingresos <= 0) return 0;
  return round2((ctx.monthlyDebtPayments / ingresos) * 100);
}

/** Gasto agregado por categoría, ordenado de mayor a menor. */
export function gastoPorCategoria(
  transactions: Transaction[],
): Array<{ category: ExpenseCategory; monto: number; porcentaje: number }> {
  const gastos = transactions.filter((t) => t.type === "gasto");
  const total = gastos.reduce((acc, t) => acc + t.amount, 0);
  const mapa = new Map<ExpenseCategory, number>();
  for (const t of gastos) {
    const cat = t.category ?? "otros";
    mapa.set(cat, (mapa.get(cat) ?? 0) + t.amount);
  }
  return Array.from(mapa.entries())
    .map(([category, monto]) => ({
      category,
      monto: round2(monto),
      porcentaje: total > 0 ? round2((monto / total) * 100) : 0,
    }))
    .sort((a, b) => b.monto - a.monto);
}

export interface ProgresoMeta {
  /** Ahorro real del mes (balance no gastado, mínimo 0). */
  ahorroActual: number;
  /** Meta mensual objetivo. */
  meta: number;
  /** Avance hacia la meta (0-100). */
  porcentaje: number;
}

/**
 * Progreso hacia la meta de ahorro mensual.
 * Fórmula: min(100, (Ahorro del mes / Meta) × 100)
 * "Ahorro del mes" = Ingresos − Gastos (no negativo).
 */
export function progresoMeta(
  transactions: Transaction[],
  meta: number,
): ProgresoMeta {
  const ahorroActual = Math.max(0, balance(transactions));
  const objetivo = meta > 0 ? meta : 0;
  const porcentaje =
    objetivo > 0 ? round2(Math.min(100, (ahorroActual / objetivo) * 100)) : 0;
  return { ahorroActual, meta: objetivo, porcentaje };
}

export interface Regla503020 {
  bucket: BudgetBucket;
  /** Monto real gastado en el bucket. */
  real: number;
  /** Monto objetivo según la regla (% del ingreso). */
  objetivo: number;
  /** Porcentaje objetivo (50, 30 o 20). */
  porcentajeObjetivo: number;
  /** Porcentaje real respecto al ingreso. */
  porcentajeReal: number;
}

/**
 * Regla 50/30/20 comparando lo real contra el objetivo.
 * Fórmula del objetivo por bucket: Ingresos × porcentaje
 *   - Necesidades: 50%
 *   - Deseos: 30%
 *   - Ahorro: 20%
 * El "real" de ahorro incluye el balance no gastado + gastos marcados como ahorro/inversión.
 */
export function regla503020(transactions: Transaction[]): Regla503020[] {
  const ingresos = totalIngresos(transactions);
  const objetivos: Record<BudgetBucket, number> = {
    necesidades: 0.5,
    deseos: 0.3,
    ahorro: 0.2,
  };

  const realPorBucket: Record<BudgetBucket, number> = {
    necesidades: 0,
    deseos: 0,
    ahorro: 0,
  };

  for (const t of transactions) {
    if (t.type !== "gasto" || !t.bucket) continue;
    realPorBucket[t.bucket] += t.amount;
  }

  // El dinero no gastado cuenta como ahorro efectivo.
  const noGastado = Math.max(0, balance(transactions));
  realPorBucket.ahorro += noGastado;

  return (Object.keys(objetivos) as BudgetBucket[]).map((bucket) => {
    const real = round2(realPorBucket[bucket]);
    const objetivo = round2(ingresos * objetivos[bucket]);
    return {
      bucket,
      real,
      objetivo,
      porcentajeObjetivo: objetivos[bucket] * 100,
      porcentajeReal: ingresos > 0 ? round2((real / ingresos) * 100) : 0,
    };
  });
}
