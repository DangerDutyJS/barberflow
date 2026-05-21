"use client";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getEstadoSuscripcion } from "@/lib/subscriptions";
import ThemeToggle from "@/components/ThemeToggle";
import type { Suscripcion } from "@/types/database";
import {
  Scissors, LayoutDashboard, Calendar, Plus, Users,
  Settings, Clock, BarChart2, Star, LogOut, Menu, X,
} from "lucide-react";

// ── Nav config ────────────────────────────────────────────────────────────────

const NAV_MAIN = [
  { href: "/dashboard",             label: "Dashboard",  icon: LayoutDashboard, exact: true  },
  { href: "/dashboard/citas",       label: "Citas",      icon: Calendar,        exact: false },
  { href: "/dashboard/citas/nueva", label: "Nueva cita", icon: Plus,            exact: true  },
  { href: "/dashboard/barberos",    label: "Barberos",   icon: Users,           exact: false },
  { href: "/dashboard/servicios",   label: "Servicios",  icon: Scissors,        exact: false },
  { href: "/dashboard/horarios",    label: "Horarios",   icon: Clock,           exact: false },
  { href: "/dashboard/reportes",    label: "Reportes",   icon: BarChart2,       exact: false },
];

const NAV_SETTINGS = [
  { href: "/dashboard/configuracion", label: "Configuración", icon: Settings },
  { href: "/dashboard/upgrade",       label: "Upgrade Pro",   icon: Star     },
];

const BOTTOM_TABS = [
  { href: "/dashboard",             label: "Inicio",   icon: LayoutDashboard, exact: true  },
  { href: "/dashboard/citas",       label: "Citas",    icon: Calendar,        exact: false },
  { href: "/dashboard/citas/nueva", label: "Nueva",    icon: Plus,            exact: true,  fab: true },
  { href: "/dashboard/barberos",    label: "Equipo",   icon: Users,           exact: false },
  { href: "/dashboard/servicios",   label: "Servicios",icon: Scissors,        exact: false },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function isActive(pathname: string, href: string, exact: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase() || "?";
}

// ── Sidebar nav item ──────────────────────────────────────────────────────────

function SideItem({
  href, label, Icon, active, onClick,
}: {
  href: string; label: string; Icon: React.ElementType; active: boolean; onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active
          ? "bg-gold/10 text-gold"
          : "text-ink-3 hover:bg-chip hover:text-ink"
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gold rounded-r-full" />
      )}
      <Icon className="w-[18px] h-[18px] shrink-0" />
      <span className="flex-1 truncate">{label}</span>
    </Link>
  );
}

// ── Shell ─────────────────────────────────────────────────────────────────────

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();

  const [barberiaId,   setBarberiaId]   = useState<string | null>(null);
  const [barberiaNombre, setBarberiaNombre] = useState("");
  const [userName,     setUserName]     = useState("");
  const [avatarUrl,    setAvatarUrl]    = useState<string | null>(null);
  const [suscripcion,  setSuscripcion]  = useState<Suscripcion | null>(null);
  const [drawerOpen,   setDrawerOpen]   = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserName(user.user_metadata?.full_name || user.email?.split("@")[0] || "");
      setAvatarUrl(user.user_metadata?.avatar_url ?? null);
      const { data: bar } = await supabase
        .from("barberias").select("id, nombre").eq("owner_id", user.id).single();
      if (!bar) return;
      setBarberiaId(bar.id);
      setBarberiaNombre(bar.nombre);
      const { data: sub } = await supabase
        .from("suscripciones").select("*").eq("barberia_id", bar.id).single();
      if (sub) setSuscripcion(sub as Suscripcion);
    })();
  }, []);

  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const estado = getEstadoSuscripcion(suscripcion);
  const ini    = initials(userName);

  // Avatar component reused in several places
  function Avatar({ size = 9 }: { size?: number }) {
    const cls = `w-${size} h-${size} rounded-xl shrink-0 object-cover`;
    return avatarUrl
      ? <img src={avatarUrl} alt={userName} className={cls} />
      : <div className={`w-${size} h-${size} rounded-xl bg-gold/20 border border-gold/25 flex items-center justify-center text-gold font-bold text-sm shrink-0`}>{ini}</div>;
  }

  return (
    <>
      {/* ── Desktop Sidebar ────────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-64 z-40 border-r border-line bg-card">

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-[64px] border-b border-line shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gold flex items-center justify-center shrink-0">
            <Scissors className="w-4 h-4 text-zinc-950" />
          </div>
          <div className="min-w-0">
            <p className="font-extrabold text-base leading-tight">
              <span className="text-ink">Barber</span><span className="text-gold">Flow</span>
            </p>
            {barberiaNombre && (
              <p className="text-[10px] text-ink-4 truncate leading-tight">{barberiaNombre}</p>
            )}
          </div>
        </div>

        {/* Nav main */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          <p className="text-[10px] font-semibold text-ink-4 uppercase tracking-widest px-3 mb-2">Principal</p>
          {NAV_MAIN.map((item) => (
            <SideItem
              key={item.href}
              href={item.href}
              label={item.label}
              Icon={item.icon}
              active={isActive(pathname, item.href, item.exact)}
            />
          ))}

          <div className="my-3 h-px bg-line" />
          <p className="text-[10px] font-semibold text-ink-4 uppercase tracking-widest px-3 mb-2">Ajustes</p>
          {NAV_SETTINGS.map((item) => (
            <SideItem
              key={item.href}
              href={item.href}
              label={item.label}
              Icon={item.icon}
              active={isActive(pathname, item.href, false)}
            />
          ))}
        </nav>

        {/* Upgrade banner */}
        {!estado.esPro && (
          <div className="px-3 pb-3">
            <Link
              href="/dashboard/upgrade"
              className="flex items-center gap-2.5 rounded-xl bg-gradient-to-br from-gold/15 to-amber-700/10 border border-gold/20 px-3 py-3 hover:from-gold/25 transition-all"
            >
              <Star className="w-4 h-4 text-gold shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-gold leading-tight">
                  {estado.esTrial ? `Trial · ${estado.diasRestantes}d restantes` : "Plan gratuito"}
                </p>
                <p className="text-[10px] text-ink-3 leading-tight">Desbloquea todo con Pro</p>
              </div>
            </Link>
          </div>
        )}

        {/* User bar */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-t border-line shrink-0">
          <Avatar size={9} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate leading-tight">{userName || "Usuario"}</p>
            <p className="text-[10px] text-ink-4 leading-tight">Admin</p>
          </div>
          <ThemeToggle />
          <button
            onClick={handleSignOut}
            title="Cerrar sesión"
            className="p-1.5 rounded-lg text-ink-3 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ── Mobile Top Header ──────────────────────────────────────────────── */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 h-14 bg-card/95 backdrop-blur-xl border-b border-line">
        <div className="flex items-center h-full px-4 gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gold flex items-center justify-center shrink-0">
              <Scissors className="w-3.5 h-3.5 text-zinc-950" />
            </div>
            <span className="font-extrabold text-sm">
              <span className="text-ink">Barber</span><span className="text-gold">Flow</span>
            </span>
          </Link>

          <ThemeToggle />

          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-chip border border-line text-ink-2 hover:text-gold transition-colors"
          >
            <Menu className="w-[18px] h-[18px]" />
          </button>
        </div>
      </header>

      {/* ── Mobile Drawer (right panel) ────────────────────────────────────── */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 w-[280px] flex flex-col bg-card border-l border-line">
            {/* Drawer header */}
            <div className="flex items-center gap-3 px-4 h-14 border-b border-line shrink-0">
              <Avatar size={8} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate leading-tight">{userName}</p>
                <p className="text-[10px] text-ink-4 truncate leading-tight">{barberiaNombre || "Mi barbería"}</p>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-lg text-ink-3 hover:text-ink hover:bg-chip transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
              <p className="text-[10px] font-semibold text-ink-4 uppercase tracking-widest px-3 mb-2">Principal</p>
              {NAV_MAIN.map((item) => (
                <SideItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  Icon={item.icon}
                  active={isActive(pathname, item.href, item.exact)}
                  onClick={() => setDrawerOpen(false)}
                />
              ))}
              <div className="my-3 h-px bg-line" />
              <p className="text-[10px] font-semibold text-ink-4 uppercase tracking-widest px-3 mb-2">Ajustes</p>
              {NAV_SETTINGS.map((item) => (
                <SideItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  Icon={item.icon}
                  active={isActive(pathname, item.href, false)}
                  onClick={() => setDrawerOpen(false)}
                />
              ))}
            </nav>

            {/* Drawer footer */}
            <div className="px-3 py-4 border-t border-line space-y-1 shrink-0">
              {!estado.esPro && (
                <Link
                  href="/dashboard/upgrade"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl bg-gold/10 border border-gold/20 px-3 py-2.5 mb-2"
                >
                  <Star className="w-4 h-4 text-gold shrink-0" />
                  <span className="text-xs font-bold text-gold">Upgrade a Pro →</span>
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="md:pl-64 pt-14 md:pt-0 pb-20 md:pb-0 min-h-screen">
        {children}
      </div>

      {/* ── Mobile Bottom Nav ──────────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-card/95 backdrop-blur-xl border-t border-line">
        <div className="flex items-center h-full">
          {BOTTOM_TABS.map((tab) => {
            const active = isActive(pathname, tab.href, tab.exact);
            const Icon   = tab.icon;
            if ("fab" in tab && tab.fab) {
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className="flex-1 flex flex-col items-center justify-center gap-0.5"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all -mt-4 ${
                    active ? "bg-amber-400 shadow-amber-400/40" : "bg-gold shadow-gold/30"
                  }`}>
                    <Icon className="w-5 h-5 text-zinc-950" />
                  </div>
                  <span className={`text-[9px] font-semibold mt-0.5 ${active ? "text-gold" : "text-ink-4"}`}>
                    {tab.label}
                  </span>
                </Link>
              );
            }
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 flex flex-col items-center justify-center gap-1 relative transition-colors ${
                  active ? "text-gold" : "text-ink-4"
                }`}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-[2px] bg-gold rounded-full" />
                )}
                <Icon className="w-[20px] h-[20px]" />
                <span className="text-[9px] font-semibold leading-none">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
