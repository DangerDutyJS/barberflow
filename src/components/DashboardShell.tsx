"use client";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getEstadoSuscripcion } from "@/lib/subscriptions";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";
import type { Suscripcion } from "@/types/database";
import {
  Scissors, LayoutDashboard, Calendar, Plus, Users,
  Settings, Clock, BarChart2, Star, LogOut, Menu, X,
  ChevronRight,
} from "lucide-react";

// ── Nav config ────────────────────────────────────────────────────────────────

const NAV_GROUPS = [
  {
    label: "Principal",
    items: [
      { href: "/dashboard",             label: "Dashboard",  icon: LayoutDashboard, exact: true  },
      { href: "/dashboard/citas",       label: "Citas",      icon: Calendar,        exact: false },
      { href: "/dashboard/citas/nueva", label: "Nueva cita", icon: Plus,            exact: true  },
      { href: "/dashboard/barberos",    label: "Barberos",   icon: Users,           exact: false },
      { href: "/dashboard/servicios",   label: "Servicios",  icon: Scissors,        exact: false },
    ],
  },
  {
    label: "Gestión",
    items: [
      { href: "/dashboard/horarios", label: "Horarios", icon: Clock,     exact: false },
      { href: "/dashboard/reportes", label: "Reportes", icon: BarChart2, exact: false },
    ],
  },
  {
    label: "Cuenta",
    items: [
      { href: "/dashboard/configuracion", label: "Configuración", icon: Settings, exact: false },
      { href: "/dashboard/upgrade",       label: "Upgrade Pro",   icon: Star,     exact: false },
    ],
  },
];

const BOTTOM_TABS = [
  { href: "/dashboard",            label: "Inicio",   icon: LayoutDashboard, exact: true  },
  { href: "/dashboard/citas",      label: "Citas",    icon: Calendar,        exact: false },
  { href: "/dashboard/citas/nueva",label: "Nueva",    icon: Plus,            exact: true,  fab: true },
  { href: "/dashboard/barberos",   label: "Equipo",   icon: Users,           exact: false },
  { href: "/dashboard/servicios",  label: "Servicios",icon: Scissors,        exact: false },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function isActive(p: string, href: string, exact: boolean) {
  return exact ? p === href : (p === href || p.startsWith(href + "/"));
}

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase() || "?";
}

// ── Sidebar nav item ──────────────────────────────────────────────────────────

function NavItem({
  href, label, Icon, active, onClick,
}: {
  href: string; label: string; Icon: React.ElementType; active: boolean; onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
        active
          ? "bg-secondary text-foreground"
          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

// ── Shell ─────────────────────────────────────────────────────────────────────

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();

  const [barberiaNombre, setBarberiaNombre] = useState("");
  const [userName,       setUserName]       = useState("");
  const [userEmail,      setUserEmail]      = useState("");
  const [avatarUrl,      setAvatarUrl]      = useState<string | null>(null);
  const [suscripcion,    setSuscripcion]    = useState<Suscripcion | null>(null);
  const [mobileOpen,     setMobileOpen]     = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserName(user.user_metadata?.full_name || user.email?.split("@")[0] || "");
      setUserEmail(user.email ?? "");
      setAvatarUrl(user.user_metadata?.avatar_url ?? null);
      const { data: bar } = await supabase
        .from("barberias").select("id, nombre").eq("owner_id", user.id).single();
      if (!bar) return;
      setBarberiaNombre(bar.nombre);
      const { data: sub } = await supabase
        .from("suscripciones").select("*").eq("barberia_id", bar.id).single();
      if (sub) setSuscripcion(sub as Suscripcion);
    })();
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const estado   = getEstadoSuscripcion(suscripcion);
  const initials = getInitials(userName);

  // ── Avatar ──────────────────────────────────────────────────────────────────
  function UserAvatar({ size = "h-8 w-8" }: { size?: string }) {
    return avatarUrl ? (
      <img src={avatarUrl} alt={userName} className={`${size} rounded-full object-cover shrink-0`} />
    ) : (
      <div className={`${size} shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary`}>
        {initials}
      </div>
    );
  }

  // ── Sidebar nav content (shared desktop + mobile) ────────────────────────────
  function SidebarNav({ onNav }: { onNav?: () => void }) {
    return (
      <div className="flex h-full flex-col overflow-hidden">

        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center border-b px-6">
          <Link href="/dashboard" onClick={onNav} className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <Scissors className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-base">BarberFlow</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    Icon={item.icon}
                    active={isActive(pathname, item.href, item.exact)}
                    onClick={onNav}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Upgrade card */}
        {!estado.esPro && (
          <div className="shrink-0 px-4 pb-3">
            <div className="rounded-lg border bg-card p-3 space-y-2">
              <div className="flex items-start gap-2">
                <Star className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="text-xs font-semibold leading-tight">
                    {estado.esTrial ? `Trial · ${estado.diasRestantes} días restantes` : "Plan gratuito"}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                    Desbloquea funciones Pro
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/upgrade"
                onClick={onNav}
                className="flex w-full items-center justify-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Upgrade a Pro <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}

        {/* User row */}
        <div className="shrink-0 border-t px-4 py-3">
          <div className="flex items-center gap-3">
            <UserAvatar />
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium leading-tight">{userName || "Usuario"}</p>
              <p className="truncate text-xs text-muted-foreground leading-tight">{userEmail}</p>
            </div>
            <ThemeToggle />
            <button
              onClick={handleSignOut}
              title="Cerrar sesión"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">

      {/* ── Desktop Sidebar (fixed left) ──────────────────────────────────────── */}
      <aside className="hidden md:flex md:w-[220px] lg:w-[240px] shrink-0 flex-col border-r bg-card fixed inset-y-0 left-0 z-30">
        <SidebarNav />
      </aside>

      {/* ── Content area (offset by sidebar width on desktop) ─────────────────── */}
      <div className="flex flex-1 flex-col md:pl-[220px] lg:pl-[240px]">

        {/* ── Mobile header ───────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-4 border-b bg-card px-4 md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2 font-bold">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
              <Scissors className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            BarberFlow
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <UserAvatar />
          </div>
        </header>

        {/* ── Desktop page header ─────────────────────────────────────────────── */}
        <header className="sticky top-0 z-20 hidden md:flex h-14 shrink-0 items-center justify-between border-b bg-card px-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{barberiaNombre || "Dashboard"}</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="flex items-center gap-2 pl-2 border-l">
              <UserAvatar />
              <div className="hidden lg:block">
                <p className="text-sm font-medium leading-tight">{userName}</p>
                <p className="text-xs text-muted-foreground leading-tight">{userEmail}</p>
              </div>
            </div>
          </div>
        </header>

        {/* ── Main content ──────────────────────────────────────────────────────── */}
        <main className="flex-1 px-4 py-6 md:px-6 md:py-8 pb-24 md:pb-8">
          <div className="mx-auto w-full max-w-5xl">
            {children}
          </div>
        </main>
      </div>

      {/* ── Mobile bottom nav ─────────────────────────────────────────────────── */}
      <nav className="fixed bottom-0 inset-x-0 z-40 border-t bg-card md:hidden">
        <div className="flex h-16 items-end pb-1">
          {BOTTOM_TABS.map((tab) => {
            const active = isActive(pathname, tab.href, tab.exact);
            const Icon   = tab.icon;
            const isFab  = "fab" in tab && tab.fab;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-end gap-1 pb-2 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {isFab ? (
                  <div className={cn(
                    "flex h-11 w-11 -mt-4 items-center justify-center rounded-full shadow-md transition-colors",
                    active ? "bg-primary/90" : "bg-primary"
                  )}>
                    <Icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                ) : (
                  <Icon className="h-5 w-5" />
                )}
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Mobile drawer (slide from left) ───────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[260px] bg-card border-r shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground hover:bg-secondary transition-colors z-10"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarNav onNav={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
