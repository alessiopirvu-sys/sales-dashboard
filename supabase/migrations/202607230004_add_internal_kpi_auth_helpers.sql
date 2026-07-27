create or replace function public.is_active_authenticated_user()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select exists (
    select 1
    from public.profiles as profile
    where profile.id = auth.uid()
      and profile.is_active = true
  );
$$;

create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select exists (
    select 1
    from public.profiles as profile
    where profile.id = auth.uid()
      and profile.role = 'admin'
      and profile.is_active = true
  );
$$;

create or replace function public.current_seller_id()
returns uuid
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select seller.id
  from public.sellers as seller
  inner join public.profiles as profile
    on profile.id = seller.profile_id
  where seller.profile_id = auth.uid()
    and seller.is_active = true
    and coalesce(seller.status, 'active') not in ('disabled', 'suspended')
    and profile.is_active = true
    and profile.role = 'seller'
  limit 1;
$$;

create or replace function public.can_access_seller(target_seller_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select public.is_admin_user() or public.current_seller_id() = target_seller_id;
$$;

create or replace function public.can_edit_reporting_period(target_period_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select exists (
    select 1
    from public.seller_reporting_periods as period
    where period.id = target_period_id
      and (
        public.is_admin_user()
        or (
          public.current_seller_id() = period.seller_id
          and period.status = 'open'
          and public.is_active_authenticated_user()
        )
      )
  );
$$;

revoke all on function public.is_active_authenticated_user() from public;
revoke all on function public.is_admin_user() from public;
revoke all on function public.current_seller_id() from public;
revoke all on function public.can_access_seller(uuid) from public;
revoke all on function public.can_edit_reporting_period(uuid) from public;

grant execute on function public.is_active_authenticated_user() to authenticated, service_role;
grant execute on function public.is_admin_user() to authenticated, service_role;
grant execute on function public.current_seller_id() to authenticated, service_role;
grant execute on function public.can_access_seller(uuid) to authenticated, service_role;
grant execute on function public.can_edit_reporting_period(uuid) to authenticated, service_role;
