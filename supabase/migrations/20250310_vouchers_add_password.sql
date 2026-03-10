-- Add 'password' column to vouchers if missing (schema cache error fix)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'vouchers' and column_name = 'password'
  ) then
    alter table public.vouchers add column password text not null default '';
  end if;
end $$;
