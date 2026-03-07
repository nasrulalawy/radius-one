# Deploy ke Vercel

API (Express) bisa dijalankan di Vercel sebagai Serverless Function.

## Setup

1. **Environment variables** di Vercel Dashboard → Project → Settings → Environment Variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY` (atau `SUPABASE_ANON_KEY`)
   - `SESSION_SECRET` (opsional, untuk session)

2. Deploy:
   ```bash
   vercel
   ```

3. Semua request (termasuk `/api/*`, `/login`, `/dashboard`, dll.) akan diarahkan ke `api/index.js` yang mem-forward ke Express app.

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
