-- Allow router_id to be null so voucher generation works without requiring a router
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'vouchers' and column_name = 'router_id'
  ) then
    alter table public.vouchers alter column router_id drop not null;
  end if;
end $$;
