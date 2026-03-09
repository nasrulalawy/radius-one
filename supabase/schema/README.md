# Schema RadiusOne (pecah per urutan)

Jalankan file di Supabase **SQL Editor** **berurutan** dari 01 sampai 14:

| No | File | Isi |
|----|------|-----|
| 01 | `01_extensions.sql` | UUID extension |
| 02 | `02_admin_profiles.sql` | Tabel admin_profiles |
| 03 | `03_services.sql` | Tabel services |
| 04 | `04_nas_devices.sql` | Tabel nas_devices |
| 05 | `05_user_groups.sql` | Tabel user_groups |
| 06 | `06_ip_pools.sql` | Tabel ip_pools |
| 07 | `07_radius_users.sql` | Tabel radius_users (butuh 03, 05) |
| 08 | `08_sessions.sql` | Tabel sessions (butuh 07, 04) |
| 09 | `09_payments.sql` | Tabel payments (butuh 07) |
| 10 | `10_vouchers.sql` | Tabel vouchers (butuh 03, 07) |
| 11 | `11_invoices.sql` | Tabel invoices (butuh 07) |
| 12 | `12_settings.sql` | Tabel settings |
| 13 | `13_rls.sql` | Enable RLS + policies |
| 14 | `14_seed.sql` | Data awal settings |

**Cara:** Buka tiap file → copy isi → paste di SQL Editor → Run. Ulangi untuk file berikutnya.
