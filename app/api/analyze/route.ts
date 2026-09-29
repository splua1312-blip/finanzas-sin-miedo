import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient, MODEL_ID, MissingApiKeyError } from "@/lib/anthropic";
import type {
  AnalysisResult,
  FinancialContext,
  Transaction,
} from "@/lib/types";

// Se ejecuta en el runtime Node (el SDK de Anthropic lo requiere).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AnalyzeRequestBody {
  transactions: Transaction[];
  context: FinancialContext;
}

const CATEGORIAS_VALIDAS = [
  "vivienda",
  "alimentacion",
  "transporte",
  "servicios",
  "salud",
  "educacion",
  "deudas",
  "entretenimiento",
  "compras",
  "suscripciones",
  "ahorro_inversion",
  "otros",
] as const;

const BUCKETS_VALIDOS = ["necesidades", "deseos", "ahorro"] as const;

const SYSTEM_PROMPT = `Eres un asesor financiero especializado en presupuesto personal para el público hispanohablante.
Tu trabajo tiene dos partes:

1) CATEGORIZAR cada gasto en:
   - "category": una de [${CATEGORIAS_VALIDAS.join(", ")}].
   - "bucket": la metodología 50/30/20, una de [${BUCKETS_VALIDOS.join(", ")}]:
       * "necesidades": gastos indispensables (vivienda, alimentación básica, servicios, transporte esencial, salud, pago mínimo de deudas).
       * "deseos": gastos de estilo de vida (entretenimiento, restaurantes, compras no esenciales, suscripciones de ocio).
       * "ahorro": aportaciones a ahorro o inversión, y abonos extra a deuda.

2) GENERAR de 3 a 5 recomendaciones de ahorro concretas, personalizadas y accionables,
   basadas en los patrones de gasto y en la regla 50/30/20. Cada recomendación debe incluir
   un ahorro mensual estimado en la moneda local (número entero o con decimales, sin símbolo).

Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional ni formato Markdown,
con esta estructura exacta:
{
  "categorized": [{ "id": "<id del gasto>", "category": "<categoria>", "bucket": "<bucket>" }],
  "recommendations": [{ "titulo": "<texto>", "detalle": "<texto>", "ahorroMensualEstimado": <numero> }],
  "resumen": "<2-3 frases con el diagnóstico general en tono formal>"
}
Mantén un tono formal y profesional. No incluyas ningún gasto que no esté en la lista.`;

/** Extrae el primer objeto JSON del texto, tolerando texto o cercas accidentales. */
function extraerJson(texto: string): string {
  const inicio = texto.indexOf("{");
  const fin = texto.lastIndexOf("}");
  if (inicio === -1 || fin === -1 || fin < inicio) {
    throw new Error("La respuesta de la IA no contiene JSON.");
  }
  return texto.slice(inicio, fin + 1);
}

function esCategoria(v: unknown): v is (typeof CATEGORIAS_VALIDAS)[number] {
  return typeof v === "string" && (CATEGORIAS_VALIDAS as readonly string[]).includes(v);
}

function esBucket(v: unknown): v is (typeof BUCKETS_VALIDOS)[number] {
  return typeof v === "string" && (BUCKETS_VALIDOS as readonly string[]).includes(v);
}

/** Valida y normaliza la respuesta cruda de la IA contra los tipos esperados. */
function normalizar(raw: any, transactions: Transaction[]): AnalysisResult {
  const idsValidos = new Set(transactions.map((t) => t.id));

  const categorized = Array.isArray(raw?.categorized)
    ? raw.categorized
        .filter(
          (c: any) =>
            c &&
            idsValidos.has(c.id) &&
            esCategoria(c.category) &&
            esBucket(c.bucket),
        )
        .map((c: any) => ({ id: c.id, category: c.category, bucket: c.bucket }))
    : [];

  const recommendations = Array.isArray(raw?.recommendations)
    ? raw.recommendations
        .filter((r: any) => r && typeof r.titulo === "string")
        .map((r: any) => ({
          titulo: String(r.titulo),
          detalle: String(r.detalle ?? ""),
          ahorroMensualEstimado: Number(r.ahorroMensualEstimado) || 0,
        }))
    : [];

  return {
    categorized,
    recommendations,
    resumen: typeof raw?.resumen === "string" ? raw.resumen : "",
  };
}

export async function POST(request: Request) {
  let body: AnalyzeRequestBody;
  try {
    body = (await request.json()) as AnalyzeRequestBody;
  } catch {
    return NextResponse.json({ error: "Cuerpo de solicitud inválido." }, { status: 400 });
  }

  const transactions = Array.isArray(body?.transactions) ? body.transactions : [];
  const gastos = transactions.filter((t) => t.type === "gasto");

  if (gastos.length === 0) {
    return NextResponse.json(
      { error: "Agrega al menos un gasto para analizar." },
      { status: 400 },
    );
  }

  const context = body?.context ?? { liquidSavings: 0, monthlyDebtPayments: 0 };
  const ingresoTotal = transactions
    .filter((t) => t.type === "ingreso")
    .reduce((acc, t) => acc + t.amount, 0);

  const userContent = JSON.stringify(
    {
      ingresoMensualTotal: ingresoTotal,
      ahorrosLiquidos: context.liquidSavings,
      pagoMensualDeudas: context.monthlyDebtPayments,
      gastos: gastos.map((t) => ({
        id: t.id,
        descripcion: t.description,
        monto: t.amount,
      })),
    },
    null,
    2,
  );

  let client: Anthropic;
  try {
    client = getAnthropicClient();
  } catch (error) {
    if (error instanceof MissingApiKeyError) {
      return NextResponse.json(
        {
          error:
            "La IA no está configurada: falta ANTHROPIC_API_KEY. Consulta el README para activarla.",
          code: "MISSING_API_KEY",
        },
        { status: 503 },
      );
    }
    throw error;
  }

  try {
    const response = await client.messages.create({
      model: MODEL_ID,
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
      // Afinable: en un SDK más reciente puede añadirse
      // `output_config: { effort: "low" }` para reducir costo/latencia en esta
      // tarea de categorización. Se omite aquí para máxima compatibilidad.
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json(
        { error: "La IA no pudo procesar esta solicitud." },
        { status: 422 },
      );
    }

    const texto = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    const parsed = JSON.parse(extraerJson(texto));
    const result = normalizar(parsed, transactions);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: "Clave de API inválida.", code: "INVALID_API_KEY" },
        { status: 401 },
      );
    }
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "Límite de uso alcanzado. Intenta de nuevo en unos momentos." },
        { status: 429 },
      );
    }
    console.error("Error al analizar con la IA:", error);
    return NextResponse.json(
      { error: "No se pudo completar el análisis. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
