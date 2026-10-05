-- Prepara un Postgres "vuoto" (es. Railway) a ricevere lo schema `public`
-- esportato da Supabase. L'autenticazione resta su Supabase Auth: qui servono
-- solo i ruoli e auth.uid() per far funzionare le policy RLS.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  -- Compare nelle ALTER DEFAULT PRIVILEGES del dump di Supabase.
  if not exists (select 1 from pg_roles where rolname = 'supabase_admin') then
    create role supabase_admin nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end
$$;

-- L'utente di connessione deve poter fare "SET ROLE authenticated".
do $$
begin
  execute format('grant anon, authenticated, service_role to %I', current_user);
end
$$;

create schema if not exists auth;

-- Legge l'id utente dalle claim JWT impostate dall'app a ogni query
-- (lib/db/client.ts), come faceva PostgREST su Supabase.
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(
    coalesce(
      nullif(current_setting('request.jwt.claim.sub', true), ''),
      nullif(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub', '')
    ),
    ''
  )::uuid
$$;

create or replace function auth.role()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'
  )
$$;

grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
grant execute on function auth.role() to anon, authenticated, service_role;

create schema if not exists public;
grant usage on schema public to anon, authenticated, service_role;
