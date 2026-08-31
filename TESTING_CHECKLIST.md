# NOKA — Checklist Testing Menyeluruh (Phase 7)

Status audit statis (sudah saya lakukan, sebelum Anda mulai testing manual):
- ✅ Semua import komponen React di seluruh `src/` — valid, tidak ada file hilang
- ✅ Semua route Laravel (`routes/api.php`) resolve ke Controller + method yang benar-benar ada
- ✅ Semua Model yang direferensikan Controller ada filenya
- ✅ Semua relasi Eloquent (`->toko()`, `->produk()`, dst) yang dipanggil controller terdefinisi di model
- ✅ Urutan migration mengikuti foreign key (dicek ulang manual)

Ini mengeliminasi kelas bug paling umum (typo nama file/method/relasi) sebelum Anda buang waktu
testing manual. Tapi ini BUKAN pengganti testing sungguhan — saya tidak bisa menjalankan
aplikasi (tidak ada PHP/Node di sandbox saya), jadi logic runtime, query database asli, dan
tampilan visual tetap perlu dicoba langsung oleh Anda.

Cara pakai checklist ini: centang manual sambil jalan `php artisan serve` + `npm run dev`
bersamaan, browser di `http://noka.test` (atau `localhost:5173`), API di `http://api.noka.test`.

---

## 1. Register, Login, Logout

- [ ] Register akun baru (email+password) → berhasil, langsung login otomatis
- [ ] Register dengan email yang sudah dipakai → error jelas, bukan crash
- [ ] Register dengan password < 8 karakter atau tanpa angka/huruf → error validasi jelas
- [ ] Login email+password benar → berhasil masuk dashboard
- [ ] Login dengan password salah → pesan error, tidak bocorkan apakah email terdaftar
- [ ] Login Google (tombol "Lanjutkan dengan Google") → redirect ke Google, kembali ke NOKA, otomatis login
- [ ] Login Google dengan email yang SAMA seperti akun email/password yang sudah ada → akun ditautkan (bukan bikin akun baru), cek `google_id` di DB terisi
- [ ] Logout → sesi benar-benar hilang, halaman yang butuh login redirect ke `/login`
- [ ] Refresh halaman setelah login → tetap login (sesi tidak hilang)

## 2. Lupa Password & Reset Password

- [ ] Minta reset password dengan email yang TERDAFTAR → email masuk (cek log kalau `MAIL_MAILER=log`)
- [ ] Minta reset password dengan email yang TIDAK terdaftar → pesan sukses yang SAMA (tidak beda), tidak ada email terkirim
- [ ] Klik link di email → buka halaman reset password dengan token & email terisi otomatis di URL
- [ ] Submit password baru → berhasil, redirect ke login
- [ ] Coba pakai link/token yang SAMA lagi setelah dipakai → gagal (token sekali pakai)
- [ ] Tunggu >60 menit lalu coba token lama (atau ubah `expire` sementara buat tes cepat) → gagal (expired)
- [ ] Login pakai password baru → berhasil

## 3. Role & Permission

- [ ] Pembeli akses halaman `/admin/*` atau `/mitra/*` → ditolak/redirect
- [ ] Admin Website coba ubah role user lain jadi `admin` atau `super_admin` lewat Kelola Pengguna → dropdown TIDAK menyediakan opsi itu, dan kalaupun dipaksa lewat API langsung → backend tolak (403)
- [ ] Admin Website coba lihat/edit akun `admin` atau `super_admin` lain → tidak muncul di daftar / ditolak backend
- [ ] Super Admin ubah role user ke `admin` → berhasil
- [ ] Ubah role dari `mitra_toko` ke `pembeli` → toko yang dipegang otomatis lepas kepemilikan (`user_id` jadi null di DB), riwayat di tabel `klaim_mitra` TETAP ada
- [ ] Coba nonaktifkan akun sendiri → ditolak dengan pesan jelas
- [ ] Akun yang dinonaktifkan (`status_aktif=false`) coba login → ditolak dengan pesan jelas

## 4. CRUD (Toko, Kurir, Produk, Kategori)

- [ ] Admin tambah toko baru tanpa pemilik → tersimpan, `status_verifikasi=approved` otomatis
- [ ] Admin tambah kurir baru → sama seperti toko
- [ ] Mitra toko edit profil toko sendiri → tersimpan, TIDAK bisa ubah toko milik mitra lain (coba ganti ID di request kalau mau tes keamanan)
- [ ] Mitra toko tambah/edit/hapus produk → cuma bisa untuk produk di toko sendiri
- [ ] Admin tambah/edit/hapus kategori produk & kategori toko → tersimpan
- [ ] Admin hapus kategori yang masih dipakai produk → produk TIDAK ikut hilang, `kategori_id` jadi null

## 5. Klaim Toko & Klaim Kurir

- [ ] User login ajukan klaim toko yang belum ada pemiliknya → status `pending`, muncul di Kelola Klaim admin
- [ ] User coba klaim toko yang SUDAH ada pemiliknya → ditolak dengan pesan jelas
- [ ] Admin approve klaim → dalam SATU aksi: `toko.user_id` terisi, role user jadi `mitra_toko`, status klaim jadi `approved` — cek ketiganya benar-benar berubah bersamaan
- [ ] Admin reject klaim → status jadi `rejected`, TIDAK ada perubahan pada toko/role user
- [ ] Ulangi untuk klaim kurir (pastikan approve klaim kurir TIDAK mengubah akun toko manapun, dan sebaliknya)
- [ ] Fitur "Daftar Mitra Baru" (bukan klaim, tapi bikin toko/kurir baru sendiri) → toko/kurir baru dengan `user_id` diri sendiri, TAPI role TETAP `pembeli` sampai admin approve manual

## 6. Status Aktif & Status Ketersediaan

- [ ] Toko: `status_verifikasi`, `status_aktif`, `status_buka` — pastikan ketiganya independen (ubah satu tidak mengubah yang lain)
- [ ] Kurir: `status_verifikasi`, `status_aktif`, `status_ketersediaan` — sama, independen
- [ ] Toko/kurir yang `status_aktif=false` TIDAK muncul di listing publik (Home, TokoList, ProdukList, LayananAntar)
- [ ] Toko yang `status_buka=false` masih muncul di listing tapi ditandai "Tutup"
- [ ] Kurir ubah status ketersediaan sendiri (toggle di dashboard) → langsung berubah, dan mempengaruhi apakah muncul di pilihan checkout (`?tersedia=1`)

## 7. Upload Foto

- [ ] Upload foto produk (mitra) → tersimpan, tampil di listing produk
- [ ] Upload foto toko (banner & logo, baik dari dashboard mitra maupun Kelola Toko admin) → tersimpan
- [ ] Upload foto kurir (dashboard mitra & Kelola Kurir admin) → tersimpan
- [ ] Upload foto profil (Edit Profil) → tersimpan
- [ ] Coba upload file bukan gambar (misal .pdf) → ditolak dengan pesan jelas
- [ ] Coba upload file >5MB → ditolak dengan pesan jelas
- [ ] Foto LAMA (dari Supabase Storage, kalau sudah migrasi data) → tetap tampil normal, tidak rusak

## 8. Pesanan (Checkout)

- [ ] Checkout sebagai GUEST (belum login) → wajib isi nama & WhatsApp, pesanan tersimpan dengan `guest_nama`/`guest_whatsapp`
- [ ] Checkout sebagai user LOGIN → `pembeli_id` terisi otomatis, tidak perlu isi nama/WA manual
- [ ] Checkout dengan metode "Ambil sendiri" → tidak perlu pilih kurir, WhatsApp terbuka ke NOMOR TOKO
- [ ] Checkout dengan metode "Diantar kurir" → wajib pilih kurir & isi alamat, WhatsApp terbuka ke NOMOR KURIR
- [ ] Coba checkout dengan keranjang berisi produk dari 2 toko berbeda → ditolak (satu pesanan cuma boleh dari satu toko)
- [ ] Cek harga di pesanan yang tersimpan SESUAI harga produk SAAT checkout (bukan berubah kalau harga produk diubah setelahnya)
- [ ] Setelah checkout → muncul di "Pesanan Saya" (pembeli, kalau login), "Pesanan Masuk" (mitra toko), "Kelola Pesanan" (admin) — ketiganya tampilkan tanggal, jam, produk, dan cara terima yang sama
- [ ] Toko yang belum isi nomor WhatsApp → checkout "ambil sendiri" diblokir dengan pesan jelas

## 9. Review

- [ ] Beri review produk, toko, kurir (masing-masing) sebagai user login → tersimpan
- [ ] Coba beri review tanpa login → ditolak/redirect login
- [ ] Edit review sendiri (dari halaman Review Saya) → tersimpan
- [ ] Coba edit review MILIK ORANG LAIN (lewat API langsung kalau mau tes keamanan) → ditolak
- [ ] Hapus review sendiri → hilang
- [ ] Admin sembunyikan review (moderasi) → review TIDAK muncul lagi di halaman publik toko/produk, tapi masih ada di database (bisa ditampilkan lagi)
- [ ] Admin hapus review permanen → hilang total
- [ ] Rating rata-rata di TokoDetail/ProdukDetail terhitung benar dan cuma dari review yang `status_moderasi=tampil`

## 10. Responsive (Desktop, Tablet, Mobile)

- [ ] Buka di lebar desktop (>1024px) → sidebar dashboard nyaman, tidak ada elemen terpotong
- [ ] Buka di lebar tablet (~768px) → layout menyesuaikan, tidak ada horizontal scroll aneh
- [ ] Buka di lebar mobile (~375px) → semua card/list bisa dibaca tanpa perlu scroll horizontal, tombol aksi tetap mudah ditekan
- [ ] Modal (konfirmasi hapus, edit kurir) → tidak keluar dari layar di mobile
- [ ] Form panjang (profil toko, tambah produk) → tetap nyaman diisi di mobile, tidak terlalu padat
- [ ] Navigasi (Navbar/Sidebar) → berfungsi baik di mobile (menu bisa dibuka/ditutup)

## 11. Dark Mode & Light Mode

- [ ] Toggle dark mode → semua halaman yang sudah di-redesign Phase 6 (auth, dashboard, semua
      halaman admin, review) kontras teksnya jelas terbaca
- [ ] Cek input/textarea di dark mode → border & teks terlihat jelas, tidak "hilang" di background gelap
- [ ] Cek Badge (status pill) di dark mode → warna tetap kontras, tidak pudar
- [ ] Cek modal (klaim kurir, edit kurir) di dark mode → background modal beda jelas dari overlay belakang
- [ ] Cek halaman yang BELUM di-redesign eksplisit di Phase 6 (TokoDetail, ProdukDetail, Checkout,
      dll) — ini sudah pakai kelas `dark:` sejak Phase 5, tapi tolong dicek juga karena belum
      saya polish ulang di Phase 6

---

## Kalau Anda menemukan bug saat testing

Beri tahu saya persis:
1. Halaman/fitur mana
2. Langkah yang dilakukan
3. Yang diharapkan vs yang terjadi
4. Kalau ada, pesan error dari console browser (F12) atau response API (Network tab)

Saya akan cari akar masalahnya (bukan tambal workaround) dan perbaiki di checkpoint berikutnya,
sesuai prinsip yang Anda tetapkan dari awal.
