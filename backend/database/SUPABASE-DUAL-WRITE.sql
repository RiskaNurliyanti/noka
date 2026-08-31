-- Dual-write ke Supabase (App\Services\DualWriteMirror)
--
-- ⚠️ Kalau Supabase project kamu MASIH KOSONG (setup dari nol), JANGAN pakai
-- file ini - pakai SUPABASE-SCHEMA-LENGKAP.sql (bikin semua tabel dari nol,
-- lebih lengkap dan urutannya sudah benar). File INI cuma buat kasus khusus:
-- Supabase project kamu SUDAH PUNYA tabel-tabel dasar (users, toko, kurir,
-- produk, pesanan, dst) dengan struktur yang PERSIS sama seperti Neon, dan
-- kamu cuma butuh menambah kolom/tabel BARU dari checkpoint 1 & 2 di bawah.
--
-- Jalankan SQL ini di Supabase Project kamu (SQL Editor) SUPAYA tabel yang
-- di-mirror punya struktur yang sama dengan Neon. Tabel-tabel LAMA (pesanan,
-- users, toko, kurir, produk, dst) SUDAH ADA di Supabase dari migrasi awal -
-- tapi kolom BARU yang ditambahkan lewat checkpoint 1 & 2 belum ada di sana,
-- jadi perlu di-ALTER dulu. Tabel yang SAMA SEKALI BARU (laporan_pengguna,
-- audit_log_pesanan, langganan, tagihan) perlu dibuat dari nol.
--
-- CATATAN: dual-write ini best-effort/backup - kalau kamu skip file ini,
-- aplikasi tetap jalan normal (DualWriteMirror otomatis diam-diam skip kalau
-- tabel tujuan tidak cocok/tidak ada), cuma salinan cadangannya jadi tidak
-- lengkap. Kolom pesanan lama tetap ke-mirror normal walau 2 kolom baru di
-- bawah belum ditambahkan - upsert akan gagal untuk baris yang menyertakan
-- kolom belum ada, jadi TETAP disarankan jalankan ini kalau mau dual-write
-- pesanan berfungsi penuh.

-- 1. Kolom baru di tabel pesanan (alasan & peran pembatalan)
alter table pesanan add column if not exists alasan_pembatalan varchar(40);
alter table pesanan add column if not exists dibatalkan_oleh_role varchar(20);

-- 2. Tabel laporan_pengguna (fitur Lapor Masalah)
create table if not exists laporan_pengguna (
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

-- 3. Tabel audit_log_pesanan (audit log perubahan status pesanan)
create table if not exists audit_log_pesanan (
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
create index if not exists audit_log_pesanan_pesanan_id_idx on audit_log_pesanan(pesanan_id);
create index if not exists audit_log_pesanan_created_at_idx on audit_log_pesanan(created_at);

-- 4. Tabel langganan (fitur langganan bulanan toko)
create table if not exists langganan (
  id uuid primary key default gen_random_uuid(),
  toko_id uuid not null unique references toko(id) on delete cascade,
  mulai_tanggal date not null,
  berakhir_tanggal date not null,
  status varchar(20) not null default 'aktif' check (status in ('aktif', 'kadaluarsa')),
  harga_bulanan integer not null default 5000,
  created_at timestamp not null default now(),
  updated_at timestamp
);

-- 5. Tabel tagihan (tagihan bulanan toko)
create table if not exists tagihan (
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

-- 6. Kolom notifikasi_dilihat_at di tabel toko (notifikasi pesanan baru penjual)
alter table toko add column if not exists notifikasi_dilihat_at timestamp;

-- 6b. Kolom notifikasi_dilihat_at di tabel users (lonceng notifikasi admin/super admin)
alter table users add column if not exists notifikasi_dilihat_at timestamp;

-- 7. Tabel kunjungan_situs (analitik pengunjung, kalau belum pernah dibuat)
create table if not exists kunjungan_situs (
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
create index if not exists kunjungan_situs_sesi_id_idx on kunjungan_situs (sesi_id);
create index if not exists kunjungan_situs_created_at_idx on kunjungan_situs (created_at);
create index if not exists kunjungan_situs_halaman_idx on kunjungan_situs (halaman);
