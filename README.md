# RadiusOne

Web app mirip **MixRadius Manager** (RADIUS admin): login, dashboard, manajemen user, NAS, layanan, user online, laporan, dan pengaturan. Dibuat dengan **Vite**, **React**, **PWA**, dan **Supabase**, siap deploy ke **Vercel**.

## Fitur

- **Login** – Autentikasi admin via Supabase Auth
- **Dashboard** – Ringkasan: total user, NAS, layanan, sesi online
- **Users** – CRUD user RADIUS (username, layanan, status, expiry, data used)
- **NAS Devices** – CRUD perangkat NAS (Mikrotik, Cisco, Chillispot, pfSense, dll.). MikroTik tanpa IP publik? Bisa pakai [VPN/WireGuard](docs/MIKROTIK-VPN-WIREGUARD.md).
- **Services** – CRUD paket layanan (prepaid/postpaid, data limit, kecepatan, harga, validity)
- **Online Users** – Daftar sesi aktif (refresh otomatis)
- **Reports** – Total pembayaran dan riwayat pembayaran
- **Settings** – Nama perusahaan, port RADIUS, session timeout
- **PWA** – Bisa di-install dan dipakai offline (cache assets)

## Setup

### 1. Supabase

1. Buat project di [supabase.com](https://supabase.com).
2. Di **SQL Editor**, jalankan isi file `supabase/schema.sql`.
3. Di **Authentication > Providers**, aktifkan Email (dan matikan Confirm email jika tidak perlu).
4. Buat user admin: **Authentication > Users > Add user** (email + password).
5. Di **Project Settings > API**, copy **Project URL** dan **anon public** key.

### 2. Environment

```bash
cp .env.example .env
```

Isi `.env`:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 3. Install & jalankan

```bash
npm install
npm run dev
```

Buka http://localhost:5173, login dengan email/password admin yang dibuat di Supabase.

### 4. Build & deploy ke Vercel

```bash
npm run build
```

- Pasang [Vercel CLI](https://vercel.com/docs/cli) atau deploy lewat GitHub.
- Tambah env **VITE_SUPABASE_URL** dan **VITE_SUPABASE_ANON_KEY** di Vercel.
- Deploy: `vercel` atau connect repo lalu deploy. Root directory: project ini, build output: `dist`.

## Tech stack

- **Vite** + **React** + **TypeScript**
- **React Router** – routing
- **Supabase** – auth + database (PostgreSQL)
- **vite-plugin-pwa** – PWA & service worker
- **lucide-react** – ikon

## Struktur database (Supabase)

- `admin_profiles` – profil admin (terhubung ke `auth.users`)
- `services` – paket layanan
- `nas_devices` – perangkat NAS
- `radius_users` – user/customer RADIUS
- `sessions` – sesi online
- `payments` – pembayaran
- `settings` – key-value pengaturan

RLS diaktifkan: hanya user yang login (authenticated) yang bisa akses tabel-tabel ini.
