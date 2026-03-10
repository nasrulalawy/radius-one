-- Add 'amount' column to vouchers if missing (schema cache error fix)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'vouchers' and column_name = 'amount'
  ) then
    alter table public.vouchers add column amount numeric(12,2) default 0;
  end if;
end $$;
