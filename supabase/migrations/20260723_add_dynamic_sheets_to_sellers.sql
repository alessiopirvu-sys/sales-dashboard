alter table public.sellers
add column if not exists sheets jsonb not null default '{}'::jsonb;

update public.sellers
set sheets = jsonb_strip_nulls(
  coalesce(sheets, '{}'::jsonb) ||
  case
    when sheet_url_april is not null and btrim(sheet_url_april) <> '' then jsonb_build_object('2026-04', sheet_url_april)
    else '{}'::jsonb
  end ||
  case
    when sheet_url_may is not null and btrim(sheet_url_may) <> '' then jsonb_build_object('2026-05', sheet_url_may)
    else '{}'::jsonb
  end
)
where
  (sheet_url_april is not null and btrim(sheet_url_april) <> '')
  or (sheet_url_may is not null and btrim(sheet_url_may) <> '');
