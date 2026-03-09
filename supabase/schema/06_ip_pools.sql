-- 06. IP Pools (untuk static IP assignment)
-- RadiusOne - Supabase schema part 6/14

create table public.ip_pools (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  range_start inet not null,
  range_end inet not null,
  description text,
  created_at timestamptz default now()
);
