-- RadiusOne - Schema UTAMA (satu file penuh)
-- Alternatif: schema sudah dipecah per urutan di folder schema/
-- Jalankan file 01_extensions.sql sampai 14_seed.sql berurutan (lihat schema/README.md)
--
-- File ini berisi gabungan semua bagian untuk yang ingin run sekali jalan:

create extension if not exists "uuid-ossp";

create table public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text,
  role text default 'admin' check (role in ('admin', 'operator', 'viewer')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.services (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  billing_type text not null check (billing_type in ('prepaid', 'postpaid')),
  data_limit_mb bigint,
  speed_limit_down_kbps int,
  speed_limit_up_kbps int,
  price numeric(12,2) default 0,
  validity_days int,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

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

create table public.user_groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  description text,
  created_at timestamptz default now()
);

create table public.ip_pools (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  range_start inet not null,
  range_end inet not null,
  description text,
  created_at timestamptz default now()
);

create table public.radius_users (
  id uuid primary key default uuid_generate_v4(),
  username text not null unique,
  password text not null,
  service_id uuid references public.services(id) on delete set null,
  group_id uuid references public.user_groups(id) on delete set null,
  email text,
  full_name text,
  phone text,
  address text,
  static_ip inet,
  max_sessions int,
  status text default 'active' check (status in ('active', 'disabled', 'expired')),
  expiry_date date,
  data_used_mb bigint default 0,
  balance numeric(12,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.radius_users(id) on delete cascade,
  username text not null,
  nas_id uuid references public.nas_devices(id) on delete set null,
  framed_ip inet,
  session_id text,
  start_time timestamptz default now(),
  data_in bigint default 0,
  data_out bigint default 0,
  terminate_cause text
);

create table public.payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.radius_users(id) on delete set null,
  amount numeric(12,2) not null,
  method text,
  reference text,
  notes text,
  created_at timestamptz default now()
);

create table public.vouchers (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  password text not null,
  service_id uuid references public.services(id) on delete set null,
  validity_days int,
  amount numeric(12,2) default 0,
  used_at timestamptz,
  used_by_user_id uuid references public.radius_users(id) on delete set null,
  created_at timestamptz default now()
);

create table public.invoices (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.radius_users(id) on delete cascade,
  amount numeric(12,2) not null,
  status text default 'pending' check (status in ('pending', 'paid', 'cancelled')),
  due_date date,
  paid_at timestamptz,
  notes text,
  created_at timestamptz default now()
);

create table public.settings (
  key text primary key,
  value jsonb,
  updated_at timestamptz default now()
);

alter table public.admin_profiles enable row level security;
alter table public.services enable row level security;
alter table public.nas_devices enable row level security;
alter table public.radius_users enable row level security;
alter table public.sessions enable row level security;
alter table public.user_groups enable row level security;
alter table public.payments enable row level security;
alter table public.vouchers enable row level security;
alter table public.invoices enable row level security;
alter table public.ip_pools enable row level security;
alter table public.settings enable row level security;

create policy "Admins full access" on public.admin_profiles for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Admins full access" on public.services for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Admins full access" on public.nas_devices for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Admins full access" on public.radius_users for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Admins full access" on public.sessions for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Admins full access" on public.user_groups for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Admins full access" on public.payments for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Admins full access" on public.vouchers for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Admins full access" on public.invoices for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Admins full access" on public.ip_pools for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Admins full access" on public.settings for all using (auth.uid() is not null) with check (auth.uid() is not null);

insert into public.settings (key, value) values
  ('company_name', '"RadiusOne"'),
  ('radius_server_address', '"43.173.164.210"'),
  ('radius_auth_port', '1812'),
  ('radius_acct_port', '1813'),
  ('session_timeout', '3600')
on conflict (key) do nothing;
