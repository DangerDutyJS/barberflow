export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import Link from "next/link";
import { getEstadoSuscripcion } from "@/lib/subscriptions";
import type { Suscripcion } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar, BarChart2, Users, Star, Clock, Plus,
  Scissors, ChevronRight, TrendingUp, Settings, AlertCircle,
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
      .limit(5),
  ]);

  const nombre = user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuario";

  function formatHora(h: string) { return h.slice(0, 5); }
  function formatFecha(f: string) {
    if (f === hoy) return "Hoy";
    return new Date(f + "T12:00:00").toLocaleDateString("es-CO", {
      weekday: "short", day: "numeric", month: "short",
    });
  }

  const ACCIONES = [
    { icon: Calendar,   title: "Citas",         desc: "Ver agenda del día",  href: "/dashboard/citas"          },
    { icon: Plus,       title: "Nueva cita",    desc: "Agendar manualmente", href: "/dashboard/citas/nueva"    },
    { icon: Users,      title: "Barberos",      desc: "Gestiona tu equipo",  href: "/dashboard/barberos"       },
    { icon: Scissors,   title: "Servicios",     desc: "Precios y duración",  href: "/dashboard/servicios"      },
    { icon: Clock,      title: "Horarios",      desc: "Disponibilidad",      href: "/dashboard/horarios"       },
    { icon: TrendingUp, title: "Reportes",      desc: "Ingresos y stats",    href: "/dashboard/reportes"       },
    { icon: Settings,   title: "Configuración", desc: "Perfil de barbería",  href: "/dashboard/configuracion"  },
    { icon: Star,       title: "Upgrade Pro",   desc: "Desbloquea todo",     href: "/dashboard/upgrade"        },
  ];

  return (
    <div className="flex flex-col gap-6">

      {/* ── Trial / Expired banner ─────────────────────────────────────────── */}
      {estadoSub.mostrarBannerTrial && (
        <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
          estadoSub.expirada
            ? "border-destructive/50 bg-destructive/10 text-destructive"
            : "border-primary/30 bg-primary/5 text-foreground"
        }`}>
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            {estadoSub.expirada
              ? "Tu período de prueba ha vencido."
              : `Trial activo · ${estadoSub.diasRestantes} día${estadoSub.diasRestantes !== 1 ? "s" : ""} restante${estadoSub.diasRestantes !== 1 ? "s" : ""}.`}
          </span>
          <Link href="/dashboard/upgrade" className="ml-auto shrink-0 font-semibold underline underline-offset-2 hover:no-underline">
            {estadoSub.expirada ? "Reactivar →" : "Upgrade a Pro →"}
          </Link>
        </div>
      )}

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Bienvenido, {nombre.split(" ")[0]} · {barberia.nombre}
          </p>
        </div>
        <Link
          href="/dashboard/citas/nueva"
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Nueva cita
        </Link>
      </div>

      {/* ── Stats row ─────────────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Citas hoy"
          value={citasHoy ?? 0}
          description="Citas agendadas para hoy"
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
          href="/dashboard/citas"
        />
        <StatCard
          title="Pendientes"
          value={citasPendientes ?? 0}
          description="Por confirmar o completar"
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          href="/dashboard/citas"
        />
        <StatCard
          title="Barberos activos"
          value={totalBarberos ?? 0}
          description="Miembros del equipo"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          href="/dashboard/barberos"
        />
        <StatCard
          title="Total citas"
          value={totalCitas ?? 0}
          description="Historial completo"
          icon={<BarChart2 className="h-4 w-4 text-muted-foreground" />}
          href="/dashboard/reportes"
        />
      </div>

      {/* ── Próximas citas + Acciones rápidas ─────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

        {/* Próximas citas */}
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Próximas citas</CardTitle>
            <Link
              href="/dashboard/citas"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Ver todas <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {proximasCitas && proximasCitas.length > 0 ? (
              <div className="space-y-0">
                {proximasCitas.map((c: {
                  id: string; fecha: string; hora_inicio: string; cliente_nombre: string | null; estado: string;
                  barbero: { nombre: string }[] | { nombre: string } | null;
                  servicio: { nombre: string }[] | { nombre: string } | null;
                }) => {
                  const barberoN  = Array.isArray(c.barbero)  ? c.barbero[0]?.nombre  : c.barbero?.nombre;
                  const servicioN = Array.isArray(c.servicio) ? c.servicio[0]?.nombre : c.servicio?.nombre;
                  return (
                    <div key={c.id} className="flex items-center gap-4 py-3 border-b last:border-0">
                      <div className="w-12 shrink-0">
                        <p className="text-[10px] text-muted-foreground uppercase font-medium">{formatFecha(c.fecha)}</p>
                        <p className="text-sm font-bold text-primary">{formatHora(c.hora_inicio)}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.cliente_nombre ?? "Sin nombre"}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {servicioN ?? "Servicio"}{barberoN ? ` · ${barberoN}` : ""}
                        </p>
                      </div>
                      <Badge variant={c.estado === "confirmada" ? "info" : "warning"}>
                        {c.estado === "confirmada" ? "Confirmada" : "Pendiente"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No hay citas próximas</p>
                <Link
                  href="/dashboard/citas/nueva"
                  className="mt-3 text-xs text-primary hover:underline"
                >
                  Agendar una cita →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Acciones rápidas */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Acciones rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {ACCIONES.map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="flex flex-col gap-2 rounded-lg border p-3 hover:bg-accent hover:border-accent-foreground/10 transition-colors group"
                >
                  <a.icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <div>
                    <p className="text-xs font-semibold leading-tight">{a.title}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 hidden sm:block">{a.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Upgrade banner ────────────────────────────────────────────────── */}
      {!estadoSub.esPro && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col sm:flex-row sm:items-center gap-4 p-6">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {estadoSub.expirada ? "Tu trial ha terminado" : estadoSub.esTrial ? `Trial activo · ${estadoSub.diasRestantes} días` : "Plan gratuito"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Barberos ilimitados, reportes detallados y página pública de agendamiento.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/upgrade"
              className="shrink-0 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors text-center"
            >
              {estadoSub.expirada ? "Reactivar plan →" : "Upgrade a Pro →"}
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  title, value, description, icon, href,
}: {
  title: string; value: number; description: string;
  icon: React.ReactNode; href: string;
}) {
  return (
    <Link href={href}>
      <Card className="hover:bg-accent/30 transition-colors cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
