import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStripeClient, getOrigin, MissingStripeConfigError } from "@/lib/stripe";
import { getSubscription } from "@/lib/subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "La autenticación no está configurada." },
      { status: 503 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Inicia sesión para gestionar tu suscripción." },
      { status: 401 },
    );
  }

  let stripe;
  try {
    stripe = getStripeClient();
  } catch (error) {
    if (error instanceof MissingStripeConfigError) {
      return NextResponse.json(
        { error: "Los pagos no están configurados." },
        { status: 503 },
      );
    }
    throw error;
  }

  const sub = await getSubscription(supabase, user.id);
  if (!sub.stripeCustomerId) {
    return NextResponse.json(
      { error: "No tienes una suscripción asociada." },
      { status: 400 },
    );
  }

  try {
    const origin = getOrigin(request);
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${origin}/cuenta`,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error al abrir el portal de facturación:", error);
    return NextResponse.json(
      { error: "No se pudo abrir el portal. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
