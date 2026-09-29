import Stripe from "stripe";

/** ID del precio (Price) del plan Pro en Stripe. */
export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID || "";

export class MissingStripeConfigError extends Error {
  constructor(message = "Falta la variable de entorno STRIPE_SECRET_KEY.") {
    super(message);
    this.name = "MissingStripeConfigError";
  }
}

/**
 * Crea el cliente de Stripe bajo demanda. Lanza MissingStripeConfigError si no
 * hay clave, para reportarlo como un error controlado en los endpoints.
 */
export function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new MissingStripeConfigError();
  }
  return new Stripe(key);
}

/** Deriva la URL de origen (para success/cancel/return) desde la request. */
export function getOrigin(request: Request): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  const origin = request.headers.get("origin");
  if (origin) return origin;
  const host = request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : "http://localhost:3000";
}
