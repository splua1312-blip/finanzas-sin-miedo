import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  contarUsoIaMes,
  FREE_MONTHLY_AI_LIMIT,
  getSubscription,
} from "@/lib/subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createSupabaseServerClient();

  // Sin Supabase configurado: modo abierto (sin auth ni paywall).
  if (!supabase) {
    return NextResponse.json({
      configured: false,
      authenticated: false,
      plan: "free",
    });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({
      configured: true,
      authenticated: false,
      plan: "free",
    });
  }

  const sub = await getSubscription(supabase, user.id);
  const usados = sub.plan === "pro" ? 0 : await contarUsoIaMes(supabase, user.id);

  return NextResponse.json({
    configured: true,
    authenticated: true,
    email: user.email,
    plan: sub.plan,
    status: sub.status,
    currentPeriodEnd: sub.currentPeriodEnd,
    hasStripeCustomer: Boolean(sub.stripeCustomerId),
    aiUsage: {
      used: usados,
      limit: FREE_MONTHLY_AI_LIMIT,
      unlimited: sub.plan === "pro",
    },
  });
}
