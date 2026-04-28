-- Lock down SECURITY DEFINER functions: revoke from anon/authenticated, only triggers run them
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
-- set_updated_at doesn't need definer rights, switch to invoker for safety
alter function public.set_updated_at() security invoker;