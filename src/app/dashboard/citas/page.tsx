"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { CitaConRelaciones, EstadoCita } from "@/types/database";
import {
  Scissors, Calendar, Clock, User, Plus, Check, X,
  AlertCircle, Phone, ImageIcon,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrecio(p: number) {
  return `$${p.toLocaleString("es-CO")}`;
}

function formatFecha(fecha: string) {
  return new Date(fecha + "T12:00:00").toLocaleDateString("es-CO", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

const ESTADO_LABEL: Record<EstadoCita, string> = {
  pendiente:   "Pendiente",
  confirmada:  "Confirmada",
  completada:  "Completada",
  cancelada:   "Cancelada",
  no_asistio:  "No asistió",
};

const ESTADO_COLOR: Record<EstadoCita, string> = {
  pendiente:  "bg-amber-500/15 text-amber-400 border-amber-500/30",
  confirmada: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  completada: "bg-green-500/15 text-green-400 border-green-500/30",
  cancelada:  "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  no_asistio: "bg-red-500/15 text-red-400 border-red-500/30",
};

// ── Cita card ─────────────────────────────────────────────────────────────────

interface CitaCardProps {
  cita: CitaConRelaciones;
  onEstado: (id: string, estado: EstadoCita) => Promise<void>;
  actualizando: string | null;
  modoCompletadas?: boolean;
}

function CitaCard({ cita, onEstado, actualizando, modoCompletadas }: CitaCardProps) {
  const cargando = actualizando === cita.id;

  return (
    <div className="rounded-2xl border border-line bg-card p-5 flex flex-col sm:flex-row sm:items-start gap-4">
      {/* Fecha + hora */}
      <div className="shrink-0 text-center sm:text-left sm:w-24">
        <div className="text-xs text-ink-3">{formatFecha(cita.fecha)}</div>
        <div className="font-semibold text-gold text-sm mt-0.5">{cita.hora_inicio}</div>
        <div className="text-xs text-ink-4">→ {cita.hora_fin}</div>
      </div>

      {/* Separador vertical */}
      <div className="hidden sm:block w-px bg-line self-stretch" />

      {/* Info principal */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-start gap-2 mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <User className="w-3.5 h-3.5 text-ink-3 shrink-0" />
            <span className="font-semibold text-sm truncate">{cita.cliente_nombre ?? "Sin nombre"}</span>
          </div>
          {cita.cliente_telefono && (
            <div className="flex items-center gap-1 text-xs text-ink-3">
              <Phone className="w-3 h-3" />
              {cita.cliente_telefono}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-3">
          {cita.servicio && (
            <span className="flex items-center gap-1">
              <Scissors className="w-3 h-3" />
              {cita.servicio.nombre}
            </span>
          )}
          {cita.barbero && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {cita.barbero.nombre}
            </span>
          )}
          {cita.precio_final != null && (
            <span className="text-gold font-medium">
              {Number(cita.precio_final) === 0 ? "Gratis" : formatPrecio(Number(cita.precio_final))}
            </span>
          )}
        </div>

        {cita.notas && (
          <p className="mt-2 text-xs text-ink-3 italic truncate">{cita.notas}</p>
        )}

        {cita.fotos_referencia && cita.fotos_referencia.length > 0 && (
          <div className="mt-3">
            <p className="flex items-center gap-1 text-xs text-ink-3 mb-1.5">
              <ImageIcon className="w-3 h-3" /> Fotos de referencia
            </p>
            <div className="flex gap-2 flex-wrap">
              {cita.fotos_referencia.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={url}
                    alt={`referencia ${i + 1}`}
                    className="w-14 h-14 rounded-lg object-cover border border-line-2 hover:border-gold hover:scale-105 transition-all"
                  />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Estado + acciones */}
      <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${ESTADO_COLOR[cita.estado]}`}>
          {ESTADO_LABEL[cita.estado]}
        </span>

        {!modoCompletadas && (cita.estado === "pendiente" || cita.estado === "confirmada") && (
          <div className="flex gap-1.5">
            <button
              disabled={cargando}
              onClick={() => onEstado(cita.id, "completada")}
              title="Marcar como completada"
              className="flex items-center gap-1 rounded-lg bg-green-500/15 border border-green-500/30 px-2.5 py-1.5 text-xs text-green-400 hover:bg-green-500/25 transition-colors disabled:opacity-40"
            >
              {cargando ? (
                <div className="h-3 w-3 rounded-full border border-green-400/50 border-t-green-400 animate-spin" />
              ) : (
                <Check className="w-3 h-3" />
              )}
              Listo
            </button>
            <button
              disabled={cargando}
              onClick={() => onEstado(cita.id, "cancelada")}
              title="Cancelar cita"
              className="flex items-center gap-1 rounded-lg bg-red-500/10 border border-red-500/20 px-2 py-1.5 text-xs text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-40"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Tab = "por_hacer" | "completadas";

export default function CitasPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [barberia, setBarberia] = useState<{ id: string; nombre: string } | null>(null);
  const [citas, setCitas] = useState<CitaConRelaciones[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("por_hacer");
  const [filtroFecha, setFiltroFecha] = useState<"hoy" | "todas">("hoy");
  const [actualizando, setActualizando] = useState<string | null>(null);

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      const { data: bar } = await supabase
        .from("barberias")
        .select("id, nombre")
        .eq("owner_id", user.id)
        .single();
      if (!bar) { router.push("/onboarding"); return; }
      setBarberia(bar);

      await fetchCitas(bar.id);
    }
    cargar();
  }, [supabase]);

  async function fetchCitas(barberiaId: string) {
    setLoading(true);
    const { data, error: err } = await supabase
      .from("citas")
      .select(`
        *,
        barbero:barberos(id, nombre, foto_url),
        servicio:servicios(id, nombre, duracion_minutos, precio)
      `)
      .eq("barberia_id", barberiaId)
      .order("fecha", { ascending: true })
      .order("hora_inicio", { ascending: true });

    if (err) {
      setError(err.message);
    } else {
      setCitas((data as CitaConRelaciones[]) ?? []);
    }
    setLoading(false);
  }

  async function handleEstado(citaId: string, nuevoEstado: EstadoCita) {
    if (!barberia) return;
    setActualizando(citaId);
    const { error: err } = await supabase
      .from("citas")
      .update({ estado: nuevoEstado })
      .eq("id", citaId);
    setActualizando(null);
    if (err) { setError(err.message); return; }
    await fetchCitas(barberia.id);
  }

  const hoy = new Date().toISOString().split("T")[0];

  const citasFiltradas = useMemo(() => {
    return citas.filter((c) => {
      if (tab === "por_hacer") {
        const activa = c.estado === "pendiente" || c.estado === "confirmada";
        if (!activa) return false;
        if (filtroFecha === "hoy") return c.fecha === hoy;
        return true;
      } else {
        const terminada = c.estado === "completada" || c.estado === "cancelada" || c.estado === "no_asistio";
        if (!terminada) return false;
        if (filtroFecha === "hoy") return c.fecha === hoy;
        return true;
      }
    });
  }, [citas, tab, filtroFecha, hoy]);

  const countPorHacer = useMemo(
    () => citas.filter((c) => (c.estado === "pendiente" || c.estado === "confirmada") && c.fecha >= hoy).length,
    [citas, hoy]
  );
  const countCompletadas = useMemo(
    () => citas.filter((c) => c.estado === "completada").length,
    [citas]
  );

  return (
    <div className="min-h-screen bg-base text-ink">
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        {/* Breadcrumb + título */}
        <div className="flex items-center gap-2 text-sm text-ink-3 mb-1">
          <Link href="/dashboard" className="hover:text-ink-2 transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-ink-2">Citas</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Citas</h1>
          <Link
            href="/dashboard/citas/nueva"
            className="flex items-center gap-1.5 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" /> Nueva cita
          </Link>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-chip rounded-xl p-1 mb-4 w-fit">
          <button
            onClick={() => setTab("por_hacer")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              tab === "por_hacer"
                ? "bg-card text-ink shadow-sm"
                : "text-ink-3 hover:text-ink-2"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Por hacer
            {countPorHacer > 0 && (
              <span className="ml-1 rounded-full bg-gold/20 text-gold text-xs px-1.5 py-0.5 font-semibold leading-none">
                {countPorHacer}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("completadas")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              tab === "completadas"
                ? "bg-card text-ink shadow-sm"
                : "text-ink-3 hover:text-ink-2"
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            Echos
            {countCompletadas > 0 && (
              <span className="ml-1 rounded-full bg-green-500/15 text-green-400 text-xs px-1.5 py-0.5 font-semibold leading-none">
                {countCompletadas}
              </span>
            )}
          </button>
        </div>

        {/* Filtro fecha */}
        <div className="flex items-center gap-2 mb-5">
          <Calendar className="w-3.5 h-3.5 text-ink-3" />
          <div className="flex gap-1">
            {(["hoy", "todas"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFiltroFecha(f)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                  filtroFecha === f
                    ? "bg-gold/20 text-gold border border-gold/30"
                    : "text-ink-3 hover:text-ink-2 border border-transparent"
                }`}
              >
                {f === "hoy" ? "Hoy" : "Todas"}
              </button>
            ))}
          </div>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 rounded-full border-2 border-line-2 border-t-gold animate-spin" />
          </div>
        ) : citasFiltradas.length === 0 ? (
          <div className="rounded-2xl border border-line bg-card p-12 text-center">
            {tab === "por_hacer" ? (
              <>
                <Calendar className="w-10 h-10 text-ink-4 mx-auto mb-3" />
                <p className="text-sm text-ink-3 mb-4">
                  {filtroFecha === "hoy" ? "No hay citas para hoy." : "No hay citas pendientes."}
                </p>
                <Link
                  href="/dashboard/citas/nueva"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-all"
                >
                  <Plus className="w-4 h-4" /> Agendar cita
                </Link>
              </>
            ) : (
              <>
                <Check className="w-10 h-10 text-ink-4 mx-auto mb-3" />
                <p className="text-sm text-ink-3">
                  {filtroFecha === "hoy" ? "Ningún corte completado hoy." : "Aún no hay cortes completados."}
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {citasFiltradas.map((cita) => (
              <CitaCard
                key={cita.id}
                cita={cita}
                onEstado={handleEstado}
                actualizando={actualizando}
                modoCompletadas={tab === "completadas"}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
