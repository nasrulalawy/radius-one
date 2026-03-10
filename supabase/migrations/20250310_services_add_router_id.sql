-- Add router (NAS) selection to services (paket)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'services' and column_name = 'router_id'
  ) then
    alter table public.services
      add column router_id uuid references public.nas_devices(id) on delete set null;
  end if;
end $$;
