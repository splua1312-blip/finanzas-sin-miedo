"use client";

import { useState } from "react";
import type { Transaction } from "@/lib/types";

interface Props {
  onAdd: (t: Omit<Transaction, "id">) => void;
}

export default function TransactionForm({ onAdd }: Props) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"ingreso" | "gasto">("gasto");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const monto = parseFloat(amount);
    if (!description.trim()) {
      setError("Escribe una descripción.");
      return;
    }
    if (!Number.isFinite(monto) || monto <= 0) {
      setError("Ingresa un monto válido mayor que cero.");
      return;
    }
    setError("");
    onAdd({ description: description.trim(), amount: monto, type });
    setDescription("");
    setAmount("");
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType("gasto")}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
            type === "gasto"
              ? "border-rose-500 bg-rose-50 text-rose-700"
              : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
          }`}
        >
          Gasto
        </button>
        <button
          type="button"
          onClick={() => setType("ingreso")}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
            type === "ingreso"
              ? "border-brand-500 bg-brand-50 text-brand-700"
              : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
          }`}
        >
          Ingreso
        </button>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-600">
          Descripción
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ej. Renta, supermercado, sueldo…"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-600">
          Monto mensual
        </label>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <button
        type="submit"
        className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
      >
        Agregar movimiento
      </button>
    </form>
  );
}
