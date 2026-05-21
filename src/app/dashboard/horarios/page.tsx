"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Barbero, Horario } from "@/types/database";
import { Clock, ChevronLeft, Save, User } from "lucide-react";

const DIAS = [
  { label: "Lunes",     value: 1 },
  { label: "Martes",    value: 2 },
  { label: "Miércoles", value: 3 },
  { label: "Jueves",    value: 4 },
  { label: "Viernes",   value: 5 },
  { label: "Sábado",    value: 6 },
  { label: "Domingo",   value: 0 },
];

interface DiaConfig {
  activo: boolean;
  hora_inicio: string;
  hora_fin: string;
}

type Semana = Record<number, DiaConfig>;

function semanaVacia(): Semana {
  return Object.fromEntries(
    DIAS.map((d) => [d.value, { activo: false, hora_inicio: "08:00", hora_fin: "18:00" }])
  );
}

function horarioToSemana(horarios: Horario[]): Semana {
  const base = semanaVacia();
  for (const h of horarios) {
    base[h.dia_semana] = {
      activo: h.activo,
      hora_inicio: h.hora_inicio.slice(0, 5),
      hora_fin: h.hora_fin.slice(0, 5),
    };
  }
  return base;
}

export default function HorariosPage() {
  const router = useRouter();
  const supabase = createClient();

  const [barberiaId, setBarberiaId] = useState<string | null>(null);
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [semana, setSemana] = useState<Semana>(semanaVacia());
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const { data: barberia } = await supabase
        .from("barberias")
        .select("id")
        .eq("owner_id", user.id)
        .single();
      if (!barberia) { router.push("/onboarding"); return; }

      setBarberiaId(barberia.id);

      const { data: barbs } = await supabase
        .from("barberos")
        .select("*")
        .eq("barberia_id", barberia.id)
        .eq("activo", true)
        .order("nombre");

      const lista = barbs ?? [];
      setBarberos(lista);
      if (lista.length > 0) setSelectedId(lista[0].id);
      setLoadingData(false);
    }
    init();
  }, []);

  const cargarHorarios = useCallback(async (barberoId: string) => {
    const { data } = await supabase
      .from("horarios")
      .select("*")
      .eq("barbero_id", barberoId);
    setSemana(horarioToSemana(data ?? []));
  }, [supabase]);

  useEffect(() => {
    if (selectedId) cargarHorarios(selectedId);
  }, [selectedId, cargarHorarios]);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function guardar() {
    if (!selectedId) return;
    setSaving(true);

    const upserts = DIAS.map((d) => ({
      barbero_id: selectedId,
      dia_semana: d.value,
      hora_inicio: semana[d.value].hora_inicio + ":00",
      hora_fin: semana[d.value].hora_fin + ":00",
      activo: semana[d.value].activo,
    }));

    const { error } = await supabase
      .from("horarios")
      .upsert(upserts, { onConflict: "barbero_id,dia_semana" });

    setSaving(false);
    if (error) showToast("Error al guardar", false);
    else showToast("Horarios guardados", true);
  }

  function setDia(dia: number, patch: Partial<DiaConfig>) {
    setSemana((prev) => ({ ...prev, [dia]: { ...prev[dia], ...patch } }));
  }

  if (loadingData) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-line-2 border-t-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base text-ink">
      {/* Header */}
      <header className="border-b border-line bg-card/60 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-4xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-gold" />
            <span className="font-bold text-lg">Horarios</span>
          </div>
          <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {barberos.length === 0 ? (
          <div className="text-center py-20">
            <User className="w-12 h-12 text-ink-4 mx-auto mb-4" />
            <p className="text-ink-2 mb-2">No hay barberos activos</p>
            <Link href="/dashboard/barberos" className="text-gold hover:underline text-sm">
              Agregar barberos
            </Link>
          </div>
        ) : (
          <>
            {/* Selector de barbero */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-ink-3 uppercase tracking-widest mb-3">Barbero</p>
              <div className="flex flex-wrap gap-2">
                {barberos.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedId(b.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedId === b.id
                        ? "bg-gold text-zinc-950"
                        : "bg-chip text-ink-2 hover:text-ink hover:bg-card border border-line"
                    }`}
                  >
                    {b.nombre}
                  </button>
                ))}
              </div>
            </div>

            {/* Tabla de horarios */}
            <div className="rounded-2xl border border-line bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-line flex items-center justify-between">
                <p className="font-semibold">Disponibilidad semanal</p>
                <p className="text-xs text-ink-3">Activa los días y define el horario</p>
              </div>

              <div className="divide-y divide-line">
                {DIAS.map((d) => {
                  const cfg = semana[d.value];
                  return (
                    <div
                      key={d.value}
                      className={`flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 transition-colors ${
                        cfg.activo ? "" : "opacity-50"
                      }`}
                    >
                      {/* Toggle + día */}
                      <div className="flex items-center gap-3 w-32 shrink-0">
                        <button
                          onClick={() => setDia(d.value, { activo: !cfg.activo })}
                          className={`relative w-10 h-5.5 rounded-full transition-colors ${
                            cfg.activo ? "bg-gold" : "bg-zinc-700"
                          }`}
                          style={{ height: "22px" }}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                              cfg.activo ? "translate-x-[18px]" : ""
                            }`}
                          />
                        </button>
                        <span className="text-sm font-medium">{d.label}</span>
                      </div>

                      {/* Horas */}
                      <div className="flex items-center gap-2 flex-1">
                        <div className="flex flex-col gap-0.5">
                          <label className="text-[10px] text-ink-4 uppercase tracking-wider">Desde</label>
                          <input
                            type="time"
                            value={cfg.hora_inicio}
                            disabled={!cfg.activo}
                            onChange={(e) => setDia(d.value, { hora_inicio: e.target.value })}
                            className="rounded-lg border border-line bg-base px-3 py-1.5 text-sm text-ink focus:outline-none focus:border-gold disabled:opacity-40 w-32"
                          />
                        </div>
                        <span className="text-ink-4 mt-4">—</span>
                        <div className="flex flex-col gap-0.5">
                          <label className="text-[10px] text-ink-4 uppercase tracking-wider">Hasta</label>
                          <input
                            type="time"
                            value={cfg.hora_fin}
                            disabled={!cfg.activo}
                            onChange={(e) => setDia(d.value, { hora_fin: e.target.value })}
                            className="rounded-lg border border-line bg-base px-3 py-1.5 text-sm text-ink focus:outline-none focus:border-gold disabled:opacity-40 w-32"
                          />
                        </div>

                        {cfg.activo && cfg.hora_inicio && cfg.hora_fin && (
                          <span className="text-xs text-ink-3 mt-4 ml-2">
                            {(() => {
                              const [h1, m1] = cfg.hora_inicio.split(":").map(Number);
                              const [h2, m2] = cfg.hora_fin.split(":").map(Number);
                              const mins = (h2 * 60 + m2) - (h1 * 60 + m1);
                              if (mins <= 0) return "";
                              const h = Math.floor(mins / 60);
                              const m = mins % 60;
                              return h > 0 ? `${h}h${m > 0 ? ` ${m}min` : ""}` : `${m}min`;
                            })()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="px-5 py-4 border-t border-line flex justify-end">
                <button
                  onClick={guardar}
                  disabled={saving}
                  className="flex items-center gap-2 bg-gold text-zinc-950 font-semibold px-5 py-2.5 rounded-xl hover:bg-amber-400 transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <span className="h-4 w-4 rounded-full border-2 border-zinc-950/30 border-t-zinc-950 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Guardar horarios
                </button>
              </div>
            </div>

            <p className="mt-4 text-xs text-ink-4 text-center">
              Los horarios definen cuándo se pueden agendar citas para cada barbero.
            </p>
          </>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg border transition-all ${
          toast.ok
            ? "bg-card border-gold/40 text-gold"
            : "bg-card border-red-500/40 text-red-400"
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
