export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";
import ThemeToggle from "@/components/ThemeToggle";
import { getEstadoSuscripcion } from "@/lib/subscriptions";
import type { Suscripcion } from "@/types/database";
import { Scissors, Calendar, BarChart2, Users, Star, Clock, TrendingUp, Settings } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Verificar si tiene barbería — si no, ir al onboarding
  const { data: barberia } = await supabase
    .from("barberias")
    .select("id, nombre, slug, direccion, telefono")
    .eq("owner_id", user.id)
    .single();

  if (!barberia) redirect("/onboarding");

  // Usamos service client para suscripciones — la RLS con subquery a barberias
  // falla en contexto servidor; la propiedad ya está verificada arriba.
  const { data: suscripcion } = await createServiceClient()
    .from("suscripciones")
    .select("plan, estado, fecha_fin, ciclo_facturacion, wompi_referencia, wompi_transaction_id")
    .eq("barberia_id", barberia.id)
    .single();

  const estadoSub = getEstadoSuscripcion(suscripcion as Suscripcion | null);

  // Estadísticas básicas
  const [{ count: totalCitas }, { count: citasHoy }, { count: totalBarberos }] =
    await Promise.all([
      supabase.from("citas").select("*", { count: "exact", head: true }).eq("barberia_id", barberia.id),
      supabase.from("citas").select("*", { count: "exact", head: true })
        .eq("barberia_id", barberia.id)
        .eq("fecha", new Date().toISOString().split("T")[0]),
      supabase.from("barberos").select("*", { count: "exact", head: true })
        .eq("barberia_id", barberia.id).eq("activo", true),
    ]);

  const nombre = user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuario";
  const avatar = user.user_metadata?.avatar_url;

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
            <span className="hidden sm:block text-line-2">|</span>
            <span className="hidden sm:block text-sm text-ink-2">{barberia.nombre}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {avatar ? (
                <img src={avatar} alt={nombre} className="w-8 h-8 rounded-full border border-line-2" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-gold text-sm font-bold">
                  {nombre[0].toUpperCase()}
                </div>
              )}
              <span className="text-sm text-ink-2 hidden sm:block">{nombre}</span>
            </div>
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Banner de trial / suscripción vencida */}
      {estadoSub.mostrarBannerTrial && (
        <div className={`border-b px-4 py-3 text-sm text-center ${
          estadoSub.expirada
            ? "border-red-900/50 bg-red-950/60 text-red-300"
            : estadoSub.diasRestantes !== null && estadoSub.diasRestantes <= 2
            ? "border-amber-900/50 bg-amber-950/60 text-amber-300"
            : "border-gold/20 bg-gold/5 text-ink-2"
        }`}>
          {estadoSub.expirada ? (
            <>
              Tu período de prueba ha terminado.{" "}
              <Link href="/dashboard/upgrade" className="font-semibold underline underline-offset-2">
                Activa tu plan para continuar →
              </Link>
            </>
          ) : (
            <>
              Trial activo ·{" "}
              <span className="font-semibold">
                {estadoSub.diasRestantes} día{estadoSub.diasRestantes !== 1 ? "s" : ""} restante{estadoSub.diasRestantes !== 1 ? "s" : ""}
              </span>
              {" "}—{" "}
              <Link href="/dashboard/upgrade" className="font-semibold underline underline-offset-2">
                Upgrade a Pro →
              </Link>
            </>
          )}
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Bienvenida */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">
            Bienvenido, <span className="text-gold">{nombre.split(" ")[0]}</span>
          </h1>
          <p className="text-ink-3 text-sm">
            Panel de control · <span className="text-ink-2">{barberia.nombre}</span>
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Citas hoy",        value: citasHoy      ?? 0, icon: <Calendar className="w-6 h-6 text-blue-400" />,   color: "text-blue-400"   },
            { label: "Total citas",      value: totalCitas    ?? 0, icon: <BarChart2 className="w-6 h-6 text-purple-400" />, color: "text-purple-400" },
            { label: "Barberos activos", value: totalBarberos ?? 0, icon: <Users className="w-6 h-6 text-green-400" />,      color: "text-green-400"  },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-line bg-card p-5">
              <div className="mb-2">{s.icon}</div>
              <div className={`text-2xl font-bold mb-0.5 ${s.color}`}>{s.value}</div>
              <div className="text-xs text-ink-3">{s.label}</div>
            </div>
          ))}

          {/* Plan activo — clickeable */}
          <Link
            href="/dashboard/upgrade"
            className="group rounded-2xl border border-line bg-card p-5 transition-all hover:border-gold/40"
          >
            <div className="mb-2"><Star className="w-6 h-6 text-gold" /></div>
            <div className={`text-2xl font-bold mb-0.5 ${estadoSub.expirada && !estadoSub.esPro ? "text-red-400" : "text-gold"}`}>
              {estadoSub.esPro
                ? "Pro"
                : estadoSub.esTrial && estadoSub.diasRestantes !== null
                ? `${estadoSub.diasRestantes}d`
                : estadoSub.expirada
                ? "Vencido"
                : "Trial"}
            </div>
            <div className="text-xs text-ink-3">Plan activo</div>
          </Link>
        </div>

        {/* Banner upgrade (solo cuando no es Pro) */}
        {!estadoSub.esPro && (
          <div className={`rounded-2xl border p-5 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
            estadoSub.expirada
              ? "border-red-500/30 bg-red-950/30"
              : "border-gold/20 bg-gold/5"
          }`}>
            <div>
              <p className={`font-semibold mb-0.5 ${estadoSub.expirada ? "text-red-300" : "text-ink"}`}>
                {estadoSub.expirada
                  ? "Tu período de prueba ha terminado"
                  : estadoSub.esTrial && estadoSub.diasRestantes !== null
                  ? `Trial · ${estadoSub.diasRestantes} día${estadoSub.diasRestantes !== 1 ? "s" : ""} restante${estadoSub.diasRestantes !== 1 ? "s" : ""}`
                  : "Estás en el plan gratuito"}
              </p>
              <p className="text-xs text-ink-3">
                {estadoSub.expirada
                  ? "Activa un plan para seguir gestionando tu barbería sin interrupciones."
                  : "Desbloquea barberos ilimitados, citas, reportes y tu página pública."}
              </p>
            </div>
            <Link
              href="/dashboard/upgrade"
              className="shrink-0 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-all hover:scale-[1.02] text-center"
            >
              {estadoSub.expirada ? "Reactivar plan →" : "Actualizar a Pro →"}
            </Link>
          </div>
        )}

        {/* Acciones rápidas */}
        <h2 className="text-sm font-semibold text-ink-2 uppercase tracking-widest mb-4">Acciones rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {[
            { icon: <Calendar className="w-6 h-6" />,    title: "Nueva cita",  desc: "Agenda una cita manualmente",  href: "/dashboard/citas/nueva",   soon: false },
            { icon: <Users className="w-6 h-6" />,       title: "Mis barberos", desc: "Gestiona tu equipo",          href: "/dashboard/barberos",      soon: false },
            { icon: <Scissors className="w-6 h-6" />,    title: "Servicios",   desc: "Precios y duración de cortes", href: "/dashboard/servicios",     soon: false },
            { icon: <Clock className="w-6 h-6" />,       title: "Horarios",    desc: "Configura disponibilidad",     href: "/dashboard/horarios",      soon: true  },
            { icon: <TrendingUp className="w-6 h-6" />,  title: "Reportes",    desc: "Ingresos y estadísticas",      href: "/dashboard/reportes",      soon: true  },
            { icon: <Settings className="w-6 h-6" />,    title: "Mi barbería", desc: "Editar info y perfil",         href: "/dashboard/configuracion", soon: false },
          ].map((a) => (
            a.soon ? (
              <div key={a.title} className="group rounded-2xl border border-line bg-card p-5 opacity-50">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-ink-3">{a.icon}</span>
                  <span className="rounded-full bg-chip px-2 py-0.5 text-xs text-ink-3">Próximamente</span>
                </div>
                <h3 className="font-semibold mb-1 text-sm">{a.title}</h3>
                <p className="text-xs text-ink-3">{a.desc}</p>
              </div>
            ) : (
              <Link key={a.title} href={a.href} className="group rounded-2xl border border-line bg-card p-5 transition-all hover:border-gold/40">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-ink-2 group-hover:text-gold transition-colors">{a.icon}</span>
                </div>
                <h3 className="font-semibold mb-1 text-sm group-hover:text-gold transition-colors">{a.title}</h3>
                <p className="text-xs text-ink-3">{a.desc}</p>
              </Link>
            )
          ))}
        </div>

        {/* Info de la barbería */}
        <div className="rounded-2xl border border-line bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Tu barbería</h2>
            <Link href="/dashboard/configuracion" className="text-xs text-gold hover:text-gold-light transition-colors">
              Editar →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-ink-3 mb-1">Nombre</p>
              <p className="text-ink font-medium">{barberia.nombre}</p>
            </div>
            <div>
              <p className="text-ink-3 mb-1">Link público</p>
              <p className="text-gold font-mono text-xs">/b/{barberia.slug}</p>
            </div>
            <div>
              <p className="text-ink-3 mb-1">Teléfono</p>
              <p className="text-ink">{barberia.telefono || <span className="text-ink-4">No configurado</span>}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
