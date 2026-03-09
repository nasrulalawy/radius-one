# Hapus tabel lewat Dashboard (tanpa SQL)

Jika SQL Editor memberi error **"Failed to perform authorization check"**, hapus tabel lewat **Table Editor**:

1. Buka **Supabase Dashboard** → project Anda.
2. Menu kiri: **Table Editor**.
3. Hapus tabel **satu per satu** (klik tabel → ikon sampah / **Delete table**), dengan urutan:
   - **payments**
   - **sessions**
   - **nas_devices**
   - **services**
   - **admin_profiles**
   - **settings**
4. **Jangan** hapus:
   - **radius_users** (tetap dipakai)
   - Tabel di schema **auth** (auth.users, dll.) — jangan dihapus.

Selesai. Hanya **radius_users** yang tersisa.
