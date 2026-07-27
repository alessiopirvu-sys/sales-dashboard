create or replace function public.touch_current_last_login()
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid;
  login_timestamp timestamptz := now();
  current_profile public.profiles%rowtype;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'Autenticazione richiesta.';
  end if;

  select *
  into current_profile
  from public.profiles
  where id = current_user_id
  limit 1;

  if not found then
    raise exception 'Profilo utente non trovato.';
  end if;

  if current_profile.is_active is distinct from true then
    raise exception 'Account disattivato.';
  end if;

  update public.profiles
  set last_login_at = login_timestamp
  where id = current_user_id;

  update public.sellers
  set last_login_at = login_timestamp
  where profile_id = current_user_id;

  return login_timestamp;
end;
$$;

revoke all on function public.touch_current_last_login() from public;
grant execute on function public.touch_current_last_login() to authenticated;
