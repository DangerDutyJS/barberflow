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
  TrendingUp, ChevronRight,
} from "lucide-react";

// ── Nav config ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: "/dashboard",              label: "Dashboard",    icon: LayoutDashboard, exact: true  },
  { href: "/dashboard/citas",        label: "Citas",        icon: Calendar,        exact: false },
  { href: "/dashboard/citas/nueva",  label: "Nueva cita",   icon: Plus,            exact: true  },
  { href: "/dashboard/barberos",     label: "Barberos",     icon: Users,           exact: false },
  { href: "/dashboard/servicios",    label: "Servicios",    icon: Scissors,        exact: false },
  { href: "/dashboard/horarios",     label: "Horarios",     icon: Clock,           exact: false },
  { href: "/dashboard/reportes",     label: "Reportes",     icon: BarChart2,       exact: false },
];

const NAV_BOTTOM = [
  { href: "/dashboard/configuracion", label: "Configuración", icon: Settings },
  { href: "/dashboard/upgrade",       label: "Upgrade Pro",   icon: Star    },
];

const MOBILE_TABS = [
  { href: "/dashboard",           label: "Inicio",    icon: LayoutDashboard, exact: true  },
  { href: "/dashboard/citas",     label: "Citas",     icon: Calendar,        exact: false },
  { href: "/dashboard/barberos",  label: "Equipo",    icon: Users,           exact: false },
  { href: "/dashboard/servicios", label: "Servicios", icon: Scissors,        exact: false },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function isActive(pathname: string, href: string, exact: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function NavItem({
  href, label, Icon, active, onClick,
}: {
  href: string; label: string; Icon: React.ElementType;
  active: boolean; onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
        active
          ? "bg-gold/15 text-gold"
          : "text-ink-3 hover:text-ink hover:bg-chip"
      }`}
    >
      <Icon className={`w-4.5 h-4.5 shrink-0 ${active ? "text-gold" : "text-ink-3 group-hover:text-ink"}`} style={{ width: 18, height: 18 }} />
      {label}
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gold" />}
    </Link>
  );
}

// ── Shell ─────────────────────────────────────────────────────────────────────

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [barberia, setBarberia] = useState<{ nombre: string; slug: string } | null>(null);
  const [userName, setUserName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [suscripcion, setSuscripcion] = useState<Suscripcion | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserName(user.user_metadata?.full_name || user.email?.split("@")[0] || "");
      setAvatarUrl(user.user_metadata?.avatar_url ?? null);

      const { data: bar } = await supabase
        .from("barberias")
        .select("nombre, slug")
        .eq("owner_id", user.id)
        .single();
      if (bar) setBarberia(bar);

      if (bar) {
        const { data: sub } = await supabase
          .from("suscripciones")
          .select("*")
          .eq("barberia_id", (bar as { nombre: string; slug: string; id?: string } & { id: string }).id ?? "")
          .single();
        if (sub) setSuscripcion(sub as Suscripcion);
      }
    }
    cargar();
  }, []);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const estado = getEstadoSuscripcion(suscripcion);
  const initials = userName ? userName[0].toUpperCase() : "?";

  // Current page label for mobile header
  const allNavItems = [...NAV_ITEMS, ...NAV_BOTTOM];
  const currentItem = allNavItems.find((n) =>
    isActive(pathname, n.href, "exact" in n ? (n as { exact: boolean }).exact : false)
  );
  const pageLabel = currentItem?.label ?? "Dashboard";

  const drawerItems = [
    { href: "/dashboard/citas/nueva",   label: "Nueva cita",     icon: Plus     },
    { href: "/dashboard/horarios",      label: "Horarios",       icon: Clock    },
    { href: "/dashboard/reportes",      label: "Reportes",       icon: TrendingUp },
    { href: "/dashboard/configuracion", label: "Configuración",  icon: Settings },
    { href: "/dashboard/upgrade",       label: "Upgrade Pro",    icon: Star     },
  ];

  return (
    <div className="flex min-h-screen bg-base text-ink">

      {/* ── Desktop Sidebar ──────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-60 border-r border-line bg-card z-30">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-line">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center">
              <Scissors className="w-4 h-4 text-gold" />
            </div>
            <span className="font-bold text-base">
              <span className="text-ink">Barber</span>
              <span className="text-gold">Flow</span>
            </span>
          </Link>
          {barberia && (
            <p className="text-xs text-ink-4 mt-1.5 ml-[42px] truncate">{barberia.nombre}</p>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              Icon={item.icon}
              active={isActive(pathname, item.href, item.exact)}
            />
          ))}

          <div className="my-2 border-t border-line" />

          {NAV_BOTTOM.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              Icon={item.icon}
              active={isActive(pathname, item.href, false)}
            />
          ))}
        </nav>

        {/* Subscription badge */}
        {!estado.esPro && (
          <div className="px-3 mb-2">
            <Link
              href="/dashboard/upgrade"
              className="flex items-center gap-2 rounded-xl border border-gold/20 bg-gold/5 px-3 py-2.5 hover:bg-gold/10 transition-colors group"
            >
              <Star className="w-4 h-4 text-gold shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gold leading-tight">
                  {estado.esTrial ? `Trial · ${estado.diasRestantes}d` : "Plan gratuito"}
                </p>
                <p className="text-[10px] text-ink-4 leading-tight">Actualiza a Pro</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-ink-4 group-hover:text-gold transition-colors" />
            </Link>
          </div>
        )}

        {/* User + controls */}
        <div className="px-3 pb-4 pt-2 border-t border-line flex items-center gap-2">
          {avatarUrl ? (
            <img src={avatarUrl} alt={userName} className="w-8 h-8 rounded-full border border-line-2 shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center text-gold text-sm font-bold shrink-0">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{userName}</p>
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

      {/* ── Mobile Top Header ────────────────────────────────────────────── */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 z-30 border-b border-line bg-card/80 backdrop-blur-md flex items-center px-4 gap-3">
        <Link href="/dashboard" className="flex items-center gap-2 mr-auto">
          <div className="w-7 h-7 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center">
            <Scissors className="w-3.5 h-3.5 text-gold" />
          </div>
          <span className="font-bold text-sm">
            <span className="text-ink">Barber</span>
            <span className="text-gold">Flow</span>
          </span>
        </Link>

        <ThemeToggle />

        {/* Avatar */}
        {avatarUrl ? (
          <img src={avatarUrl} alt={userName} className="w-8 h-8 rounded-full border border-line-2" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center text-gold text-sm font-bold">
            {initials}
          </div>
        )}

        {/* Hamburger / Más */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-1.5 rounded-lg text-ink-2 hover:text-ink hover:bg-chip transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* ── Mobile Drawer ────────────────────────────────────────────────── */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Panel */}
          <div className="relative ml-auto w-72 h-full bg-card border-l border-line flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-line">
              <div>
                <p className="font-bold">{barberia?.nombre ?? "Mi barbería"}</p>
                <p className="text-xs text-ink-3">{userName}</p>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-lg text-ink-3 hover:text-ink hover:bg-chip transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
              {[...NAV_ITEMS, ...NAV_BOTTOM].map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  Icon={item.icon}
                  active={isActive(pathname, item.href, "exact" in item ? (item as {exact: boolean}).exact : false)}
                  onClick={() => setDrawerOpen(false)}
                />
              ))}
            </nav>

            {!estado.esPro && (
              <div className="px-3 mb-2">
                <Link
                  href="/dashboard/upgrade"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-2 rounded-xl border border-gold/20 bg-gold/5 px-3 py-2.5"
                >
                  <Star className="w-4 h-4 text-gold" />
                  <span className="text-xs font-semibold text-gold">
                    {estado.esTrial ? `Trial · ${estado.diasRestantes}d restantes` : "Actualiza a Pro"}
                  </span>
                </Link>
              </div>
            )}

            <div className="px-3 pb-6 pt-2 border-t border-line">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex-1 md:ml-60 pt-14 md:pt-0 pb-20 md:pb-0 min-w-0">
        {children}
      </div>

      {/* ── Mobile Bottom Nav ────────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 z-30 border-t border-line bg-card/90 backdrop-blur-md flex items-center">
        {MOBILE_TABS.map((tab) => {
          const active = isActive(pathname, tab.href, tab.exact);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors ${
                active ? "text-gold" : "text-ink-4"
              }`}
            >
              <Icon className="w-5 h-5" style={{ width: 20, height: 20 }} />
              <span className="text-[10px] font-medium">{tab.label}</span>
              {active && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-gold" />}
            </Link>
          );
        })}
        {/* Más button */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-ink-4"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-medium">Más</span>
        </button>
      </nav>
    </div>
  );
}
