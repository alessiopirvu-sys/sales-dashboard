-- Team Sales: collega i venditori della squadra ai veri account Cold Team
-- (public.sellers), sposta il mese da un'etichetta libera a anno/mese
-- numerici, e fa in modo che le vendite/il fatturato vengano calcolati
-- automaticamente dai KPI giornalieri gia' registrati per ogni venditore
-- invece di essere inseriti a mano.

alter table public.team_sales_sellers
  add column seller_id uuid references public.sellers(id) on delete set null;
create index team_sales_sellers_seller_id_idx on public.team_sales_sellers (seller_id);

alter table public.team_sales_months add column year int;
alter table public.team_sales_months add column month int;
update public.team_sales_months
  set year = extract(year from created_at)::int,
      month = extract(month from created_at)::int
  where year is null;
alter table public.team_sales_months alter column year set not null;
alter table public.team_sales_months alter column month set not null;
alter table public.team_sales_months add constraint team_sales_months_year_check check (year between 2000 and 2100);
alter table public.team_sales_months add constraint team_sales_months_month_check check (month between 1 and 12);

-- Lettura: come get_team_sales_month, ma le "entries" (vendite giornaliere)
-- ora sono calcolate sommando fr_revenue+referral_revenue+d2d_revenue+
-- office_revenue da seller_daily_kpis per ogni venditore collegato, nel
-- mese della squadra. Un venditore della squadra senza seller_id collegato
-- contribuisce sempre 0 (nessun inserimento manuale sostitutivo).
--
-- security definer (non invoker): le RLS di seller_daily_kpis limitano
-- ogni seller a vedere solo le proprie righe, ma qui vogliamo che un
-- membro della squadra veda il totale di TUTTA la squadra (e' il senso
-- di una dashboard di team condivisa). La funzione espone solo somme di
-- fatturato, e solo per i venditori esplicitamente assegnati a quella
-- specifica squadra da un admin - non e' un accesso libero ai dati KPI.
create or replace function public.get_team_sales_month(p_team_id uuid)
returns jsonb
language sql
security definer
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
      select jsonb_agg(jsonb_build_object('id', s.id, 'sellerId', s.seller_id, 'name', s.name, 'target', s.target) order by s.sort_order, s.created_at)
      from team_sales_sellers s
      where s.team_month_id = (select id from latest_month)
    ), '[]'::jsonb),
    'entries', coalesce((
      select jsonb_agg(jsonb_build_object('sellerName', s.name, 'saleDate', k.report_date, 'amount', k.fr_revenue + k.referral_revenue + k.d2d_revenue + k.office_revenue) order by k.report_date)
      from team_sales_sellers s
      join seller_daily_kpis k on k.seller_id = s.seller_id
      where s.team_month_id = (select id from latest_month)
        and s.seller_id is not null
        and extract(year from k.report_date)::int = (select year from latest_month)
        and extract(month from k.report_date)::int = (select month from latest_month)
        and (k.fr_revenue + k.referral_revenue + k.d2d_revenue + k.office_revenue) > 0
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

revoke all on function public.get_team_sales_month(uuid) from public;
grant execute on function public.get_team_sales_month(uuid) to authenticated;

-- Scrittura: non riceve piu' le vendite giornaliere (arrivano dai KPI),
-- solo anno/mese/giorni lavorativi/target e l'elenco venditori collegati.
drop function if exists public.save_team_sales_month(uuid, uuid, jsonb);

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
  v_pending jsonb;
begin
  if p_team_month_id is not null then
    update team_sales_months set
      year = (payload->>'year')::int,
      month = (payload->>'month')::int,
      working_days = (payload->>'workingDays')::int,
      target_total = (payload->>'targetTotal')::numeric,
      month_label = payload->>'monthLabel'
    where id = p_team_month_id and team_id = p_team_id
    returning id into v_month_id;

    if v_month_id is null then
      raise exception 'team_month % non trovato per il team %', p_team_month_id, p_team_id;
    end if;
  else
    insert into team_sales_months (team_id, year, month, working_days, target_total, month_label)
    values (
      p_team_id,
      (payload->>'year')::int,
      (payload->>'month')::int,
      (payload->>'workingDays')::int,
      (payload->>'targetTotal')::numeric,
      payload->>'monthLabel'
    )
    returning id into v_month_id;
  end if;

  delete from team_sales_sellers where team_month_id = v_month_id;
  for v_seller in select * from jsonb_array_elements(coalesce(payload->'sellers', '[]'::jsonb))
  loop
    insert into team_sales_sellers (team_month_id, seller_id, name, target, sort_order)
    values (
      v_month_id,
      nullif(v_seller->>'sellerId', '')::uuid,
      v_seller->>'name',
      (v_seller->>'target')::numeric,
      coalesce((v_seller->>'sortOrder')::int, 0)
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
