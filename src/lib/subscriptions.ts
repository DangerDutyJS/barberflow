import type { Suscripcion } from "@/types/database";

export interface EstadoSuscripcion {
  activa: boolean;
  esTrial: boolean;
  esPro: boolean;
  diasRestantes: number | null;
  expirada: boolean;
  mostrarBannerTrial: boolean;
}

export function getEstadoSuscripcion(suscripcion: Suscripcion | null): EstadoSuscripcion {
  const base: EstadoSuscripcion = {
    activa: false,
    esTrial: false,
    esPro: false,
    diasRestantes: null,
    expirada: true,
    mostrarBannerTrial: false,
  };

  if (!suscripcion || suscripcion.estado !== "activa") return base;

  const esTrial = suscripcion.plan === "trial";
  const esPro = suscripcion.plan === "pro";

  if (!suscripcion.fecha_fin) {
    // Plan gratis sin fecha = activo indefinido
    return { ...base, activa: true, esTrial: false, esPro, expirada: false };
  }

  const fin = new Date(suscripcion.fecha_fin);
  fin.setHours(23, 59, 59, 999);
  const hoy = new Date();
  const diff = fin.getTime() - hoy.getTime();
  const diasRestantes = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  const activa = diasRestantes > 0;

  return {
    activa,
    esTrial,
    esPro,
    diasRestantes: esTrial ? diasRestantes : null,
    expirada: !activa,
    mostrarBannerTrial: esTrial,
  };
}

export function fechaFinPlan(dias: number): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  return fecha.toISOString().split("T")[0];
}
