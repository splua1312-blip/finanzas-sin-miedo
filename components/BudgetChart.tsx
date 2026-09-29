"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { Transaction } from "@/lib/types";
import { gastoPorCategoria } from "@/lib/finance";
import { ETIQUETAS_CATEGORIA, formatoMoneda } from "@/lib/format";

// Paleta categórica accesible (tonos diferenciables en claro).
const PALETA = [
  "#22714f",
  "#4faa7f",
  "#e0a63a",
  "#d9663f",
  "#3f72d9",
  "#8b5cd9",
  "#d94f8a",
  "#5aa9c9",
  "#a3b23a",
  "#c98b3a",
  "#2f8d63",
  "#94a3b8",
];

interface Props {
  transactions: Transaction[];
}

export default function BudgetChart({ transactions }: Props) {
  const datos = gastoPorCategoria(transactions).map((d) => ({
    ...d,
    nombre: ETIQUETAS_CATEGORIA[d.category] ?? d.category,
  }));

  if (datos.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-400">
        Agrega gastos para ver la distribución por categoría.
      </p>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={datos}
            dataKey="monto"
            nameKey="nombre"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
          >
            {datos.map((_, i) => (
              <Cell key={i} fill={PALETA[i % PALETA.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, _name, item: any) => [
              `${formatoMoneda(value)} (${item?.payload?.porcentaje ?? 0}%)`,
              item?.payload?.nombre,
            ]}
          />
          <Legend
            iconType="circle"
            formatter={(value) => (
              <span className="text-xs text-slate-600">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
