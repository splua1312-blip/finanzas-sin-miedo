import { test } from "node:test";
import assert from "node:assert/strict";
import { escaparCampoCSV, movimientosACSV } from "./export.ts";
import type { Transaction } from "./types.ts";

test("escaparCampoCSV entrecomilla valores con comas", () => {
  assert.equal(escaparCampoCSV("Renta, agua"), '"Renta, agua"');
});

test("escaparCampoCSV duplica comillas internas", () => {
  assert.equal(escaparCampoCSV('Pago "extra"'), '"Pago ""extra"""');
});

test("escaparCampoCSV deja intactos los valores simples", () => {
  assert.equal(escaparCampoCSV("Supermercado"), "Supermercado");
});

test("movimientosACSV genera encabezados y filas", () => {
  const txs: Transaction[] = [
    {
      id: "1",
      description: "Sueldo",
      amount: 10000,
      type: "ingreso",
    },
    {
      id: "2",
      description: "Renta, depto",
      amount: 4000,
      type: "gasto",
      category: "vivienda",
      bucket: "necesidades",
    },
  ];
  const csv = movimientosACSV(txs);
  const lineas = csv.split("\r\n");
  assert.equal(lineas[0], "Descripción,Tipo,Monto,Categoría,Bucket");
  assert.equal(lineas[1], "Sueldo,Ingreso,10000,,");
  assert.equal(lineas[2], '"Renta, depto",Gasto,4000,Vivienda,Necesidades');
});
