create extension if not exists "pgcrypto";

create table if not exists public.sellers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sheet_url text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sheet_sync_logs (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.sellers(id) on delete cascade,
  status text not null,
  message text,
  synced_at timestamptz not null default now()
);

create index if not exists sellers_is_active_idx on public.sellers(is_active);
create index if not exists sheet_sync_logs_seller_id_idx on public.sheet_sync_logs(seller_id);
create index if not exists sheet_sync_logs_synced_at_idx on public.sheet_sync_logs(synced_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_sellers_updated_at on public.sellers;
create trigger set_sellers_updated_at
before update on public.sellers
for each row
execute function public.set_updated_at();
