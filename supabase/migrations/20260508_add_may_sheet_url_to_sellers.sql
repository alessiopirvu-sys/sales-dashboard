alter table public.sellers
add column if not exists sheet_url_may text;

create unique index if not exists sellers_sheet_url_may_key
on public.sellers(sheet_url_may)
where sheet_url_may is not null;
