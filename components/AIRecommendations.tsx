"use client";

import { useState } from "react";
import Link from "next/link";
import type { AnalysisResult } from "@/lib/types";
import { formatoMoneda } from "@/lib/format";
import { startCheckout } from "@/lib/billing";

interface Props {
  result: AnalysisResult | null;
  loading: boolean;
  error: string;
  errorCode?: string;
  onAnalyze: () => void;
  disabled: boolean;
}

export default function AIRecommendations({
  result,
  loading,
  error,
  errorCode,
  onAnalyze,
  disabled,
}: Props) {
  const [upgrading, setUpgrading] = useState(false);

  async function onUpgrade() {
    setUpgrading(true);
    const err = await startCheckout();
    if (err) setUpgrading(false);
  }
  const ahorroTotal =
    result?.recommendations.reduce(
      (acc, r) => acc + (r.ahorroMensualEstimado || 0),
      0,
    ) ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">
          Recomendaciones con IA
        </h3>
        <button
          onClick={onAnalyze}
          disabled={disabled || loading}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? "Analizando…" : "Analizar con IA"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <p>{error}</p>
          {errorCode === "AUTH_REQUIRED" && (
            <Link
              href="/login"
              className="mt-2 inline-block rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
            >
              Iniciar sesión
            </Link>
          )}
          {errorCode === "UPGRADE_REQUIRED" && (
            <button
              onClick={onUpgrade}
              disabled={upgrading}
              className="mt-2 inline-block rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:bg-slate-300"
            >
              {upgrading ? "Redirigiendo…" : "Mejorar a Pro"}
            </button>
          )}
        </div>
      )}

      {!result && !error && !loading && (
        <p className="text-sm text-slate-500">
          Registra tus ingresos y gastos y pulsa “Analizar con IA” para
          categorizar tus movimientos y recibir recomendaciones personalizadas de
          ahorro.
        </p>
      )}

      {loading && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-slate-100"
            />
          ))}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {result.resumen && (
            <p className="rounded-lg border border-brand-200 bg-brand-50 p-3 text-sm text-slate-700">
              {result.resumen}
            </p>
          )}

          {ahorroTotal > 0 && (
            <p className="text-sm text-slate-600">
              Ahorro potencial estimado:{" "}
              <span className="font-semibold text-brand-700">
                {formatoMoneda(ahorroTotal)}/mes
              </span>
            </p>
          )}

          <ul className="space-y-3">
            {result.recommendations.map((r, i) => (
              <li
                key={i}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-slate-800">{r.titulo}</p>
                  {r.ahorroMensualEstimado > 0 && (
                    <span className="whitespace-nowrap rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
                      +{formatoMoneda(r.ahorroMensualEstimado)}
                    </span>
                  )}
                </div>
                {r.detalle && (
                  <p className="mt-1 text-sm text-slate-600">{r.detalle}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
