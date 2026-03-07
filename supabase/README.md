# Supabase untuk Radius One

Aplikasi bisa memakai **Supabase** (PostgreSQL) sebagai database dengan mengatur env dan menjalankan schema sekali.

## Langkah

### 1. Buat project di Supabase

- Buka [supabase.com](https://supabase.com), buat project baru.
- Catat **Project URL** dan **API Keys** (Settings → API):
  - **service_role** (rahasia, untuk server): dipakai di `SUPABASE_SERVICE_KEY`
  - atau **anon** jika pakai RLS: `SUPABASE_ANON_KEY`

### 2. Jalankan schema

- Di dashboard Supabase: **SQL Editor** → New query.
- Salin isi `supabase/schema.sql` dan jalankan (Run).
- File schema ini juga menyiapkan tabel `radcheck` dan `radreply` untuk mode integrasi router `RADIUS` di database yang sama.

Jika tabel `routers` sudah terlanjur dibuat sebelum fitur mode integrasi:

```sql
ALTER TABLE routers
ADD COLUMN IF NOT EXISTS integration_mode TEXT DEFAULT 'api';
ALTER TABLE routers
ADD COLUMN IF NOT EXISTS vpn_profile_id TEXT;
```

### 3. Set env

Di `.env`:

```env
USE_SUPABASE=1
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Untuk user admin pertama, isi tabel `users` lewat SQL Editor (satu kali), contoh:

```sql
-- Ganti password_hash dengan hash bcrypt dari password yang diinginkan
INSERT INTO users (username, password_hash, role)
VALUES ('admin', '$2a$10$...', 'admin');
```

Atau jalankan script init yang mengisi admin (jika nanti ada script migrasi dari JSON).

### 4. Migrasi data dari db.json (opsional)

Jika sudah punya data di `data/db.json`, bisa impor ke Supabase dengan script sekali jalan (insert ke tiap tabel) atau import manual lewat CSV/SQL. Struktur kolom mengikuti `schema.sql`.

### 5. Jalankan app

```bash
npm install
npm run dev
```

Jika env Supabase benar, di log akan muncul: `Database: Supabase (PostgreSQL)`.

---

**Tanpa Supabase:** Jangan set `USE_SUPABASE` (atau set `USE_SUPABASE=0`). App akan memakai file `data/db.json` seperti biasa.
