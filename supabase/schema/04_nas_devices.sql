-- 04. NAS devices (RADIUS clients)
-- RadiusOne - Supabase schema part 4/14

create table public.nas_devices (
  id uuid primary key default uuid_generate_v4(),
  nasname text not null,
  shortname text,
  type text default 'mikrotik' check (type in ('mikrotik', 'cisco', 'chillispot', 'pfSense', 'dd-wrt', 'access_point', 'other')),
  ports int,
  auth_port int default 1812,
  acct_port int default 1813,
  time_zone text,
  api_port int default 8728,
  api_username text,
  api_password text,
  secret text not null,
  server text,
  community text,
  due_notice_url text,
  description text,
  ping_status text,
  last_checked timestamptz,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(nasname)
);
