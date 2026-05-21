export type UserRole = "admin" | "barbero" | "cliente";
export type EstadoCita = "pendiente" | "confirmada" | "completada" | "cancelada" | "no_asistio";
export type PlanSuscripcion = "gratis" | "trial" | "pro" | "business";
export type EstadoSuscripcion = "activa" | "cancelada" | "vencida";

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Barberia {
  id: string;
  owner_id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  direccion: string | null;
  pais: string | null;
  departamento: string | null;
  ciudad: string | null;
  telefono: string | null;
  email: string | null;
  logo_url: string | null;
  activa: boolean;
  created_at: string;
  updated_at: string;
}

export interface Barbero {
  id: string;
  barberia_id: string;
  profile_id: string | null;
  nombre: string;
  foto_url: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Servicio {
  id: string;
  barberia_id: string;
  nombre: string;
  descripcion: string | null;
  duracion_minutos: number;
  precio: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Horario {
  id: string;
  barbero_id: string;
  dia_semana: number; // 0=domingo, 1=lunes, ..., 6=sábado
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
}

export interface Cita {
  id: string;
  barberia_id: string;
  barbero_id: string | null;
  servicio_id: string | null;
  cliente_id: string | null;
  cliente_nombre: string | null;
  cliente_telefono: string | null;
  cliente_email: string | null;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: EstadoCita;
  notas: string | null;
  fotos_referencia: string[] | null;
  precio_final: number | null;
  created_at: string;
  updated_at: string;
}

export interface Suscripcion {
  id: string;
  barberia_id: string;
  plan: PlanSuscripcion;
  estado: EstadoSuscripcion;
  fecha_inicio: string;
  fecha_fin: string | null;
  ciclo_facturacion: "mensual" | "anual" | null;
  wompi_referencia: string | null;
  wompi_transaction_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Pago {
  id: string;
  barberia_id: string;
  wompi_transaction_id: string;
  wompi_referencia: string;
  monto_centavos: number;
  moneda: string;
  estado: string;
  plan: PlanSuscripcion;
  ciclo_facturacion: string | null;
  created_at: string;
}

// Tipos con relaciones (para queries con joins)
export type CitaConRelaciones = Cita & {
  barbero?: Pick<Barbero, "id" | "nombre" | "foto_url">;
  servicio?: Pick<Servicio, "id" | "nombre" | "duracion_minutos" | "precio">;
  cliente?: Pick<Profile, "id" | "full_name" | "phone">;
};

export type BarberoConHorarios = Barbero & {
  horarios?: Horario[];
};
