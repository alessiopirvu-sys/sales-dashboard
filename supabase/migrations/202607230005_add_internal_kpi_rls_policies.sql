alter table public.profiles enable row level security;
alter table public.sellers enable row level security;
alter table public.seller_reporting_periods enable row level security;
alter table public.seller_daily_kpis enable row level security;
alter table public.seller_kpi_audit_logs enable row level security;
alter table public.seller_kpi_import_runs enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles
for select
using (auth.uid() = id and is_active = true);

drop policy if exists profiles_select_admin on public.profiles;
create policy profiles_select_admin
on public.profiles
for select
using (public.is_admin_user());

drop policy if exists profiles_update_own on public.profiles;

drop policy if exists profiles_manage_admin on public.profiles;
create policy profiles_manage_admin
on public.profiles
for all
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists sellers_select_own on public.sellers;
create policy sellers_select_own
on public.sellers
for select
using (public.can_access_seller(id));

drop policy if exists sellers_manage_admin on public.sellers;
create policy sellers_manage_admin
on public.sellers
for all
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists seller_reporting_periods_select_own on public.seller_reporting_periods;
create policy seller_reporting_periods_select_own
on public.seller_reporting_periods
for select
using (public.can_access_seller(seller_id));

drop policy if exists seller_reporting_periods_insert_own on public.seller_reporting_periods;

drop policy if exists seller_reporting_periods_update_own on public.seller_reporting_periods;

drop policy if exists seller_reporting_periods_manage_admin on public.seller_reporting_periods;
create policy seller_reporting_periods_manage_admin
on public.seller_reporting_periods
for all
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists seller_daily_kpis_select_own on public.seller_daily_kpis;
create policy seller_daily_kpis_select_own
on public.seller_daily_kpis
for select
using (public.can_access_seller(seller_id));

drop policy if exists seller_daily_kpis_insert_own on public.seller_daily_kpis;

drop policy if exists seller_daily_kpis_update_own on public.seller_daily_kpis;

drop policy if exists seller_daily_kpis_manage_admin on public.seller_daily_kpis;
create policy seller_daily_kpis_manage_admin
on public.seller_daily_kpis
for all
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists seller_kpi_audit_logs_select_own on public.seller_kpi_audit_logs;
create policy seller_kpi_audit_logs_select_own
on public.seller_kpi_audit_logs
for select
using (public.can_access_seller(seller_id));

drop policy if exists seller_kpi_audit_logs_manage_admin on public.seller_kpi_audit_logs;
drop policy if exists seller_kpi_audit_logs_select_admin on public.seller_kpi_audit_logs;
create policy seller_kpi_audit_logs_select_admin
on public.seller_kpi_audit_logs
for select
using (public.is_admin_user());

drop policy if exists seller_kpi_import_runs_select_own on public.seller_kpi_import_runs;
create policy seller_kpi_import_runs_select_own
on public.seller_kpi_import_runs
for select
using (public.can_access_seller(seller_id));

drop policy if exists seller_kpi_import_runs_manage_admin on public.seller_kpi_import_runs;
create policy seller_kpi_import_runs_manage_admin
on public.seller_kpi_import_runs
for all
using (public.is_admin_user())
with check (public.is_admin_user());
