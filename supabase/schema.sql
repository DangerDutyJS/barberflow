-- ============================================================
-- BarberFlow — Esquema de Base de Datos
-- Ejecutar en: Supabase → SQL Editor → New query
-- ============================================================

-- EXTENSIONES
create extension if not exists "uuid-ossp";

-- ============================================================
-- TIPOS ENUMERADOS
-- ============================================================

create type user_role        as enum ('admin', 'barbero', 'cliente');
create type estado_cita      as enum ('pendiente', 'confirmada', 'completada', 'cancelada', 'no_asistio');
create type plan_suscripcion as enum ('gratis', 'pro', 'business');
create type estado_suscripcion as enum ('activa', 'cancelada', 'vencida');

-- ============================================================
-- TABLAS
-- ============================================================

-- Perfil público de cada usuario (se crea automáticamente al registrarse)
create table profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  full_name   text,
  phone       text,
  avatar_url  text,
  role        user_role    default 'cliente',
  created_at  timestamptz  default now(),
  updated_at  timestamptz  default now()
);

-- Barberías registradas en la plataforma
create table barberias (
  id           uuid         default uuid_generate_v4() primary key,
  owner_id     uuid         references profiles(id) on delete cascade not null,
  nombre       text         not null,
  slug         text         unique not null,          -- URL pública: barberflow.com/b/mi-barberia
  descripcion  text,
  direccion    text,
  telefono     text,
  email        text,
  logo_url     text,
  activa       boolean      default true,
  created_at   timestamptz  default now(),
  updated_at   timestamptz  default now()
);

-- Barberos que trabajan en una barbería
create table barberos (
  id           uuid         default uuid_generate_v4() primary key,
  barberia_id  uuid         references barberias(id) on delete cascade not null,
  profile_id   uuid         references profiles(id) on delete set null,
  nombre       text         not null,
  foto_url     text,
  activo       boolean      default true,
  created_at   timestamptz  default now(),
  updated_at   timestamptz  default now()
);

-- Servicios que ofrece cada barbería
create table servicios (
  id                 uuid         default uuid_generate_v4() primary key,
  barberia_id        uuid         references barberias(id) on delete cascade not null,
  nombre             text         not null,
  descripcion        text,
  duracion_minutos   integer      not null default 30,
  precio             decimal(10,2) not null default 0,
  activo             boolean      default true,
  created_at         timestamptz  default now(),
  updated_at         timestamptz  default now()
);

-- Disponibilidad semanal de cada barbero
create table horarios (
  id           uuid     default uuid_generate_v4() primary key,
  barbero_id   uuid     references barberos(id) on delete cascade not null,
  dia_semana   integer  not null check (dia_semana between 0 and 6), -- 0=domingo, 1=lunes...
  hora_inicio  time     not null,
  hora_fin     time     not null,
  activo       boolean  default true,
  constraint horario_unico unique (barbero_id, dia_semana)
);

-- Citas agendadas
create table citas (
  id                 uuid         default uuid_generate_v4() primary key,
  barberia_id        uuid         references barberias(id) on delete cascade not null,
  barbero_id         uuid         references barberos(id) on delete set null,
  servicio_id        uuid         references servicios(id) on delete set null,
  cliente_id         uuid         references profiles(id) on delete set null,  -- null si no está registrado
  cliente_nombre     text,
  cliente_telefono   text,
  cliente_email      text,
  fecha              date         not null,
  hora_inicio        time         not null,
  hora_fin           time         not null,
  estado             estado_cita  default 'pendiente',
  notas              text,
  precio_final       decimal(10,2),
  created_at         timestamptz  default now(),
  updated_at         timestamptz  default now()
);

-- Plan de suscripción de cada barbería
create table suscripciones (
  id            uuid              default uuid_generate_v4() primary key,
  barberia_id   uuid              references barberias(id) on delete cascade not null unique,
  plan          plan_suscripcion  default 'gratis',
  estado        estado_suscripcion default 'activa',
  fecha_inicio  date              default current_date,
  fecha_fin     date,
  created_at    timestamptz       default now(),
  updated_at    timestamptz       default now()
);

-- ============================================================
-- ÍNDICES
-- ============================================================

create index idx_barberias_owner   on barberias(owner_id);
create index idx_barberias_slug    on barberias(slug);
create index idx_barberos_barberia on barberos(barberia_id);
create index idx_servicios_barberia on servicios(barberia_id);
create index idx_horarios_barbero  on horarios(barbero_id);
create index idx_citas_barberia    on citas(barberia_id);
create index idx_citas_barbero     on citas(barbero_id);
create index idx_citas_cliente     on citas(cliente_id);
create index idx_citas_fecha       on citas(fecha);
create index idx_citas_estado      on citas(estado);

-- ============================================================
-- FUNCIÓN Y TRIGGERS: updated_at automático
-- ============================================================

create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function handle_updated_at();

create trigger trg_barberias_updated_at
  before update on barberias
  for each row execute function handle_updated_at();

create trigger trg_barberos_updated_at
  before update on barberos
  for each row execute function handle_updated_at();

create trigger trg_servicios_updated_at
  before update on servicios
  for each row execute function handle_updated_at();

create trigger trg_citas_updated_at
  before update on citas
  for each row execute function handle_updated_at();

create trigger trg_suscripciones_updated_at
  before update on suscripciones
  for each row execute function handle_updated_at();

-- ============================================================
-- FUNCIÓN Y TRIGGER: crear perfil automáticamente al registrarse
-- ============================================================

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table profiles     enable row level security;
alter table barberias    enable row level security;
alter table barberos     enable row level security;
alter table servicios    enable row level security;
alter table horarios     enable row level security;
alter table citas        enable row level security;
alter table suscripciones enable row level security;

-- PROFILES
create policy "Ver propio perfil"
  on profiles for select using (auth.uid() = id);

create policy "Actualizar propio perfil"
  on profiles for update using (auth.uid() = id);

-- BARBERIAS
create policy "Ver barberías activas"
  on barberias for select using (activa = true);

create policy "Owner gestiona su barbería"
  on barberias for all using (auth.uid() = owner_id);

-- BARBEROS
create policy "Ver barberos activos"
  on barberos for select using (activo = true);

create policy "Owner gestiona barberos"
  on barberos for all using (
    exists (
      select 1 from barberias
      where barberias.id = barberos.barberia_id
        and barberias.owner_id = auth.uid()
    )
  );

-- SERVICIOS
create policy "Ver servicios activos"
  on servicios for select using (activo = true);

create policy "Owner gestiona servicios"
  on servicios for all using (
    exists (
      select 1 from barberias
      where barberias.id = servicios.barberia_id
        and barberias.owner_id = auth.uid()
    )
  );

-- HORARIOS
create policy "Ver horarios activos"
  on horarios for select using (activo = true);

create policy "Owner gestiona horarios"
  on horarios for all using (
    exists (
      select 1 from barberos b
      join barberias ba on ba.id = b.barberia_id
      where b.id = horarios.barbero_id
        and ba.owner_id = auth.uid()
    )
  );

-- CITAS
create policy "Ver citas propias o de tu barbería"
  on citas for select using (
    auth.uid() = cliente_id
    or exists (
      select 1 from barberias
      where barberias.id = citas.barberia_id
        and barberias.owner_id = auth.uid()
    )
  );

create policy "Cualquiera puede crear una cita"
  on citas for insert with check (true);

create policy "Owner actualiza citas de su barbería"
  on citas for update using (
    exists (
      select 1 from barberias
      where barberias.id = citas.barberia_id
        and barberias.owner_id = auth.uid()
    )
  );

-- SUSCRIPCIONES
create policy "Owner ve su suscripción"
  on suscripciones for select using (
    exists (
      select 1 from barberias
      where barberias.id = suscripciones.barberia_id
        and barberias.owner_id = auth.uid()
    )
  );
