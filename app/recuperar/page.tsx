"use client";

import { useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [enviado, setEnviado] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError(
        "La autenticación no está configurada. Falta NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      );
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/actualizar-password`,
      });
      if (error) {
        setError(error.message);
        return;
      }
      setEnviado(true);
    } catch {
      setError("Ocurrió un error. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link
          href="/login"
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          ← Volver a iniciar sesión
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-800">
          Recuperar contraseña
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Te enviaremos un enlace para restablecer tu contraseña.
        </p>

        {enviado ? (
          <div className="mt-6 rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm text-brand-700">
            Si existe una cuenta con ese correo, recibirás un enlace para
            restablecer tu contraseña. Revisa tu bandeja de entrada (y la carpeta
            de spam).
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                placeholder="tu@correo.com"
              />
            </div>

            {error && <p className="text-sm text-rose-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:bg-slate-300"
            >
              {loading ? "Enviando…" : "Enviar enlace"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
