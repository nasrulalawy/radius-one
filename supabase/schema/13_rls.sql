-- 13. RLS (Row Level Security) - jalankan setelah semua tabel ada
-- RadiusOne - Supabase schema part 13/14

alter table public.admin_profiles enable row level security;
alter table public.services enable row level security;
alter table public.nas_devices enable row level security;
alter table public.radius_users enable row level security;
alter table public.sessions enable row level security;
alter table public.user_groups enable row level security;
alter table public.payments enable row level security;
alter table public.vouchers enable row level security;
alter table public.invoices enable row level security;
alter table public.ip_pools enable row level security;
alter table public.settings enable row level security;

create policy "Admins full access" on public.admin_profiles for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Admins full access" on public.services for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Admins full access" on public.nas_devices for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Admins full access" on public.radius_users for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Admins full access" on public.sessions for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Admins full access" on public.user_groups for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Admins full access" on public.payments for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Admins full access" on public.vouchers for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Admins full access" on public.invoices for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Admins full access" on public.ip_pools for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Admins full access" on public.settings for all using (auth.uid() is not null) with check (auth.uid() is not null);
