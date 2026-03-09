-- 12. System settings (key-value)
-- RadiusOne - Supabase schema part 12/14

create table public.settings (
  key text primary key,
  value jsonb,
  updated_at timestamptz default now()
);
