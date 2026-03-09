-- 02. Admin profiles (extends auth.users)
-- RadiusOne - Supabase schema part 2/14

create table public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text,
  role text default 'admin' check (role in ('admin', 'operator', 'viewer')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
