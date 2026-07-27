create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'seller')),
  first_name text,
  last_name text,
  email text,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_email_unique_idx
on public.profiles (lower(email))
where email is not null;

alter table public.sellers
add column if not exists profile_id uuid references auth.users(id) on delete set null,
add column if not exists first_name text,
add column if not exists last_name text,
add column if not exists email text,
add column if not exists status text,
add column if not exists last_login_at timestamptz;

alter table public.sellers
drop constraint if exists sellers_status_check;

alter table public.sellers
add constraint sellers_status_check
check (
  status is null
  or status in ('pending_invite', 'active', 'suspended', 'disabled')
);

create unique index if not exists sellers_profile_id_unique_idx
on public.sellers (profile_id)
where profile_id is not null;

create unique index if not exists sellers_email_unique_idx
on public.sellers (lower(email))
where email is not null;
