-- handle_new_user solo debe correr via trigger, nunca invocable via RPC directa.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;

-- is_admin() solo lo necesitan las RLS policies para usuarios logueados, anon no.
revoke execute on function public.is_admin() from public;
revoke execute on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;
