import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripeClient, MissingStripeConfigError } from "@/lib/stripe";
import {
  createSupabaseAdminClient,
  MissingSupabaseAdminConfigError,
} from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Extrae el fin del periodo actual (unix s) de una suscripción, con respaldo. */
function periodEnd(sub: Stripe.Subscription): string | null {
  // La ubicación de current_period_end varía entre versiones de la API de
  // Stripe (a nivel de suscripción o de item); se leen ambas de forma segura.
  const anySub = sub as unknown as {
    current_period_end?: number;
    items?: { data?: Array<{ current_period_end?: number }> };
  };
  const raw =
    anySub.current_period_end ?? anySub.items?.data?.[0]?.current_period_end;
  return raw ? new Date(raw * 1000).toISOString() : null;
}

async function actualizarPorCliente(
  customerId: string,
  status: string,
  currentPeriodEnd: string | null,
) {
  const admin = createSupabaseAdminClient();
  await admin
    .from("profiles")
    .update({
      subscription_status: status,
      current_period_end: currentPeriodEnd,
    })
    .eq("stripe_customer_id", customerId);
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Webhook no configurado (falta STRIPE_WEBHOOK_SECRET)." },
      { status: 503 },
    );
  }

  let stripe;
  try {
    stripe = getStripeClient();
  } catch (error) {
    if (error instanceof MissingStripeConfigError) {
      return NextResponse.json(
        { error: "Pagos no configurados." },
        { status: 503 },
      );
    }
    throw error;
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Firma de webhook inválida:", error);
    return NextResponse.json({ error: "Firma inválida." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;
        if (customerId && session.subscription) {
          const subId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await actualizarPorCliente(customerId, sub.status, periodEnd(sub));
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        await actualizarPorCliente(customerId, sub.status, periodEnd(sub));
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        await actualizarPorCliente(customerId, "canceled", periodEnd(sub));
        break;
      }
      default:
        // Otros eventos: ignorados.
        break;
    }
  } catch (error) {
    if (error instanceof MissingSupabaseAdminConfigError) {
      console.error("Supabase admin no configurado para el webhook.");
      return NextResponse.json(
        { error: "Base de datos no configurada." },
        { status: 503 },
      );
    }
    console.error("Error al procesar el webhook:", error);
    return NextResponse.json(
      { error: "Error al procesar el evento." },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
