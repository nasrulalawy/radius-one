# Tahapan Setup: Radius One + Koneksi ke MikroTik

Panduan singkat dari nol sampai aplikasi berjalan dan terkoneksi ke router MikroTik (PPPoE atau Hotspot).

---

## 1. Persyaratan

- **Node.js 18+** terpasang di komputer/server Anda.
- **MikroTik RouterOS** dengan:
  - **API** aktif (port **8728** untuk API, atau **8729** untuk API-SSL).
  - Untuk PPPoE: PPPoE Server sudah dikonfigurasi, pool IP sudah ada.
  - Untuk Hotspot: Hotspot sudah dikonfigurasi (server, profile, dll).

---

## 2. Jalankan Aplikasi di Komputer/Server Anda

```bash
cd RadiusOne
npm install
npm run init-db
npm run dev
```

- Buka browser: **http://localhost:3001** (atau port yang Anda set di `.env`).
- Login: **admin** / **admin123** (ubah nanti lewat `.env` + jalankan lagi `npm run init-db` jika perlu).

*(Opsional: salin `.env.example` ke `.env` lalu atur `PORT`, `SESSION_SECRET`, `ADMIN_USER`, `ADMIN_PASS`.)*

---

## 3. Aktifkan API di MikroTik

Aplikasi berbicara ke MikroTik lewat **RouterOS API**, bukan Winbox/SSH biasa.

1. Login ke MikroTik (Winbox atau SSH).
2. Masuk ke **IP → Services**.
3. Pastikan **api** (port 8728) atau **api-ssl** (port 8729) **enabled**.
4. Catat:
   - **IP router** yang bisa diakses dari komputer tempat Radius One jalan (bisa IP LAN, misal `192.168.88.1`).
   - **Port**: 8728 (API) atau 8729 (API-SSL).
   - **Username & password** user yang punya akses API (biasanya user **admin** atau user khusus).

---

## 4. Tambah Router di Aplikasi

1. Di menu kiri: **Router MikroTik** → **Tambah Router**.
2. Isi:
   - **Nama**: bebas (mis. "Router Kantor").
   - **Host**: IP MikroTik (mis. `192.168.88.1`).
   - **Port**: 8728 (API) atau 8729 (API-SSL).
   - **Username** & **Password**: user MikroTik yang tadi.
   - **Mode Integrasi**: pilih `MikroTik API` (langsung ke router) atau `RADIUS`.
   - **Gunakan SSL**: centang hanya jika pakai **api-ssl** (8729).
3. Simpan.

---

## 5. Test Koneksi ke Router

1. Di daftar **Router MikroTik**, klik **Test** pada router yang baru ditambah.
2. Jika berhasil: muncul pesan sukses (koneksi API OK).
3. Jika gagal: periksa:
   - IP dan port benar.
   - API / api-ssl di MikroTik benar-benar enabled.
   - Firewall (di MikroTik atau di antara PC dan router) tidak memblok port 8728/8729.
   - Username/password benar.

---

## 6. Siapkan PPPoE atau Hotspot di MikroTik

Aplikasi **tidak** mengatur PPPoE Server atau Hotspot dari nol. Itu harus sudah ada di MikroTik. Radius One hanya:

- **PPPoE**: menambah/menghapus **PPPoE Secret** (username/password) dan **isolir/aktifkan** (disable/enable secret).
- **Hotspot**: menambah/menghapus **Hotspot User** dan **isolir/aktifkan** user.

### Jika pakai PPPoE

- PPPoE Server, pool IP, dan profile sudah dikonfigurasi di MikroTik.
- Nanti di aplikasi, saat tambah pelanggan pilih tipe **PPPoE**; aplikasi akan menambah **PPP → Secrets** di router.

### Jika pakai Hotspot

- Hotspot (server, profile, halaman login) sudah dikonfigurasi di MikroTik.
- Nanti di aplikasi, saat tambah pelanggan pilih tipe **Hotspot**; aplikasi akan menambah **IP → Hotspot → Users** di router.

---

## 7. Buat Paket dan Pelanggan di Aplikasi

1. **Paket**  
   Menu **Paket** → tambah paket (nama, tipe PPPoE/Hotspot, harga, limit kecepatan jika perlu).

2. **Pelanggan**  
   Menu **Pelanggan** → **Tambah Pelanggan**:
   - Pilih **Router** (MikroTik yang tadi).
   - Pilih **Paket**.
   - Isi nama, **username**, **password** (harus sama dengan yang dipakai di PPPoE/Hotspot).
   - Pilih tipe: **PPPoE** atau **Hotspot**.
   - Simpan.

   Jika koneksi API ke router OK, aplikasi akan **otomatis menambah** PPPoE Secret atau Hotspot User di MikroTik.

---

## 8. Isolir / Aktifkan Pelanggan (sambungan ke MikroTik)

- **Isolir**: di daftar pelanggan, tombol **Isolir** → aplikasi memanggil API MikroTik untuk **disable** PPPoE secret / Hotspot user.
- **Aktifkan**: tombol **Aktifkan** → aplikasi memanggil API untuk **enable** lagi.

Ini bukti bahwa aplikasi sudah terkoneksi ke MikroTik: aksi di web langsung mengubah status di router.

---

## Ringkasan Urutan

| No | Tahapan |
|----|--------|
| 1 | Pasang Node.js 18+, clone/download project, `npm install` + `npm run init-db` |
| 2 | Jalankan app (`npm run dev`), login admin di browser |
| 3 | Di MikroTik: aktifkan **api** (8728) atau **api-ssl** (8729) di IP → Services |
| 4 | Di app: **Router MikroTik** → Tambah Router (IP, port, user, pass, SSL jika perlu) |
| 5 | Di app: **Test** koneksi router → harus sukses |
| 6 | Di MikroTik: pastikan PPPoE Server atau Hotspot sudah jalan |
| 7 | Di app: buat **Paket** lalu **Pelanggan** (pilih router, paket, username/password, tipe PPPoE/Hotspot) |
| 8 | Cek isolir/aktifkan pelanggan → status berubah di MikroTik = terkoneksi |

---

## Troubleshooting

- **Koneksi gagal / timeout**  
  - Cek IP, port (8728/8729), username/password.  
  - Cek **IP → Services** (api / api-ssl enabled).  
  - Cek firewall (MikroTik dan jaringan antara PC dengan router).

- **Pelanggan tidak bisa login PPPoE/Hotspot**  
  - Pastikan PPPoE Server / Hotspot di MikroTik sudah benar.  
  - Pastikan username & password di aplikasi sama dengan yang di router (aplikasi yang menambah ke router saat simpan pelanggan).

- **Router di lokasi lain (tidak satu LAN)**  
  - Bisa pakai fitur **VPN Radius** (WireGuard): router connect ke server Anda, aplikasi akses router lewat IP VPN. Lihat bagian VPN Radius di **README.md**.

- **Mode RADIUS gagal test/sinkron**  
  - Jika backend Supabase: pastikan `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` valid, dan tabel `radcheck`/`radreply` sudah dibuat.  
  - Jika backend MySQL: pastikan env `RADIUS_DB_*` terisi benar.  
  - Pastikan user DB punya hak insert/update/delete ke tabel radius.
