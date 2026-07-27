create table if not exists public.seller_reporting_periods (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete restrict,
  year integer not null,
  month integer not null,
  status text not null default 'open' check (status in ('open', 'locked')),
  source text not null default 'manual' check (source in ('manual', 'google_sheets_import', 'migration')),
  created_by uuid references auth.users(id) on delete set null,
  locked_at timestamptz,
  locked_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seller_reporting_periods_year_check check (year between 2000 and 2100),
  constraint seller_reporting_periods_month_check check (month between 1 and 12),
  constraint seller_reporting_periods_unique_seller_month unique (seller_id, year, month)
);

create table if not exists public.seller_daily_kpis (
  id uuid primary key default gen_random_uuid(),
  reporting_period_id uuid not null references public.seller_reporting_periods(id) on delete restrict,
  seller_id uuid not null references public.sellers(id) on delete restrict,
  report_date date not null,
  day_number integer not null,
  day_type text not null check (day_type in ('FERIALE', 'SAB', 'DOM')),
  fr_calls integer not null default 0,
  fr_not_interested integer not null default 0,
  fr_no_answer integer not null default 0,
  fr_appointments integer not null default 0,
  fr_completed integer not null default 0,
  fr_no_show integer not null default 0,
  fr_closed integer not null default 0,
  fr_revenue numeric(12,2) not null default 0,
  referral_count integer not null default 0,
  referral_closed integer not null default 0,
  referral_revenue numeric(12,2) not null default 0,
  d2d_base integer not null default 0,
  d2d_appointments integer not null default 0,
  d2d_completed integer not null default 0,
  d2d_no_show integer not null default 0,
  d2d_closed integer not null default 0,
  d2d_revenue numeric(12,2) not null default 0,
  office_base integer not null default 0,
  office_completed integer not null default 0,
  office_rescheduled integer not null default 0,
  office_no_show integer not null default 0,
  office_closed integer not null default 0,
  office_revenue numeric(12,2) not null default 0,
  validation_status text not null default 'valid' check (validation_status in ('valid', 'warning', 'error')),
  validation_errors jsonb not null default '[]'::jsonb,
  source text not null default 'manual' check (source in ('manual', 'google_sheets_import', 'migration')),
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seller_daily_kpis_non_negative_check check (
    fr_calls >= 0
    and fr_not_interested >= 0
    and fr_no_answer >= 0
    and fr_appointments >= 0
    and fr_completed >= 0
    and fr_no_show >= 0
    and fr_closed >= 0
    and fr_revenue >= 0
    and referral_count >= 0
    and referral_closed >= 0
    and referral_revenue >= 0
    and d2d_base >= 0
    and d2d_appointments >= 0
    and d2d_completed >= 0
    and d2d_no_show >= 0
    and d2d_closed >= 0
    and d2d_revenue >= 0
    and office_base >= 0
    and office_completed >= 0
    and office_rescheduled >= 0
    and office_no_show >= 0
    and office_closed >= 0
    and office_revenue >= 0
  ),
  constraint seller_daily_kpis_unique_day unique (reporting_period_id, report_date),
  constraint seller_daily_kpis_day_number_check check (day_number between 1 and 31)
);

create table if not exists public.seller_kpi_audit_logs (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete restrict,
  reporting_period_id uuid references public.seller_reporting_periods(id) on delete set null,
  seller_daily_kpi_id uuid references public.seller_daily_kpis(id) on delete set null,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.seller_kpi_import_runs (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete restrict,
  reporting_period_id uuid references public.seller_reporting_periods(id) on delete set null,
  year integer not null,
  month integer not null,
  source text not null check (source in ('manual', 'google_sheets_import', 'migration')),
  dry_run boolean not null default true,
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  rows_processed integer not null default 0,
  totals_preview jsonb not null default '{}'::jsonb,
  error_report jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seller_kpi_import_runs_year_check check (year between 2000 and 2100),
  constraint seller_kpi_import_runs_month_check check (month between 1 and 12)
);
