import Anthropic from "@anthropic-ai/sdk";

/**
 * Modelo de Claude usado por la herramienta.
 * Por defecto claude-sonnet-5-5 (buen balance costo/latencia para categorización
 * y recomendaciones de alto volumen). Configurable con ANTHROPIC_MODEL para subir
 * a claude-opus-5-5 cuando se requiera mayor calidad.
 */
export const MODEL_ID = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

/**
 * Crea el cliente de Anthropic. Se instancia bajo demanda (no a nivel de módulo)
 * para que la ausencia de la clave no rompa el build ni el arranque, sino que se
 * reporte como un error controlado al llamar al endpoint.
 */
export function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new MissingApiKeyError();
  }
  return new Anthropic({ apiKey });
}

export class MissingApiKeyError extends Error {
  constructor() {
    super("Falta la variable de entorno ANTHROPIC_API_KEY.");
    this.name = "MissingApiKeyError";
  }
}
