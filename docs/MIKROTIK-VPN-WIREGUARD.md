# MikroTik dengan VPN atau WireGuard

Jika router MikroTik **tidak punya IP publik** (hanya IP privat/LAN atau hanya terjangkau lewat VPN/WireGuard), RadiusOne tetap bisa dipakai dengan konfigurasi berikut.

---

## 1. RADIUS (login Hotspot/PPPoE & accounting)

**Tetap berfungsi** selama:

- MikroTik bisa mengirim paket **ke** RADIUS server (outbound).
- Di RadiusOne, **Router Address** diisi dengan **IP yang dipakai MikroTik sebagai sumber** saat kirim RADIUS.

### Opsi A: RADIUS server di internet (mis. Tencent Lighthouse)

- MikroTik di belakang NAT/VPN tetap bisa mengirim Access-Request dan Accounting **ke** IP publik server.
- Di **Router [NAS]** → **Router Address**: isi **IP yang terlihat oleh server** sebagai sumber (biasanya IP publik keluar dari NAT, atau jika pakai WireGuard/VPN ke server, isi **IP MikroTik di dalam jaringan VPN**, mis. `10.0.0.2`).
- Di MikroTik, set RADIUS client ke **IP publik server** (atau IP server di dalam VPN jika server ikut VPN).

### Opsi B: RADIUS server di jaringan yang sama dengan MikroTik (LAN atau satu VPN)

- Pasang RADIUS server (mis. `radius-server` dari project ini) di mesin yang **satu jaringan** dengan MikroTik (LAN yang sama, atau satu VPN/WireGuard).
- Di **Router [NAS]** → **Router Address**: isi **IP MikroTik di jaringan itu** (mis. `192.168.1.1` atau `10.0.0.2` di VPN).
- Di MikroTik, set RADIUS client ke IP RADIUS server di jaringan yang sama.

### Ringkas RADIUS + VPN/WireGuard

| Pihak        | Yang perlu |
|-------------|------------|
| MikroTik    | Bisa akses ke RADIUS server (langsung LAN, atau outbound ke internet/VPN). |
| RADIUS server | Bisa menerima UDP 1812/1813 dari MikroTik. Jika pakai VPN: server harus punya IP di VPN yang bisa dijangkau MikroTik. |
| RadiusOne (Router Address) | IP yang dipakai MikroTik sebagai **sumber** saat kirim RADIUS (IP di LAN, atau IP di VPN, atau IP publik keluar NAT). |

---

## 2. WireGuard: contoh topologi

Contoh agar MikroTik dan RADIUS server saling jangkau lewat WireGuard:

- **MikroTik**: pasang WireGuard client (atau peer), dapat IP VPN mis. `10.99.0.2`.
- **Server RADIUS** (Ubuntu/VPS): pasang WireGuard, dapat IP VPN mis. `10.99.0.1`.
- Keduanya dalam satu subnet WireGuard `10.99.0.0/24`.

Konfigurasi:

- Di **MikroTik** → RADIUS client: **Address** = `10.99.0.1` (IP server di VPN), Secret = sama dengan di RadiusOne.
- Di **RadiusOne** → Router [NAS] → **Router Address** = `10.99.0.2` (IP MikroTik di VPN).

Setelah itu, login hotspot/PPPoE dan accounting akan mengalir lewat VPN.

**Catatan:** WireGuard di MikroTik tersedia di **RouterOS 7.1+**. Jika device Anda RouterOS 6 atau tidak ada menu WireGuard, gunakan VPN alternatif di bawah.

---

## 2b. VPN alternatif (tanpa WireGuard di MikroTik)

Jika MikroTik **tidak punya WireGuard** (RouterOS 6 atau device lama), Anda bisa pakai **L2TP/IPsec** atau **OpenVPN** agar router dan RADIUS server satu jaringan VPN.

### Opsi 1: L2TP/IPsec (biasa ada di RouterOS 6 & 7)

**Di server (Ubuntu/VPS):** pasang L2TP/IPsec server (mis. dengan `xl2tpd` + `strongswan`).  
**Di MikroTik:** buat L2TP client yang connect ke server, dapat IP VPN (mis. `10.99.0.2`).  
RADIUS server jalan di VPS yang sama (atau punya IP di subnet VPN). Di MikroTik set RADIUS client ke IP server di VPN; di RadiusOne isi Router Address = IP MikroTik di VPN.

**Panduan langkah demi langkah:** [VPN-MIKROTIK-L2TP.md](./VPN-MIKROTIK-L2TP.md) (server StrongSwan + xl2tpd, client MikroTik, firewall, troubleshooting).

Contoh singkat di MikroTik (L2TP client):

```bash
/interface l2tp-client add name=l2tp1 user=USER password=PASS connect-to=IP_PUBLIK_SERVER disabled=no
/ip address add address=10.99.0.2/24 interface=l2tp1
```

(IP 10.99.0.2 harus sesuai dengan pool yang diberikan server L2TP.)

### Opsi 2: OpenVPN (client di MikroTik)

**Di server:** pasang OpenVPN, buat config client untuk MikroTik.  
**Di MikroTik:** Package **openvpn-client** (cek di RouterOS 6/7 apakah tersedia untuk device Anda). Import config, connect; dapat IP VPN.  
Lalu set RADIUS client ke IP RADIUS server di VPN; di RadiusOne isi Router Address = IP MikroTik di VPN.

### Opsi 3: WireGuard di perangkat lain (bukan di MikroTik)

- Pasang **WireGuard** di PC atau Raspberry Pi di **LAN yang sama** dengan MikroTik.
- Device itu connect ke VPN server (VPS). RADIUS server jalan di VPS.
- MikroTik **tidak perlu** VPN: set RADIUS client ke **IP publik VPS**. Atau, jika Anda routing khusus: RADIUS server bisa punya IP di subnet VPN dan lalu lintas dari Pi/LAN ke VPS lewat WireGuard — topologi bisa disesuaikan.

Untuk RADIUS saja, **tanpa VPN pun bisa**: MikroTik (di belakang NAT) kirim auth/accounting ke IP publik RADIUS server. VPN hanya perlu kalau Anda ingin server dan router “satu jaringan” (mis. untuk akses REST API dari server ke MikroTik).

---

## 3. Fitur dari dashboard (Test Connection, Cek Semua Router, Putus user)

Fitur ini memanggil **REST API MikroTik dari Supabase Edge (cloud)**. Edge Function **tidak bisa** ikut VPN/WireGuard Anda.

Jadi jika MikroTik **hanya** terjangkau via VPN/WireGuard (tanpa IP publik/DDNS):

- **Test Connection** dan **Cek Semua Router** akan **timeout/gagal** (cloud tidak punya akses ke jaringan VPN).
- **Putus (disconnect)** dari halaman User Online hanya akan menghapus session di database; **tidak** bisa memutus di MikroTik.

Yang tetap jalan:

- **RADIUS auth & accounting** (MikroTik ↔ RADIUS server).
- **CRUD router** di dashboard (data disimpan di Supabase).
- **Putus** hanya efek di DB; user bisa putus manual di MikroTik atau lewat RADIUS CoA jika nanti diimplementasi di server.

### Jika ingin Test Connection / Disconnect dari dashboard ke router di VPN

Perlu komponen tambahan yang jalan di **jaringan yang punya akses VPN** (bukan di Supabase Edge), mis.:

- Sebuah **agent** di VPS/server yang:
  - Terhubung ke WireGuard/VPN yang sama dengan MikroTik,
  - Menerima request dari app (atau dari Edge Function via webhook),
  - Memanggil REST API MikroTik (test, disconnect) lalu mengupdate status di Supabase.

Implementasi agent semacam itu bisa ditambah di kemudian hari; untuk sekarang, skenario VPN/WireGuard didukung penuh untuk **RADIUS** saja.

---

## 4. Checklist singkat

- [ ] MikroTik dan RADIUS server bisa saling jangkau (LAN atau VPN/WireGuard).
- [ ] Di RadiusOne → Router [NAS]: **Router Address** = IP MikroTik yang dipakai sebagai sumber RADIUS (IP di LAN atau IP di VPN).
- [ ] Di MikroTik: RADIUS client mengarah ke IP RADIUS server (LAN atau IP server di VPN), Secret sama dengan di RadiusOne.
- [ ] Jika router hanya di VPN: terima bahwa Test Connection / Cek Semua / Putus dari dashboard tidak akan sampai ke router; RADIUS tetap jalan.

Lihat juga: [RADIUS-SERVER-TENCENT-LIGHTHOUSE.md](./RADIUS-SERVER-TENCENT-LIGHTHOUSE.md), [STATUS-KONEKSI-MIKROTIK.md](./STATUS-KONEKSI-MIKROTIK.md).
