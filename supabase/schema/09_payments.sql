-- 09. Payments - butuh: radius_users
-- RadiusOne - Supabase schema part 9/14

create table public.payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.radius_users(id) on delete set null,
  amount numeric(12,2) not null,
  method text,
  reference text,
  notes text,
  created_at timestamptz default now()
);
