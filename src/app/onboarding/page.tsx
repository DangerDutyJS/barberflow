"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

// ── helpers ──────────────────────────────────────────────────────────────────

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// ── step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <motion.div
            animate={{
              width: i === current ? 28 : 8,
              backgroundColor: i < current ? "#d4a853" : i === current ? "#d4a853" : "#3f3f46",
            }}
            transition={{ duration: 0.3 }}
            className="h-2 rounded-full"
          />
        </div>
      ))}
    </div>
  );
}

// ── tipos ─────────────────────────────────────────────────────────────────────

interface FormData {
  nombre: string;
  slug: string;
  direccion: string;
  telefono: string;
  email: string;
}

// ── página ────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [slugTaken, setSlugTaken] = useState(false);
  const [userName, setUserName] = useState("");
  const [barberiaId, setBarberiaId] = useState("");

  const [form, setForm] = useState<FormData>({
    nombre: "",
    slug: "",
    direccion: "",
    telefono: "",
    email: "",
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/auth/login"); return; }
      const name = data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "Usuario";
      setUserName(name.split(" ")[0]);
    });
  }, []);

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "nombre") {
      setForm((prev) => ({ ...prev, nombre: value, slug: toSlug(value) }));
      setSlugTaken(false);
    }
    if (field === "slug") setSlugTaken(false);
  }

  async function checkSlug(): Promise<boolean> {
    const { data } = await supabase
      .from("barberias")
      .select("id")
      .eq("slug", form.slug)
      .maybeSingle();
    return !!data;
  }

  async function nextStep() {
    setError("");
    if (step === 0) {
      if (!form.nombre.trim()) { setError("El nombre es obligatorio."); return; }
      if (!form.slug.trim())   { setError("La URL es obligatoria."); return; }
      const taken = await checkSlug();
      if (taken) { setSlugTaken(true); setError("Esa URL ya está en uso. Elige otra."); return; }
    }
    setDirection(1);
    setStep((s) => s + 1);
  }

  function prevStep() {
    setDirection(-1);
    setStep((s) => s - 1);
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { data: barberia, error: bErr } = await supabase
        .from("barberias")
        .insert({
          owner_id:   user.id,
          nombre:     form.nombre.trim(),
          slug:       form.slug.trim(),
          direccion:  form.direccion.trim() || null,
          telefono:   form.telefono.trim() || null,
          email:      form.email.trim() || null,
        })
        .select()
        .single();

      if (bErr) throw bErr;

      // Crear trial de 7 días (upsert por si la fila ya existe)
      const fechaTrial = new Date();
      fechaTrial.setDate(fechaTrial.getDate() + 7);
      const { error: subErr } = await supabase.from("suscripciones").upsert({
        barberia_id: barberia.id,
        plan: "trial",
        estado: "activa",
        fecha_fin: fechaTrial.toISOString().split("T")[0],
      }, { onConflict: "barberia_id" });
      if (subErr) throw subErr;

      setBarberiaId(barberia.id);
      setDirection(1);
      setStep(2);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al crear la barbería";
      setError(msg.includes("duplicate") ? "Esa URL ya está en uso." : msg);
    } finally {
      setLoading(false);
    }
  }

  // ── animación entre pasos ──────────────────────────────────────────────────

  const variants = {
    enter:  (d: number) => ({ x: d > 0 ? 60  : -60,  opacity: 0 }),
    center: ()          => ({ x: 0, opacity: 1 }),
    exit:   (d: number) => ({ x: d > 0 ? -60 : 60,   opacity: 0 }),
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(212,168,83,0.07),transparent)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <span className="text-2xl">✂</span>
          <span className="text-2xl font-bold tracking-tight">
            <span className="text-white">Barber</span>
            <span className="text-gold">Flow</span>
          </span>
        </Link>

        {/* Indicador de pasos */}
        <StepIndicator current={step} total={3} />

        {/* Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            {/* ── PASO 0: Nombre y slug ── */}
            {step === 0 && (
              <motion.div
                key="step0"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="p-8"
              >
                <p className="text-sm text-gold font-semibold uppercase tracking-widest mb-2">Paso 1 de 2</p>
                <h1 className="text-2xl font-bold mb-1">
                  {userName ? `Hola, ${userName} 👋` : "Bienvenido 👋"}
                </h1>
                <p className="text-zinc-400 text-sm mb-7">
                  Vamos a configurar tu barbería en menos de 2 minutos.
                </p>

                <div className="flex flex-col gap-5">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1.5">
                      Nombre de tu barbería <span className="text-gold">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.nombre}
                      onChange={(e) => set("nombre", e.target.value)}
                      placeholder="Ej: Barbería El Rey"
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-1.5">
                      URL personalizada <span className="text-gold">*</span>
                    </label>
                    <div className={`flex rounded-xl border ${slugTaken ? "border-red-500" : "border-zinc-700 focus-within:border-gold"} bg-zinc-800 overflow-hidden transition-colors`}>
                      <span className="flex items-center px-3 text-xs text-zinc-500 border-r border-zinc-700 whitespace-nowrap">
                        /b/
                      </span>
                      <input
                        type="text"
                        value={form.slug}
                        onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                        placeholder="barberia-el-rey"
                        className="flex-1 bg-transparent px-3 py-3 text-sm text-white placeholder-zinc-600 outline-none"
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-zinc-600">
                      Tu link público: <span className="text-zinc-400">barberflow.com/b/{form.slug || "tu-barberia"}</span>
                    </p>
                  </div>
                </div>

                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {error}
                  </motion.p>
                )}

                <button
                  onClick={nextStep}
                  disabled={!form.nombre || !form.slug}
                  className="mt-6 w-full rounded-xl bg-gold py-3 text-sm font-semibold text-zinc-950 hover:bg-gold-light transition-all hover:scale-[1.02] disabled:opacity-40 disabled:scale-100"
                >
                  Continuar →
                </button>
              </motion.div>
            )}

            {/* ── PASO 1: Contacto ── */}
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="p-8"
              >
                <p className="text-sm text-gold font-semibold uppercase tracking-widest mb-2">Paso 2 de 2</p>
                <h1 className="text-2xl font-bold mb-1">Contacto y ubicación</h1>
                <p className="text-zinc-400 text-sm mb-7">
                  Todo es opcional. Puedes completarlo después desde el dashboard.
                </p>

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1.5">Dirección</label>
                    <input
                      type="text"
                      value={form.direccion}
                      onChange={(e) => set("direccion", e.target.value)}
                      placeholder="Calle 123, Ciudad"
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1.5">Teléfono</label>
                    <input
                      type="tel"
                      value={form.telefono}
                      onChange={(e) => set("telefono", e.target.value)}
                      placeholder="+1 234 567 8900"
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1.5">Email de contacto</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="contacto@mibarberia.com"
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                    />
                  </div>
                </div>

                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {error}
                  </motion.p>
                )}

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={prevStep}
                    className="flex-1 rounded-xl border border-zinc-700 py-3 text-sm font-semibold text-zinc-400 hover:border-zinc-500 hover:text-white transition-colors"
                  >
                    ← Atrás
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-[2] rounded-xl bg-gold py-3 text-sm font-semibold text-zinc-950 hover:bg-gold-light transition-all hover:scale-[1.02] disabled:opacity-50 disabled:scale-100"
                  >
                    {loading ? "Creando..." : "Crear mi barbería 🚀"}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── PASO 2: Éxito ── */}
            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="p-8 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                  className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-gold bg-gold/10"
                >
                  <span className="text-4xl">✓</span>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <h1 className="text-2xl font-bold mb-2">¡Todo listo!</h1>
                  <p className="text-zinc-400 text-sm mb-2">
                    <span className="text-gold font-semibold">{form.nombre}</span> ha sido creada exitosamente.
                  </p>
                  <p className="text-zinc-600 text-xs mb-8">
                    Tu link público: <span className="text-zinc-500">barberflow.com/b/{form.slug}</span>
                  </p>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => router.push("/dashboard")}
                      className="w-full rounded-xl bg-gold py-3 text-sm font-semibold text-zinc-950 hover:bg-gold-light transition-all hover:scale-[1.02]"
                    >
                      Ir al dashboard →
                    </button>
                    <button
                      onClick={() => router.push("/dashboard/barberos")}
                      className="w-full rounded-xl border border-zinc-700 py-3 text-sm font-semibold text-zinc-400 hover:border-zinc-500 hover:text-white transition-colors"
                    >
                      Agregar mis barberos
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
