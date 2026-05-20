"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import SignOutButton from "@/components/SignOutButton";
import type { Barbero, Servicio } from "@/types/database";
import {
  Scissors, Calendar, Clock, User, Phone, Mail,
  FileText, ChevronLeft, ChevronRight, Check, AlertCircle,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrecio(p: number) {
  return `$${p.toLocaleString("es-CO")}`;
}

function formatDuracion(m: number) {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r === 0 ? `${h}h` : `${h}h ${r}min`;
}

function timeToMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function addMinutes(time: string, minutes: number): string {
  const total = timeToMin(time) + minutes;
  return `${Math.floor(total / 60).toString().padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`;
}

function slotOcupado(
  hora: string,
  duracion: number,
  citas: { hora_inicio: string; hora_fin: string }[]
): boolean {
  const ini = timeToMin(hora);
  const fin = ini + duracion;
  return citas.some((c) => {
    const ci = timeToMin(c.hora_inicio);
    const cf = timeToMin(c.hora_fin);
    return !(fin <= ci || ini >= cf);
  });
}

const TODOS_SLOTS: string[] = (() => {
  const list: string[] = [];
  for (let t = 8 * 60; t < 20 * 60; t += 30) {
    list.push(
      `${Math.floor(t / 60).toString().padStart(2, "0")}:${(t % 60).toString().padStart(2, "0")}`
    );
  }
  return list;
})();

// ── Step indicator ─────────────────────────────────────────────────────────────

const STEP_LABELS = ["Servicio", "Barbero", "Fecha & Hora", "Cliente"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center mb-8">
      {STEP_LABELS.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className={`flex items-center gap-2 ${i <= current ? "opacity-100" : "opacity-40"}`}>
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < current
                  ? "bg-gold text-zinc-950"
                  : i === current
                  ? "bg-gold text-zinc-950 ring-2 ring-gold/30"
                  : "bg-chip border border-line-2 text-ink-3"
              }`}
            >
              {i < current ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span
              className={`text-xs font-medium hidden sm:block ${
                i === current ? "text-gold" : "text-ink-3"
              }`}
            >
              {label}
            </span>
          </div>
          {i < STEP_LABELS.length - 1 && (
            <div className={`h-px w-6 sm:w-8 mx-2 ${i < current ? "bg-gold" : "bg-line-2"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type BarberoOpcional = Barbero | "sin_asignar";

export default function NuevaCitaPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [barberia, setBarberia] = useState<{ id: string; nombre: string } | null>(null);
  const [userName, setUserName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Wizard state
  const [step, setStep] = useState(0);
  const [servicio, setServicio] = useState<Servicio | null>(null);
  const [barbero, setBarbero] = useState<BarberoOpcional | null>(null);
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");
  const [notas, setNotas] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Availability
  const [citasExistentes, setCitasExistentes] = useState<{ hora_inicio: string; hora_fin: string }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      setUserName(user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuario");
      setAvatarUrl(user.user_metadata?.avatar_url ?? null);

      const { data: bar } = await supabase
        .from("barberias")
        .select("id, nombre")
        .eq("owner_id", user.id)
        .single();
      if (!bar) { router.push("/onboarding"); return; }
      setBarberia(bar);

      const [{ data: barbs }, { data: servs }] = await Promise.all([
        supabase.from("barberos").select("*").eq("barberia_id", bar.id).eq("activo", true).order("nombre"),
        supabase.from("servicios").select("*").eq("barberia_id", bar.id).eq("activo", true).order("nombre"),
      ]);
      setBarberos(barbs ?? []);
      setServicios(servs ?? []);
      setLoadingData(false);
    }
    cargar();
  }, [supabase]);

  // Load existing appointments when barbero + fecha changes (step 2)
  useEffect(() => {
    if (!barberia || !fecha || !barbero || barbero === "sin_asignar") {
      setCitasExistentes([]);
      return;
    }
    setLoadingSlots(true);
    supabase
      .from("citas")
      .select("hora_inicio, hora_fin")
      .eq("barberia_id", barberia.id)
      .eq("barbero_id", (barbero as Barbero).id)
      .eq("fecha", fecha)
      .neq("estado", "cancelada")
      .then(({ data }) => {
        setCitasExistentes(data ?? []);
        setLoadingSlots(false);
      });
  }, [supabase, barbero, fecha, barberia]);

  const today = new Date().toISOString().split("T")[0];

  const slotsValidos = useMemo(() => {
    if (!servicio) return TODOS_SLOTS;
    return TODOS_SLOTS.filter(
      (s) => timeToMin(addMinutes(s, servicio.duracion_minutos)) <= 20 * 60
    );
  }, [servicio]);

  async function handleSubmit() {
    if (!barberia || !servicio || !fecha || !hora) return;
    if (!clienteNombre.trim()) { setError("El nombre del cliente es obligatorio."); return; }
    setError("");
    setSaving(true);

    const horaFin = addMinutes(hora, servicio.duracion_minutos);
    const barberoId = barbero === "sin_asignar" ? null : (barbero as Barbero).id;

    const { error: err } = await supabase.from("citas").insert({
      barberia_id: barberia.id,
      barbero_id: barberoId,
      servicio_id: servicio.id,
      cliente_nombre: clienteNombre.trim(),
      cliente_telefono: clienteTelefono.trim() || null,
      cliente_email: clienteEmail.trim() || null,
      fecha,
      hora_inicio: hora,
      hora_fin: horaFin,
      estado: "pendiente",
      notas: notas.trim() || null,
      precio_final: Number(servicio.precio),
    });

    setSaving(false);
    if (err) { setError(`Error: ${err.message}`); return; }
    router.push("/dashboard");
  }

  if (loadingData) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-line-2 border-t-gold animate-spin" />
      </div>
    );
  }

  const canNext = [
    servicio !== null,
    barbero !== null,
    fecha !== "" && hora !== "",
    clienteNombre.trim() !== "",
  ];

  return (
    <div className="min-h-screen bg-base text-ink">
      {/* Header */}
      <header className="border-b border-line bg-card/60 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Scissors className="w-5 h-5 text-gold" />
              <span className="text-lg font-bold tracking-tight">
                <span className="text-ink">Barber</span>
                <span className="text-gold">Flow</span>
              </span>
            </Link>
            {barberia && (
              <>
                <span className="hidden sm:block text-line-2">|</span>
                <span className="hidden sm:block text-sm text-ink-2">{barberia.nombre}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <img src={avatarUrl} alt={userName} className="w-8 h-8 rounded-full border border-line-2" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-gold text-sm font-bold">
                  {userName[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-sm text-ink-2 hidden sm:block">{userName}</span>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-ink-3 mb-1">
          <Link href="/dashboard" className="hover:text-ink-2 transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-ink-2">Nueva cita</span>
        </div>
        <h1 className="text-2xl font-bold mb-6">Nueva cita</h1>

        <StepIndicator current={step} />

        <AnimatePresence mode="wait">
          {/* ── PASO 0 — Servicio ── */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.2 }}
            >
              <div className="rounded-2xl border border-line bg-card p-6 mb-4">
                <h2 className="font-semibold mb-1">Selecciona el servicio</h2>
                <p className="text-sm text-ink-3 mb-5">¿Qué corte o servicio se realizará?</p>

                {servicios.length === 0 ? (
                  <div className="text-center py-10">
                    <Scissors className="w-10 h-10 text-ink-4 mx-auto mb-3" />
                    <p className="text-sm text-ink-3 mb-3">No hay servicios activos aún.</p>
                    <Link href="/dashboard/servicios" className="text-sm text-gold hover:text-amber-400 transition-colors">
                      Ir a Servicios para agregar
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {servicios.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setServicio(s)}
                        className={`w-full rounded-xl border px-4 py-3.5 text-left transition-all ${
                          servicio?.id === s.id
                            ? "border-gold bg-gold/10"
                            : "border-line bg-chip hover:border-line-2"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium text-sm">{s.nombre}</div>
                            {s.descripcion && (
                              <div className="text-xs text-ink-3 mt-0.5 truncate">{s.descripcion}</div>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-semibold text-gold">
                              {Number(s.precio) === 0 ? "Gratis" : formatPrecio(Number(s.precio))}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-ink-3 justify-end mt-0.5">
                              <Clock className="w-3 h-3" />
                              {formatDuracion(s.duracion_minutos)}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 rounded-xl border border-line-2 px-4 py-2.5 text-sm text-ink-2 hover:text-ink hover:border-zinc-500 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Cancelar
                </Link>
                <button
                  disabled={!canNext[0]}
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-all hover:scale-[1.02] disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed"
                >
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── PASO 1 — Barbero ── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.2 }}
            >
              <div className="rounded-2xl border border-line bg-card p-6 mb-4">
                <h2 className="font-semibold mb-1">Selecciona el barbero</h2>
                <p className="text-sm text-ink-3 mb-5">¿Quién va a atender esta cita?</p>

                <div className="flex flex-col gap-2">
                  {/* Sin asignar */}
                  <button
                    onClick={() => { setBarbero("sin_asignar"); setHora(""); setCitasExistentes([]); }}
                    className={`w-full rounded-xl border px-4 py-3.5 text-left transition-all ${
                      barbero === "sin_asignar"
                        ? "border-gold bg-gold/10"
                        : "border-line bg-chip hover:border-line-2"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-chip border border-line-2 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-ink-3" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">Sin asignar</div>
                        <div className="text-xs text-ink-3">Asignar barbero después</div>
                      </div>
                    </div>
                  </button>

                  {barberos.length === 0 ? (
                    <p className="text-xs text-ink-3 text-center py-2">
                      No hay barberos activos.{" "}
                      <Link href="/dashboard/barberos" className="text-gold hover:text-amber-400">Agregar →</Link>
                    </p>
                  ) : (
                    barberos.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => { setBarbero(b); setHora(""); }}
                        className={`w-full rounded-xl border px-4 py-3.5 text-left transition-all ${
                          (barbero as Barbero)?.id === b.id
                            ? "border-gold bg-gold/10"
                            : "border-line bg-chip hover:border-line-2"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {b.foto_url ? (
                            <img
                              src={b.foto_url}
                              alt={b.nombre}
                              className="w-9 h-9 rounded-full object-cover border border-line-2 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-gold text-sm font-bold shrink-0">
                              {b.nombre[0]?.toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium text-sm">{b.nombre}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(0)}
                  className="flex items-center gap-1.5 rounded-xl border border-line-2 px-4 py-2.5 text-sm text-ink-2 hover:text-ink hover:border-zinc-500 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>
                <button
                  disabled={!canNext[1]}
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-all hover:scale-[1.02] disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed"
                >
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── PASO 2 — Fecha & Hora ── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.2 }}
            >
              <div className="rounded-2xl border border-line bg-card p-6 mb-4">
                <h2 className="font-semibold mb-1">Fecha y hora</h2>
                <p className="text-sm text-ink-3 mb-5">¿Cuándo será la cita?</p>

                {/* Date */}
                <div className="mb-6">
                  <label className="flex items-center gap-1.5 text-sm text-ink-2 mb-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Fecha
                  </label>
                  <input
                    type="date"
                    value={fecha}
                    min={today}
                    onChange={(e) => { setFecha(e.target.value); setHora(""); }}
                    className="w-full rounded-xl border border-line-2 bg-chip px-4 py-3 text-sm text-ink outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                  />
                </div>

                {/* Time slots */}
                {fecha && (
                  <div>
                    <label className="flex items-center gap-1.5 text-sm text-ink-2 mb-3">
                      <Clock className="w-3.5 h-3.5" /> Horario disponible
                      {servicio && (
                        <span className="text-ink-4 text-xs ml-1">
                          · bloques de {formatDuracion(servicio.duracion_minutos)}
                        </span>
                      )}
                    </label>

                    {loadingSlots ? (
                      <div className="flex justify-center py-8">
                        <div className="h-6 w-6 rounded-full border-2 border-line-2 border-t-gold animate-spin" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {slotsValidos.map((slot) => {
                          const ocupado = servicio
                            ? slotOcupado(slot, servicio.duracion_minutos, citasExistentes)
                            : false;
                          const selected = hora === slot;
                          return (
                            <button
                              key={slot}
                              disabled={ocupado}
                              onClick={() => setHora(slot)}
                              className={`rounded-lg py-2 text-xs font-semibold transition-all ${
                                ocupado
                                  ? "bg-chip text-ink-4 line-through cursor-not-allowed opacity-40"
                                  : selected
                                  ? "bg-gold text-zinc-950 scale-105"
                                  : "border border-line-2 text-ink-2 hover:border-gold hover:text-gold"
                              }`}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {hora && servicio && (
                      <p className="mt-3 text-xs text-ink-3">
                        La cita termina a las{" "}
                        <span className="text-gold font-semibold">
                          {addMinutes(hora, servicio.duracion_minutos)}
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 rounded-xl border border-line-2 px-4 py-2.5 text-sm text-ink-2 hover:text-ink hover:border-zinc-500 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>
                <button
                  disabled={!canNext[2]}
                  onClick={() => setStep(3)}
                  className="flex items-center gap-1.5 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-all hover:scale-[1.02] disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed"
                >
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── PASO 3 — Cliente + Confirmar ── */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.2 }}
            >
              {/* Resumen */}
              <div className="rounded-2xl border border-gold/30 bg-gold/5 p-5 mb-4">
                <h3 className="text-xs font-semibold text-gold uppercase tracking-widest mb-3">Resumen</h3>
                <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                  <span className="text-ink-3">Servicio</span>
                  <span className="font-medium">{servicio?.nombre}</span>

                  <span className="text-ink-3">Barbero</span>
                  <span>
                    {barbero === "sin_asignar" ? (
                      <span className="text-ink-3">Sin asignar</span>
                    ) : (
                      (barbero as Barbero)?.nombre
                    )}
                  </span>

                  <span className="text-ink-3">Fecha</span>
                  <span>
                    {fecha &&
                      new Date(fecha + "T12:00:00").toLocaleDateString("es-CO", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                  </span>

                  <span className="text-ink-3">Hora</span>
                  <span>
                    {hora}{" "}
                    <span className="text-ink-3">→</span>{" "}
                    {servicio && addMinutes(hora, servicio.duracion_minutos)}
                  </span>

                  <span className="text-ink-3">Precio</span>
                  <span className="text-gold font-semibold">
                    {servicio &&
                      (Number(servicio.precio) === 0
                        ? "Gratis"
                        : formatPrecio(Number(servicio.precio)))}
                  </span>
                </div>
              </div>

              {/* Formulario cliente */}
              <div className="rounded-2xl border border-line bg-card p-6 mb-4">
                <h2 className="font-semibold mb-1">Datos del cliente</h2>
                <p className="text-sm text-ink-3 mb-5">¿A nombre de quién va la cita?</p>

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm text-ink-2 mb-1.5">
                      Nombre <span className="text-gold">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3" />
                      <input
                        type="text"
                        value={clienteNombre}
                        onChange={(e) => setClienteNombre(e.target.value)}
                        placeholder="Nombre completo"
                        autoFocus
                        className="w-full rounded-xl border border-line-2 bg-chip pl-10 pr-4 py-3 text-sm text-ink placeholder-ink-3 outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-ink-2 mb-1.5">Teléfono</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3" />
                      <input
                        type="tel"
                        value={clienteTelefono}
                        onChange={(e) => setClienteTelefono(e.target.value)}
                        placeholder="+57 300 000 0000"
                        className="w-full rounded-xl border border-line-2 bg-chip pl-10 pr-4 py-3 text-sm text-ink placeholder-ink-3 outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-ink-2 mb-1.5">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3" />
                      <input
                        type="email"
                        value={clienteEmail}
                        onChange={(e) => setClienteEmail(e.target.value)}
                        placeholder="cliente@email.com"
                        className="w-full rounded-xl border border-line-2 bg-chip pl-10 pr-4 py-3 text-sm text-ink placeholder-ink-3 outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-ink-2 mb-1.5">Notas internas</label>
                    <div className="relative">
                      <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-ink-3" />
                      <textarea
                        value={notas}
                        onChange={(e) => setNotas(e.target.value)}
                        placeholder="Observaciones, preferencias del cliente..."
                        rows={2}
                        className="w-full rounded-xl border border-line-2 bg-chip pl-10 pr-4 py-3 text-sm text-ink placeholder-ink-3 outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors resize-none"
                      />
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 rounded-xl border border-line-2 px-4 py-2.5 text-sm text-ink-2 hover:text-ink hover:border-zinc-500 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>
                <button
                  disabled={!canNext[3] || saving}
                  onClick={handleSubmit}
                  className="flex items-center gap-2 rounded-xl bg-gold px-6 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-all hover:scale-[1.02] disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-zinc-950/30 border-t-zinc-950 animate-spin" />
                      Agendando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Agendar cita
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
