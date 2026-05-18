"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { PLANES_WOMPI, type PlanKey } from "@/lib/wompi";

type Estado = "verificando" | "confirmado" | "pendiente";

function UpgradeSuccessContent() {
  const router = useRouter();
  const params = useSearchParams();
  const planKey = params.get("plan") as PlanKey | null;
  const ref = params.get("ref");
  const plan = planKey ? PLANES_WOMPI[planKey] : null;

  const [estado, setEstado] = useState<Estado>("verificando");

  useEffect(() => {
    if (!ref) { router.push("/dashboard/upgrade"); return; }

    // Polling: el webhook puede llegar en 2-5 segundos
    let intentos = 0;
    const MAX = 10;

    const intervalo = setInterval(async () => {
      intentos++;
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: barberia } = await supabase
        .from("barberias")
        .select("id")
        .eq("owner_id", user.id)
        .single();
      if (!barberia) return;

      const { data: sub } = await supabase
        .from("suscripciones")
        .select("plan, wompi_transaction_id")
        .eq("barberia_id", barberia.id)
        .single();

      if (sub?.plan === "pro" && sub.wompi_transaction_id) {
        setEstado("confirmado");
        clearInterval(intervalo);
        return;
      }

      if (intentos >= MAX) {
        setEstado("pendiente");
        clearInterval(intervalo);
      }
    }, 2000);

    return () => clearInterval(intervalo);
  }, [ref]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(212,168,83,0.07),transparent)] pointer-events-none" />

      <Link href="/" className="flex items-center gap-2 mb-10">
        <span className="text-2xl">✂</span>
        <span className="text-2xl font-bold">
          <span className="text-white">Barber</span>
          <span className="text-gold">Flow</span>
        </span>
      </Link>

      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
        {estado === "verificando" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="mx-auto mb-6 h-16 w-16 rounded-full border-2 border-zinc-700 border-t-gold animate-spin" />
            <h1 className="text-xl font-bold mb-2">Confirmando pago...</h1>
            <p className="text-zinc-400 text-sm">Esto puede tomar unos segundos.</p>
          </motion.div>
        )}

        {estado === "confirmado" && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-gold bg-gold/10"
            >
              <span className="text-4xl">✓</span>
            </motion.div>
            <h1 className="text-2xl font-bold mb-2">¡Plan activado!</h1>
            <p className="text-zinc-400 text-sm mb-1">
              {plan
                ? `Suscripción ${plan.label} activa.`
                : "Tu plan Pro está activo."}
            </p>
            <p className="text-zinc-600 text-xs mb-8">
              Recibirás un correo de confirmación a tu email registrado.
            </p>
            <Link
              href="/dashboard"
              className="block w-full rounded-xl bg-gold py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-all hover:scale-[1.02]"
            >
              Ir al dashboard →
            </Link>
          </motion.div>
        )}

        {estado === "pendiente" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-zinc-600 bg-zinc-800">
              <span className="text-4xl">⏳</span>
            </div>
            <h1 className="text-xl font-bold mb-2">Pago en procesamiento</h1>
            <p className="text-zinc-400 text-sm mb-6">
              Tu pago fue recibido. La activación puede demorar unos minutos.
              Refresca el dashboard para verificar.
            </p>
            <Link
              href="/dashboard"
              className="block w-full rounded-xl bg-zinc-800 py-3 text-sm font-semibold text-white hover:bg-zinc-700 transition-colors"
            >
              Ir al dashboard
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function UpgradeSuccessPage() {
  return (
    <Suspense>
      <UpgradeSuccessContent />
    </Suspense>
  );
}
