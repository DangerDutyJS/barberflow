"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { getEstadoSuscripcion } from "@/lib/subscriptions";
import { PLANES_WOMPI, type PlanKey } from "@/lib/wompi";
import type { Suscripcion } from "@/types/database";

interface PlanCardProps {
  planKey: PlanKey;
  suscripcion: Suscripcion | null;
  onSelect: (key: PlanKey) => void;
  loading: boolean;
  selectedKey: PlanKey | null;
}

function PlanCard({ planKey, suscripcion, onSelect, loading, selectedKey }: PlanCardProps) {
  const plan = PLANES_WOMPI[planKey];
  const estado = getEstadoSuscripcion(suscripcion);
  const esPlanActual = suscripcion?.plan === "pro" && estado.activa &&
    suscripcion.ciclo_facturacion === plan.ciclo;
  const isAnual = planKey === "pro_anual";
  const isLoading = loading && selectedKey === planKey;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: isAnual ? 0.15 : 0 }}
      className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
        isAnual
          ? "border-gold bg-gradient-to-b from-gold/10 to-zinc-900 shadow-lg shadow-gold/10"
          : "border-zinc-800 bg-zinc-900"
      }`}
    >
      {isAnual && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-gold px-3 py-0.5 text-xs font-bold text-zinc-950">
            AHORRA 20%
          </span>
        </div>
      )}

      <div className="mb-4">
        <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${isAnual ? "text-gold" : "text-zinc-500"}`}>
          {isAnual ? "Mejor valor" : "Flexible"}
        </p>
        <h3 className="text-lg font-bold">{plan.label}</h3>
      </div>

      <div className="mb-6">
        <span className="text-3xl font-extrabold">
          ${plan.precioCOP.toLocaleString("es-CO")}
        </span>
        <span className="text-zinc-500 text-sm ml-1">
          COP / {plan.ciclo === "anual" ? "año" : "mes"}
        </span>
        {isAnual && (
          <p className="mt-1 text-xs text-zinc-500">
            Equivale a ${Math.round(plan.precioCOP / 12).toLocaleString("es-CO")} COP/mes
          </p>
        )}
      </div>

      <ul className="flex flex-col gap-2.5 mb-8 text-sm text-zinc-300">
        {[
          "Barberos ilimitados",
          "Citas ilimitadas",
          "Página pública de agendamiento",
          "Estadísticas y reportes",
          "Soporte prioritario",
        ].map((feat) => (
          <li key={feat} className="flex items-center gap-2">
            <span className="text-gold text-xs">✓</span>
            {feat}
          </li>
        ))}
      </ul>

      <button
        onClick={() => !esPlanActual && onSelect(planKey)}
        disabled={loading || esPlanActual}
        className={`mt-auto w-full rounded-xl py-3 text-sm font-semibold transition-all ${
          esPlanActual
            ? "bg-zinc-700 text-zinc-500 cursor-default"
            : isAnual
            ? "bg-gold text-zinc-950 hover:bg-amber-400 hover:scale-[1.02] disabled:opacity-50"
            : "border border-zinc-700 text-white hover:border-gold hover:text-gold disabled:opacity-50"
        }`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 rounded-full border-2 border-zinc-950/30 border-t-zinc-950 animate-spin" />
            Procesando...
          </span>
        ) : esPlanActual ? (
          "Plan actual"
        ) : (
          `Suscribirse ${plan.ciclo === "anual" ? "anualmente" : "mensualmente"}`
        )}
      </button>
    </motion.div>
  );
}

export default function UpgradePage() {
  const router = useRouter();
  const supabase = createClient();

  const [suscripcion, setSuscripcion] = useState<Suscripcion | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedKey, setSelectedKey] = useState<PlanKey | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const { data: barberia } = await supabase
        .from("barberias")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (!barberia) { router.push("/onboarding"); return; }

      const { data: sub } = await supabase
        .from("suscripciones")
        .select("*")
        .eq("barberia_id", barberia.id)
        .single();

      setSuscripcion(sub);
      setLoadingData(false);
    }
    cargar();
  }, []);

  async function handleSelect(planKey: PlanKey) {
    setError("");
    setLoading(true);
    setSelectedKey(planKey);

    try {
      const res = await fetch("/api/checkout/wompi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey }),
      });

      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || "No se pudo iniciar el pago");
      }

      window.location.href = data.checkoutUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al procesar. Intenta de nuevo.");
      setLoading(false);
      setSelectedKey(null);
    }
  }

  const estado = getEstadoSuscripcion(suscripcion);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_-10%,rgba(212,168,83,0.08),transparent)] pointer-events-none" />

      <header className="border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-5xl px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">✂</span>
            <span className="text-lg font-bold">
              <span className="text-white">Barber</span>
              <span className="text-gold">Flow</span>
            </span>
          </Link>
          <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white transition-colors">
            ← Volver al dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-16">
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl font-extrabold mb-3"
          >
            Elige tu plan
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-zinc-400 max-w-md mx-auto"
          >
            {estado.esTrial && estado.diasRestantes !== null && estado.diasRestantes > 0
              ? `Tu trial vence en ${estado.diasRestantes} día${estado.diasRestantes !== 1 ? "s" : ""}. Activa tu plan para no perder el acceso.`
              : estado.expirada && !estado.esPro
              ? "Tu período de prueba ha terminado. Activa un plan para continuar."
              : "Gestiona tu barbería sin límites."}
          </motion.p>
        </div>

        {loadingData ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 rounded-full border-2 border-zinc-700 border-t-gold animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <PlanCard
              planKey="pro_mensual"
              suscripcion={suscripcion}
              onSelect={handleSelect}
              loading={loading}
              selectedKey={selectedKey}
            />
            <PlanCard
              planKey="pro_anual"
              suscripcion={suscripcion}
              onSelect={handleSelect}
              loading={loading}
              selectedKey={selectedKey}
            />
          </div>
        )}

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 text-center rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 max-w-2xl mx-auto"
          >
            {error}
          </motion.p>
        )}

        <p className="mt-8 text-center text-xs text-zinc-600">
          Pagos seguros procesados por{" "}
          <span className="text-zinc-500 font-medium">Wompi (Bancolombia)</span>
          {" "}· Acepta PSE, Nequi, tarjetas débito/crédito y Efecty
        </p>
      </main>
    </div>
  );
}
