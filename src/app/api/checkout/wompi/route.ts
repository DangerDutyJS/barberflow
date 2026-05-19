import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { construirUrlCheckout, PLANES_WOMPI, type PlanKey } from "@/lib/wompi";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json() as { planKey: PlanKey };
  const plan = PLANES_WOMPI[body.planKey];
  if (!plan) return NextResponse.json({ error: "Plan inválido" }, { status: 400 });

  const { data: barberia } = await supabase
    .from("barberias")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!barberia) return NextResponse.json({ error: "Barbería no encontrada" }, { status: 404 });

  // Referencia única: bf_<8 chars barberia>_<8 chars random>
  const reference = `bf_${barberia.id.replace(/-/g, "").slice(0, 8)}_${randomUUID().replace(/-/g, "").slice(0, 8)}`;

  // Guardar referencia y ciclo antes de redirigir (el webhook los usa al confirmar)
  const { error: updateErr } = await supabase
    .from("suscripciones")
    .update({
      wompi_referencia: reference,
      ciclo_facturacion: plan.ciclo,
    })
    .eq("barberia_id", barberia.id);

  if (updateErr) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUrl = `${appUrl}/dashboard/upgrade/success?ref=${reference}&plan=${body.planKey}`;
  const checkoutUrl = construirUrlCheckout({
    reference,
    amountCents: plan.centavos,
    redirectUrl,
  });

  console.log("[wompi-checkout]", { appUrl, redirectUrl, checkoutUrl });

  return NextResponse.json({ checkoutUrl, _debug: { appUrl, redirectUrl } });
}
