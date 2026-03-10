# VPN L2TP/IPsec: MikroTik ↔ Server (tanpa WireGuard di MikroTik)

Panduan singkat agar MikroTik (RouterOS 6 atau 7 tanpa WireGuard) dan server RADIUS bisa satu jaringan lewat **L2TP/IPsec**. Setelah tunnel jalan, RADIUS client di MikroTik mengarah ke IP server di VPN; di RadiusOne isi Router Address = IP MikroTik di VPN.

---

## 1. Di server (Ubuntu / VPS)

### Pasang paket

```bash
sudo apt update
sudo apt install -y strongswan strongswan-pki xl2tpd
```

### Buat sertifikat untuk IPsec (opsional, bisa pakai pre-shared key)

Untuk sederhana, pakai **pre-shared key (PSK)**. Buat file:

```bash
sudo nano /etc/ipsec.secrets
```

Isi (ganti `SECRET_PSK_ANDA` dengan string acak kuat):

```
%any %any : PSK "SECRET_PSK_ANDA"
```

### Konfigurasi StrongSwan (IPsec)

```bash
sudo nano /etc/ipsec.conf
```

Contoh (sesuaikan `left=` dengan IP publik server, `right=` boleh 0.0.0.0 untuk terima dari mana saja):

```
config setup
    charondebug="ike 2, knl 2, cfg 2"

conn l2tp-psk
    auto=add
    type=transport
    keyexchange=ikev1
    authby=secret
    left=%defaultroute
    leftprotoport=17/1701
    right=%any
    rightprotoport=17/0
    ike=aes256-sha1-modp2048!
    esp=aes256-sha1!
```

Simpan. Restart:

```bash
sudo systemctl restart strongswan-starter
```

### Konfigurasi xl2tpd (L2TP)

```bash
sudo nano /etc/xl2tpd/xl2tpd.conf
```

Contoh:

```ini
[global]
listen-addr = 0.0.0.0
ipsec saref = yes

[lns default]
ip range = 10.99.0.10-10.99.0.20
local ip = 10.99.0.1
require chap = yes
refuse pap = yes
name = radius-vpn
ppp debug = no
pppoptfile = /etc/ppp/options.xl2tpd
length bit = yes
```

Lalu:

```bash
sudo nano /etc/ppp/options.xl2tpd
```

Isi:

```
ipcp-accept-local
ipcp-accept-remote
ms-dns 8.8.8.8
noccp
auth
crtscts
idle 1800
mtu 1280
mru 1280
nodefaultroute
debug
lock
```

Buat user L2TP (ganti `user1` dan `password1`):

```bash
echo 'user1 * password1 *' | sudo tee /etc/ppp/chap-secrets
```

Restart:

```bash
sudo systemctl restart xl2tpd
```

### Firewall

Buka port UDP 500, 4500 (IPsec), dan 1701 (L2TP):

```bash
sudo ufw allow 500/udp
sudo ufw allow 4500/udp
sudo ufw allow 1701/udp
sudo ufw reload
```

---

## 2. Di MikroTik (L2TP client)

Ganti `IP_SERVER` = IP publik VPS, `user1` / `password1` = sama dengan di `/etc/ppp/chap-secrets`. `SECRET_PSK_ANDA` = sama dengan di `/etc/ipsec.secrets`.

```bash
/interface l2tp-client add \
  name=l2tp-radius \
  connect-to=IP_SERVER \
  user=user1 \
  password=password1 \
  use-ipsec=yes \
  ipsec-secret=SECRET_PSK_ANDA \
  disabled=no
```

Biasanya IP client diberikan server lewat PPP (dari range 10.99.0.10–20). Jika perlu set manual, sesuaikan dengan pool di server:

```bash
/ip address add address=10.99.0.10/24 interface=l2tp-radius
```

Cek status dan IP yang didapat:

```bash
/interface l2tp-client print detail
```

Kalau `running` = yes, tunnel sudah up.

---

## 3. RADIUS + RadiusOne

- **RADIUS server** jalan di VPS yang sama (atau punya IP 10.99.0.1). Pastikan listen di interface yang dapat 10.99.0.1 (atau 0.0.0.0).
- **Di MikroTik** → RADIUS client: **Address** = `10.99.0.1`, Secret = sama dengan di RadiusOne.
- **Di RadiusOne** → Router [NAS] → **Router Address** = IP MikroTik di VPN (mis. `10.99.0.10` dari pool server).

Login hotspot/PPPoE dan accounting akan lewat VPN.

---

## 4. Troubleshooting

- **Tunnel tidak up:** cek log `sudo journalctl -u strongswan-starter -u xl2tpd -f`. Pastikan PSK dan user/password sama di server dan MikroTik.
- **MikroTik tidak dapat IP:** di server cek `ip range` dan `local ip` di `xl2tpd.conf`; pastikan pool (10.99.0.10–20) tidak bentrok dengan jaringan lain.
- **RADIUS tidak nyambung:** pastikan RADIUS server listen 0.0.0.0 atau 10.99.0.1; firewall izinkan UDP 1812/1813 dari 10.99.0.0/24.

Lihat juga: [MIKROTIK-VPN-WIREGUARD.md](./MIKROTIK-VPN-WIREGUARD.md), [RADIUS-SERVER-TENCENT-LIGHTHOUSE.md](./RADIUS-SERVER-TENCENT-LIGHTHOUSE.md).
