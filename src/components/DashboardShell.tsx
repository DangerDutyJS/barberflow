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
      { href: "/dashboard/horarios",    label: "Horarios",     icon: Clock,     exact: false },
      { href: "/dashboard/reportes",    label: "Reportes",     icon: BarChart2, exact: false },
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
  { href: "/dashboard",           label: "Inicio",    icon: LayoutDashboard, exact: true  },
  { href: "/dashboard/citas",     label: "Citas",     icon: Calendar,        exact: false },
  { href: "/dashboard/citas/nueva",label: "Nueva",   icon: Plus,            exact: true  },
  { href: "/dashboard/barberos",  label: "Equipo",    icon: Users,           exact: false },
  { href: "/dashboard/servicios", label: "Servicios", icon: Scissors,        exact: false },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function isActive(pathname: string, href: string, exact: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase() || "?";
}

// ── Sidebar nav link ──────────────────────────────────────────────────────────

function NavLink({
  href, label, Icon, active, onClick,
}: {
  href: string; label: string; Icon: React.ElementType; active: boolean; onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}

// ── Shell ─────────────────────────────────────────────────────────────────────

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();

  const [barberiaNombre, setBarberiaNombre] = useState("");
  const [barberiaId,     setBarberiaId]     = useState("");
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
      setBarberiaId(bar.id);
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

  // ── Sidebar content (shared between desktop and mobile drawer) ──────────────
  function SidebarContent({ onNav }: { onNav?: () => void }) {
    return (
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold" onClick={onNav}>
            <Scissors className="h-5 w-5 text-primary" />
            <span>BarberFlow</span>
          </Link>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-auto py-4">
          <nav className="grid items-start gap-px px-2 text-sm font-medium lg:px-4">
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="mb-4">
                <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {group.label}
                </p>
                {group.items.map((item) => (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    Icon={item.icon}
                    active={isActive(pathname, item.href, item.exact)}
                    onClick={onNav}
                  />
                ))}
              </div>
            ))}
          </nav>
        </div>

        {/* Upgrade banner */}
        {!estado.esPro && (
          <div className="px-4 pb-3">
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-start gap-2">
                <Star className="mt-px h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold">
                    {estado.esTrial ? `Trial · ${estado.diasRestantes} días` : "Plan gratuito"}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                    Desbloquea todo con Pro
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/upgrade"
                onClick={onNav}
                className="mt-3 flex w-full items-center justify-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Upgrade a Pro <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}

        {/* User */}
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt={userName} className="h-8 w-8 rounded-full object-cover shrink-0" />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium leading-tight">{userName || "Usuario"}</p>
              <p className="truncate text-xs text-muted-foreground leading-tight">{userEmail}</p>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <button
                onClick={handleSignOut}
                title="Cerrar sesión"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[240px_1fr]">

      {/* ── Desktop Sidebar ──────────────────────────────────────────────────── */}
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2 sticky top-0">
          <SidebarContent />
        </div>
      </div>

      {/* ── Right side: header + content ────────────────────────────────────── */}
      <div className="flex flex-col">

        {/* ── Mobile / Tablet top header ──────────────────────────────────────── */}
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 md:hidden">
          {/* Mobile drawer trigger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menú</span>
          </button>

          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <Scissors className="h-5 w-5 text-primary" />
            <span>BarberFlow</span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            {avatarUrl ? (
              <img src={avatarUrl} alt={userName} className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                {initials}
              </div>
            )}
          </div>
        </header>

        {/* Desktop top bar (visible only on md+) */}
        <header className="hidden md:flex h-[60px] items-center gap-4 border-b bg-muted/40 px-4 lg:px-6">
          <div className="ml-auto flex items-center gap-2">
            {barberiaNombre && (
              <span className="text-sm text-muted-foreground hidden lg:block">{barberiaNombre}</span>
            )}
          </div>
        </header>

        {/* ── Page content ─────────────────────────────────────────────────── */}
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom nav ────────────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur-md md:hidden">
        <div className="flex h-16 items-center">
          {BOTTOM_TABS.map((tab) => {
            const active = isActive(pathname, tab.href, tab.exact);
            const Icon   = tab.icon;
            const isNew  = tab.href === "/dashboard/citas/nueva";
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  isNew && "relative"
                )}
              >
                {isNew ? (
                  <div className="flex h-10 w-10 -mt-5 items-center justify-center rounded-full bg-primary shadow-lg">
                    <Icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                ) : (
                  <Icon className="h-5 w-5" />
                )}
                <span className={cn("text-[10px]", isNew && "mt-0.5")}>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Mobile Drawer ────────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-background border-r shadow-xl">
            <div className="absolute right-4 top-4">
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent onNav={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
