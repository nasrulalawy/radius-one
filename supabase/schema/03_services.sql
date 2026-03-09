-- 03. Services / plans (RADIUS service profiles)
-- RadiusOne - Supabase schema part 3/14

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
