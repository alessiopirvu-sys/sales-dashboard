-- Team Sales: tabelle dedicate (prefisso team_sales_ per non collidere con
-- public.sellers/public.profiles gia' usate dal sistema KPI interno).
create table public.team_sales_teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.team_sales_months (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.team_sales_teams(id) on delete cascade,
  month_label text not null,
  working_days int not null default 21 check (working_days between 1 and 31),
  target_total numeric(12,2) not null default 0 check (target_total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index team_sales_months_team_id_created_at_idx
  on public.team_sales_months (team_id, created_at desc);

create table public.team_sales_sellers (
  id uuid primary key default gen_random_uuid(),
  team_month_id uuid not null references public.team_sales_months(id) on delete cascade,
  name text not null,
  target numeric(12,2) not null default 0 check (target >= 0),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index team_sales_sellers_team_month_id_idx
  on public.team_sales_sellers (team_month_id);

create table public.team_sales_entries (
  id uuid primary key default gen_random_uuid(),
  team_month_id uuid not null references public.team_sales_months(id) on delete cascade,
  seller_name text not null,
  sale_date date not null,
  amount numeric(12,2) not null check (amount > 0),
  created_at timestamptz not null default now()
);
create index team_sales_entries_team_month_id_sale_date_idx
  on public.team_sales_entries (team_month_id, sale_date);

create table public.team_sales_pending (
  id uuid primary key default gen_random_uuid(),
  team_month_id uuid not null references public.team_sales_months(id) on delete cascade,
  client text not null,
  seller_name text not null,
  value numeric(12,2) not null default 0 check (value >= 0),
  phase text,
  close_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index team_sales_pending_team_month_id_idx
  on public.team_sales_pending (team_month_id);

create trigger set_team_sales_teams_updated_at
  before update on public.team_sales_teams
  for each row execute function public.set_internal_kpi_updated_at();
create trigger set_team_sales_months_updated_at
  before update on public.team_sales_months
  for each row execute function public.set_internal_kpi_updated_at();
create trigger set_team_sales_pending_updated_at
  before update on public.team_sales_pending
  for each row execute function public.set_internal_kpi_updated_at();

-- RLS: qualunque utente Cold Team attivo (admin o seller) legge/scrive.
-- Team Sales e' una scheda condivisa di team, non dati "personali" come i KPI.
alter table public.team_sales_teams enable row level security;
alter table public.team_sales_months enable row level security;
alter table public.team_sales_sellers enable row level security;
alter table public.team_sales_entries enable row level security;
alter table public.team_sales_pending enable row level security;

create policy team_sales_teams_rw on public.team_sales_teams for all
  using (public.is_active_authenticated_user())
  with check (public.is_active_authenticated_user());

create policy team_sales_months_rw on public.team_sales_months for all
  using (public.is_active_authenticated_user())
  with check (public.is_active_authenticated_user());

create policy team_sales_sellers_rw on public.team_sales_sellers for all
  using (public.is_active_authenticated_user())
  with check (public.is_active_authenticated_user());

create policy team_sales_entries_rw on public.team_sales_entries for all
  using (public.is_active_authenticated_user())
  with check (public.is_active_authenticated_user());

create policy team_sales_pending_rw on public.team_sales_pending for all
  using (public.is_active_authenticated_user())
  with check (public.is_active_authenticated_user());

-- Lettura in un solo round-trip: squadra + mese piu' recente + venditori +
-- vendite + pending, incapsulati in un unico jsonb.
create or replace function public.get_team_sales_month(p_team_id uuid)
returns jsonb
language sql
security invoker
stable
set search_path = public
as $$
  with latest_month as (
    select *
    from team_sales_months
    where team_id = p_team_id
    order by created_at desc, id desc
    limit 1
  )
  select jsonb_build_object(
    'team', (select jsonb_build_object('id', t.id, 'name', t.name) from team_sales_teams t where t.id = p_team_id),
    'month', (select to_jsonb(m) from latest_month m),
    'sellers', coalesce((
      select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'target', s.target) order by s.sort_order, s.created_at)
      from team_sales_sellers s
      where s.team_month_id = (select id from latest_month)
    ), '[]'::jsonb),
    'entries', coalesce((
      select jsonb_agg(jsonb_build_object('id', e.id, 'sellerName', e.seller_name, 'saleDate', e.sale_date, 'amount', e.amount) order by e.sale_date)
      from team_sales_entries e
      where e.team_month_id = (select id from latest_month)
    ), '[]'::jsonb),
    'pending', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'client', p.client, 'sellerName', p.seller_name, 'value', p.value,
        'phase', p.phase, 'closeDate', p.close_date, 'notes', p.notes
      ) order by p.created_at)
      from team_sales_pending p
      where p.team_month_id = (select id from latest_month)
    ), '[]'::jsonb)
  );
$$;

grant execute on function public.get_team_sales_month(uuid) to authenticated;

-- Scrittura atomica: sostituisce le ~7 chiamate sequenziali (delete+insert
-- per sellers/entries/pending, upsert team/month) con un'unica transazione.
-- security invoker: gira con i permessi del chiamante, le RLS sopra restano attive.
create or replace function public.save_team_sales_month(
  p_team_id uuid,
  p_team_month_id uuid,
  payload jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_month_id uuid;
  v_seller jsonb;
  v_entry jsonb;
  v_pending jsonb;
begin
  if p_team_month_id is not null then
    update team_sales_months set
      month_label = payload->'setup'->>'monthLabel',
      working_days = (payload->'setup'->>'workingDays')::int,
      target_total = (payload->'setup'->>'targetTotal')::numeric
    where id = p_team_month_id and team_id = p_team_id
    returning id into v_month_id;

    if v_month_id is null then
      raise exception 'team_month % non trovato per il team %', p_team_month_id, p_team_id;
    end if;
  else
    insert into team_sales_months (team_id, month_label, working_days, target_total)
    values (
      p_team_id,
      payload->'setup'->>'monthLabel',
      (payload->'setup'->>'workingDays')::int,
      (payload->'setup'->>'targetTotal')::numeric
    )
    returning id into v_month_id;
  end if;

  delete from team_sales_sellers where team_month_id = v_month_id;
  for v_seller in select * from jsonb_array_elements(coalesce(payload->'setup'->'sellers', '[]'::jsonb))
  loop
    insert into team_sales_sellers (team_month_id, name, target, sort_order)
    values (
      v_month_id,
      v_seller->>'name',
      (v_seller->>'target')::numeric,
      coalesce((v_seller->>'sortOrder')::int, 0)
    );
  end loop;

  delete from team_sales_entries where team_month_id = v_month_id;
  for v_entry in select * from jsonb_array_elements(coalesce(payload->'entries', '[]'::jsonb))
  loop
    insert into team_sales_entries (team_month_id, seller_name, sale_date, amount)
    values (
      v_month_id,
      v_entry->>'sellerName',
      (v_entry->>'saleDate')::date,
      (v_entry->>'amount')::numeric
    );
  end loop;

  delete from team_sales_pending where team_month_id = v_month_id;
  for v_pending in select * from jsonb_array_elements(coalesce(payload->'pending', '[]'::jsonb))
  loop
    insert into team_sales_pending (team_month_id, client, seller_name, value, phase, close_date, notes)
    values (
      v_month_id,
      v_pending->>'client',
      v_pending->>'sellerName',
      (v_pending->>'value')::numeric,
      v_pending->>'phase',
      nullif(v_pending->>'closeDate', '')::date,
      v_pending->>'notes'
    );
  end loop;

  return jsonb_build_object('teamId', p_team_id, 'teamMonthId', v_month_id);
end;
$$;

grant execute on function public.save_team_sales_month(uuid, uuid, jsonb) to authenticated;
