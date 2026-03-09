-- Fitur parity dengan MixRadius/RADIUS Manager: IP Pools, static_ip, max_sessions, Access Point type.
-- Jalankan setelah schema dasar atau migrations_add_menu_tables.

create table if not exists public.ip_pools (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  range_start inet not null,
  range_end inet not null,
  description text,
  created_at timestamptz default now()
);

do $$ begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'radius_users' and column_name = 'static_ip') then
    alter table public.radius_users add column static_ip inet;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'radius_users' and column_name = 'max_sessions') then
    alter table public.radius_users add column max_sessions int;
  end if;
end $$;

-- Tambah type 'access_point' ke nas_devices (drop + add constraint)
alter table public.nas_devices drop constraint if exists nas_devices_type_check;
alter table public.nas_devices add constraint nas_devices_type_check check (
  type in ('mikrotik', 'cisco', 'chillispot', 'pfSense', 'dd-wrt', 'access_point', 'other')
);

alter table public.ip_pools enable row level security;
drop policy if exists "Admins full access" on public.ip_pools;
create policy "Admins full access" on public.ip_pools for all using (auth.uid() is not null) with check (auth.uid() is not null);
