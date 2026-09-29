import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export class MissingSupabaseAdminConfigError extends Error {
  constructor() {
    super(
      "Faltan variables de Supabase para el cliente admin (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).",
    );
    this.name = "MissingSupabaseAdminConfigError";
  }
}

/**
 * Cliente de Supabase con clave service_role (omite RLS). Uso exclusivo en el
 * servidor (por ejemplo, el webhook de Stripe). Nunca exponer en el navegador.
 */
export function createSupabaseAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new MissingSupabaseAdminConfigError();
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
