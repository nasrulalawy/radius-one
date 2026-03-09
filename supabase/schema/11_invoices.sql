-- 11. Invoices (tagihan postpaid) - butuh: radius_users
-- RadiusOne - Supabase schema part 11/14

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
