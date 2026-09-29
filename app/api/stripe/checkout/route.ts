import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getStripeClient,
  getOrigin,
  resolvePriceId,
  type PlanPago,
  MissingStripeConfigError,
} from "@/lib/stripe";
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
      { error: "Inicia sesión para suscribirte." },
      { status: 401 },
    );
  }

  // Plan solicitado (pro mensual por defecto, o anual).
  let plan: PlanPago = "pro";
  try {
    const body = await request.json();
    if (body?.plan === "anual") plan = "anual";
  } catch {
    /* sin cuerpo: se usa el plan por defecto */
  }

  const priceId = resolvePriceId(plan);
  if (!priceId) {
    return NextResponse.json(
      {
        error:
          plan === "anual"
            ? "Falta configurar STRIPE_PRICE_ID_ANUAL."
            : "Falta configurar STRIPE_PRICE_ID.",
      },
      { status: 503 },
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

  try {
    const sub = await getSubscription(supabase, user.id);
    let customerId = sub.stripeCustomerId;

    // Crear el cliente de Stripe si aún no existe y guardarlo en el perfil.
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const origin = getOrigin(request);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${origin}/cuenta?checkout=success`,
      cancel_url: `${origin}/cuenta?checkout=cancel`,
      metadata: { supabase_user_id: user.id, plan },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error al crear la sesión de checkout:", error);
    return NextResponse.json(
      { error: "No se pudo iniciar el pago. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
