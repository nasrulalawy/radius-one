# RADIUS Server untuk RadiusOne

Server RADIUS (UDP 1812 auth, 1813 accounting) yang memakai **Supabase** sebagai backend:
- **Auth**: cek username/password ke tabel `radius_users`, status & expiry.
- **Accounting**: tulis ke `sessions`, update `data_used_mb` di `radius_users`.

Jalankan di **Ubuntu** (mis. Tencent Lighthouse). Panduan lengkap: [../docs/RADIUS-SERVER-TENCENT-LIGHTHOUSE.md](../docs/RADIUS-SERVER-TENCENT-LIGHTHOUSE.md).

## Cepat

```bash
cp .env.example .env
# Isi SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY
npm install
npm start
```

Buka firewall UDP 1812 dan 1813. Di MikroTik, set RADIUS client ke IP server ini + secret yang sama dengan di RadiusOne (Router [NAS]).
