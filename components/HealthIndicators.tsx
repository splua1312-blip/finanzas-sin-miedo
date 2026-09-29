"use client";

import type { FinancialContext, Transaction } from "@/lib/types";
import {
  mesesFondoEmergencia,
  ratioEndeudamiento,
  regla503020,
  tasaDeAhorro,
} from "@/lib/finance";
import { ETIQUETAS_BUCKET, formatoMoneda, formatoPorcentaje } from "@/lib/format";

interface Props {
  transactions: Transaction[];
  context: FinancialContext;
}

interface Indicador {
  titulo: string;
  valor: string;
  formula: string;
  estado: "bien" | "alerta" | "neutral";
  nota: string;
}

function colorEstado(estado: Indicador["estado"]): string {
  switch (estado) {
    case "bien":
      return "border-brand-200 bg-brand-50";
    case "alerta":
      return "border-amber-200 bg-amber-50";
    default:
      return "border-slate-200 bg-white";
  }
}

export default function HealthIndicators({ transactions, context }: Props) {
  const ahorro = tasaDeAhorro(transactions);
  const meses = mesesFondoEmergencia(transactions, context);
  const endeudamiento = ratioEndeudamiento(transactions, context);
  const regla = regla503020(transactions);

  const indicadores: Indicador[] = [
    {
      titulo: "Tasa de ahorro",
      valor: formatoPorcentaje(ahorro),
      formula: "(Ingresos − Gastos) / Ingresos × 100",
      estado: ahorro >= 20 ? "bien" : ahorro >= 10 ? "neutral" : "alerta",
      nota:
        ahorro >= 20
          ? "Excelente: ahorras al menos el 20% recomendado."
          : "Meta sugerida: alcanzar al menos el 20%.",
    },
    {
      titulo: "Fondo de emergencia",
      valor: `${meses.toFixed(1)} meses`,
      formula: "Ahorros líquidos / Gastos esenciales mensuales",
      estado: meses >= 3 ? "bien" : meses >= 1 ? "neutral" : "alerta",
      nota:
        meses >= 3
          ? "Cubres 3+ meses de gastos esenciales."
          : "Meta sugerida: 3 a 6 meses de gastos esenciales.",
    },
    {
      titulo: "Ratio de endeudamiento",
      valor: formatoPorcentaje(endeudamiento),
      formula: "Pago mensual de deudas / Ingresos × 100",
      estado:
        endeudamiento <= 36 ? "bien" : endeudamiento <= 43 ? "neutral" : "alerta",
      nota:
        endeudamiento <= 36
          ? "Saludable: por debajo del 36%."
          : "Recomendado: mantenerlo por debajo del 36%.",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {indicadores.map((ind) => (
          <div
            key={ind.titulo}
            className={`rounded-xl border p-4 ${colorEstado(ind.estado)}`}
          >
            <p className="text-sm font-medium text-slate-600">{ind.titulo}</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{ind.valor}</p>
            <p className="mt-2 font-mono text-[11px] leading-tight text-slate-500">
              {ind.formula}
            </p>
            <p className="mt-2 text-xs text-slate-600">{ind.nota}</p>
          </div>
        ))}
      </div>

      <div>
        <h4 className="mb-1 text-sm font-semibold text-slate-700">
          Regla 50/30/20
        </h4>
        <p className="mb-3 font-mono text-[11px] text-slate-500">
          Objetivo por bucket = Ingresos × (50% necesidades / 30% deseos / 20% ahorro)
        </p>
        <div className="space-y-3">
          {regla.map((r) => {
            const pct =
              r.objetivo > 0 ? Math.min(100, (r.real / r.objetivo) * 100) : 0;
            const excede = r.real > r.objetivo && r.bucket !== "ahorro";
            return (
              <div key={r.bucket}>
                <div className="mb-1 flex justify-between text-xs text-slate-600">
                  <span className="font-medium">
                    {ETIQUETAS_BUCKET[r.bucket]} ({r.porcentajeObjetivo}%)
                  </span>
                  <span>
                    {formatoMoneda(r.real)} / {formatoMoneda(r.objetivo)}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${
                      excede ? "bg-amber-500" : "bg-brand-500"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
