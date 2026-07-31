-- Escalada de privilegios: cualquier usuario logueado podia auto-promoverse a admin.
--
-- La migracion 20260725235101_profiles.sql cerraba la columna con
--   revoke update (is_admin) on public.profiles from authenticated;
-- pero eso fue un no-op silencioso: Supabase otorga UPDATE a nivel TABLA a
-- `authenticated`, y en Postgres un revoke de columna no puede recortar un
-- privilegio table-level (avisa por WARNING y sigue de largo). Sumado a la
-- policy profiles_update_own (auth.uid() = id), alcanzaba con
--   supabase.from('profiles').update({ is_admin: true }).eq('id', user.id)
-- desde el browser con la anon key para leer las fichas de salud de todos,
-- los consentimientos y operar el panel de admin.
--
-- El fix correcto es sacar el privilegio de tabla y re-otorgarlo por columna:
-- solo lo que el usuario edita de su propio perfil. `is_admin` queda promovible
-- unicamente a mano (SQL/dashboard), como decia la intencion original.

revoke update on public.profiles from authenticated;
revoke update on public.profiles from anon;

grant update (full_name, avatar_url) on public.profiles to authenticated;
