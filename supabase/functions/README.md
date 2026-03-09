# Supabase Edge Functions – Integrasi MikroTik

## Fungsi

- **mikrotik-test** – Tes koneksi ke satu router (REST API RouterOS 7). Kirim `nas_id` atau `address` + `api_username` + `api_password`. Mengisi `ping_status` dan `last_checked` di `nas_devices` jika `nas_id` diberikan.
- **mikrotik-check-all** – Cek semua router tipe `mikrotik` dan update `ping_status` + `last_checked`.
- **mikrotik-disconnect** – Putus user di MikroTik (hotspot active remove). Kirim `session_id` (atau `nas_id` + `username`). Menghapus dari `/ip/hotspot/active` lalu hapus record di tabel `sessions`.

## Syarat Router

- **RouterOS 7.x** dengan layanan **www** (HTTP) atau **www-ssl** (HTTPS) diaktifkan.
- Router harus **bisa diakses dari internet** (IP publik atau hostname/DDNS). Edge Function berjalan di cloud Supabase; router di jaringan lokal (192.168.x.x) tanpa ekspos tidak akan bisa dijangkau.
- Untuk HTTPS dengan sertifikat self-signed, koneksi mungkin gagal; gunakan HTTP untuk uji (port 80).

## Deploy

1. Pasang Supabase CLI: https://supabase.com/docs/guides/cli
2. Login: `supabase login`
3. Link project: `supabase link --project-ref <your-project-ref>`
4. Deploy fungsi:
   ```bash
   supabase functions deploy mikrotik-test
   supabase functions deploy mikrotik-check-all
   supabase functions deploy mikrotik-disconnect
   ```

## Migrasi database

Jalankan di Supabase Dashboard → SQL Editor:

- `supabase/migrations/20250307_nas_ping_status.sql` (tambah kolom `ping_status`, `last_checked`)

## Pemanggilan dari frontend

- **Test Connection** di form Tambah/Edit Router memanggil `mikrotik-test` dengan `nas_id` (saat edit) atau `address` + `api_username` + `api_password` (saat tambah).
- Tombol **Cek Semua Router** memanggil `mikrotik-check-all`.
