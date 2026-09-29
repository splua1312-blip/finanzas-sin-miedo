"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase para el navegador. Devuelve null si faltan las variables
 * de entorno públicas, para que la UI pueda degradar con gracia en lugar de romper.
 * Llamar bajo demanda (en manejadores de eventos o efectos), nunca en el render.
 */
export function createSupabaseBrowserClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}
