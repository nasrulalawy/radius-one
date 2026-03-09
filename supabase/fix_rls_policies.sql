-- Jalankan ini di Supabase SQL Editor jika CRUD belum jalan (RLS block).
-- Hanya mengubah policy untuk tabel yang ADA (skip yang tidak ada).

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'admin_profiles') then
    drop policy if exists "Admins full access" on public.admin_profiles;
    create policy "Admins full access" on public.admin_profiles for all using (auth.uid() is not null) with check (auth.uid() is not null);
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'services') then
    drop policy if exists "Admins full access" on public.services;
    create policy "Admins full access" on public.services for all using (auth.uid() is not null) with check (auth.uid() is not null);
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'nas_devices') then
    drop policy if exists "Admins full access" on public.nas_devices;
    create policy "Admins full access" on public.nas_devices for all using (auth.uid() is not null) with check (auth.uid() is not null);
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'radius_users') then
    drop policy if exists "Admins full access" on public.radius_users;
    create policy "Admins full access" on public.radius_users for all using (auth.uid() is not null) with check (auth.uid() is not null);
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'sessions') then
    drop policy if exists "Admins full access" on public.sessions;
    create policy "Admins full access" on public.sessions for all using (auth.uid() is not null) with check (auth.uid() is not null);
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'user_groups') then
    drop policy if exists "Admins full access" on public.user_groups;
    create policy "Admins full access" on public.user_groups for all using (auth.uid() is not null) with check (auth.uid() is not null);
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'payments') then
    drop policy if exists "Admins full access" on public.payments;
    create policy "Admins full access" on public.payments for all using (auth.uid() is not null) with check (auth.uid() is not null);
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'vouchers') then
    drop policy if exists "Admins full access" on public.vouchers;
    create policy "Admins full access" on public.vouchers for all using (auth.uid() is not null) with check (auth.uid() is not null);
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'invoices') then
    drop policy if exists "Admins full access" on public.invoices;
    create policy "Admins full access" on public.invoices for all using (auth.uid() is not null) with check (auth.uid() is not null);
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'ip_pools') then
    drop policy if exists "Admins full access" on public.ip_pools;
    create policy "Admins full access" on public.ip_pools for all using (auth.uid() is not null) with check (auth.uid() is not null);
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'settings') then
    drop policy if exists "Admins full access" on public.settings;
    create policy "Admins full access" on public.settings for all using (auth.uid() is not null) with check (auth.uid() is not null);
  end if;
end $$;
