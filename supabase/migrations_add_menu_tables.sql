-- Jalankan jika project sudah punya schema lama (tanpa user_groups, vouchers, invoices).
-- Tambah tabel + RLS untuk fitur menu lengkap.

create table if not exists public.user_groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  description text,
  created_at timestamptz default now()
);

create table if not exists public.vouchers (
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

create table if not exists public.invoices (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.radius_users(id) on delete cascade,
  amount numeric(12,2) not null,
  status text default 'pending' check (status in ('pending', 'paid', 'cancelled')),
  due_date date,
  paid_at timestamptz,
  notes text,
  created_at timestamptz default now()
);

do $$ begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'radius_users' and column_name = 'group_id') then
    alter table public.radius_users add column group_id uuid references public.user_groups(id) on delete set null;
  end if;
end $$;

alter table public.user_groups enable row level security;
alter table public.vouchers enable row level security;
alter table public.invoices enable row level security;

drop policy if exists "Admins full access" on public.user_groups;
drop policy if exists "Admins full access" on public.vouchers;
drop policy if exists "Admins full access" on public.invoices;

create policy "Admins full access" on public.user_groups for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Admins full access" on public.vouchers for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Admins full access" on public.invoices for all using (auth.uid() is not null) with check (auth.uid() is not null);
