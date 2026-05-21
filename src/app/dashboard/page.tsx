export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import Link from "next/link";
import { getEstadoSuscripcion } from "@/lib/subscriptions";
import type { Suscripcion } from "@/types/database";
import {
  Calendar, BarChart2, Users, Star, Clock,
  TrendingUp, Settings, Plus, Scissors, ChevronRight,
} from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: barberia } = await supabase
    .from("barberias")
    .select("id, nombre, slug, direccion, telefono, email")
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
      .select("id, fecha, hora_inicio, hora_fin, cliente_nombre, estado, barbero:barberos(nombre), servicio:servicios(nombre, precio)")
      .eq("barberia_id", barberia.id)
      .in("estado", ["pendiente", "confirmada"])
      .gte("fecha", hoy)
      .order("fecha").order("hora_inicio")
      .limit(5),
  ]);

  const nombre = user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuario";

  const ACCIONES = [
    { icon: Calendar,   title: "Citas",         desc: "Lista de citas del día",       href: "/dashboard/citas",          color: "text-blue-400"   },
    { icon: Plus,       title: "Nueva cita",     desc: "Agendar cita manualmente",     href: "/dashboard/citas/nueva",    color: "text-emerald-400"},
    { icon: Users,      title: "Barberos",       desc: "Gestiona tu equipo",           href: "/dashboard/barberos",       color: "text-violet-400" },
    { icon: Scissors,   title: "Servicios",      desc: "Precios y duración",           href: "/dashboard/servicios",      color: "text-amber-400"  },
    { icon: Clock,      title: "Horarios",       desc: "Disponibilidad semanal",       href: "/dashboard/horarios",       color: "text-cyan-400"   },
    { icon: TrendingUp, title: "Reportes",       desc: "Ingresos y estadísticas",      href: "/dashboard/reportes",       color: "text-pink-400"   },
    { icon: Settings,   title: "Configuración",  desc: "Info y perfil de tu barbería", href: "/dashboard/configuracion",  color: "text-zinc-400"   },
    { icon: Star,       title: "Upgrade Pro",    desc: "Desbloquea todo",              href: "/dashboard/upgrade",        color: "text-gold"       },
  ];

  function formatHora(h: string) { return h.slice(0, 5); }
  function formatFecha(f: string) {
    const d = new Date(f + "T12:00:00");
    if (f === hoy) return "Hoy";
    return d.toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short" });
  }

  return (
    <div className="min-h-screen bg-base text-ink">
      {/* Trial / vencido banner */}
      {estadoSub.mostrarBannerTrial && (
        <div className={`px-4 py-2.5 text-sm text-center ${
          estadoSub.expirada
            ? "bg-red-950/70 text-red-300 border-b border-red-900/40"
            : estadoSub.diasRestantes !== null && estadoSub.diasRestantes <= 2
            ? "bg-amber-950/70 text-amber-300 border-b border-amber-900/40"
            : "bg-gold/8 text-ink-2 border-b border-gold/15"
        }`}>
          {estadoSub.expirada ? (
            <>Tu trial venció. <Link href="/dashboard/upgrade" className="font-semibold underline underline-offset-2">Activa tu plan →</Link></>
          ) : (
            <>Trial · <strong>{estadoSub.diasRestantes}d</strong> restante{estadoSub.diasRestantes !== 1 ? "s" : ""} — <Link href="/dashboard/upgrade" className="font-semibold underline underline-offset-2">Upgrade a Pro →</Link></>
          )}
        </div>
      )}

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        {/* Bienvenida */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">
            Hola, <span className="text-gold">{nombre.split(" ")[0]}</span>
          </h1>
          <p className="text-ink-3 text-sm">{barberia.nombre}</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard
            icon={<Calendar className="w-5 h-5 text-blue-400" />}
            value={citasHoy ?? 0}
            label="Hoy"
            href="/dashboard/citas"
          />
          <StatCard
            icon={<Clock className="w-5 h-5 text-amber-400" />}
            value={citasPendientes ?? 0}
            label="Pendientes"
            href="/dashboard/citas"
          />
          <StatCard
            icon={<Users className="w-5 h-5 text-violet-400" />}
            value={totalBarberos ?? 0}
            label="Barberos"
            href="/dashboard/barberos"
          />
          <StatCard
            icon={<BarChart2 className="w-5 h-5 text-emerald-400" />}
            value={totalCitas ?? 0}
            label="Total citas"
            href="/dashboard/reportes"
          />
        </div>

        {/* Próximas citas */}
        {proximasCitas && proximasCitas.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-ink-2 uppercase tracking-widest">Próximas citas</h2>
              <Link href="/dashboard/citas" className="text-xs text-gold hover:text-amber-400 transition-colors flex items-center gap-1">
                Ver todas <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="rounded-2xl border border-line bg-card overflow-hidden divide-y divide-line">
              {proximasCitas.map((c: {
                id: string; fecha: string; hora_inicio: string; hora_fin: string;
                cliente_nombre: string | null; estado: string;
                barbero: { nombre: string }[] | { nombre: string } | null;
                servicio: { nombre: string; precio: number }[] | { nombre: string; precio: number } | null;
              }) => {
                const barberoNombre = Array.isArray(c.barbero) ? c.barbero[0]?.nombre : c.barbero?.nombre;
                const servicioNombre = Array.isArray(c.servicio) ? c.servicio[0]?.nombre : c.servicio?.nombre;
                return (
                <div key={c.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="shrink-0 text-center w-12">
                    <p className="text-[10px] text-ink-4 uppercase">{formatFecha(c.fecha)}</p>
                    <p className="text-gold font-bold text-sm">{formatHora(c.hora_inicio)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.cliente_nombre ?? "Sin nombre"}</p>
                    <p className="text-xs text-ink-3 truncate">
                      {servicioNombre ?? "Servicio"}{barberoNombre ? ` · ${barberoNombre}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      c.estado === "confirmada"
                        ? "bg-blue-500/15 text-blue-400"
                        : "bg-amber-500/15 text-amber-400"
                    }`}>
                      {c.estado === "confirmada" ? "Confirmada" : "Pendiente"}
                    </span>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Acciones rápidas */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-ink-2 uppercase tracking-widest mb-3">Acciones rápidas</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {ACCIONES.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="group rounded-2xl border border-line bg-card p-4 transition-all hover:border-gold/30 hover:bg-card active:scale-95"
              >
                <div className={`mb-3 ${a.color} group-hover:scale-110 transition-transform inline-block`}>
                  <a.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm mb-0.5 group-hover:text-gold transition-colors">{a.title}</h3>
                <p className="text-[11px] text-ink-4 leading-snug">{a.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Upgrade banner */}
        {!estadoSub.esPro && (
          <div className={`rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${
            estadoSub.expirada ? "border-red-500/30 bg-red-950/20" : "border-gold/20 bg-gold/5"
          }`}>
            <Star className={`w-8 h-8 shrink-0 ${estadoSub.expirada ? "text-red-400" : "text-gold"}`} />
            <div className="flex-1">
              <p className="font-semibold mb-0.5">
                {estadoSub.expirada ? "Tu trial ha terminado" : estadoSub.esTrial ? `Trial activo · ${estadoSub.diasRestantes} días` : "Plan gratuito"}
              </p>
              <p className="text-xs text-ink-3">Desbloquea barberos ilimitados, reportes y tu página pública de agendamiento.</p>
            </div>
            <Link
              href="/dashboard/upgrade"
              className="shrink-0 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-all text-center"
            >
              {estadoSub.expirada ? "Reactivar →" : "Upgrade a Pro →"}
            </Link>
          </div>
        )}

        {/* Info barbería */}
        <div className="mt-6 rounded-2xl border border-line bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm">Tu barbería</h2>
            <Link href="/dashboard/configuracion" className="text-xs text-gold hover:text-amber-400 flex items-center gap-1 transition-colors">
              Editar <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-[10px] text-ink-4 uppercase tracking-wider mb-1">Nombre</p>
              <p className="font-medium truncate">{barberia.nombre}</p>
            </div>
            <div>
              <p className="text-[10px] text-ink-4 uppercase tracking-wider mb-1">Link público</p>
              <p className="text-gold font-mono text-xs">/b/{barberia.slug}</p>
            </div>
            <div>
              <p className="text-[10px] text-ink-4 uppercase tracking-wider mb-1">Teléfono</p>
              <p className={barberia.telefono ? "" : "text-ink-4"}>
                {barberia.telefono || "No configurado"}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, value, label, href }: { icon: React.ReactNode; value: number; label: string; href: string }) {
  return (
    <Link href={href} className="group rounded-2xl border border-line bg-card p-4 transition-all hover:border-gold/30 active:scale-95">
      <div className="mb-2 group-hover:scale-110 transition-transform inline-block">{icon}</div>
      <div className="text-2xl font-bold mb-0.5">{value}</div>
      <div className="text-xs text-ink-3">{label}</div>
    </Link>
  );
}
