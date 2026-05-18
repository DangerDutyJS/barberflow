import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verificarWebhook, type WompiWebhookBody, type WompiTransaction } from "@/lib/wompi";
import { fechaFinPlan } from "@/lib/subscriptions";

export async function POST(request: NextRequest) {
  const body = await request.json() as WompiWebhookBody;

  const eventsKey = process.env.WOMPI_EVENTS_KEY;
  if (!eventsKey) {
    console.error("WOMPI_EVENTS_KEY no configurado");
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  if (!verificarWebhook(body, eventsKey)) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  if (body.event !== "transaction.updated") {
    return NextResponse.json({ ok: true });
  }

  const tx = (body.data as { transaction: WompiTransaction }).transaction;

  // Solo procesar transacciones aprobadas
  if (tx.status !== "APPROVED") {
    return NextResponse.json({ ok: true });
  }

  const supabase = createServiceClient();

  // Buscar qué barbería inició este pago por la referencia guardada
  const { data: suscripcion } = await supabase
    .from("suscripciones")
    .select("barberia_id, ciclo_facturacion")
    .eq("wompi_referencia", tx.reference)
    .single();

  if (!suscripcion) {
    // Referencia no encontrada — puede ser una transacción de otra app
    return NextResponse.json({ ok: true });
  }

  const ciclo = suscripcion.ciclo_facturacion ?? "mensual";
  const dias = ciclo === "anual" ? 365 : 30;

  // Activar plan pro
  await supabase
    .from("suscripciones")
    .update({
      plan: "pro",
      estado: "activa",
      fecha_inicio: new Date().toISOString().split("T")[0],
      fecha_fin: fechaFinPlan(dias),
      wompi_transaction_id: tx.id,
    })
    .eq("barberia_id", suscripcion.barberia_id);

  // Registrar en historial de pagos
  await supabase.from("pagos").insert({
    barberia_id: suscripcion.barberia_id,
    wompi_transaction_id: tx.id,
    wompi_referencia: tx.reference,
    monto_centavos: tx.amount_in_cents,
    moneda: tx.currency,
    estado: tx.status,
    plan: "pro",
    ciclo_facturacion: ciclo,
  });

  return NextResponse.json({ ok: true });
}
