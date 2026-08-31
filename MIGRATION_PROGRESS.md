# Progress Migrasi Frontend (Phase 5)

Melacak file mana yang sudah pindah dari Supabase langsung ke Laravel API
(`src/lib/apiClient.js`), supaya migrasi bisa dilanjut bertahap tanpa mengulang
kerjaan atau kelewatan file.

## ⚠️ Koreksi jumlah file (penting)

Audit Phase 1 awal menghitung **24 file** pakai Supabase, tapi itu keliru - grep yang dipakai
waktu itu (`grep "supabase\."`) tidak menangkap pola pemanggilan multi-baris seperti:
```js
const { data } = await supabase
  .from('pesanan')
  ...
```
Setelah dicek ulang pakai `grep "supabaseClient"` (cari referensi import, lebih tahan pola
multi-baris), jumlah sebenarnya adalah **27 file**. 9 file yang sebelumnya tidak
tercatat: `Checkout.jsx`, `Favorit.jsx`, `Peta.jsx`, `PesananSaya.jsx`, `RiwayatPesanan.jsx`,
`admin/DashboardAdmin.jsx`, `admin/KelolaPesanan.jsx`, `mitra/DashboardKurir.jsx`,
`mitra/DashboardToko.jsx`. Checklist di bawah sudah pakai angka yang benar.

## ✅ Selesai (Batch 1 — Fondasi Auth)

- `src/lib/apiClient.js` — **BARU**, fetch wrapper + Sanctum CSRF handling
- `src/context/AuthContext.jsx` — login, register, logout, Google OAuth, lupa/reset password,
  **updateProfile** (ditambah di Batch 3a)
- `src/App.jsx` — cek `maintenance_mode` lewat endpoint publik
- `src/pages/Login.jsx`, `Register.jsx` (baru), `LupaPassword.jsx` (baru), `ResetPassword.jsx` (baru)

## ✅ Selesai (Batch 2 — Marketplace publik)

- `src/pages/Home.jsx`, `TokoList.jsx`, `TokoDetail.jsx`, `ProdukList.jsx`, `ProdukDetail.jsx`,
  `LayananAntar.jsx`
- Backend: `BannerController`, `PopulerController` (produk-populer, toko-populer),
  filter `?diskon=1`, agregat rating/jumlah produk via `withCount`/`withAvg`
- **Ditemukan & ditambahkan**: 6 database VIEW yang terlewat di audit Phase 1 (`toko_stats`,
  `produk_terlaris`, `produk_populer`, `toko_populer`, `statistik_global`, `penjualan_harian`)
  — migration `2024_01_02_000001_create_stats_views.php`. Endpoint untuk `toko_stats` &
  `produk_terlaris` (dashboard mitra) dan `statistik_global` & `penjualan_harian` (dashboard
  admin) menyusul di Batch 4/5.

## ✅ Selesai (Batch 3a — Fitur pembeli sederhana)

- `src/pages/PelangganDashboard.jsx` — pakai `/pesanan-saya`, `/favorit`, `/review-saya`
- `src/pages/EditProfil.jsx` — pakai `PUT /auth/me` (endpoint baru)
- `src/pages/Favorit.jsx` — pakai `GET /favorit`
- `src/pages/ReviewSaya.jsx`, `src/components/ReviewForm.jsx` — pakai `GET /review-saya`,
  `PUT /review/{jenis}/{id}`, `DELETE /review/{jenis}/{id}` (endpoint baru)
- `src/lib/storage.js` — upload lewat `POST /upload` (folder disamakan dengan yang dipakai
  di seluruh frontend: produk, toko, kurir, kurir/logo, profil)

**Backend ditambah** untuk Batch 3a: `PUT /auth/me` (update profil sendiri - cuma
nama/foto/no_whatsapp, bukan role/email/status), dan 3 endpoint review baru (`GET /review-saya`,
`PUT/DELETE /review/{jenis}/{id}` dengan pengecekan kepemilikan review).

## ✅ Selesai (Batch 3b — Alur pesanan)

- `src/pages/Checkout.jsx` — harga & total dikunci ulang oleh backend saat checkout (bukan
  dipercaya dari state frontend); pesan WhatsApp dibangun dari data pesanan hasil response API
  (otoritatif), bukan dari state keranjang lokal lagi
- `src/pages/PesananSaya.jsx` — pakai `GET /pesanan-saya`
- `src/pages/RiwayatPesanan.jsx` — dimigrasi juga, meski **tidak dirujuk di routing manapun**
  (kemungkinan duplikat lama dari PesananSaya.jsx yang sudah tidak dipakai). Tidak dihapus
  sesuai prinsip "jangan hapus tanpa alasan teknis jelas" - keputusan hapus/pertahankan
  diserahkan ke Anda.

**Backend ditambah**: filter `?tersedia=1` di `GET /kurir` (dipakai Checkout untuk cuma
menampilkan kurir yang online).

## ✅ Selesai (Batch 3c — Klaim mitra & peta)

- `src/pages/KlaimMitra.jsx` — pakai `POST /klaim`
- `src/pages/Peta.jsx` — pakai `GET /toko?punya_lokasi=1` dan `GET /produk?toko_ids=...`
  (bulk, satu request buat semua toko, bukan N request)

**Backend ditambah**: `GET /admin-whatsapp` (nomor WA admin/super_admin aktif pertama - dipakai
alur klaim), filter `?punya_lokasi=1` di `GET /toko`, filter `?toko_ids=a,b,c` (bulk) di
`GET /produk`.

Batch 3 (fitur pembeli) sekarang **tuntas semua**. Sisa 16 file murni mitra & admin.

## ✅ Selesai (Batch 4 — Mitra)

- `src/pages/mitra/DaftarMitra.jsx` — pakai `POST /daftar-mitra/toko` dan `POST /daftar-mitra/kurir`
  (endpoint baru). **Temuan penting**: ini flow BERBEDA dari KlaimMitra - user langsung bikin
  toko/kurir baru dengan dirinya sebagai pemilik (bukan klaim listing yang sudah ada), TAPI
  role tetap `pembeli` sampai admin approve manual lewat Kelola Pengguna - konsisten dengan
  instruksi "role tidak berubah otomatis hanya karena operasi UI".
- `src/pages/mitra/PesananMasuk.jsx` — pakai `GET /mitra/toko/pesanan`
- `src/pages/mitra/DashboardToko.jsx` — pakai `GET /mitra/toko/stats` (VIEW `toko_stats` yang
  tadinya ditunda, sekarang dibuka), plus semua endpoint CRUD produk & profil toko mitra
- `src/pages/mitra/DashboardKurir.jsx` — pakai `GET /mitra/kurir/pesanan` (endpoint baru)

**Backend ditambah**: `DaftarMitraController` (storeToko, storeKurir), `GET /mitra/toko/stats`,
`GET /mitra/kurir/pesanan`.

Batch 4 (mitra) **tuntas semua**. Sisa 12 file murni admin (Batch 5, batch terakhir).

## ✅ Selesai (Batch 5 — Admin) — TERAKHIR

- `KelolaKategori.jsx`, `KelolaKategoriToko.jsx` — CRUD sederhana
- `KelolaKurir.jsx` — **bug ditemukan & diperbaiki**: fitur "klaim cepat via email" di versi
  lama meng-update kolom `status_klaim` yang **tidak pernah ada** di skema `kurir` (dicek ulang
  ke SQL asli) - kemungkinan sudah lama error di produksi. Diperbaiki pakai jalur klaim yang
  benar-benar berjalan (tabel `klaim_mitra`, tercatat + langsung disetujui admin dalam 1 langkah)
- `KelolaPengguna.jsx` — otorisasi (admin biasa vs super_admin) sepenuhnya ditegakkan backend
- `KelolaPesanan.jsx`, `KelolaProdukGlobal.jsx`, `KelolaToko.jsx` — CRUD + moderasi
- `ModerasiReview.jsx` — moderasi 3 tabel review sekaligus
- `PengaturanSistem.jsx` — super_admin only (admin_whatsapp sensitif)
- `DashboardAdmin.jsx`, `SuperAdminDashboard.jsx` — approve/reject klaim sekarang pakai endpoint
  atomic (DB transaction) di backend, bukan 3 update terpisah seperti versi Supabase (yang
  berisiko state setengah-jadi kalau salah satu langkah gagal di tengah)
- `useNotifikasiAdmin.js` — badge notifikasi pengajuan pending

**Backend ditambah**: `GET /admin/statistik` (VIEW `statistik_global`), `GET /admin/produk-terlaris`
(VIEW `produk_terlaris`), `GET /admin/penjualan-harian` (VIEW `penjualan_harian`) - ini **2 VIEW
terakhir** dari 4 yang sempat ditunda sejak Batch 2, sekarang semua 6 VIEW yang ditemukan di
audit sudah punya endpoint. Juga: `Admin\LogAktivitasController`, `Admin\StatistikController`,
update/store untuk produk admin, update untuk user admin, status moderasi review, dan perbaikan
bug klaim-by-email kurir.

**Folder upload lain yang ketemu saat batch ini** (lolos dari grep awal karena pola multi-baris,
kasus sama seperti Supabase kemarin): `toko/banner`, `toko/logo` (dipakai `KelolaToko.jsx`).
Sudah ditambahkan ke allowlist backend.

---

# 🎉 PHASE 5 SELESAI — SEMUA 27 FILE SUDAH DIMIGRASI

```
grep -rl "supabaseClient" src --include=*.jsx --include=*.js
```
mengembalikan **0 file**. Cleanup selesai:
- ✅ `src/lib/supabaseClient.js` dihapus
- ✅ `@supabase/supabase-js` dihapus dari `package.json`
- ✅ `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` dihapus dari `.env.example` dan `.env.local`

**Boleh mulai Phase 6 (Redesign UI/UX)** kapan saja setelah checkpoint ini diverifikasi jalan.

## Cleanup setelah semua file selesai — SUDAH DILAKUKAN

- ✅ `src/lib/supabaseClient.js` dihapus
- ✅ Dependency `@supabase/supabase-js` dihapus dari `package.json`
- ✅ `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` dihapus dari `.env.example` dan `.env.local`
- ➡️ **Boleh mulai Phase 6 (Redesign UI/UX)**

## Catatan penting untuk siapa pun (termasuk Claude sesi berikutnya) yang melanjutkan

- Pola pemanggilan API: `import { api } from '../lib/apiClient'` lalu `api.get('/toko')`,
  `api.post('/pesanan', data)`, dst. Response selalu `{success, message, data}` - akses
  datanya lewat `res.data`. Endpoint yang di-paginate Laravel (`GET /toko`, `/produk`, `/kurir`,
  `/pesanan-saya`, dll) mengembalikan `res.data.data` untuk array item-nya, plus meta seperti
  `res.data.total`.
- Error dari API otomatis di-`throw` sebagai `Error` dengan `.message` terisi - `try/catch` biasa.
- **SEBELUM mengerjakan batch baru, selalu cek ulang dengan
  `grep -rl "supabaseClient" src --include=*.jsx --include=*.js` (BUKAN `grep "supabase\."`,
  itu yang menyebabkan miss 9 file di awal) untuk memastikan tidak ada file lain yang kelewatan.**
- **Jangan hapus `supabaseClient.js` atau dependency Supabase sebelum SEMUA file di atas
  checklist selesai.**
