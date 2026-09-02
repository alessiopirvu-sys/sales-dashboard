-- Team Sales: funzione di overview che riassume l'andamento di TUTTE le
-- squadre in un'unica chiamata (per la pagina "Squadre"), cosi' da non
-- dover fare N round-trip separati (uno per squadra) dal client.
--
-- security definer per lo stesso motivo di get_team_sales_month: il
-- fatturato aggregato per squadra va sommato dai KPI di venditori diversi
-- dall'utente che guarda la pagina, cosa che le RLS di seller_daily_kpis
-- normalmente non permetterebbero riga per riga.
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
    select *
    from team_sales_months tm
    where tm.team_id = t.id
    order by tm.created_at desc, tm.id desc
    limit 1
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

revoke all on function public.get_team_sales_overview() from public;
grant execute on function public.get_team_sales_overview() to authenticated;
