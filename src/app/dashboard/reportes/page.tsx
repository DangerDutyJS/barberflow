"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Barbero, Servicio, Pago } from "@/types/database";
import {
  BarChart2, TrendingUp, Calendar,
  CheckCircle, XCircle, Clock, CreditCard,
} from "lucide-react";

type Periodo = "semana" | "mes" | "año";

interface Stats {
  totalCitas: number;
  completadas: number;
  canceladas: number;
  pendientes: number;
  ingresosCentavos: number;
  topBarbero: string | null;
  topServicio: string | null;
}

interface CitaRow {
  estado: string;
  barbero_id: string | null;
  servicio_id: string | null;
  precio_final: number | null;
  created_at: string;
}

function formatCOP(centavos: number) {
  return `$${Math.round(centavos / 100).toLocaleString("es-CO")} COP`;
}

function formatFechaPago(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function inicioPeriodo(periodo: Periodo): Date {
  const now = new Date();
  if (periodo === "semana") {
    const d = new Date(now);
    d.setDate(now.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (periodo === "mes") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return new Date(now.getFullYear(), 0, 1);
}

export default function ReportesPage() {
  const router = useRouter();
  const supabase = createClient();

  const [barberiaId, setBarberiaId] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [barberos, setBarberos] = useState<Record<string, string>>({});
  const [servicios, setServicios] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const { data: barberia } = await supabase
        .from("barberias").select("id").eq("owner_id", user.id).single();
      if (!barberia) { router.push("/onboarding"); return; }

      setBarberiaId(barberia.id);

      const [{ data: barbs }, { data: servs }, { data: pagosData }] = await Promise.all([
        supabase.from("barberos").select("id, nombre").eq("barberia_id", barberia.id),
        supabase.from("servicios").select("id, nombre").eq("barberia_id", barberia.id),
        supabase.from("pagos").select("*").eq("barberia_id", barberia.id).order("created_at", { ascending: false }),
      ]);

      const barbMap: Record<string, string> = {};
      for (const b of barbs ?? []) barbMap[b.id] = b.nombre;
      const servMap: Record<string, string> = {};
      for (const s of servs ?? []) servMap[s.id] = s.nombre;

      setBarberos(barbMap);
      setServicios(servMap);
      setPagos(pagosData ?? []);
      setBarberiaId(barberia.id);
      setLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    if (!barberiaId) return;
    async function cargarStats() {
      setLoading(true);
      const desde = inicioPeriodo(periodo).toISOString();

      const { data: citas } = await supabase
        .from("citas")
        .select("estado, barbero_id, servicio_id, precio_final, created_at")
        .eq("barberia_id", barberiaId!)
        .gte("created_at", desde);

      const rows: CitaRow[] = citas ?? [];

      const completadas = rows.filter((c) => c.estado === "completada").length;
      const canceladas = rows.filter((c) => c.estado === "cancelada").length;
      const pendientes = rows.filter((c) => c.estado === "pendiente" || c.estado === "confirmada").length;

      const ingresosCentavos = rows
        .filter((c) => c.estado === "completada" && c.precio_final)
        .reduce((acc, c) => acc + (c.precio_final ?? 0) * 100, 0);

      // Barbero con más citas completadas
      const contBarbero: Record<string, number> = {};
      for (const c of rows.filter((r) => r.estado === "completada" && r.barbero_id)) {
        contBarbero[c.barbero_id!] = (contBarbero[c.barbero_id!] ?? 0) + 1;
      }
      const topBarberoId = Object.entries(contBarbero).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

      // Servicio más solicitado
      const contServicio: Record<string, number> = {};
      for (const c of rows.filter((r) => r.servicio_id)) {
        contServicio[c.servicio_id!] = (contServicio[c.servicio_id!] ?? 0) + 1;
      }
      const topServicioId = Object.entries(contServicio).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

      setStats({
        totalCitas: rows.length,
        completadas,
        canceladas,
        pendientes,
        ingresosCentavos,
        topBarbero: topBarberoId ? (barberos[topBarberoId] ?? null) : null,
        topServicio: topServicioId ? (servicios[topServicioId] ?? null) : null,
      });
      setLoading(false);
    }
    cargarStats();
  }, [barberiaId, periodo, barberos, servicios]);

  const PERIODOS: { key: Periodo; label: string }[] = [
    { key: "semana", label: "Últimos 7 días" },
    { key: "mes",    label: "Este mes" },
    { key: "año",    label: "Este año" },
  ];

  return (
    <div className="min-h-screen bg-base text-ink">
      <main className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        {/* Selector de período */}
        <div className="flex items-center gap-2 flex-wrap">
          {PERIODOS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriodo(p.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                periodo === p.key
                  ? "bg-gold text-zinc-950"
                  : "bg-chip text-ink-2 hover:text-ink border border-line"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 rounded-full border-2 border-line-2 border-t-gold animate-spin" />
          </div>
        ) : stats ? (
          <>
            {/* Cards de stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<Calendar className="w-4 h-4" />}
                label="Total citas"
                value={String(stats.totalCitas)}
                sub="en el período"
              />
              <StatCard
                icon={<CheckCircle className="w-4 h-4 text-emerald-400" />}
                label="Completadas"
                value={String(stats.completadas)}
                sub={stats.totalCitas > 0 ? `${Math.round((stats.completadas / stats.totalCitas) * 100)}%` : "—"}
                accent="emerald"
              />
              <StatCard
                icon={<XCircle className="w-4 h-4 text-red-400" />}
                label="Canceladas"
                value={String(stats.canceladas)}
                sub={stats.totalCitas > 0 ? `${Math.round((stats.canceladas / stats.totalCitas) * 100)}%` : "—"}
                accent="red"
              />
              <StatCard
                icon={<Clock className="w-4 h-4 text-blue-400" />}
                label="Pendientes"
                value={String(stats.pendientes)}
                sub="por completar"
                accent="blue"
              />
            </div>

            {/* Ingresos + top */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 rounded-2xl border border-gold/30 bg-gradient-to-b from-gold/10 to-card p-5">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-gold" />
                  <p className="text-xs font-semibold text-gold uppercase tracking-widest">Ingresos estimados</p>
                </div>
                <p className="text-2xl font-extrabold mt-2">{formatCOP(stats.ingresosCentavos)}</p>
                <p className="text-xs text-ink-3 mt-1">Suma de citas completadas con precio registrado</p>
              </div>

              <div className="rounded-2xl border border-line bg-card p-5">
                <p className="text-xs font-semibold text-ink-3 uppercase tracking-widest mb-3">Barbero top</p>
                {stats.topBarbero ? (
                  <p className="font-bold text-lg">{stats.topBarbero}</p>
                ) : (
                  <p className="text-ink-3 text-sm">Sin datos</p>
                )}
                <p className="text-xs text-ink-4 mt-1">Más citas completadas en el período</p>
              </div>

              <div className="rounded-2xl border border-line bg-card p-5">
                <p className="text-xs font-semibold text-ink-3 uppercase tracking-widest mb-3">Servicio más pedido</p>
                {stats.topServicio ? (
                  <p className="font-bold text-lg">{stats.topServicio}</p>
                ) : (
                  <p className="text-ink-3 text-sm">Sin datos</p>
                )}
                <p className="text-xs text-ink-4 mt-1">El más solicitado en el período</p>
              </div>
            </div>

            {/* Historial de pagos Wompi */}
            <div className="rounded-2xl border border-line bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-line flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gold" />
                <p className="font-semibold">Historial de suscripciones</p>
              </div>

              {pagos.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-ink-3 text-sm">No hay pagos registrados aún</p>
                </div>
              ) : (
                <div className="divide-y divide-line">
                  {pagos.map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-5 py-4 gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          Plan {p.plan === "pro" ? "Pro" : p.plan}{" "}
                          {p.ciclo_facturacion ? `· ${p.ciclo_facturacion}` : ""}
                        </p>
                        <p className="text-xs text-ink-3 truncate">
                          Ref: {p.wompi_referencia}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-gold">
                          {formatCOP(p.monto_centavos)}
                        </p>
                        <p className="text-xs text-ink-3">{formatFechaPago(p.created_at)}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        p.estado === "APPROVED"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-red-500/15 text-red-400"
                      }`}>
                        {p.estado === "APPROVED" ? "Aprobado" : p.estado}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}

function StatCard({
  icon, label, value, sub, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent?: "emerald" | "red" | "blue";
}) {
  const borderColor = accent === "emerald" ? "border-emerald-500/20"
    : accent === "red" ? "border-red-500/20"
    : accent === "blue" ? "border-blue-500/20"
    : "border-line";

  return (
    <div className={`rounded-2xl border ${borderColor} bg-card p-5`}>
      <div className="flex items-center gap-2 mb-2 text-ink-3">
        {icon}
        <p className="text-xs font-semibold uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-2xl font-extrabold">{value}</p>
      <p className="text-xs text-ink-4 mt-1">{sub}</p>
    </div>
  );
}
