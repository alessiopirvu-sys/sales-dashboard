create index if not exists seller_reporting_periods_seller_id_idx
on public.seller_reporting_periods (seller_id);

create index if not exists seller_reporting_periods_year_month_idx
on public.seller_reporting_periods (year, month);

create index if not exists seller_reporting_periods_status_idx
on public.seller_reporting_periods (status);

create index if not exists seller_daily_kpis_seller_id_idx
on public.seller_daily_kpis (seller_id);

create index if not exists seller_daily_kpis_reporting_period_id_idx
on public.seller_daily_kpis (reporting_period_id);

create index if not exists seller_daily_kpis_report_date_idx
on public.seller_daily_kpis (report_date);

create index if not exists seller_daily_kpis_period_date_idx
on public.seller_daily_kpis (reporting_period_id, report_date);

create index if not exists seller_kpi_audit_logs_seller_id_idx
on public.seller_kpi_audit_logs (seller_id);

create index if not exists seller_kpi_audit_logs_reporting_period_id_idx
on public.seller_kpi_audit_logs (reporting_period_id);

create index if not exists seller_kpi_audit_logs_created_at_idx
on public.seller_kpi_audit_logs (created_at desc);

create index if not exists seller_kpi_import_runs_seller_id_idx
on public.seller_kpi_import_runs (seller_id);

create index if not exists seller_kpi_import_runs_year_month_idx
on public.seller_kpi_import_runs (year, month);

create index if not exists seller_kpi_import_runs_status_idx
on public.seller_kpi_import_runs (status);

create or replace function public.set_internal_kpi_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.guard_profile_admin_fields()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null and not public.is_admin_user() then
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

create or replace function public.validate_seller_daily_kpi_row()
returns trigger
language plpgsql
as $$
declare
  period_record public.seller_reporting_periods%rowtype;
  computed_day_type text;
begin
  select *
  into period_record
  from public.seller_reporting_periods
  where id = new.reporting_period_id;

  if not found then
    raise exception 'Periodo KPI non trovato per reporting_period_id=%', new.reporting_period_id;
  end if;

  if period_record.seller_id <> new.seller_id then
    raise exception 'seller_id non coerente con il periodo KPI selezionato.';
  end if;

  if extract(year from new.report_date)::integer <> period_record.year
     or extract(month from new.report_date)::integer <> period_record.month then
    raise exception 'report_date fuori dal mese o anno del periodo KPI selezionato.';
  end if;

  if extract(day from new.report_date)::integer <> new.day_number then
    raise exception 'day_number non coerente con report_date.';
  end if;

  computed_day_type := case extract(dow from new.report_date)::integer
    when 0 then 'DOM'
    when 6 then 'SAB'
    else 'FERIALE'
  end;

  if computed_day_type <> new.day_type then
    raise exception 'day_type non coerente con report_date.';
  end if;

  return new;
end;
$$;

create or replace function public.validate_seller_kpi_import_run_row()
returns trigger
language plpgsql
as $$
declare
  period_record public.seller_reporting_periods%rowtype;
begin
  if new.reporting_period_id is null then
    return new;
  end if;

  select *
  into period_record
  from public.seller_reporting_periods
  where id = new.reporting_period_id;

  if not found then
    raise exception 'Periodo KPI non trovato per reporting_period_id=%', new.reporting_period_id;
  end if;

  if period_record.seller_id <> new.seller_id then
    raise exception 'seller_id non coerente con il reporting_period_id dell''import run.';
  end if;

  return new;
end;
$$;

create or replace function public.prevent_audit_log_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Gli audit log sono append-only e non possono essere modificati o eliminati.';
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_internal_kpi_updated_at();

drop trigger if exists guard_profiles_admin_fields on public.profiles;
create trigger guard_profiles_admin_fields
before update on public.profiles
for each row
execute function public.guard_profile_admin_fields();

drop trigger if exists set_seller_reporting_periods_updated_at on public.seller_reporting_periods;
create trigger set_seller_reporting_periods_updated_at
before update on public.seller_reporting_periods
for each row
execute function public.set_internal_kpi_updated_at();

drop trigger if exists set_seller_daily_kpis_updated_at on public.seller_daily_kpis;
create trigger set_seller_daily_kpis_updated_at
before update on public.seller_daily_kpis
for each row
execute function public.set_internal_kpi_updated_at();

drop trigger if exists validate_seller_daily_kpis_row on public.seller_daily_kpis;
create trigger validate_seller_daily_kpis_row
before insert or update on public.seller_daily_kpis
for each row
execute function public.validate_seller_daily_kpi_row();

drop trigger if exists set_seller_kpi_import_runs_updated_at on public.seller_kpi_import_runs;
create trigger set_seller_kpi_import_runs_updated_at
before update on public.seller_kpi_import_runs
for each row
execute function public.set_internal_kpi_updated_at();

drop trigger if exists validate_seller_kpi_import_runs_row on public.seller_kpi_import_runs;
create trigger validate_seller_kpi_import_runs_row
before insert or update on public.seller_kpi_import_runs
for each row
execute function public.validate_seller_kpi_import_run_row();

drop trigger if exists prevent_seller_kpi_audit_logs_update_delete on public.seller_kpi_audit_logs;
create trigger prevent_seller_kpi_audit_logs_update_delete
before update or delete on public.seller_kpi_audit_logs
for each row
execute function public.prevent_audit_log_mutation();
