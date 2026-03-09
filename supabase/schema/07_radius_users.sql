-- 07. RADIUS users (customers) - butuh: services, user_groups
-- RadiusOne - Supabase schema part 7/14

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
