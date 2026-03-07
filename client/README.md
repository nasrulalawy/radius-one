# Radius One - Frontend (Vite + React + Tailwind)

Frontend baru untuk Radius One menggunakan **Vite**, **React**, dan **Tailwind CSS**.

## Setup

```bash
cd client
npm install
```

## Development

Jalankan backend (Express) di satu terminal:

```bash
# dari root project
npm run dev
```

Jalankan frontend (Vite) di terminal lain:

```bash
npm run dev
# atau dari root: npm run dev:client
```

Buka **http://localhost:5173** untuk UI React. Vite mem-proxy `/api` ke `http://localhost:3001`.

## Build

```bash
npm run build
```

Output di `client/dist`. Untuk production, jalankan dari root:

```bash
npm run build:client
npm start
```

Set env `USE_VITE_UI=1` dan pastikan `client/dist` ada agar Express mengirim SPA untuk route yang tidak ditangani.

## Halaman yang tersedia

- Login
- Dashboard (ringkasan, grafik pendapatan, pelanggan per tipe, status tagihan, pembayaran terbaru)
- Pelanggan (list)
- Tagihan (list, filter unpaid)
- Paket (list)
- Router (list)

Halaman lain (App Settings, Reports, Support, dll.) bisa ditambahkan dengan pola yang sama: endpoint di `src/routes/api.js` dan halaman React di `src/pages/`.
