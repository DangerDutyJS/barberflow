export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import Link from "next/link";
import { getEstadoSuscripcion } from "@/lib/subscriptions";
import type { Suscripcion } from "@/types/database";
import {
  Calendar, BarChart2, Users, Star, Clock,
  TrendingUp, Settings, Plus, Scissors, ChevronRight, AlertTriangle,
} from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: barberia } = await supabase
    .from("barberias")
    .select("id, nombre, slug, telefono")
    .eq("owner_id", user.id)
    .single();
  if (!barberia) redirect("/onboarding");

  const { data: suscripcion } = await createServiceClient()
    .from("suscripciones")
    .select("*")
    .eq("barberia_id", barberia.id)
    .single();

  const estadoSub = getEstadoSuscripcion(suscripcion as Suscripcion | null);

  const hoy = new Date().toISOString().split("T")[0];

  const [
    { count: totalCitas },
    { count: citasHoy },
    { count: totalBarberos },
    { count: citasPendientes },
    { data: proximasCitas },
  ] = await Promise.all([
    supabase.from("citas").select("*", { count: "exact", head: true }).eq("barberia_id", barberia.id),
    supabase.from("citas").select("*", { count: "exact", head: true })
      .eq("barberia_id", barberia.id).eq("fecha", hoy),
    supabase.from("barberos").select("*", { count: "exact", head: true })
      .eq("barberia_id", barberia.id).eq("activo", true),
    supabase.from("citas").select("*", { count: "exact", head: true })
      .eq("barberia_id", barberia.id)
      .in("estado", ["pendiente", "confirmada"])
      .gte("fecha", hoy),
    supabase.from("citas")
      .select("id, fecha, hora_inicio, cliente_nombre, estado, barbero:barberos(nombre), servicio:servicios(nombre)")
      .eq("barberia_id", barberia.id)
      .in("estado", ["pendiente", "confirmada"])
      .gte("fecha", hoy)
      .order("fecha").order("hora_inicio")
      .limit(4),
  ]);

  const nombre = user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuario";

  const diaLabel = new Date().toLocaleDateString("es-CO", {
    weekday: "long", day: "numeric", month: "long",
  });

  function formatHora(h: string) { return h.slice(0, 5); }
  function formatFecha(f: string) {
    if (f === hoy) return "Hoy";
    const d = new Date(f + "T12:00:00");
    return d.toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short" });
  }

  const ACCIONES = [
    { icon: Calendar,   title: "Citas",         desc: "Ver agenda del día",  href: "/dashboard/citas",         bg: "bg-blue-500/10",    border: "border-blue-500/20",   iconCls: "text-blue-400"   },
    { icon: Plus,       title: "Nueva cita",    desc: "Agendar ahora",       href: "/dashboard/citas/nueva",   bg: "bg-emerald-500/10", border: "border-emerald-500/20",iconCls: "text-emerald-400"},
    { icon: Users,      title: "Barberos",      desc: "Gestiona tu equipo",  href: "/dashboard/barberos",      bg: "bg-violet-500/10",  border: "border-violet-500/20", iconCls: "text-violet-400" },
    { icon: Scissors,   title: "Servicios",     desc: "Precios y cortes",    href: "/dashboard/servicios",     bg: "bg-amber-500/10",   border: "border-amber-500/20",  iconCls: "text-amber-400"  },
    { icon: Clock,      title: "Horarios",      desc: "Disponibilidad",      href: "/dashboard/horarios",      bg: "bg-cyan-500/10",    border: "border-cyan-500/20",   iconCls: "text-cyan-400"   },
    { icon: TrendingUp, title: "Reportes",      desc: "Ingresos y stats",    href: "/dashboard/reportes",      bg: "bg-pink-500/10",    border: "border-pink-500/20",   iconCls: "text-pink-400"   },
    { icon: Settings,   title: "Configuración", desc: "Perfil de barbería",  href: "/dashboard/configuracion", bg: "bg-zinc-500/10",    border: "border-zinc-500/20",   iconCls: "text-zinc-400"   },
    { icon: Star,       title: "Upgrade",       desc: "Desbloquea todo",     href: "/dashboard/upgrade",       bg: "bg-gold/10",        border: "border-gold/20",       iconCls: "text-gold"       },
  ];

  return (
    <div className="bg-base text-ink">

      {/* ── Trial / Expired banner ─────────────────────────────────────────── */}
      {estadoSub.mostrarBannerTrial && (
        <div className={`flex items-center justify-center gap-2 px-4 py-2.5 text-sm ${
          estadoSub.expirada
            ? "bg-red-950/60 text-red-300 border-b border-red-900/40"
            : estadoSub.diasRestantes !== null && estadoSub.diasRestantes <= 2
            ? "bg-amber-950/60 text-amber-300 border-b border-amber-900/40"
            : "bg-gold/8 text-ink-2 border-b border-gold/15"
        }`}>
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {estadoSub.expirada ? (
            <>Tu trial venció. <Link href="/dashboard/upgrade" className="font-bold underline underline-offset-2 ml-1">Activa tu plan →</Link></>
          ) : (
            <>Trial · <strong className="mx-1">{estadoSub.diasRestantes}d</strong> restante{estadoSub.diasRestantes !== 1 ? "s" : ""} —
              <Link href="/dashboard/upgrade" className="font-bold underline underline-offset-2 ml-1">Upgrade a Pro →</Link>
            </>
          )}
        </div>
      )}

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">

        {/* ── Greeting ──────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-ink-4 uppercase tracking-widest mb-1 capitalize">{diaLabel}</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hola, <span className="text-gold">{nombre.split(" ")[0]}</span>
            </h1>
            <p className="text-ink-3 text-sm mt-0.5">{barberia.nombre}</p>
          </div>
          <Link
            href="/dashboard/citas/nueva"
            className="shrink-0 flex items-center gap-1.5 rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-zinc-950 hover:bg-amber-400 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-gold/20"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">Nueva cita</span>
            <span className="xs:hidden">Nueva</span>
          </Link>
        </div>

        {/* ── Stats ─────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon={<Calendar className="w-5 h-5" />}
            value={citasHoy ?? 0}
            label="Citas hoy"
            href="/dashboard/citas"
            accent="blue"
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            value={citasPendientes ?? 0}
            label="Pendientes"
            href="/dashboard/citas"
            accent="amber"
          />
          <StatCard
            icon={<Users className="w-5 h-5" />}
            value={totalBarberos ?? 0}
            label="Barberos"
            href="/dashboard/barberos"
            accent="violet"
          />
          <StatCard
            icon={<BarChart2 className="w-5 h-5" />}
            value={totalCitas ?? 0}
            label="Total citas"
            href="/dashboard/reportes"
            accent="emerald"
          />
        </div>

        {/* ── Próximas citas ─────────────────────────────────────────────────── */}
        {proximasCitas && proximasCitas.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-ink-3 uppercase tracking-widest">Próximas citas</h2>
              <Link href="/dashboard/citas" className="flex items-center gap-0.5 text-xs text-gold hover:text-amber-400 transition-colors font-medium">
                Ver todas <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="rounded-2xl border border-line bg-card overflow-hidden divide-y divide-line/50">
              {proximasCitas.map((c: {
                id: string; fecha: string; hora_inicio: string; cliente_nombre: string | null; estado: string;
                barbero: { nombre: string }[] | { nombre: string } | null;
                servicio: { nombre: string }[] | { nombre: string } | null;
              }) => {
                const barberoN = Array.isArray(c.barbero) ? c.barbero[0]?.nombre : c.barbero?.nombre;
                const servicioN = Array.isArray(c.servicio) ? c.servicio[0]?.nombre : c.servicio?.nombre;
                const esHoy = c.fecha === hoy;
                return (
                  <div key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-chip/30 transition-colors">
                    {/* Hora */}
                    <div className="shrink-0 w-14 text-center">
                      <p className="text-[10px] text-ink-4 font-medium uppercase">{formatFecha(c.fecha)}</p>
                      <p className={`text-sm font-bold ${esHoy ? "text-gold" : "text-ink-2"}`}>{formatHora(c.hora_inicio)}</p>
                    </div>
                    {/* Divider */}
                    <div className="w-px h-8 bg-line shrink-0" />
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{c.cliente_nombre ?? "Sin nombre"}</p>
                      <p className="text-xs text-ink-3 truncate">
                        {servicioN ?? "Servicio"}{barberoN ? ` · ${barberoN}` : ""}
                      </p>
                    </div>
                    {/* Estado */}
                    <div className={`shrink-0 w-2 h-2 rounded-full ${
                      c.estado === "confirmada" ? "bg-blue-400" : "bg-amber-400"
                    }`} />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Acciones rápidas ───────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-bold text-ink-3 uppercase tracking-widest mb-3">Acciones rápidas</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ACCIONES.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className={`group flex flex-col gap-3 rounded-2xl border ${a.border} ${a.bg} p-4 hover:scale-[1.02] active:scale-95 transition-all`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${a.bg} border ${a.border}`}>
                  <a.icon className={`w-4.5 h-4.5 ${a.iconCls}`} style={{ width: 18, height: 18 }} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-ink group-hover:text-inherit">{a.title}</p>
                  <p className="text-[11px] text-ink-4 leading-snug mt-0.5">{a.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Upgrade banner ─────────────────────────────────────────────────── */}
        {!estadoSub.esPro && (
          <div className={`rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${
            estadoSub.expirada ? "border-red-500/30 bg-red-950/20" : "border-gold/20 bg-gradient-to-br from-gold/8 to-transparent"
          }`}>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              estadoSub.expirada ? "bg-red-500/15" : "bg-gold/15"
            }`}>
              <Star className={`w-5 h-5 ${estadoSub.expirada ? "text-red-400" : "text-gold"}`} />
            </div>
            <div className="flex-1">
              <p className="font-bold mb-0.5">
                {estadoSub.expirada ? "Tu trial ha terminado" : estadoSub.esTrial ? `Trial activo · ${estadoSub.diasRestantes} días restantes` : "Plan gratuito"}
              </p>
              <p className="text-xs text-ink-3">Barberos ilimitados, reportes detallados y página pública de agendamiento.</p>
            </div>
            <Link
              href="/dashboard/upgrade"
              className={`shrink-0 rounded-xl px-5 py-2.5 text-sm font-bold text-center transition-all hover:scale-[1.02] active:scale-95 ${
                estadoSub.expirada
                  ? "bg-red-500 text-white hover:bg-red-400"
                  : "bg-gold text-zinc-950 hover:bg-amber-400 shadow-lg shadow-gold/20"
              }`}
            >
              {estadoSub.expirada ? "Reactivar →" : "Upgrade a Pro →"}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Stat card component ───────────────────────────────────────────────────────

const ACCENT_STYLES = {
  blue:    { bg: "bg-blue-500/10",    border: "border-blue-500/20",    icon: "text-blue-400",    num: "text-blue-400"    },
  amber:   { bg: "bg-amber-500/10",   border: "border-amber-500/20",   icon: "text-amber-400",   num: "text-amber-400"   },
  violet:  { bg: "bg-violet-500/10",  border: "border-violet-500/20",  icon: "text-violet-400",  num: "text-violet-400"  },
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: "text-emerald-400", num: "text-emerald-400" },
} as const;

function StatCard({
  icon, value, label, href, accent,
}: {
  icon: React.ReactNode; value: number; label: string; href: string;
  accent: keyof typeof ACCENT_STYLES;
}) {
  const s = ACCENT_STYLES[accent];
  return (
    <Link
      href={href}
      className={`group rounded-2xl border ${s.border} ${s.bg} p-4 flex flex-col gap-2 hover:scale-[1.02] active:scale-95 transition-all`}
    >
      <div className={`${s.icon}`}>{icon}</div>
      <div>
        <p className={`text-3xl font-extrabold leading-none ${s.num}`}>{value}</p>
        <p className="text-xs text-ink-3 mt-1 font-medium">{label}</p>
      </div>
    </Link>
  );
}
