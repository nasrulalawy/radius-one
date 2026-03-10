-- Sync all vouchers columns from schema (add any missing columns)
-- Fixes schema cache errors for amount, password, service_id, validity_days, used_at, used_by_user_id

do $$
begin
  -- service_id
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'vouchers' and column_name = 'service_id') then
    alter table public.vouchers add column service_id uuid references public.services(id) on delete set null;
  end if;
  -- validity_days
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'vouchers' and column_name = 'validity_days') then
    alter table public.vouchers add column validity_days int;
  end if;
  -- amount
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'vouchers' and column_name = 'amount') then
    alter table public.vouchers add column amount numeric(12,2) default 0;
  end if;
  -- used_at
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'vouchers' and column_name = 'used_at') then
    alter table public.vouchers add column used_at timestamptz;
  end if;
  -- used_by_user_id
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'vouchers' and column_name = 'used_by_user_id') then
    alter table public.vouchers add column used_by_user_id uuid references public.radius_users(id) on delete set null;
  end if;
  -- password
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'vouchers' and column_name = 'password') then
    alter table public.vouchers add column password text not null default '';
  end if;
end $$;
