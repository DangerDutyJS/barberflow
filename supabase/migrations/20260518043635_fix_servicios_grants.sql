-- Ensure authenticated and anon roles have access to all tables
-- RLS policies control which rows are visible; grants control table-level access.

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on table public.servicios     to authenticated;
grant select                          on table public.servicios     to anon;

grant select, insert, update, delete on table public.barberos      to authenticated;
grant select                          on table public.barberos      to anon;

grant select, insert, update, delete on table public.barberias     to authenticated;
grant select                          on table public.barberias     to anon;

grant select, insert, update, delete on table public.citas         to authenticated;
grant select, insert                  on table public.citas         to anon;

grant select, insert, update, delete on table public.suscripciones to authenticated;
grant select, insert, update, delete on table public.horarios      to authenticated;
grant select                          on table public.horarios      to anon;

grant select, insert, update, delete on table public.profiles      to authenticated;
grant select                          on table public.profiles      to anon;

grant select, insert, update, delete on table public.pagos         to authenticated;
