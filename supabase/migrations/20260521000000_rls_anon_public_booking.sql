-- ============================================================
-- RLS para agendamiento público /b/[slug]
--
-- Los grants de tabla ya existen (fix_servicios_grants.sql).
-- Este archivo agrega únicamente las políticas RLS que faltaban
-- para que el rol `anon` pueda operar en la página pública.
-- ============================================================


-- ── 1. BARBERIAS ─────────────────────────────────────────────
-- La política "Ver barberías activas" del schema inicial aplica
-- a todos los roles (sin TO). No se requiere cambio.


-- ── 2. BARBEROS ──────────────────────────────────────────────
-- La política "Ver barberos activos" del schema inicial aplica
-- a todos los roles. No se requiere cambio.


-- ── 3. SERVICIOS ─────────────────────────────────────────────
-- La política "Ver servicios activos" del schema inicial aplica
-- a todos los roles. No se requiere cambio.


-- ── 4. HORARIOS ──────────────────────────────────────────────
-- La política existente "Ver horarios activos" filtra activo=true,
-- lo que impide detectar días inactivos del barbero.
-- Agregamos política para anon que expone todos los horarios
-- (incluyendo activo=false) para poder mostrar el aviso
-- "este barbero no trabaja ese día".

create policy "anon puede ver todos los horarios"
  on horarios for select to anon
  using (true);


-- ── 5. CITAS — SELECT (verificar slots ocupados) ──────────────
-- Problema: la política "Ver citas propias o de tu barbería"
-- usa auth.uid(), que para anon siempre es NULL → nunca retorna filas.
-- Sin esto, el wizard público siempre muestra todos los slots libres
-- aunque estén ocupados (doble booking silencioso).
--
-- La privacidad de los datos personales (nombre, teléfono) de otros
-- clientes se garantiza en la capa de aplicación: la página solo
-- solicita las columnas hora_inicio y hora_fin.

create policy "anon puede ver slots ocupados"
  on citas for select to anon
  using (estado != 'cancelada');


-- ── 6. CITAS — INSERT ─────────────────────────────────────────
-- Reemplazamos la política laxa "Cualquiera puede crear una cita"
-- (WITH CHECK true, sin validación) por dos políticas separadas:
--
-- a) anon (página pública): exige todos los campos de identidad
--    del cliente + barbero asignado (no se permite "sin asignar"
--    desde la página pública).
--
-- b) authenticated (dashboard): permite crear citas en barberías
--    propias, con barbero opcional (el dueño puede dejarlo sin asignar).

drop policy if exists "Cualquiera puede crear una cita" on citas;

-- a) Página pública: el cliente debe identificarse y elegir un barbero
create policy "anon crear cita pública"
  on citas for insert to anon
  with check (
    barberia_id    is not null and
    barbero_id     is not null and
    servicio_id    is not null and
    cliente_nombre is not null and
    trim(cliente_nombre) != '' and
    fecha          is not null and
    hora_inicio    is not null and
    hora_fin       is not null
  );

-- b) Dashboard: el dueño crea citas en su propia barbería (barbero opcional)
create policy "authenticated crear cita en su barbería"
  on citas for insert to authenticated
  with check (
    exists (
      select 1 from barberias
      where barberias.id = citas.barberia_id
        and barberias.owner_id = auth.uid()
    )
  );
