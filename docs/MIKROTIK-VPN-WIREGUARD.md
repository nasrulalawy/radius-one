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
