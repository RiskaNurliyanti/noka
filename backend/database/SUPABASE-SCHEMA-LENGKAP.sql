-- ============================================================
-- NOKA — Skema LENGKAP untuk Supabase (database CADANGAN / dual-write)
-- Jalankan SEKALI di project Supabase yang MASIH KOSONG lewat
-- Supabase Dashboard > SQL Editor > New query > paste semua > Run.
--
-- Skema ini sudah disesuaikan 1:1 dengan struktur Neon (backend Laravel)
-- saat ini - BUKAN skema Supabase Auth lama (noka_schema_supabase.sql di
-- root repo, sudah usang/deprecated, jangan dipakai).
--
-- Kenapa perlu ini padahal Neon sudah dimigrasi Laravel?
-- App\Services\DualWriteMirror menyalin data ke Supabase sebagai CADANGAN
-- best-effort (Neon tetap satu-satunya sumber kebenaran yang dibaca
-- aplikasi) - supaya salinan itu valid, tabel di Supabase harus punya
-- struktur (nama tabel & kolom) yang SAMA PERSIS dengan Neon.
--
-- Setelah menjalankan file ini, jalankan:
--   php artisan supabase:backfill
-- dari backend untuk menyalin SEMUA data yang sudah ada di Neon ke sini
-- (file ini cuma bikin tabel kosong). Lihat SETUP-DARI-AWAL.md.
-- ============================================================

-- ------------------------------------------------------------
-- 0. ENUM TYPES
-- ------------------------------------------------------------
create type user_role as enum ('pembeli', 'mitra_toko', 'mitra_kurir', 'admin', 'super_admin');
create type status_verifikasi as enum ('pending', 'approved', 'rejected');
create type jenis_klaim as enum ('toko', 'kurir');

-- ------------------------------------------------------------
-- 1. USERS
-- ------------------------------------------------------------
create table users (
  id uuid primary key default gen_random_uuid(),
  nama varchar(255),
  email varchar(255) not null unique,
  email_verified_at timestamp,
  notifikasi_pesanan_dilihat_at timestamp,
  password varchar(255),
  google_id varchar(255) unique,
  foto varchar(255),
  no_whatsapp varchar(255),
  status_aktif boolean not null default true,
  notifikasi_dilihat_at timestamp,
  remember_token varchar(100),
  role user_role not null default 'pembeli',
  created_at timestamp not null default now(),
  updated_at timestamp
);
create index users_role_index on users (role);

-- ------------------------------------------------------------
-- 2. KATEGORI PRODUK & KATEGORI TOKO
-- ------------------------------------------------------------
create table kategori (
  id uuid primary key default gen_random_uuid(),
  nama varchar(255) not null,
  icon varchar(255),
  created_at timestamp not null default now()
);

create table kategori_toko (
  id uuid primary key default gen_random_uuid(),
  nama varchar(255) not null,
  icon varchar(255),
  created_at timestamp not null default now()
);

-- ------------------------------------------------------------
-- 3. TOKO
-- ------------------------------------------------------------
create table toko (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  kategori_toko_id uuid references kategori_toko(id) on delete set null,
  nama_toko varchar(255) not null,
  deskripsi text,
  no_whatsapp varchar(255) not null default '',
  foto_banner varchar(255),
  foto_logo varchar(255),
  galeri jsonb,
  alamat text,
  kecamatan varchar(255),
  desa varchar(255),
  lokasi_lat numeric(10, 7),
  lokasi_lng numeric(10, 7),
  jam_buka time,
  jam_tutup time,
  status_buka boolean not null default true,
  notifikasi_dilihat_at timestamp,
  status_aktif boolean not null default true,
  created_at timestamp not null default now(),
  status_verifikasi status_verifikasi not null default 'pending'
);

-- ------------------------------------------------------------
-- 4. KURIR
-- ------------------------------------------------------------
create table kurir (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  nama_layanan varchar(255) not null,
  foto_logo varchar(255),
  no_whatsapp varchar(255) not null,
  kendaraan varchar(255),
  area_layanan text,
  jam_operasional varchar(255),
  status_ketersediaan boolean not null default true,
  status_aktif boolean not null default true,
  notifikasi_dilihat_at timestamp,
  created_at timestamp not null default now(),
  status_verifikasi status_verifikasi not null default 'pending'
);

-- ------------------------------------------------------------
-- 5. PRODUK
-- ------------------------------------------------------------
create table produk (
  id uuid primary key default gen_random_uuid(),
  toko_id uuid not null references toko(id) on delete cascade,
  kategori_id uuid references kategori(id) on delete set null,
  nama varchar(255) not null,
  deskripsi text,
  harga numeric(12, 2) not null,
  harga_diskon numeric(12, 2),
  foto varchar(255),
  galeri jsonb,
  status_aktif boolean not null default true,
  created_at timestamp not null default now()
);

-- ------------------------------------------------------------
-- 6. FAVORIT & KERANJANG
-- ------------------------------------------------------------
create table favorit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  produk_id uuid not null references produk(id) on delete cascade,
  created_at timestamp not null default now(),
  unique (user_id, produk_id)
);

create table keranjang (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  produk_id uuid not null references produk(id) on delete cascade,
  qty integer not null default 1 check (qty > 0),
  catatan text,
  created_at timestamp not null default now()
);

-- ------------------------------------------------------------
-- 7. REVIEW (produk / toko / kurir - 3 tabel terpisah)
-- ------------------------------------------------------------
create table review_produk (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  pesanan_id uuid, -- FK ke pesanan ditambahkan di bawah (pesanan belum ada di sini)
  produk_id uuid not null references produk(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  komentar text,
  status_moderasi varchar(255) not null default 'tampil',
  update_count smallint not null default 0,
  created_at timestamp not null default now()
);
create unique index review_produk_user_pesanan_produk_id_unique on review_produk (user_id, pesanan_id, produk_id) where pesanan_id is not null;

create table review_toko (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  pesanan_id uuid,
  toko_id uuid not null references toko(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  komentar text,
  status_moderasi varchar(255) not null default 'tampil',
  update_count smallint not null default 0,
  created_at timestamp not null default now()
);
create unique index review_toko_user_pesanan_toko_id_unique on review_toko (user_id, pesanan_id, toko_id) where pesanan_id is not null;

create table review_kurir (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  pesanan_id uuid,
  kurir_id uuid not null references kurir(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  komentar text,
  status_moderasi varchar(255) not null default 'tampil',
  update_count smallint not null default 0,
  created_at timestamp not null default now()
);
create unique index review_kurir_user_pesanan_kurir_id_unique on review_kurir (user_id, pesanan_id, kurir_id) where pesanan_id is not null;

-- ------------------------------------------------------------
-- 8. KUNJUNGAN TOKO, BANNER, PENGATURAN SISTEM, LOG AKTIVITAS
-- ------------------------------------------------------------
create table kunjungan_toko (
  id uuid primary key default gen_random_uuid(),
  toko_id uuid not null references toko(id) on delete cascade,
  created_at timestamp not null default now()
);

-- Analitik pengunjung situs (beda dari kunjungan_toko di atas
-- yang cuma catat kunjungan ke halaman toko tertentu)
create table kunjungan_situs (
  id uuid primary key default gen_random_uuid(),
  halaman varchar(255) not null,
  user_id uuid references users(id) on delete set null,
  sesi_id varchar(64) not null,
  perangkat varchar(20),
  referrer varchar(255),
  user_agent varchar(255),
  ip_address varchar(45),
  created_at timestamp not null default now()
);
create index kunjungan_situs_sesi_id_idx on kunjungan_situs (sesi_id);
create index kunjungan_situs_created_at_idx on kunjungan_situs (created_at);
create index kunjungan_situs_halaman_idx on kunjungan_situs (halaman);

create table banner (
  id uuid primary key default gen_random_uuid(),
  judul varchar(255),
  gambar varchar(255) not null,
  link varchar(255),
  urutan integer not null default 0,
  status_aktif boolean not null default true,
  created_at timestamp not null default now()
);

create table pengaturan_sistem (
  id integer primary key default 1 check (id = 1),
  nama_web varchar(255) not null default 'NOKA',
  logo varchar(255),
  admin_whatsapp varchar(255),
  konfigurasi jsonb not null default '{}',
  maintenance_mode boolean not null default false
);
insert into pengaturan_sistem (id) values (1) on conflict (id) do nothing;

create table log_aktivitas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  aksi varchar(255) not null,
  detail jsonb,
  created_at timestamp not null default now()
);

-- ------------------------------------------------------------
-- 9. PESANAN & PESANAN_ITEM
-- ------------------------------------------------------------
create table pesanan (
  id uuid primary key default gen_random_uuid(),
  pembeli_id uuid references users(id) on delete set null,
  guest_nama varchar(255),
  guest_whatsapp varchar(255),
  toko_id uuid not null references toko(id) on delete cascade,
  kurir_id uuid references kurir(id) on delete set null,
  total_harga numeric(12, 2) not null default 0,
  alamat_antar text,
  catatan text,
  status varchar(20) not null default 'dibuat' check (status in ('dibuat', 'diproses', 'selesai', 'dibatalkan')),
  -- Alasan & peran pembatalan
  alasan_pembatalan varchar(40) check (alasan_pembatalan in ('toko_tutup', 'stok_tidak_tersedia', 'kurir_libur', 'ganti_toko_lain', 'tidak_jadi_beli')),
  dibatalkan_oleh_role varchar(20) check (dibatalkan_oleh_role in ('pembeli', 'penjual', 'kurir', 'admin', 'super_admin')),
  updated_at timestamp,
  created_at timestamp not null default now(),
  constraint pembeli_or_guest check (pembeli_id is not null or (guest_nama is not null and guest_whatsapp is not null))
);

create table pesanan_item (
  id uuid primary key default gen_random_uuid(),
  pesanan_id uuid not null references pesanan(id) on delete cascade,
  produk_id uuid not null references produk(id) on delete restrict,
  qty integer not null check (qty > 0),
  harga_satuan numeric(12, 2) not null,
  subtotal numeric(12, 2) not null
);

-- Baru bisa ditambahkan sekarang setelah tabel pesanan ada (lihat bagian 7 di atas):
alter table review_produk add constraint review_produk_pesanan_id_foreign foreign key (pesanan_id) references pesanan(id) on delete set null;
alter table review_toko add constraint review_toko_pesanan_id_foreign foreign key (pesanan_id) references pesanan(id) on delete set null;
alter table review_kurir add constraint review_kurir_pesanan_id_foreign foreign key (pesanan_id) references pesanan(id) on delete set null;

-- ------------------------------------------------------------
-- 10. KLAIM MITRA
-- ------------------------------------------------------------
create table klaim_mitra (
  id uuid primary key default gen_random_uuid(),
  toko_id uuid references toko(id) on delete cascade,
  kurir_id uuid references kurir(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  catatan text,
  created_at timestamp not null default now(),
  jenis jenis_klaim not null,
  status status_verifikasi not null default 'pending',
  constraint klaim_target_valid check (
    (jenis = 'toko' and toko_id is not null and kurir_id is null)
    or (jenis = 'kurir' and kurir_id is not null and toko_id is null)
  )
);

-- ------------------------------------------------------------
-- 11. LAPORAN PENGGUNA (fitur Lapor Masalah)
-- ------------------------------------------------------------
create table laporan_pengguna (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  jenis varchar(20) not null check (jenis in ('bug', 'pelanggaran')),
  judul varchar(150) not null,
  deskripsi text not null,
  target_jenis varchar(20),
  target_id uuid,
  lampiran_url varchar(255),
  status varchar(20) not null default 'pending' check (status in ('pending', 'diproses', 'selesai', 'ditolak')),
  catatan_admin text,
  created_at timestamp not null default now(),
  updated_at timestamp
);

-- ------------------------------------------------------------
-- 12. AUDIT LOG PESANAN (khusus super admin)
-- ------------------------------------------------------------
create table audit_log_pesanan (
  id uuid primary key default gen_random_uuid(),
  pesanan_id uuid references pesanan(id) on delete set null,
  user_id uuid references users(id) on delete set null,
  role varchar(20),
  aksi varchar(30) not null,
  data_sebelum jsonb,
  data_sesudah jsonb,
  ip_address varchar(45),
  user_agent varchar(255),
  created_at timestamp not null default now()
);
create index audit_log_pesanan_pesanan_id_idx on audit_log_pesanan (pesanan_id);
create index audit_log_pesanan_created_at_idx on audit_log_pesanan (created_at);

-- ------------------------------------------------------------
-- 13. LANGGANAN & TAGIHAN (fitur langganan toko)
-- ------------------------------------------------------------
create table langganan (
  id uuid primary key default gen_random_uuid(),
  toko_id uuid not null unique references toko(id) on delete cascade,
  mulai_tanggal date not null,
  berakhir_tanggal date not null,
  status varchar(20) not null default 'aktif' check (status in ('aktif', 'kadaluarsa')),
  harga_bulanan integer not null default 5000,
  created_at timestamp not null default now(),
  updated_at timestamp
);

create table tagihan (
  id uuid primary key default gen_random_uuid(),
  toko_id uuid not null references toko(id) on delete cascade,
  periode varchar(7) not null,
  jumlah_transaksi integer not null default 0,
  biaya_langganan integer not null default 5000,
  biaya_tambahan integer not null default 0,
  total integer not null default 5000,
  status_bayar varchar(20) not null default 'belum_dibayar' check (status_bayar in ('belum_dibayar', 'lunas')),
  jatuh_tempo date,
  dibayar_at timestamp,
  created_at timestamp not null default now(),
  updated_at timestamp,
  unique (toko_id, periode)
);

-- ============================================================
-- SELESAI. Lanjut ke langkah berikutnya di SETUP-DARI-AWAL.md:
--   php artisan supabase:backfill
-- ============================================================
