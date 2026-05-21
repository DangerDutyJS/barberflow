"use client";
export const dynamic = "force-dynamic";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scissors, MapPin, Phone, Clock, User, ChevronLeft, ChevronRight,
  Check, AlertCircle, CheckCircle2, Calendar, FileText, Mail,
} from "lucide-react";
import type { Barberia, Barbero, Servicio, Horario } from "@/types/database";

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

function slotFueraDeHorario(
  hora: string,
  duracion: number,
  horario: { hora_inicio: string; hora_fin: string } | null
): boolean {
  if (!horario) return true;
  const slotIni = timeToMin(hora);
  const slotFin = slotIni + duracion;
  const hIni = timeToMin(horario.hora_inicio);
  const hFin = timeToMin(horario.hora_fin);
  return slotIni < hIni || slotFin > hFin;
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

function formatFechaLarga(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("es-CO", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function capitalizar(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Step indicator ─────────────────────────────────────────────────────────────

const STEP_LABELS = ["Servicio", "Barbero", "Fecha & Hora", "Mis datos"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {STEP_LABELS.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className={`flex items-center gap-2 transition-opacity ${i <= current ? "opacity-100" : "opacity-35"}`}>
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
            <span className={`text-xs font-medium hidden sm:block ${i === current ? "text-gold" : "text-ink-3"}`}>
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

// ── Pantalla de éxito ──────────────────────────────────────────────────────────

function PantallaExito({
  barberia,
  servicio,
  barbero,
  fecha,
  hora,
  nombre,
  onNueva,
}: {
  barberia: Barberia;
  servicio: Servicio;
  barbero: Barbero;
  fecha: string;
  hora: string;
  nombre: string;
  onNueva: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center text-center gap-5 py-6"
    >
      <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8 text-green-400" />
      </div>

      <div>
        <h2 className="text-xl font-bold text-ink mb-1">¡Cita confirmada!</h2>
        <p className="text-sm text-ink-3">
          Hola <span className="text-ink font-medium">{nombre}</span>, tu cita ha sido registrada.
        </p>
      </div>

      <div className="w-full rounded-2xl border border-gold/30 bg-gold/5 p-5 text-left">
        <h3 className="text-xs font-semibold text-gold uppercase tracking-widest mb-4">Detalles</h3>
        <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-sm">
          <span className="text-ink-3">Barbería</span>
          <span className="font-medium">{barberia.nombre}</span>

          <span className="text-ink-3">Servicio</span>
          <span>{servicio.nombre}</span>

          <span className="text-ink-3">Barbero</span>
          <span>{barbero.nombre}</span>

          <span className="text-ink-3">Fecha</span>
          <span>{capitalizar(formatFechaLarga(fecha))}</span>

          <span className="text-ink-3">Hora</span>
          <span>
            {hora} <span className="text-ink-3">→</span> {addMinutes(hora, servicio.duracion_minutos)}
          </span>

          <span className="text-ink-3">Precio</span>
          <span className="text-gold font-semibold">
            {Number(servicio.precio) === 0 ? "Gratis" : formatPrecio(Number(servicio.precio))}
          </span>
        </div>
      </div>

      {barberia.telefono && (
        <p className="text-xs text-ink-3">
          ¿Necesitas cancelar?{" "}
          <a
            href={`https://wa.me/${barberia.telefono.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold hover:text-amber-400 transition-colors"
          >
            Contáctanos por WhatsApp
          </a>
        </p>
      )}

      <button
        onClick={onNueva}
        className="mt-2 rounded-xl border border-line-2 px-6 py-2.5 text-sm text-ink-2 hover:text-ink hover:border-zinc-500 transition-colors"
      >
        Agendar otra cita
      </button>
    </motion.div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────

export default function PaginaPublica({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const supabase = useMemo(() => createClient(), []);

  // Estado de carga inicial
  const [cargando, setCargando] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [barberia, setBarberia] = useState<Barberia | null>(null);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [barberos, setBarberos] = useState<Barbero[]>([]);

  // Wizard
  const [step, setStep] = useState(0);
  const [servicio, setServicio] = useState<Servicio | null>(null);
  const [barbero, setBarbero] = useState<Barbero | null>(null);
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");
  const [notas, setNotas] = useState("");

  // Disponibilidad
  const [horarioBarbero, setHorarioBarbero] = useState<Pick<Horario, "hora_inicio" | "hora_fin"> | null>(null);
  const [citasOcupadas, setCitasOcupadas] = useState<{ hora_inicio: string; hora_fin: string }[]>([]);
  const [barberoSinHorario, setBarberoSinHorario] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Envío
  const [agendando, setAgendando] = useState(false);
  const [error, setError] = useState("");
  const [citaCreada, setCitaCreada] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  // ── Carga inicial ────────────────────────────────────────────────────────────
  useEffect(() => {
    async function cargar() {
      const { data: bar } = await supabase
        .from("barberias")
        .select("*")
        .eq("slug", slug)
        .eq("activa", true)
        .single();

      if (!bar) {
        setNotFound(true);
        setCargando(false);
        return;
      }
      setBarberia(bar);

      const [{ data: svcs }, { data: barbs }] = await Promise.all([
        supabase.from("servicios").select("*").eq("barberia_id", bar.id).eq("activo", true).order("nombre"),
        supabase.from("barberos").select("*").eq("barberia_id", bar.id).eq("activo", true).order("nombre"),
      ]);

      setServicios(svcs ?? []);
      setBarberos(barbs ?? []);
      setCargando(false);
    }
    cargar();
  }, [slug, supabase]);

  // ── Disponibilidad cuando cambia barbero o fecha ─────────────────────────────
  useEffect(() => {
    if (!barbero || !fecha || !barberia) {
      setHorarioBarbero(null);
      setCitasOcupadas([]);
      setBarberoSinHorario(false);
      return;
    }
    setLoadingSlots(true);
    setHora("");
    setBarberoSinHorario(false);

    const diaNum = new Date(fecha + "T12:00:00").getDay();

    Promise.all([
      supabase
        .from("horarios")
        .select("hora_inicio, hora_fin, activo")
        .eq("barbero_id", barbero.id)
        .eq("dia_semana", diaNum)
        .single(),
      supabase
        .from("citas")
        .select("hora_inicio, hora_fin")
        .eq("barberia_id", barberia.id)
        .eq("barbero_id", barbero.id)
        .eq("fecha", fecha)
        .neq("estado", "cancelada"),
    ]).then(([{ data: hor }, { data: citas }]) => {
      if (!hor || !hor.activo) {
        setHorarioBarbero(null);
        setBarberoSinHorario(true);
      } else {
        setHorarioBarbero({ hora_inicio: hor.hora_inicio, hora_fin: hor.hora_fin });
        setBarberoSinHorario(false);
      }
      setCitasOcupadas(citas ?? []);
      setLoadingSlots(false);
    });
  }, [barbero, fecha, barberia, supabase]);

  // ── Slots filtrados por horario y duración ───────────────────────────────────
  const slotsDisponibles = useMemo(() => {
    if (!servicio) return [];
    return TODOS_SLOTS.filter((s) => {
      if (timeToMin(addMinutes(s, servicio.duracion_minutos)) > 20 * 60) return false;
      if (slotFueraDeHorario(s, servicio.duracion_minutos, horarioBarbero)) return false;
      return true;
    });
  }, [servicio, horarioBarbero]);

  // ── Confirmar cita ───────────────────────────────────────────────────────────
  const confirmarCita = useCallback(async () => {
    if (!barberia || !servicio || !barbero || !fecha || !hora || !clienteNombre.trim()) return;
    setAgendando(true);
    setError("");

    const { error: err } = await supabase.from("citas").insert({
      barberia_id: barberia.id,
      barbero_id: barbero.id,
      servicio_id: servicio.id,
      cliente_nombre: clienteNombre.trim(),
      cliente_telefono: clienteTelefono.trim() || null,
      cliente_email: clienteEmail.trim() || null,
      fecha,
      hora_inicio: hora,
      hora_fin: addMinutes(hora, servicio.duracion_minutos),
      estado: "pendiente",
      notas: notas.trim() || null,
      precio_final: Number(servicio.precio),
    });

    setAgendando(false);
    if (err) {
      setError("No pudimos agendar tu cita. Por favor intenta de nuevo.");
      return;
    }
    setCitaCreada(true);
  }, [barberia, servicio, barbero, fecha, hora, clienteNombre, clienteTelefono, clienteEmail, notas, supabase]);

  function resetWizard() {
    setCitaCreada(false);
    setStep(0);
    setServicio(null);
    setBarbero(null);
    setFecha("");
    setHora("");
    setClienteNombre("");
    setClienteTelefono("");
    setClienteEmail("");
    setNotas("");
    setError("");
  }

  // ── Pantallas especiales ─────────────────────────────────────────────────────

  if (cargando) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-line-2 border-t-gold animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-base flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="w-14 h-14 rounded-full bg-chip flex items-center justify-center">
          <Scissors className="w-7 h-7 text-ink-3" />
        </div>
        <h1 className="text-xl font-bold text-ink">Barbería no encontrada</h1>
        <p className="text-sm text-ink-3 max-w-xs">
          El enlace que seguiste no corresponde a ninguna barbería activa en BarberFlow.
        </p>
      </div>
    );
  }

  // ── Layout principal ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-base text-ink">
      {/* Header */}
      <header className="border-b border-line bg-card sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          {barberia!.logo_url ? (
            <img
              src={barberia!.logo_url}
              alt={barberia!.nombre}
              className="w-10 h-10 rounded-full object-cover shrink-0 border border-line-2"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
              <Scissors className="w-5 h-5 text-gold" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-ink truncate leading-tight">{barberia!.nombre}</h1>
            <div className="flex items-center gap-3 mt-0.5">
              {barberia!.ciudad && (
                <span className="text-xs text-ink-3 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {barberia!.ciudad}
                </span>
              )}
              {barberia!.telefono && (
                <a
                  href={`tel:${barberia!.telefono}`}
                  className="text-xs text-ink-3 flex items-center gap-1 hover:text-gold transition-colors"
                >
                  <Phone className="w-3 h-3" />
                  {barberia!.telefono}
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        {citaCreada ? (
          <PantallaExito
            barberia={barberia!}
            servicio={servicio!}
            barbero={barbero!}
            fecha={fecha}
            hora={hora}
            nombre={clienteNombre}
            onNueva={resetWizard}
          />
        ) : (
          <>
            <div className="mb-2">
              <h2 className="text-lg font-bold text-center">Agenda tu cita</h2>
              <p className="text-sm text-ink-3 text-center mt-0.5">Proceso rápido, sin necesidad de cuenta</p>
            </div>

            <div className="my-6">
              <StepIndicator current={step} />
            </div>

            <AnimatePresence mode="wait">
              {/* ── PASO 0 — Servicio ─────────────────────────────────────── */}
              {step === 0 && (
                <motion.div
                  key="step0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.18 }}
                >
                  <div className="rounded-2xl border border-line bg-card p-5 mb-4">
                    <h3 className="font-semibold mb-1">¿Qué servicio deseas?</h3>
                    <p className="text-sm text-ink-3 mb-5">Selecciona el servicio que quieres reservar.</p>

                    {servicios.length === 0 ? (
                      <div className="text-center py-10">
                        <Scissors className="w-10 h-10 text-ink-4 mx-auto mb-3" />
                        <p className="text-sm text-ink-3">Esta barbería aún no tiene servicios disponibles.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {servicios.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => { setServicio(s); setStep(1); }}
                            className={`w-full rounded-xl border px-4 py-3.5 text-left transition-all ${
                              servicio?.id === s.id
                                ? "border-gold bg-gold/10"
                                : "border-line bg-chip hover:border-line-2 active:scale-[0.99]"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-medium text-sm">{s.nombre}</div>
                                {s.descripcion && (
                                  <div className="text-xs text-ink-3 mt-0.5 line-clamp-1">{s.descripcion}</div>
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
                </motion.div>
              )}

              {/* ── PASO 1 — Barbero ──────────────────────────────────────── */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.18 }}
                >
                  <div className="rounded-2xl border border-line bg-card p-5 mb-4">
                    <h3 className="font-semibold mb-1">¿Con quién quieres la cita?</h3>
                    <p className="text-sm text-ink-3 mb-5">Elige tu barbero de confianza.</p>

                    {barberos.length === 0 ? (
                      <div className="text-center py-10">
                        <User className="w-10 h-10 text-ink-4 mx-auto mb-3" />
                        <p className="text-sm text-ink-3">No hay barberos disponibles en este momento.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {barberos.map((b) => (
                          <button
                            key={b.id}
                            onClick={() => { setBarbero(b); setFecha(""); setHora(""); setStep(2); }}
                            className={`w-full rounded-xl border px-4 py-3.5 text-left transition-all ${
                              barbero?.id === b.id
                                ? "border-gold bg-gold/10"
                                : "border-line bg-chip hover:border-line-2 active:scale-[0.99]"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {b.foto_url ? (
                                <img
                                  src={b.foto_url}
                                  alt={b.nombre}
                                  className="w-10 h-10 rounded-full object-cover border border-line-2 shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-gold font-bold shrink-0">
                                  {b.nombre[0]?.toUpperCase()}
                                </div>
                              )}
                              <span className="font-medium text-sm">{b.nombre}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setStep(0)}
                    className="flex items-center gap-1.5 rounded-xl border border-line-2 px-4 py-2.5 text-sm text-ink-2 hover:text-ink hover:border-zinc-500 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" /> Anterior
                  </button>
                </motion.div>
              )}

              {/* ── PASO 2 — Fecha & Hora ─────────────────────────────────── */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.18 }}
                >
                  <div className="rounded-2xl border border-line bg-card p-5 mb-4">
                    <h3 className="font-semibold mb-1">¿Cuándo quieres la cita?</h3>
                    <p className="text-sm text-ink-3 mb-5">Elige una fecha y el horario disponible.</p>

                    {/* Fecha */}
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

                    {/* Slots */}
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
                        ) : barberoSinHorario ? (
                          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {barbero?.nombre} no trabaja ese día. Elige otra fecha.
                          </div>
                        ) : slotsDisponibles.length === 0 ? (
                          <div className="rounded-xl border border-line bg-chip px-4 py-3 text-sm text-ink-3 text-center">
                            No hay horarios disponibles para esta fecha.
                          </div>
                        ) : (
                          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                            {slotsDisponibles.map((slot) => {
                              const ocupado = servicio
                                ? slotOcupado(slot, servicio.duracion_minutos, citasOcupadas)
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
                            Tu cita termina a las{" "}
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
                      disabled={!fecha || !hora}
                      onClick={() => setStep(3)}
                      className="flex items-center gap-1.5 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-all hover:scale-[1.02] disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed"
                    >
                      Siguiente <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── PASO 3 — Datos cliente ────────────────────────────────── */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.18 }}
                >
                  {/* Resumen */}
                  <div className="rounded-2xl border border-gold/30 bg-gold/5 p-5 mb-4">
                    <h3 className="text-xs font-semibold text-gold uppercase tracking-widest mb-3">Tu reserva</h3>
                    <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                      <span className="text-ink-3">Servicio</span>
                      <span className="font-medium">{servicio?.nombre}</span>

                      <span className="text-ink-3">Barbero</span>
                      <span>{barbero?.nombre}</span>

                      <span className="text-ink-3">Fecha</span>
                      <span>{fecha && capitalizar(formatFechaLarga(fecha))}</span>

                      <span className="text-ink-3">Hora</span>
                      <span>
                        {hora} <span className="text-ink-3">→</span>{" "}
                        {servicio && addMinutes(hora, servicio.duracion_minutos)}
                      </span>

                      <span className="text-ink-3">Precio</span>
                      <span className="text-gold font-semibold">
                        {servicio && (Number(servicio.precio) === 0 ? "Gratis" : formatPrecio(Number(servicio.precio)))}
                      </span>
                    </div>
                  </div>

                  {/* Formulario */}
                  <div className="rounded-2xl border border-line bg-card p-5 mb-4">
                    <h3 className="font-semibold mb-1">Tus datos</h3>
                    <p className="text-sm text-ink-3 mb-5">¿A nombre de quién agendamos la cita?</p>

                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="block text-sm text-ink-2 mb-1.5">
                          Nombre completo <span className="text-gold">*</span>
                        </label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3" />
                          <input
                            type="text"
                            value={clienteNombre}
                            onChange={(e) => setClienteNombre(e.target.value)}
                            placeholder="Tu nombre"
                            autoFocus
                            className="w-full rounded-xl border border-line-2 bg-chip pl-10 pr-4 py-3 text-sm text-ink placeholder-ink-3 outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-ink-2 mb-1.5">
                          Teléfono / WhatsApp
                        </label>
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
                            placeholder="tu@email.com"
                            className="w-full rounded-xl border border-line-2 bg-chip pl-10 pr-4 py-3 text-sm text-ink placeholder-ink-3 outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-ink-2 mb-1.5">Notas u observaciones</label>
                        <div className="relative">
                          <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-ink-3" />
                          <textarea
                            value={notas}
                            onChange={(e) => setNotas(e.target.value)}
                            placeholder="Ej: Quiero degradado bajo, barba incluida..."
                            rows={2}
                            className="w-full rounded-xl border border-line-2 bg-chip pl-10 pr-4 py-3 text-sm text-ink placeholder-ink-3 outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                        >
                          <AlertCircle className="w-4 h-4 shrink-0" />
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
                      disabled={!clienteNombre.trim() || agendando}
                      onClick={confirmarCita}
                      className="flex items-center gap-2 rounded-xl bg-gold px-6 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-all hover:scale-[1.02] disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed"
                    >
                      {agendando ? (
                        <>
                          <div className="h-4 w-4 rounded-full border-2 border-zinc-950/30 border-t-zinc-950 animate-spin" />
                          Agendando...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Confirmar cita
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 pb-8 text-center">
        <p className="text-xs text-ink-4">
          Impulsado por{" "}
          <span className="font-semibold">
            <span className="text-ink-3">Barber</span>
            <span className="text-gold">Flow</span>
          </span>
        </p>
      </footer>
    </div>
  );
}
