-- ============================================================
-- Fotos de referencia de corte en citas
--
-- Permite que el cliente adjunte imágenes del corte que desea
-- al momento de agendar desde la página pública /b/[slug].
-- ============================================================


-- ── 1. Columna en citas ───────────────────────────────────────
-- Array de URLs públicas de Supabase Storage.
-- Null cuando el cliente no adjunta imágenes.

alter table citas
  add column if not exists fotos_referencia text[];


-- ── 2. Bucket de Storage ──────────────────────────────────────
-- Bucket público: las imágenes son visibles con su URL directa.
-- La validación de tamaño (max 2 MB) y tipo se hace en el frontend.

insert into storage.buckets (id, name, public)
values ('referencias', 'referencias', true)
on conflict (id) do nothing;


-- ── 3. Políticas de Storage ───────────────────────────────────

-- Anon puede subir fotos al crear una cita
create policy "anon puede subir fotos de referencia"
  on storage.objects for insert to anon
  with check (bucket_id = 'referencias');

-- Cualquiera puede ver las fotos (bucket público)
create policy "público puede ver fotos de referencia"
  on storage.objects for select
  using (bucket_id = 'referencias');

-- El dueño autenticado puede eliminar fotos de su barbería
create policy "authenticated puede eliminar fotos de referencia"
  on storage.objects for delete to authenticated
  using (bucket_id = 'referencias');
