-- Add max_sessions (and static_ip if missing) to radius_users - schema cache fix
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'radius_users' and column_name = 'static_ip') then
    alter table public.radius_users add column static_ip inet;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'radius_users' and column_name = 'max_sessions') then
    alter table public.radius_users add column max_sessions int;
  end if;
end $$;
