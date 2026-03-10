# Darimana App Mendeteksi "Data Terpakai" dan "Voucher Terpakai"

## Data terpakai (radius_users.data_used_mb)

**Sumber:** **RADIUS Accounting** — bukan dari app web langsung.

1. **MikroTik** (atau NAS lain) mengirim **Accounting-Request** (UDP port **1813**) ke **RADIUS server** Anda.
2. **RADIUS server** (di project ini: `radius-server/index.js`) menerima paket itu dan membaca:
   - `Acct-Status-Type`: Start / Interim-Update / **Stop**
   - `Acct-Input-Octets`, `Acct-Output-Octets` (traffic in/out)
   - `User-Name`, `Acct-Session-Id`, dll.
3. Server menulis ke Supabase:
   - Tabel **sessions**: session per user (session_id, data_in, data_out, dll.).
   - Saat **Stop**: total MB (input+output) **ditambahkan** ke **radius_users.data_used_mb** untuk user yang login.
4. **App web** hanya **membaca** dari Supabase: halaman Users, Traffic Report, Dashboard memakai kolom `data_used_mb` yang sudah di-update oleh RADIUS server.

**Kesimpulan:** Data terpakai terdeteksi karena **RADIUS server** (yang jalan di server terpisah, bukan di browser) menerima accounting dari router dan menulis ke database. Tanpa RADIUS server yang jalan dan tanpa MikroTik yang dikonfigurasi kirim accounting ke server itu, `data_used_mb` tidak akan berubah.

---

## Voucher terpakai (vouchers.used_at)

**Saat ini:** Kolom **used_at** (dan **used_by_user_id**) di tabel `vouchers` **tidak di-set otomatis** oleh sistem mana pun.

- **Auth RADIUS** di `radius-server/index.js` hanya cek **radius_users** (username + password). Tidak ada logika “login dengan kode voucher”.
- Jadi meskipun pelanggan suatu saat login dengan kode+password voucher (jika RADIUS server nanti mendukung voucher), **used_at** saat ini tidak di-update.

**Agar voucher terpakai terdeteksi:**

1. **Opsi A – Di RADIUS server (auth):**  
   Saat menerima Access-Request, jika username/password cocok dengan **voucher** (bukan radius_users):
   - Terima login (Access-Accept).
   - Update `vouchers` set **used_at = now()**, **used_by_user_id = &lt;id user yang dipakai atau buat sementara&gt;** untuk voucher dengan kode tersebut.
2. **Opsi B – Manual:**  
   Admin mengisi / update **used_at** (dan **used_by_user_id** jika ada) lewat app atau SQL saat voucher dipakai.

Ringkas: **data terpakai** datang dari **RADIUS accounting**; **voucher terpakai** butuh penambahan alur di RADIUS server (auth) atau update manual.
