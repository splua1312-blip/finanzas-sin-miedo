"use client";

import type { FinancialContext, Transaction } from "@/lib/types";
import { balance, totalGastos, totalIngresos } from "@/lib/finance";
import { formatoMoneda } from "@/lib/format";
import BudgetChart from "./BudgetChart";
import HealthIndicators from "./HealthIndicators";

interface Props {
  transactions: Transaction[];
  context: FinancialContext;
}

export default function Dashboard({ transactions, context }: Props) {
  const ingresos = totalIngresos(transactions);
  const gastos = totalGastos(transactions);
  const saldo = balance(transactions);

  const tiles = [
    { label: "Ingresos", valor: ingresos, color: "text-brand-700" },
    { label: "Gastos", valor: gastos, color: "text-rose-600" },
    {
      label: "Balance",
      valor: saldo,
      color: saldo >= 0 ? "text-brand-700" : "text-rose-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {t.label}
            </p>
            <p className={`mt-1 text-xl font-bold ${t.color}`}>
              {formatoMoneda(t.valor)}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-2 text-lg font-semibold text-slate-800">
          Distribución de gastos
        </h3>
        <BudgetChart transactions={transactions} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-4 text-lg font-semibold text-slate-800">
          Salud financiera
        </h3>
        <HealthIndicators transactions={transactions} context={context} />
      </div>
    </div>
  );
}
