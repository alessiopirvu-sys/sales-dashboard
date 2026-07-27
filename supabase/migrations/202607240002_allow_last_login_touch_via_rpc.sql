create or replace function public.guard_profile_admin_fields()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null and not public.is_admin_user() then
    if current_setting('app.allow_profile_last_login_touch', true) = 'on' then
      if new.id is distinct from old.id
         or new.role is distinct from old.role
         or new.email is distinct from old.email
         or new.is_active is distinct from old.is_active
         or new.created_at is distinct from old.created_at
         or new.first_name is distinct from old.first_name
         or new.last_name is distinct from old.last_name then
        raise exception 'Solo un admin puo modificare i campi protetti di profiles.';
      end if;

      return new;
    end if;

    if new.id is distinct from old.id
       or new.role is distinct from old.role
       or new.email is distinct from old.email
       or new.is_active is distinct from old.is_active
       or new.created_at is distinct from old.created_at
       or new.last_login_at is distinct from old.last_login_at then
      raise exception 'Solo un admin puo modificare i campi protetti di profiles.';
    end if;
  end if;

  return new;
end;
$$;

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

  perform pg_catalog.set_config('app.allow_profile_last_login_touch', 'on', true);

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
