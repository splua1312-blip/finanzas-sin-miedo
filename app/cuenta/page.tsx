"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { openBillingPortal, startCheckout } from "@/lib/billing";

export const dynamic = "force-dynamic";

interface AccountData {
  configured: boolean;
  authenticated: boolean;
  email?: string;
  plan?: "free" | "pro";
  status?: string;
  currentPeriodEnd?: string | null;
  hasStripeCustomer?: boolean;
  aiUsage?: { used: number; limit: number; unlimited: boolean };
}

export default function CuentaPage() {
  const router = useRouter();
  const [data, setData] = useState<AccountData | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/account")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ configured: false, authenticated: false }));
  }, []);

  async function onCheckout() {
    setBusy(true);
    setError("");
    const err = await startCheckout();
    if (err) {
      setError(err);
      setBusy(false);
    }
  }

  async function onPortal() {
    setBusy(true);
    setError("");
    const err = await openBillingPortal();
    if (err) {
      setError(err);
      setBusy(false);
    }
  }

  async function onSignOut() {
    const supabase = createSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-slate-400">
        Cargando…
      </div>
    );
  }

  if (!data.authenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-slate-600">Necesitas iniciar sesión.</p>
        <Link
          href="/login"
          className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  const esPro = data.plan === "pro";

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Link
        href="/"
        className="text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        ← Volver a la app
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-slate-800">Mi cuenta</h1>
      <p className="mt-1 text-sm text-slate-500">{data.email}</p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Plan actual</p>
            <p className="text-xl font-bold text-slate-800">
              {esPro ? "Pro" : "Gratis"}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              esPro
                ? "bg-brand-100 text-brand-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {esPro ? "Activo" : "Sin suscripción"}
          </span>
        </div>

        {data.aiUsage && !data.aiUsage.unlimited && (
          <p className="mt-4 text-sm text-slate-600">
            Análisis con IA este mes: {data.aiUsage.used} / {data.aiUsage.limit}
          </p>
        )}
        {data.aiUsage?.unlimited && (
          <p className="mt-4 text-sm text-slate-600">
            Análisis con IA: ilimitados
          </p>
        )}

        {data.currentPeriodEnd && esPro && (
          <p className="mt-1 text-xs text-slate-400">
            Renovación:{" "}
            {new Date(data.currentPeriodEnd).toLocaleDateString("es-MX")}
          </p>
        )}

        {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

        <div className="mt-6 flex flex-wrap gap-3">
          {esPro ? (
            <button
              onClick={onPortal}
              disabled={busy}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:bg-slate-300"
            >
              {busy ? "Abriendo…" : "Gestionar suscripción"}
            </button>
          ) : (
            <button
              onClick={onCheckout}
              disabled={busy}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:bg-slate-300"
            >
              {busy ? "Redirigiendo…" : "Mejorar a Pro"}
            </button>
          )}
          <button
            onClick={onSignOut}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
