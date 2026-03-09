-- 10. Vouchers / prepaid cards - butuh: services, radius_users
-- RadiusOne - Supabase schema part 10/14

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
