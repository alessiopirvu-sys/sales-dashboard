-- Team Sales: dato un venditore, restituisce gli id delle squadre di cui
-- fa parte nel mese piu' recente di ciascuna (usato per mostrare un badge
-- "La tua squadra" al seller nella pagina elenco squadre).
create or replace function public.get_my_team_sales_team_ids(p_seller_id uuid)
returns uuid[]
language sql
security invoker
stable
set search_path = public
as $$
  select coalesce(array_agg(distinct t.id), '{}'::uuid[])
  from team_sales_teams t
  join lateral (
    select *
    from team_sales_months tm
    where tm.team_id = t.id
    order by tm.created_at desc, tm.id desc
    limit 1
  ) m on true
  join team_sales_sellers s on s.team_month_id = m.id
  where s.seller_id = p_seller_id;
$$;

grant execute on function public.get_my_team_sales_team_ids(uuid) to authenticated;
