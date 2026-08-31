# Setup NOKA — Panduan Lengkap dari Nol

NOKA terdiri dari 2 bagian terpisah yang harus dijalankan berbarengan:
- **Backend**: Laravel API (folder `noka-backend-real/`)
- **Frontend**: React + Vite (folder root, isinya `src/`)

Ikuti urutan di bawah — backend duluan, baru frontend.

---

## 0. Yang perlu disiapkan dulu

| Kebutuhan | Versi | Cek dengan |
|---|---|---|
| PHP | 8.2 atau lebih baru | `php -v` |
| Composer | 2.x | `composer -V` |
| Node.js | 18 atau lebih baru | `node -v` |
| Database PostgreSQL | - | Neon (gratis, cloud) atau Postgres lokal |

Kalau `php -v` atau `composer -V` tidak dikenali, instal dulu PHP (https://windows.php.net/download/ untuk Windows, atau pakai Laragon/XAMPP yang sudah termasuk PHP+Composer) sebelum lanjut.

---

## 1. Setup Backend (Laravel)

Buka terminal di folder `noka-backend-real/` (bukan folder `backend` — pastikan nama foldernya sesuai yang ada di ZIP, kalau di-rename manual pastikan isinya `artisan`, `composer.json`, `app/`, dll).

```bash
cd noka-backend-real
```

### 1.1 Install dependency PHP

```bash
composer install
```

**Kalau muncul error seperti ini:**
```
- Required package "laravel/framework" is in the lock file as "vX.X.X" but that does not satisfy your constraint "^11.44|^12.0".
- Required package "phpoffice/phpspreadsheet" is not present in the lock file.
```
Ini artinya `composer.lock` yang ikut ter-zip sudah tidak sinkron dengan `composer.json` (biasa terjadi kalau lock file lama tercampur, atau ada dependency baru yang ditambahkan — di NOKA, `phpoffice/phpspreadsheet` untuk fitur laporan Excel baru ditambahkan belakangan dan belum sempat di-lock). **Solusinya, jalankan `composer update` sebagai gantinya:**

```bash
composer update
```

Ini akan meregenerasi `composer.lock` sesuai isi `composer.json` yang sebenarnya (Laravel 11/12, PHPUnit 11, dan PhpSpreadsheet ikut ter-download). Prosesnya lebih lama dari `install` biasa (composer harus menghitung ulang kombinasi versi), tunggu sampai selesai.

### 1.2 Buat file `.env`

```bash
cp .env.example .env
```

Buka `.env`, lalu isi minimal bagian berikut:

```dotenv
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

DB_CONNECTION=pgsql
DB_HOST=isi-host-database-kamu
DB_PORT=5432
DB_DATABASE=isi-nama-database
DB_USERNAME=isi-username
DB_PASSWORD=isi-password
DB_SSLMODE=require

SANCTUM_STATEFUL_DOMAINS=localhost:5173
SESSION_DOMAIN=localhost

MAIL_MAILER=smtp
MAIL_HOST=isi-smtp-host
MAIL_PORT=587
MAIL_USERNAME=isi-smtp-username
MAIL_PASSWORD=isi-smtp-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@noka.id"
```

**Kalau belum punya database Postgres**, cara tercepat pakai **Neon** (gratis, tanpa kartu kredit):
1. Buat akun di https://neon.tech
2. Buat project baru
3. Buka **Connection Details**, salin host/database/username/password ke `.env` di atas

**Kalau belum punya SMTP** (buat kirim email verifikasi & reset password), bisa pakai layanan gratis seperti Mailtrap (https://mailtrap.io) untuk testing — email tidak benar-benar terkirim ke inbox asli, tapi bisa dilihat di dashboard Mailtrap.

⚠️ **Jangan pakai `FILESYSTEM_DISK=local`** — harus `public` (sudah default di `.env.example`), karena upload gambar (foto toko/produk/kurir) disimpan lewat disk `public` supaya bisa diakses lewat URL `/storage/...`. Kalau salah, gambar akan ke-upload tapi tidak pernah muncul (broken image).

### 1.3 Generate application key

```bash
php artisan key:generate
```

### 1.4 Jalankan migration

```bash
php artisan migrate
```

Ini akan membuat semua tabel database dari nol, termasuk kolom-kolom yang ditambahkan selama proses perbaikan (verifikasi email, link review-ke-pesanan, jam operasional, status pesanan, dll).

### 1.5 Buat symlink storage (opsional, tidak wajib)

```bash
php artisan storage:link
```

NOKA punya jalur cadangan otomatis (`/media/{path}`) buat menyajikan foto yang **tidak bergantung pada symlink ini sama sekali** — jadi foto tetap tampil normal walau langkah ini di-skip atau symlink-nya gagal dibuat (sering terjadi di Windows tanpa Developer Mode aktif, biasanya muncul sebagai error 403 Forbidden). Tetap disarankan dijalankan sebagai jalur utama yang lebih cepat kalau memang berhasil.

### 1.6 Jalankan server backend

```bash
php artisan serve
```

Backend akan jalan di alamat & port sesuai `APP_URL` di `.env` (default Laravel `http://localhost:8000` kalau tidak ditentukan lain). **Pastikan port ini SAMA PERSIS dengan `VITE_API_URL` di `.env` frontend (langkah 2)** — kalau beda, data teks masih bisa muncul tapi foto tidak akan tampil (backend membangun path foto relatif, frontend yang menggabungkannya ke `VITE_API_URL` saat menampilkan). **Biarkan terminal ini tetap terbuka.**

---

## 2. Setup Frontend (React)

Buka **terminal baru** (jangan tutup terminal backend), lalu masuk ke folder root project (yang isinya `src/`, `package.json`, bukan folder backend).

```bash
npm install
```

### 2.1 Buat file `.env.local`

```bash
cp .env.example .env.local
```

Isi dengan URL backend yang tadi dijalankan:

```dotenv
VITE_API_URL=http://localhost:8000
```

⚠️ **Port di sini HARUS SAMA PERSIS** dengan port backend beneran jalan (langkah 1.6) — kalau backend kebetulan jalan di port lain (mis. `8001`), samakan angka ini. Beda port adalah penyebab paling umum "foto tidak muncul" padahal data lain normal.

### 2.2 Jalankan frontend

```bash
npm run dev
```

Frontend akan jalan di `http://localhost:5173`. Buka di browser.

---

## 3. Bikin akun pertama jadi Super Admin

1. Daftar akun baru lewat halaman Register di `http://localhost:5173/register`
2. Cek email (atau dashboard Mailtrap kalau pakai itu) untuk link verifikasi, klik link-nya
3. Login
4. Jadikan akun itu `super_admin` lewat database langsung (belum ada UI untuk ini, memang sengaja — super_admin tidak boleh dibuat sembarangan dari UI):

   Buka **Neon SQL Editor** (atau `psql`/pgAdmin kalau pakai Postgres lain), jalankan:
   ```sql
   update users set role = 'super_admin' where email = 'emailmu@example.com';
   ```
5. Logout lalu login lagi supaya role baru ke-load.

---

## 4. Ganti nomor WhatsApp admin (untuk klaim mitra)

Cari `NOMOR_WA_ADMIN` di `src/pages/KlaimMitra.jsx`, ganti dengan nomor WhatsApp admin NOKA yang sebenarnya.

---

## 5. Setup Supabase (database cadangan / dual-write) — OPSIONAL

NOKA bisa jalan dengan **1 database saja** (Neon, dari langkah 1) — bagian ini murni **opsional**, buat yang mau punya salinan cadangan otomatis di Supabase. Skip bagian ini kalau belum perlu; aplikasi tetap jalan normal tanpanya.

**Konsepnya:** Neon tetap **satu-satunya** database yang **dibaca** aplikasi (source of truth). Supabase cuma nampung **salinan tulis-jalan** (mirror) dari setiap perubahan pesanan — kalau Neon down/hilang, ada cadangan. Kalau Supabase belum di-setup atau lagi down, aplikasi tetap jalan normal (mirror di-skip diam-diam, tidak ada error ke user).

### 5.1 Buat project Supabase

1. Daftar/login di https://supabase.com, klik **New Project**
2. Catat **Database Password** yang kamu buat saat itu (butuh lagi di langkah 5.3)
3. Tunggu project selesai di-provision (1-2 menit)

### 5.2 Buat semua tabel di Supabase

1. Buka project Supabase, masuk ke **SQL Editor** (ikon di sidebar kiri)
2. Klik **New query**
3. Buka file `noka-backend-real/database/SUPABASE-SCHEMA-LENGKAP.sql`, salin **seluruh isinya**, paste ke SQL Editor
4. Klik **Run**

Ini membuat semua tabel NOKA di Supabase dengan struktur yang sama persis seperti Neon (kosong, belum ada data — data lama disalin di langkah 5.4).

> ⚠️ **Jangan** pakai file `noka_schema_supabase.sql` di root repo — itu skema LAMA dari sebelum proyek pindah ke Laravel, sudah tidak sesuai (masih pakai Supabase Auth). Sudah ditandai jelas usang di dalam file itu sendiri.

### 5.3 Ambil kredensial koneksi Supabase

1. Di Supabase, buka **Project Settings > Database**
2. Cari bagian **Connection parameters** (bukan "Connection string" — kita butuh nilainya terpisah)
3. Catat: **Host**, **Database name** (biasanya `postgres`), **Port** (biasanya `5432`), **User** (biasanya `postgres`)
4. Password = yang kamu buat di langkah 5.1

### 5.4 Isi ke `.env` backend

Buka `noka-backend-real/.env`, isi bagian `DB_LEGACY_*` (sudah ada placeholder-nya di `.env.example`):

```dotenv
DB_LEGACY_HOST=db.xxxxxxxxxxxx.supabase.co
DB_LEGACY_PORT=5432
DB_LEGACY_DATABASE=postgres
DB_LEGACY_USERNAME=postgres
DB_LEGACY_PASSWORD=password_yang_dicatat_tadi
```

### 5.5 Salin data lama dari Neon ke Supabase (backfill sekali jalan)

Kalau Neon kamu sudah ada isinya (bukan database baru kosong), jalankan ini SEKALI supaya Supabase langsung sinkron dengan data yang sudah ada (bukan cuma data baru ke depannya):

```bash
cd noka-backend-real
php artisan supabase:backfill
```

Proses ini akan menampilkan progress bar per tabel. Aman dijalankan ulang kapan saja (pakai upsert, tidak akan bikin data dobel).

### 5.6 Verifikasi dual-write jalan

1. Buat/ubah status 1 pesanan lewat aplikasi NOKA seperti biasa
2. Buka Supabase **Table Editor > pesanan**, cek baris pesanan itu muncul dengan data yang sama seperti di Neon
3. Kalau tidak muncul, cek `storage/logs/laravel.log` di backend — `DualWriteMirror` mencatat warning kalau gagal konek/menyalin (tapi tidak pernah bikin request utama gagal)

### 5.7 (Opsional) Jadwalkan tagihan bulanan otomatis

Fitur langganan punya command `tagihan:generate` yang perlu jalan otomatis tiap hari. Tambahkan 1 baris cron di server production (bukan buat local dev):

```
* * * * * cd /path/ke/noka-backend-real && php artisan schedule:run >> /dev/null 2>&1
```

Tanpa cron ini, tagihan bulanan bisa tetap dihitung manual lewat tombol "Hitung ulang tagihan" di halaman admin `/admin/langganan`.

---

## 6. Update dari versi lama (sudah pernah setup sebelumnya)

Kalau kamu update kode NOKA dari versi lama (bukan setup dari nol), selalu jalankan ini setiap kali dapat update baru:

```bash
cd noka-backend-real
composer install          # kalau ada dependency baru
php artisan migrate       # kalau ada tabel/kolom baru
php artisan config:clear  # bersihkan cache config lama
```

Lalu restart `php artisan serve` (stop dulu, jalankan ulang) supaya semua perubahan kepakai.

---

## Troubleshooting

**Gambar upload tidak muncul (broken image)**
- Penyebab paling umum: `VITE_API_URL` di frontend **tidak sama persis** dengan port backend beneran jalan — cek keduanya cocok (lihat catatan di langkah 1.6 & 2.1)
- Foto TIDAK bergantung pada symlink `storage:link` lagi (ada jalur cadangan otomatis lewat `/media/{path}`) — jadi kalau langkah di atas sudah benar tapi masih 403/404, coba `php artisan config:clear` lalu restart `php artisan serve`
- Cek `FILESYSTEM_DISK=public` di `.env` backend (bukan `local`)
- Buka DevTools browser (F12) → tab Network → klik gambar yang gagal → lihat **Request URL** dan **Status Code**-nya buat tahu persis di mana putusnya

**Login gagal terus / CORS error di console browser**
- Pastikan `FRONTEND_URL` di `.env` backend sama persis dengan URL frontend (termasuk port)
- Pastikan `SANCTUM_STATEFUL_DOMAINS` mencantumkan domain+port frontend (`localhost:5173`)
- Pastikan `VITE_API_URL` di frontend sama persis dengan `APP_URL` backend

**Email verifikasi/reset password tidak terkirim**
- Cek kredensial `MAIL_*` di `.env` sudah benar
- Untuk testing tanpa SMTP asli, set `MAIL_MAILER=log` — email akan ditulis ke `storage/logs/laravel.log` alih-alih benar-benar dikirim, jadi kamu bisa lihat link verifikasinya di situ

**Error saat `composer install`/`update` soal versi PHP**
- Cek `php -v` minimal 8.2. Kalau versi PHP di komputer lebih lama, install PHP 8.2+ dulu (atau pakai Laragon yang bisa switch versi PHP)

**Export laporan Excel error "class not found"**
- Berarti `phpoffice/phpspreadsheet` belum ter-install — jalankan ulang `composer update` di folder backend

**Data tidak muncul di Supabase padahal sudah setup dual-write**
- Cek `DB_LEGACY_HOST` dkk di `.env` sudah terisi benar (bukan placeholder kosong)
- Cek `storage/logs/laravel.log` — cari baris `DualWriteMirror` untuk pesan error koneksi/query
- Pastikan sudah jalankan `SUPABASE-SCHEMA-LENGKAP.sql` di Supabase SQL Editor (tabel tujuan harus ada dulu)
- Untuk data LAMA yang sudah ada sebelum dual-write di-setup, jalankan `php artisan supabase:backfill` (lihat bagian 5.5) — mirror otomatis cuma nyalin data BARU ke depan

**Email verifikasi/reset password tidak terkirim, atau error "535 Username and Password not accepted"**
- Ini error dari Google, bukan dari NOKA — Gmail menolak login SMTP pakai password akun biasa. Wajib pakai **App Password** (password 16 karakter khusus), bukan password login Gmail. Lihat komentar lengkap di atas kolom `MAIL_PASSWORD` pada `.env.example`, ringkasnya:
  1. Aktifkan Verifikasi 2 Langkah di akun Gmail itu dulu (https://myaccount.google.com/security)
  2. Buat App Password baru di https://myaccount.google.com/apppasswords
  3. Pakai App Password itu (bukan password Gmail biasa) di `MAIL_PASSWORD`
- Registrasi/reset password tetap akan tampil **berhasil** ke pengguna walau email gagal terkirim (supaya tidak ada informasi bocor & akun yang sudah kebuat tidak "hilang" dari sisi user) — tapi error sebenarnya tetap tercatat di `storage/logs/laravel.log`, cek di situ untuk debug
