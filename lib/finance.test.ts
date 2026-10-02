// Pruebas unitarias de la lógica financiera pura.
// Ejecutar con: node --test (tras compilar) o mediante el runner del proyecto.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  balance,
  mesesFondoEmergencia,
  progresoMeta,
  ratioEndeudamiento,
  regla503020,
  tasaDeAhorro,
  totalGastos,
  totalIngresos,
} from "./finance.ts";
import type { Transaction } from "./types.ts";

const base: Transaction[] = [
  { id: "1", description: "Sueldo", amount: 10000, type: "ingreso" },
  { id: "2", description: "Renta", amount: 4000, type: "gasto", bucket: "necesidades" },
  { id: "3", description: "Cine", amount: 1000, type: "gasto", bucket: "deseos" },
];

test("totales de ingresos y gastos", () => {
  assert.equal(totalIngresos(base), 10000);
  assert.equal(totalGastos(base), 5000);
  assert.equal(balance(base), 5000);
});

test("tasa de ahorro = (ingresos - gastos) / ingresos * 100", () => {
  assert.equal(tasaDeAhorro(base), 50);
});

test("tasa de ahorro es 0 sin ingresos", () => {
  const t: Transaction[] = [
    { id: "1", description: "Gasto", amount: 100, type: "gasto" },
  ];
  assert.equal(tasaDeAhorro(t), 0);
});

test("fondo de emergencia = ahorros / gastos esenciales", () => {
  // gastos esenciales (necesidades) = 4000; ahorros = 12000 -> 3 meses
  assert.equal(
    mesesFondoEmergencia(base, { liquidSavings: 12000, monthlyDebtPayments: 0 }),
    3,
  );
});

test("ratio de endeudamiento = deudas / ingresos * 100", () => {
  assert.equal(
    ratioEndeudamiento(base, { liquidSavings: 0, monthlyDebtPayments: 3600 }),
    36,
  );
});

test("progresoMeta calcula el avance hacia la meta", () => {
  // balance de base = 5000; meta 10000 -> 50%
  const p = progresoMeta(base, 10000);
  assert.equal(p.ahorroActual, 5000);
  assert.equal(p.meta, 10000);
  assert.equal(p.porcentaje, 50);
});

test("progresoMeta sin meta devuelve 0%", () => {
  const p = progresoMeta(base, 0);
  assert.equal(p.porcentaje, 0);
});

test("regla 50/30/20 calcula objetivos correctos", () => {
  const r = regla503020(base);
  const necesidades = r.find((x) => x.bucket === "necesidades")!;
  const deseos = r.find((x) => x.bucket === "deseos")!;
  const ahorro = r.find((x) => x.bucket === "ahorro")!;
  assert.equal(necesidades.objetivo, 5000); // 10000 * 0.5
  assert.equal(deseos.objetivo, 3000); // 10000 * 0.3
  assert.equal(ahorro.objetivo, 2000); // 10000 * 0.2
  // El balance no gastado (5000) cuenta como ahorro efectivo.
  assert.equal(ahorro.real, 5000);
});
