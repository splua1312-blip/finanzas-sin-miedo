"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface AccountState {
  configured: boolean;
  authenticated: boolean;
  email?: string;
  plan?: "free" | "pro";
}

export default function AccountBar() {
  const [account, setAccount] = useState<AccountState | null>(null);

  useEffect(() => {
    let activo = true;
    fetch("/api/account")
      .then((r) => r.json())
      .then((data) => {
        if (activo) setAccount(data);
      })
      .catch(() => {
        if (activo) setAccount({ configured: false, authenticated: false });
      });
    return () => {
      activo = false;
    };
  }, []);

  return (
    <div className="border-b border-brand-500/30 bg-brand-800/40">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 text-sm">
        <span className="font-semibold text-white">Presupuesto Sin Miedo</span>
        <div className="flex items-center gap-3">
          {account?.authenticated ? (
            <>
              {account.plan === "pro" ? (
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold text-white">
                  Pro
                </span>
              ) : (
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-brand-50">
                  Gratis
                </span>
              )}
              <Link
                href="/cuenta"
                className="text-brand-50 hover:text-white"
                title={account.email}
              >
                Mi cuenta
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="text-brand-50 hover:text-white">
                Iniciar sesión
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-white px-3 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
