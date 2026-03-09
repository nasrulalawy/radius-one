-- Hapus semua tabel KECUALI radius_users
-- Jika dapat error "authorization check", hapus tabel lewat Dashboard (lihat bawah).

-- Opsi A: Satu per satu (copy-paste tiap baris, run satu per satu)
-- drop table if exists public.payments cascade;
-- drop table if exists public.sessions cascade;
-- drop table if exists public.nas_devices cascade;
-- drop table if exists public.services cascade;
-- drop table if exists public.admin_profiles cascade;
-- drop table if exists public.settings cascade;

-- Opsi B: Semua sekaligus (pakai CASCADE, tidak pakai ALTER)
drop table if exists public.payments cascade;
drop table if exists public.sessions cascade;
drop table if exists public.nas_devices cascade;
drop table if exists public.services cascade;
drop table if exists public.admin_profiles cascade;
drop table if exists public.settings cascade;
