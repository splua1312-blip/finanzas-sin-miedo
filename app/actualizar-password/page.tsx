"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export default function ActualizarPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [listo, setListo] = useState(false);
  const [sesionRecuperacion, setSesionRecuperacion] = useState<boolean | null>(
    null,
  );

  // Al abrir el enlace del correo, Supabase establece una sesión de recuperación.
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setSesionRecuperacion(false);
      return;
    }
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setSesionRecuperacion(true);
      }
    });
    // Verifica si ya hay sesión (por si el evento se disparó antes de montar).
    supabase.auth.getSession().then(({ data: s }) => {
      if (s.session) setSesionRecuperacion(true);
      else setSesionRecuperacion((prev) => prev ?? false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("La autenticación no está configurada.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(traducirError(error.message));
        return;
      }
      setListo(true);
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1500);
    } catch {
      setError("Ocurrió un error. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800">Nueva contraseña</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ingresa tu nueva contraseña.
        </p>

        {sesionRecuperacion === false && (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            Abre esta página desde el enlace que te enviamos por correo. Si el
            enlace expiró,{" "}
            <Link href="/recuperar" className="font-medium underline">
              solicita uno nuevo
            </Link>
            .
          </div>
        )}

        {listo ? (
          <div className="mt-6 rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm text-brand-700">
            Contraseña actualizada. Redirigiéndote…
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Nueva contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Confirmar contraseña
              </label>
              <input
                type="password"
                required
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-sm text-rose-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:bg-slate-300"
            >
              {loading ? "Guardando…" : "Actualizar contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function traducirError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("auth session missing") || m.includes("session"))
    return "Tu sesión de recuperación expiró. Solicita un nuevo enlace.";
  if (m.includes("same password") || m.includes("should be different"))
    return "La nueva contraseña debe ser diferente a la anterior.";
  return message;
}
