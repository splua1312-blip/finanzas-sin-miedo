import type { SupabaseClient } from "@supabase/supabase-js";

/** Análisis con IA permitidos al mes en el plan gratuito. */
export const FREE_MONTHLY_AI_LIMIT = 1;

export type Plan = "free" | "pro";

/** Estados de Stripe que consideramos como acceso "Pro" activo. */
const ESTADOS_ACTIVOS = new Set(["active", "trialing"]);

export function planDesdeEstado(status: string | null | undefined): Plan {
  return status && ESTADOS_ACTIVOS.has(status) ? "pro" : "free";
}

export interface SubscriptionInfo {
  plan: Plan;
  status: string;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
}

/** Lee el perfil del usuario y deriva su plan. */
export async function getSubscription(
  supabase: SupabaseClient,
  userId: string,
): Promise<SubscriptionInfo> {
  const { data } = await supabase
    .from("profiles")
    .select("subscription_status, current_period_end, stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();

  const status = data?.subscription_status ?? "free";
  return {
    plan: planDesdeEstado(status),
    status,
    currentPeriodEnd: data?.current_period_end ?? null,
    stripeCustomerId: data?.stripe_customer_id ?? null,
  };
}

/** Cuenta los análisis con IA usados por el usuario en el mes calendario actual. */
export async function contarUsoIaMes(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", inicioMes.toISOString());

  return count ?? 0;
}
