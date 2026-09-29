"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  AnalysisResult,
  FinancialContext,
  Transaction,
} from "@/lib/types";
import { ETIQUETAS_BUCKET, ETIQUETAS_CATEGORIA, formatoMoneda } from "@/lib/format";
import TransactionForm from "@/components/TransactionForm";
import Dashboard from "@/components/Dashboard";
import AIRecommendations from "@/components/AIRecommendations";

const STORAGE_KEY = "psm:estado:v1";

interface EstadoPersistido {
  transactions: Transaction[];
  context: FinancialContext;
}

const MOVIMIENTOS_EJEMPLO: Transaction[] = [
  { id: "ej-1", description: "Sueldo mensual", amount: 20000, type: "ingreso" },
  { id: "ej-2", description: "Renta departamento", amount: 6500, type: "gasto" },
  { id: "ej-3", description: "Supermercado", amount: 3500, type: "gasto" },
  { id: "ej-4", description: "Transporte", amount: 1200, type: "gasto" },
  { id: "ej-5", description: "Streaming y suscripciones", amount: 700, type: "gasto" },
  { id: "ej-6", description: "Restaurantes", amount: 1800, type: "gasto" },
];

function nuevoId(): string {
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [context, setContext] = useState<FinancialContext>({
    liquidSavings: 0,
    monthlyDebtPayments: 0,
  });
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cargado, setCargado] = useState(false);

  // Cargar estado desde localStorage al montar.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as EstadoPersistido;
        setTransactions(parsed.transactions ?? []);
        setContext(parsed.context ?? { liquidSavings: 0, monthlyDebtPayments: 0 });
      } else {
        setTransactions(MOVIMIENTOS_EJEMPLO);
      }
    } catch {
      setTransactions(MOVIMIENTOS_EJEMPLO);
    }
    setCargado(true);
  }, []);

  // Guardar estado en localStorage cuando cambie.
  useEffect(() => {
    if (!cargado) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ transactions, context }),
      );
    } catch {
      /* almacenamiento no disponible: se ignora */
    }
  }, [transactions, context, cargado]);

  const categoriasPorId = useMemo(() => {
    const mapa = new Map<string, { category?: string; bucket?: string }>();
    result?.categorized.forEach((c) =>
      mapa.set(c.id, { category: c.category, bucket: c.bucket }),
    );
    return mapa;
  }, [result]);

  function agregar(t: Omit<Transaction, "id">) {
    setTransactions((prev) => [...prev, { ...t, id: nuevoId() }]);
    setResult(null);
  }

  function eliminar(id: string) {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    setResult(null);
  }

  function limpiar() {
    setTransactions([]);
    setResult(null);
    setError("");
  }

  async function analizar() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions, context }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "No se pudo completar el análisis.");
        setResult(null);
        return;
      }
      // Fusionar categorías/buckets devueltos en las transacciones.
      const cat = new Map<string, { category: any; bucket: any }>();
      (data as AnalysisResult).categorized.forEach((c) =>
        cat.set(c.id, { category: c.category, bucket: c.bucket }),
      );
      setTransactions((prev) =>
        prev.map((t) =>
          cat.has(t.id)
            ? { ...t, category: cat.get(t.id)!.category, bucket: cat.get(t.id)!.bucket }
            : t,
        ),
      );
      setResult(data as AnalysisResult);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const hayGastos = transactions.some((t) => t.type === "gasto");

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <header className="bg-gradient-to-b from-brand-700 to-brand-600 text-white">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-brand-100">
            Presupuesto Sin Miedo
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">
            Ordena tus finanzas personales con ayuda de inteligencia artificial
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-brand-50">
            Registra tus ingresos y gastos, y deja que la IA los categorice, mida
            tu salud financiera y te dé recomendaciones de ahorro personalizadas.
          </p>
          <a
            href="#app"
            className="mt-6 inline-block rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            Comenzar gratis
          </a>
        </div>
      </header>

      {/* App */}
      <section id="app" className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          {/* Columna izquierda: entrada de datos */}
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-4 text-lg font-semibold text-slate-800">
                Registrar movimiento
              </h2>
              <TransactionForm onAdd={agregar} />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-4 text-lg font-semibold text-slate-800">
                Datos para tus indicadores
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600">
                    Ahorros líquidos (fondo actual)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={context.liquidSavings || ""}
                    onChange={(e) =>
                      setContext((c) => ({
                        ...c,
                        liquidSavings: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600">
                    Pago mensual de deudas
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={context.monthlyDebtPayments || ""}
                    onChange={(e) =>
                      setContext((c) => ({
                        ...c,
                        monthlyDebtPayments: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {transactions.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-800">
                    Movimientos ({transactions.length})
                  </h2>
                  <button
                    onClick={limpiar}
                    className="text-xs font-medium text-slate-400 hover:text-rose-600"
                  >
                    Limpiar todo
                  </button>
                </div>
                <ul className="divide-y divide-slate-100">
                  {transactions.map((t) => {
                    const meta = categoriasPorId.get(t.id);
                    return (
                      <li
                        key={t.id}
                        className="flex items-center justify-between gap-2 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-700">
                            {t.description}
                          </p>
                          {meta?.category && (
                            <p className="text-xs text-slate-400">
                              {ETIQUETAS_CATEGORIA[meta.category] ?? meta.category}
                              {meta.bucket
                                ? ` · ${ETIQUETAS_BUCKET[meta.bucket] ?? meta.bucket}`
                                : ""}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-sm font-semibold ${
                              t.type === "ingreso"
                                ? "text-brand-700"
                                : "text-rose-600"
                            }`}
                          >
                            {t.type === "ingreso" ? "+" : "−"}
                            {formatoMoneda(t.amount)}
                          </span>
                          <button
                            onClick={() => eliminar(t.id)}
                            className="text-slate-300 transition hover:text-rose-500"
                            aria-label="Eliminar"
                          >
                            ✕
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {/* Columna derecha: dashboard + IA */}
          <div className="space-y-6">
            <Dashboard transactions={transactions} context={context} />
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <AIRecommendations
                result={result}
                loading={loading}
                error={error}
                onAnalyze={analizar}
                disabled={!hayGastos}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Planes */}
      <PricingSection />

      <footer className="border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-400">
        Presupuesto Sin Miedo · Hecho para tomar el control de tus finanzas.
      </footer>
    </main>
  );
}

function PricingSection() {
  const planes = [
    {
      nombre: "Gratis",
      precio: "$0",
      periodo: "para siempre",
      destacado: false,
      features: [
        "Hasta 15 movimientos",
        "Dashboard e indicadores de salud",
        "1 análisis con IA al mes",
      ],
    },
    {
      nombre: "Pro",
      precio: "$99",
      periodo: "/mes",
      destacado: true,
      features: [
        "Movimientos ilimitados",
        "Análisis con IA ilimitado",
        "Recomendaciones personalizadas",
        "Regla 50/30/20 automática",
      ],
    },
    {
      nombre: "Anual",
      precio: "$948",
      periodo: "/año (2 meses gratis)",
      destacado: false,
      features: ["Todo lo de Pro", "20% de ahorro", "Soporte prioritario"],
    },
  ];

  return (
    <section className="bg-slate-100 py-14">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-center text-2xl font-bold text-slate-800">
          Planes
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Empieza gratis y mejora cuando lo necesites. (El cobro se habilitará
          próximamente.)
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {planes.map((p) => (
            <div
              key={p.nombre}
              className={`rounded-2xl border p-6 ${
                p.destacado
                  ? "border-brand-500 bg-white shadow-lg ring-1 ring-brand-500"
                  : "border-slate-200 bg-white"
              }`}
            >
              {p.destacado && (
                <span className="mb-2 inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
                  Más popular
                </span>
              )}
              <h3 className="text-lg font-semibold text-slate-800">{p.nombre}</h3>
              <p className="mt-2">
                <span className="text-3xl font-bold text-slate-900">
                  {p.precio}
                </span>{" "}
                <span className="text-sm text-slate-500">{p.periodo}</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-brand-600">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                disabled
                className={`mt-6 w-full rounded-lg px-4 py-2 text-sm font-semibold ${
                  p.destacado
                    ? "bg-brand-600 text-white"
                    : "bg-slate-100 text-slate-600"
                } cursor-not-allowed opacity-80`}
              >
                {p.nombre === "Gratis" ? "Plan actual" : "Próximamente"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
