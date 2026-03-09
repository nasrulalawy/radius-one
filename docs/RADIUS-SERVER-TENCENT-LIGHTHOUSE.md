# RADIUS Server di Tencent Lighthouse (Ubuntu)

Agar login Hotspot/PPPoE di MikroTik memakai user dari RadiusOne, jalankan RADIUS server di Ubuntu Tencent Lighthouse yang **baca/tulis ke Supabase**.

**Contoh IP server:** `43.173.164.210` — ini yang diisi di MikroTik sebagai alamat RADIUS server.

## 1. Buka port UDP di Tencent Cloud

1. Login **Tencent Cloud Console** → **Lighthouse** → pilih instance Anda.
2. **Firewall** / **Security Group** → tambah **Inbound Rule**:
   - **Port**: 1812, **Protocol**: UDP, **Source**: 0.0.0.0/0 (atau IP MikroTik saja).
   - **Port**: 1813, **Protocol**: UDP, **Source**: 0.0.0.0/0.
3. Simpan.

Di Ubuntu (jika pakai ufw):

```bash
sudo ufw allow 1812/udp
sudo ufw allow 1813/udp
sudo ufw reload
```

## 2. Pasang Node.js & RADIUS server

```bash
# Node.js 18+ (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Upload folder radius-server dari project RadiusOne (atau git clone lalu masuk ke radius-server)
cd /opt/radius-server
npm install
```

## 3. Konfigurasi

Salin env dan isi:

```bash
cp .env.example .env
nano .env
```

Isi `.env`:

```
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Dapatkan **Service Role Key** dari Supabase Dashboard → Project Settings → API. Jangan pakai anon key untuk server (perlu tulis accounting).

## 4. NAS (MikroTik) di RadiusOne

Di **RadiusOne** → **Router [NAS]**:

- **Router Address**: masukkan **IP yang dipakai MikroTik untuk kirim RADIUS** ke server.  
  Jika MikroTik dan server di internet, isi **IP publik** MikroTik (atau IP yang keluar saat akses internet).  
  Jika sama jaringan, isi IP LAN MikroTik (mis. 192.168.1.1).  
  Jika pakai **VPN/WireGuard**, isi IP MikroTik di dalam jaringan VPN (lihat [MIKROTIK-VPN-WIREGUARD.md](./MIKROTIK-VPN-WIREGUARD.md)).
- **Radius Secret**: sama dengan yang Anda set di MikroTik untuk RADIUS client (shared secret).

## 5. Jalankan RADIUS server

```bash
cd /opt/radius-server
node index.js
```

Agar jalan terus (production), pakai **pm2**:

```bash
sudo npm install -g pm2
pm2 start index.js --name radius-server
pm2 save
pm2 startup
```

## 6. Set RADIUS di MikroTik

- **Address**: IP publik server RADIUS Anda.  
  *(Contoh: `43.173.164.210` — ganti dengan IP instance Lighthouse Anda jika berbeda.)*
- **Secret**: sama dengan **Radius Secret** di RadiusOne untuk NAS tersebut.
- **Auth / Accounting port**: 1812 / 1813.

Setelah itu, login Hotspot/PPPoE akan di-auth ke Supabase (tabel `radius_users`), dan accounting akan masuk ke tabel `sessions` serta update `data_used_mb`.

## Troubleshooting

- **User ditolak**: cek username/password di RadiusOne, status user (active/disabled/expired), dan **Router Address** (NAS) harus cocok dengan IP sumber yang dipakai MikroTik.
- **Tidak ada accounting**: pastikan port 1813 UDP terbuka dan RADIUS server jalan (lihat log pm2: `pm2 logs radius-server`).
- **Router tanpa IP publik / pakai VPN atau WireGuard**: lihat [MIKROTIK-VPN-WIREGUARD.md](./MIKROTIK-VPN-WIREGUARD.md).
