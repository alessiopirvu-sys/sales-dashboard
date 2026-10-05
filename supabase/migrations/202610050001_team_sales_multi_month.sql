-- Team Sales: piu' mesi per squadra. Ogni mese (anno/mese) ha i propri
-- obiettivi, venditori, pending; le vendite restano calcolate dai KPI
-- giornalieri del mese corrispondente.

create unique index if not exists team_sales_months_team_year_month_key
  on public.team_sales_months (team_id, year, month);

-- Mese "attivo" di una squadra: quello del calendario corrente (fuso Roma);
-- se non esiste, il piu' recente non futuro; altrimenti il primo futuro.
create or replace function public.team_sales_current_month_id(p_team_id uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  with today as (
    select extract(year from (now() at time zone 'Europe/Rome'))::int * 12
         + extract(month from (now() at time zone 'Europe/Rome'))::int as idx
  )
  select tm.id
  from team_sales_months tm, today
  where tm.team_id = p_team_id
  order by
    (tm.year * 12 + tm.month = today.idx) desc,
    (tm.year * 12 + tm.month > today.idx) asc,
    case when tm.year * 12 + tm.month <= today.idx then tm.year * 12 + tm.month end desc nulls last,
    tm.year * 12 + tm.month asc
  limit 1;
$$;

revoke all on function public.team_sales_current_month_id(uuid) from public;
grant execute on function public.team_sales_current_month_id(uuid) to authenticated;

-- Lettura: mese richiesto (anno/mese) oppure il mese attivo. Restituisce anche
-- l'elenco dei mesi della squadra per il selettore.
drop function if exists public.get_team_sales_month(uuid);

create or replace function public.get_team_sales_month(
  p_team_id uuid,
  p_year int default null,
  p_month int default null
)
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  with chosen as (
    select *
    from team_sales_months
    where id = coalesce(
      (select id from team_sales_months where team_id = p_team_id and year = p_year and month = p_month),
      public.team_sales_current_month_id(p_team_id)
    )
  )
  select jsonb_build_object(
    'team', (select jsonb_build_object('id', t.id, 'name', t.name) from team_sales_teams t where t.id = p_team_id),
    'month', (select to_jsonb(m) from chosen m),
    'months', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', tm.id, 'year', tm.year, 'month', tm.month,
        'monthLabel', tm.month_label, 'targetTotal', tm.target_total
      ) order by tm.year desc, tm.month desc)
      from team_sales_months tm
      where tm.team_id = p_team_id
    ), '[]'::jsonb),
    'sellers', coalesce((
      select jsonb_agg(jsonb_build_object('id', s.id, 'sellerId', s.seller_id, 'name', s.name, 'target', s.target) order by s.sort_order, s.created_at)
      from team_sales_sellers s
      where s.team_month_id = (select id from chosen)
    ), '[]'::jsonb),
    'entries', coalesce((
      select jsonb_agg(jsonb_build_object('sellerName', s.name, 'saleDate', k.report_date, 'amount', k.fr_revenue + k.referral_revenue + k.d2d_revenue + k.office_revenue) order by k.report_date)
      from team_sales_sellers s
      join seller_daily_kpis k on k.seller_id = s.seller_id
      where s.team_month_id = (select id from chosen)
        and s.seller_id is not null
        and extract(year from k.report_date)::int = (select year from chosen)
        and extract(month from k.report_date)::int = (select month from chosen)
        and (k.fr_revenue + k.referral_revenue + k.d2d_revenue + k.office_revenue) > 0
    ), '[]'::jsonb),
    'pending', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'client', p.client, 'sellerName', p.seller_name, 'value', p.value,
        'phase', p.phase, 'closeDate', p.close_date, 'notes', p.notes
      ) order by p.created_at)
      from team_sales_pending p
      where p.team_month_id = (select id from chosen)
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.get_team_sales_month(uuid, int, int) from public;
grant execute on function public.get_team_sales_month(uuid, int, int) to authenticated;

-- Crea un nuovo mese. Con p_copy_from copia venditori e obiettivi personali
-- da un mese esistente (i pending e le vendite non si copiano).
create or replace function public.create_team_sales_month(
  p_team_id uuid,
  p_year int,
  p_month int,
  p_copy_from uuid default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_month_id uuid;
  v_first date := make_date(p_year, p_month, 1);
  v_working_days int;
  v_labels text[] := array['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
begin
  select count(*) into v_working_days
  from generate_series(v_first, (v_first + interval '1 month - 1 day')::date, interval '1 day') d
  where extract(isodow from d) < 6;

  insert into team_sales_months (team_id, year, month, month_label, working_days, target_total)
  values (p_team_id, p_year, p_month, v_labels[p_month] || ' ' || p_year, greatest(v_working_days, 1), 0)
  returning id into v_month_id;

  if p_copy_from is not null then
    insert into team_sales_sellers (team_month_id, seller_id, name, target, sort_order)
    select v_month_id, s.seller_id, s.name, s.target, s.sort_order
    from team_sales_sellers s
    join team_sales_months src on src.id = s.team_month_id
    where s.team_month_id = p_copy_from and src.team_id = p_team_id;

    update team_sales_months
    set target_total = coalesce((select sum(target) from team_sales_sellers where team_month_id = v_month_id), 0)
    where id = v_month_id;
  end if;

  return jsonb_build_object('teamMonthId', v_month_id, 'year', p_year, 'month', p_month);
end;
$$;

grant execute on function public.create_team_sales_month(uuid, int, int, uuid) to authenticated;

-- Panoramica squadre: usa il mese attivo di ciascuna squadra.
create or replace function public.get_team_sales_overview()
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'teamId', t.id,
      'teamName', t.name,
      'monthLabel', m.month_label,
      'targetTotal', coalesce(m.target_total, 0),
      'workingDays', coalesce(m.working_days, 0),
      'soldTotal', coalesce(sold.total, 0),
      'pendingValue', coalesce(pending.value_total, 0),
      'pendingCount', coalesce(pending.count_total, 0),
      'topSellerName', top_seller.name,
      'topSellerTotal', coalesce(top_seller.total, 0)
    ) order by t.name
  ), '[]'::jsonb)
  from team_sales_teams t
  left join lateral (
    select * from team_sales_months tm where tm.id = public.team_sales_current_month_id(t.id)
  ) m on true
  left join lateral (
    select sum(k.fr_revenue + k.referral_revenue + k.d2d_revenue + k.office_revenue) as total
    from team_sales_sellers s
    join seller_daily_kpis k on k.seller_id = s.seller_id
    where s.team_month_id = m.id
      and s.seller_id is not null
      and extract(year from k.report_date)::int = m.year
      and extract(month from k.report_date)::int = m.month
  ) sold on true
  left join lateral (
    select sum(p.value) as value_total, count(*) as count_total
    from team_sales_pending p
    where p.team_month_id = m.id
  ) pending on true
  left join lateral (
    select s.name, sum(k.fr_revenue + k.referral_revenue + k.d2d_revenue + k.office_revenue) as total
    from team_sales_sellers s
    join seller_daily_kpis k on k.seller_id = s.seller_id
    where s.team_month_id = m.id
      and s.seller_id is not null
      and extract(year from k.report_date)::int = m.year
      and extract(month from k.report_date)::int = m.month
    group by s.name
    order by sum(k.fr_revenue + k.referral_revenue + k.d2d_revenue + k.office_revenue) desc
    limit 1
  ) top_seller on true;
$$;

-- "La tua squadra": appartenenza nel mese attivo di ciascuna squadra.
create or replace function public.get_my_team_sales_team_ids(p_seller_id uuid)
returns uuid[]
language sql
security invoker
stable
set search_path = public
as $$
  select coalesce(array_agg(distinct t.id), '{}'::uuid[])
  from team_sales_teams t
  join team_sales_sellers s on s.team_month_id = public.team_sales_current_month_id(t.id)
  where s.seller_id = p_seller_id;
$$;
