alter table public.sellers
add column if not exists sheet_url_april text;

create unique index if not exists sellers_sheet_url_april_key
on public.sellers(sheet_url_april)
where sheet_url_april is not null;
