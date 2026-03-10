-- Fix router_id columns: ensure type is uuid (not bigint) so they accept nas_devices(id)
do $$
declare
  col_type text;
  cname text;
begin
  -- vouchers.router_id
  select data_type into col_type
  from information_schema.columns
  where table_schema = 'public' and table_name = 'vouchers' and column_name = 'router_id';
  if col_type = 'bigint' then
    for cname in (
      select tc.constraint_name from information_schema.table_constraints tc
      join information_schema.key_column_usage kcu on tc.constraint_name = kcu.constraint_name
      where tc.table_schema = 'public' and tc.table_name = 'vouchers' and kcu.column_name = 'router_id'
    ) loop
      execute format('alter table public.vouchers drop constraint if exists %I', cname);
    end loop;
    alter table public.vouchers alter column router_id type uuid using null;
    alter table public.vouchers add constraint vouchers_router_id_fkey
      foreign key (router_id) references public.nas_devices(id) on delete set null;
  end if;

  -- services.router_id
  select data_type into col_type
  from information_schema.columns
  where table_schema = 'public' and table_name = 'services' and column_name = 'router_id';
  if col_type = 'bigint' then
    for cname in (
      select tc.constraint_name from information_schema.table_constraints tc
      join information_schema.key_column_usage kcu on tc.constraint_name = kcu.constraint_name
      where tc.table_schema = 'public' and tc.table_name = 'services' and kcu.column_name = 'router_id'
    ) loop
      execute format('alter table public.services drop constraint if exists %I', cname);
    end loop;
    alter table public.services alter column router_id type uuid using null;
    alter table public.services add constraint services_router_id_fkey
      foreign key (router_id) references public.nas_devices(id) on delete set null;
  end if;
end $$;
