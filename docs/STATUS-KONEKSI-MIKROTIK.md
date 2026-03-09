# Status Koneksi Fitur RadiusOne ke RADIUS Device MikroTik

## Ringkasan

| Fitur | Terkoneksi? | Keterangan |
|-------|-------------|------------|
| **Router [NAS] – CRUD & daftar** | ✅ Ya | Data disimpan di Supabase, tampil di web. |
| **Test koneksi / Ping status** | ✅ Ya | Edge Function memanggil REST API RouterOS 7 (`/rest/system/resource`). |
| **Cek semua router** | ✅ Ya | Edge Function `mikrotik-check-all` mengecek semua NAS tipe MikroTik. |
| **Autentikasi login (Hotspot/PPPoE)** | ❌ Belum | Butuh **RADIUS server** yang baca `radius_users` dan merespons Access-Request dari MikroTik. |
| **Accounting (session & data usage)** | ❌ Belum | Butuh RADIUS server yang terima Accounting-Request dan tulis ke `sessions` + update `data_used_mb`. |
| **User Online / Riwayat Session** | ⚠️ Sebagian | Data dari tabel `sessions`. Tanpa RADIUS accounting, isi tabel hanya dari sumber lain (manual/sync). |
| **Putus (disconnect) user** | ✅ Ya (Hotspot) | Edge Function `mikrotik-disconnect` memutus user di MikroTik (hotspot active remove) lalu hapus dari DB. Tombol "Putus" di User Online memanggil ini. |
| **Pengaturan Auth/Acct port** | ✅ Disimpan | Port 1812/1813 disimpan di Settings; dipakai oleh RADIUS server (bukan oleh app web). |

---

## Yang Sudah Terkoneksi

1. **Manajemen Router [NAS]**
   - Tambah / edit / hapus router, simpan IP, secret, API username/password, time zone, dll.
   - **Test Connection**: Edge Function `mikrotik-test` memanggil REST API MikroTik (RouterOS 7), mengisi `ping_status` dan `last_checked`.
   - **Cek Semua Router**: Edge Function `mikrotik-check-all` mengecek semua router tipe MikroTik dan mengupdate status.
   - **Syarat**: Router harus bisa diakses dari internet (IP publik/DDNS), layanan www atau www-ssl aktif. Jika router hanya terjangkau via **VPN/WireGuard** (tanpa IP publik), Test Connection dan Cek Semua akan gagal dari cloud; RADIUS auth & accounting tetap bisa dipakai — lihat [MIKROTIK-VPN-WIREGUARD.md](./MIKROTIK-VPN-WIREGUARD.md).

2. **Data pelanggan & paket**
   - `radius_users`, `services`, `user_groups` disimpan di Supabase. Siap dipakai oleh RADIUS server untuk autentikasi jika server tersebut baca dari DB kita.

3. **Pengaturan**
   - Port RADIUS Auth (1812) dan Accounting (1813) disimpan; berguna untuk konfigurasi RADIUS server.

---

## Yang Belum Terkoneksi (Butuh Komponen Tambahan)

### 1. Autentikasi login di MikroTik (Hotspot / PPPoE)

- **Alur**: User login di hotspot/PPPoE → MikroTik kirim **Access-Request** ke RADIUS server → server cek username/password (biasanya ke DB) → kirim Access-Accept/Reject.
- **Di RadiusOne**: Kita hanya menyimpan user di `radius_users`. **Tidak ada** RADIUS server di project ini yang menerima request dari MikroTik.
- **Agar terkoneksi**: Perlu **RADIUS server** (mis. FreeRADIUS) yang:
  - Dikonfigurasi dengan client = MikroTik (IP + secret dari `nas_devices`),
  - Membaca user dari database yang sama dengan RadiusOne (atau API RadiusOne), dan
  - Berjalan di server yang bisa dijangkau MikroTik (biasanya satu jaringan atau VPN).

### 2. Accounting (session & data usage)

- **Alur**: Setelah user login, MikroTik kirim **Accounting-Request** (Start / Interim-Update / Stop) ke RADIUS server. Server menyimpan ke DB (session, traffic).
- **Di RadiusOne**: Tabel `sessions` dan field `data_used_mb` di `radius_users` siap dipakai, tapi **tidak ada** proses yang menerima accounting dan menulis ke sini.
- **Agar terkoneksi**: RADIUS server yang sama di atas harus mengolah accounting dan menulis ke Supabase (atau DB yang sinkron dengan RadiusOne).

### 3. Putus (disconnect) user di MikroTik

- **Sudah ditambah**: Edge Function `mikrotik-disconnect` memanggil REST API MikroTik (`GET /rest/ip/hotspot/active`, lalu `DELETE` by `.id`). Tombol "Putus" di halaman User Online memanggil fungsi ini; jika router terjangkau dan user ada di hotspot active, user akan putus di MikroTik dan record dihapus dari DB. Jika tidak (mis. pakai PPPoE atau router tidak terjangkau), fallback: hanya hapus dari DB.

---

## Rekomendasi

1. **Edge Functions yang sudah dipakai** (REST API MikroTik):
   - Test koneksi ✅
   - Cek semua router ✅
   - Disconnect user (hotspot active remove) ✅
2. **RADIUS auth & accounting**: Butuh komponen di luar app web (RADIUS server yang baca/tulis ke DB kita). Bisa:
   - FreeRADIUS + modul yang baca/tulis ke PostgreSQL/Supabase, atau
   - Custom RADIUS server (Node/Go/dll.) yang pakai tabel `radius_users` dan `sessions`.

Setelah RADIUS server terpasang dan MikroTik mengarah ke server tersebut (IP + secret sesuai `nas_devices`), maka login hotspot/PPPoE dan isi session/data usage akan terkoneksi dengan data di RadiusOne.
