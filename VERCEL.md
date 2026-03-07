# Deploy ke Vercel

API (Express) bisa dijalankan di Vercel sebagai Serverless Function.

## Setup

1. **Environment variables** (wajib) di Vercel Dashboard → Project → Settings → Environment Variables:
   - `SUPABASE_URL` — URL project Supabase (e.g. https://xxx.supabase.co)
   - `SUPABASE_SERVICE_KEY` — service role key dari Supabase (Dashboard → Settings → API). Jangan pakai anon key untuk backend.
   - `SESSION_SECRET` — string rahasia untuk session (opsional)

   Tanpa `SUPABASE_URL` dan `SUPABASE_SERVICE_KEY`, function akan crash. Pastikan keduanya di-set untuk Production (dan Preview jika perlu).

2. Deploy:
   ```bash
   vercel
   ```

3. Jika masih 500: buka URL deploy dan lihat response JSON. Isi `message` dan `hint` akan menjelaskan penyebab (mis. env belum di-set). Cek juga Vercel Dashboard → Project → Logs / Functions.

## Batasan di Vercel

- **Session in-memory**: Setiap invocation bisa jalan di instance berbeda. Session (login) mungkin hilang setelah beberapa detik/request. Untuk production serius, pakai **session store eksternal** (mis. [Vercel KV](https://vercel.com/docs/storage/vercel-kv) + `connect-redis` / store yang kompatibel) atau ganti ke **JWT** di cookie.
- **Cold start**: Request pertama bisa lebih lambat karena `db.init()` (load cache dari Supabase).
- **Timeout**: Hobby 10s, Pro 60s. Operasi berat (import CSV, sync banyak router) bisa timeout.
- **Portal pelanggan** (`/client/*`) dan **invoice** tetap dilayani oleh fungsi yang sama.

## Tanpa Vercel (VPS / Node biasa)

Jalankan seperti biasa; session in-memory tetap berlaku:

```bash
npm start
```
