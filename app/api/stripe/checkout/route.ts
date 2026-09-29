import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getStripeClient,
  getOrigin,
  STRIPE_PRICE_ID,
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

  if (!STRIPE_PRICE_ID) {
    return NextResponse.json(
      { error: "Falta configurar STRIPE_PRICE_ID." },
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
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${origin}/cuenta?checkout=success`,
      cancel_url: `${origin}/cuenta?checkout=cancel`,
      metadata: { supabase_user_id: user.id },
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
