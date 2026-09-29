import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { FinancialContext, Transaction } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATEGORIAS = new Set([
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
]);
const BUCKETS = new Set(["necesidades", "deseos", "ahorro"]);
const MAX_TRANSACCIONES = 500;

/** Sanitiza y valida un movimiento entrante. Devuelve null si es inválido. */
function limpiarTransaccion(t: any): Transaction | null {
  if (!t || typeof t !== "object") return null;
  const description = typeof t.description === "string" ? t.description.trim() : "";
  const amount = Number(t.amount);
  const type = t.type;
  if (!description) return null;
  if (!Number.isFinite(amount) || amount <= 0) return null;
  if (type !== "ingreso" && type !== "gasto") return null;

  const tx: Transaction = {
    id: typeof t.id === "string" && t.id ? t.id : `t-${Math.random().toString(36).slice(2, 10)}`,
    description: description.slice(0, 200),
    amount,
    type,
  };
  if (typeof t.category === "string" && CATEGORIAS.has(t.category)) {
    tx.category = t.category;
  }
  if (typeof t.bucket === "string" && BUCKETS.has(t.bucket)) {
    tx.bucket = t.bucket as Transaction["bucket"];
  }
  return tx;
}

export async function GET() {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ configured: false, transactions: [], context: null });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ authenticated: false, transactions: [], context: null });
  }

  const [{ data: rows }, { data: profile }] = await Promise.all([
    supabase
      .from("transactions")
      .select("client_id, description, amount, type, category, bucket")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("profiles")
      .select("liquid_savings, monthly_debt_payments")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const transactions: Transaction[] = (rows ?? []).map((r: any) => ({
    id: r.client_id,
    description: r.description,
    amount: Number(r.amount),
    type: r.type,
    category: r.category ?? undefined,
    bucket: r.bucket ?? undefined,
  }));

  const context: FinancialContext = {
    liquidSavings: Number(profile?.liquid_savings ?? 0),
    monthlyDebtPayments: Number(profile?.monthly_debt_payments ?? 0),
  };

  return NextResponse.json({ authenticated: true, transactions, context });
}

export async function PUT(request: Request) {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "La sincronización no está configurada." },
      { status: 503 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  let body: { transactions?: unknown; context?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const entrantes = Array.isArray(body.transactions) ? body.transactions : [];
  if (entrantes.length > MAX_TRANSACCIONES) {
    return NextResponse.json(
      { error: `Máximo ${MAX_TRANSACCIONES} movimientos.` },
      { status: 400 },
    );
  }

  const limpias = entrantes
    .map(limpiarTransaccion)
    .filter((t): t is Transaction => t !== null);

  const ctx = (body.context ?? {}) as Partial<FinancialContext>;
  const liquidSavings = Number(ctx.liquidSavings) || 0;
  const monthlyDebtPayments = Number(ctx.monthlyDebtPayments) || 0;

  try {
    // Reemplazo completo del conjunto de movimientos del usuario.
    const { error: delError } = await supabase
      .from("transactions")
      .delete()
      .eq("user_id", user.id);
    if (delError) throw delError;

    if (limpias.length > 0) {
      const filas = limpias.map((t) => ({
        user_id: user.id,
        client_id: t.id,
        description: t.description,
        amount: t.amount,
        type: t.type,
        category: t.category ?? null,
        bucket: t.bucket ?? null,
      }));
      const { error: insError } = await supabase.from("transactions").insert(filas);
      if (insError) throw insError;
    }

    await supabase
      .from("profiles")
      .update({
        liquid_savings: liquidSavings,
        monthly_debt_payments: monthlyDebtPayments,
      })
      .eq("id", user.id);

    return NextResponse.json({ ok: true, count: limpias.length });
  } catch (error) {
    console.error("Error al guardar movimientos:", error);
    return NextResponse.json(
      { error: "No se pudieron guardar los movimientos." },
      { status: 500 },
    );
  }
}
