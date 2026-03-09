-- 05. User groups (harus sebelum radius_users)
-- RadiusOne - Supabase schema part 5/14

create table public.user_groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  description text,
  created_at timestamptz default now()
);
