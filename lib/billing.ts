// Helpers de cliente para iniciar el checkout y el portal de facturación.

async function postAndRedirect(endpoint: string): Promise<string | null> {
  const res = await fetch(endpoint, { method: "POST" });
  const data = await res.json().catch(() => ({}));
  if (res.ok && data?.url) {
    window.location.href = data.url as string;
    return null;
  }
  return (data?.error as string) ?? "No se pudo continuar. Intenta de nuevo.";
}

/** Inicia el checkout de suscripción. Devuelve un mensaje de error o null si redirige. */
export function startCheckout(): Promise<string | null> {
  return postAndRedirect("/api/stripe/checkout");
}

/** Abre el portal de facturación de Stripe. Devuelve un mensaje de error o null. */
export function openBillingPortal(): Promise<string | null> {
  return postAndRedirect("/api/stripe/portal");
}
