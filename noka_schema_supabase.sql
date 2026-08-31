-- ============================================================
-- ⚠️ FILE INI SUDAH USANG (DEPRECATED) - JANGAN DIPAKAI LAGI ⚠️
-- ============================================================
-- Ini skema Supabase LAMA dari SEBELUM proyek pindah ke Laravel+Neon.
-- Masih pakai arsitektur Supabase Auth (tabel `profiles` + `auth.users`)
-- yang SUDAH TIDAK DIPAKAI - backend sekarang pakai tabel `users` polos
-- + Laravel Sanctum, BUKAN Supabase Auth sama sekali.
--
-- Untuk setup Supabase sebagai database CADANGAN (dual-write),
-- pakai file ini sebagai gantinya:
--   noka-backend-real/database/SUPABASE-SCHEMA-LENGKAP.sql
--
-- File itu skemanya sudah disesuaikan 1:1 dengan Neon (tabel `users` biasa,
-- bukan `profiles`+`auth.users`). Lihat juga SETUP-DARI-AWAL.md untuk
-- panduan setup lengkap dari nol.
-- ============================================================

-- ============================================================
-- NOKA - Skema Database untuk Supabase (PostgreSQL)
-- Paste seluruh file ini ke Supabase Dashboard > SQL Editor > Run
-- ============================================================

-- ------------------------------------------------------------
-- 0. EXTENSIONS
-- ------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- 1. PROFILES
-- Tabel tambahan yang nyambung ke auth.users bawaan Supabase.
-- Dibuat otomatis lewat trigger tiap ada user baru daftar/login.
-- ------------------------------------------------------------
create type user_role as enum ('pembeli', 'mitra_toko', 'mitra_kurir', 'admin', 'super_admin');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text,
  email text,
  foto text,
  no_whatsapp text, -- nomor kontak akun (pembeli, mitra, admin, super admin - semua bisa isi)
  status_aktif boolean not null default true, -- suspend akun tanpa hapus permanen
  role user_role not null default 'pembeli',
  created_at timestamptz not null default now()
);

-- Trigger: bikin row profiles otomatis pas ada user baru signup
create function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nama, email, foto)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email, new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ------------------------------------------------------------
-- 2. KATEGORI PRODUK & KATEGORI TOKO (dipisah, sesuai roadmap)
-- Nama tabel `kategori` dipertahankan (dipakai produk.kategori_id) supaya
-- tidak perlu migrasi data/rename yang berisiko - anggap ini "kategori produk".
-- ------------------------------------------------------------
create table kategori (
  -- ini KATEGORI PRODUK: Makanan, Minuman, Snack, Dessert, dst.
  id uuid primary key default uuid_generate_v4(),
  nama text not null,
  icon text,
  created_at timestamptz not null default now()
);

create table kategori_toko (
  -- KATEGORI TOKO: Warung, Restoran, Cafe, Seafood, Frozen Food, dst.
  id uuid primary key default uuid_generate_v4(),
  nama text not null,
  icon text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3. TOKO (Mitra Toko)
-- ------------------------------------------------------------
create type status_verifikasi as enum ('pending', 'approved', 'rejected');

create table toko (
  id uuid primary key default uuid_generate_v4(),
  -- Nullable: toko bisa ditambahkan admin duluan (belum ada pemiliknya) lalu diklaim mitra asli.
  -- Lihat tabel klaim_mitra di bawah.
  user_id uuid references profiles(id) on delete set null,
  kategori_toko_id uuid references kategori_toko(id) on delete set null,
  nama_toko text not null,
  deskripsi text,
  no_whatsapp text not null default '', -- PENTING: dipakai buat redirect checkout, wajib diisi
  foto_banner text, -- cover
  foto_logo text,
  galeri text[], -- array URL foto galeri toko
  alamat text,
  kecamatan text,
  desa text,
  lokasi_lat numeric,
  lokasi_lng numeric,
  jam_buka time,
  jam_tutup time,
  status_buka boolean not null default true,
  status_aktif boolean not null default true, -- suspend/nonaktifkan toko tanpa hapus datanya
  status_verifikasi status_verifikasi not null default 'pending',
  created_at timestamptz not null default now()
);


-- ------------------------------------------------------------
-- 4. KURIR (Mitra Kurir)
-- ------------------------------------------------------------
create table kurir (
  id uuid primary key default uuid_generate_v4(),
  -- Nullable: sama seperti toko, kurir bisa ditambahkan admin duluan lalu diklaim.
  user_id uuid references profiles(id) on delete set null,
  nama_layanan text not null,
  foto_logo text,
  no_whatsapp text not null,
  kendaraan text, -- motor, mobil, sepeda, dst
  area_layanan text,
  jam_operasional text,
  status_ketersediaan boolean not null default true, -- online/offline saat ini
  status_aktif boolean not null default true, -- suspend/nonaktifkan tanpa hapus data
  status_verifikasi status_verifikasi not null default 'pending',
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 5. PRODUK
-- ------------------------------------------------------------
create table produk (
  id uuid primary key default uuid_generate_v4(),
  toko_id uuid not null references toko(id) on delete cascade,
  kategori_id uuid references kategori(id) on delete set null,
  nama text not null,
  deskripsi text,
  harga numeric(12,2) not null,
  harga_diskon numeric(12,2), -- nullable, cuma diisi kalau lagi promo
  foto text,
  galeri text[], -- array URL foto tambahan
  status_aktif boolean not null default true, -- "status tersedia"
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 6. FAVORIT
-- ------------------------------------------------------------
create table favorit (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  produk_id uuid not null references produk(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, produk_id)
);

-- ------------------------------------------------------------
-- 7. KERANJANG
-- ------------------------------------------------------------
create table keranjang (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  produk_id uuid not null references produk(id) on delete cascade,
  qty integer not null default 1 check (qty > 0),
  catatan text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 8. PESANAN (Order) & ITEM
-- Pesanan di sini murni catatan/struk, bukan status tracking.
-- Setelah checkout, koordinasi konfirmasi/proses/antar sepenuhnya
-- dilakukan manual lewat WhatsApp antara pembeli, toko, dan kurir -
-- tidak ada yang diupdate balik ke database.
-- ------------------------------------------------------------
create table pesanan (
  id uuid primary key default uuid_generate_v4(),
  pembeli_id uuid references profiles(id) on delete set null,
  guest_nama text,
  guest_whatsapp text,
  toko_id uuid not null references toko(id) on delete cascade,
  kurir_id uuid references kurir(id) on delete set null,
  total_harga numeric(12,2) not null default 0,
  alamat_antar text,
  catatan text,
  created_at timestamptz not null default now(),
  constraint pembeli_or_guest check (
    pembeli_id is not null or (guest_nama is not null and guest_whatsapp is not null)
  )
);

create table pesanan_item (
  id uuid primary key default uuid_generate_v4(),
  pesanan_id uuid not null references pesanan(id) on delete cascade,
  produk_id uuid not null references produk(id) on delete restrict,
  qty integer not null check (qty > 0),
  harga_satuan numeric(12,2) not null,
  subtotal numeric(12,2) not null
);

-- ------------------------------------------------------------
-- 8b. REVIEW (dipindah ke sini, sebelum view statistik, supaya
-- tabelnya sudah ada duluan waktu dipakai view toko_stats di bawah)
-- ------------------------------------------------------------
create table review_produk (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  produk_id uuid not null references produk(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  komentar text,
  status_moderasi text not null default 'tampil', -- tampil / disembunyikan
  created_at timestamptz not null default now()
);

create table review_toko (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  toko_id uuid not null references toko(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  komentar text,
  status_moderasi text not null default 'tampil',
  created_at timestamptz not null default now()
);

create table review_kurir (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  kurir_id uuid not null references kurir(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  komentar text,
  status_moderasi text not null default 'tampil',
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 9b. KUNJUNGAN TOKO (buat hitung statistik "jumlah dikunjungi")
-- Insert 1 baris tiap kali halaman detail toko dibuka.
-- ------------------------------------------------------------
create table kunjungan_toko (
  id uuid primary key default uuid_generate_v4(),
  toko_id uuid not null references toko(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table kunjungan_toko enable row level security;
create policy "siapapun boleh catat kunjungan" on kunjungan_toko for insert with check (true);
create policy "mitra toko baca kunjungan sendiri" on kunjungan_toko for select using (
  toko_id in (select id from toko where user_id = auth.uid())
);

-- ------------------------------------------------------------
-- 9c. VIEW: STATISTIK TOKO
-- Tinggal query "select * from toko_stats where toko_id = ..."
-- dari dashboard mitra toko.
-- ------------------------------------------------------------
create view toko_stats with (security_invoker = true) as
select
  t.id as toko_id,
  t.nama_toko,
  (select count(*) from kunjungan_toko k where k.toko_id = t.id) as jumlah_kunjungan,
  (select count(*) from pesanan p where p.toko_id = t.id) as jumlah_pesanan,
  (select coalesce(sum(p.total_harga), 0) from pesanan p where p.toko_id = t.id) as pendapatan,
  (select coalesce(sum(pi.qty), 0)
     from pesanan_item pi
     join produk pr on pr.id = pi.produk_id
    where pr.toko_id = t.id) as total_produk_terjual,
  (select count(*)
     from favorit f
     join produk pr on pr.id = f.produk_id
    where pr.toko_id = t.id) as jumlah_favorit,
  (select round(avg(rt.rating)::numeric, 1) from review_toko rt where rt.toko_id = t.id) as rating_rata,
  (select count(*) from review_toko rt where rt.toko_id = t.id) as jumlah_review
from toko t;

-- Produk terlaris per toko (dipakai terpisah, query dengan filter toko_id + limit)
-- Aggregat publik (tanpa data pribadi), jadi TIDAK pakai security_invoker
-- biar bisa diakses tanpa login untuk halaman Home / dashboard toko.
create view produk_terlaris as
select
  pr.id as produk_id,
  pr.toko_id,
  pr.nama,
  sum(pi.qty) as total_terjual
from pesanan_item pi
join produk pr on pr.id = pi.produk_id
group by pr.id, pr.toko_id, pr.nama
order by total_terjual desc;

-- ------------------------------------------------------------
-- 9d. VIEW: PRODUK POPULER & TOKO POPULER (buat halaman Home)
-- Populer = kombinasi total terjual & jumlah difavoritkan (produk),
-- atau kombinasi kunjungan & jumlah pesanan (toko).
-- Query di frontend tinggal: select * from produk_populer limit 8;
-- ------------------------------------------------------------
create view produk_populer as
select
  p.id as produk_id,
  p.toko_id,
  p.nama,
  p.harga,
  p.foto,
  coalesce(sum(pi.qty), 0) as total_terjual,
  (select count(*) from favorit f where f.produk_id = p.id) as jumlah_favorit
from produk p
left join pesanan_item pi on pi.produk_id = p.id
where p.status_aktif = true
group by p.id, p.toko_id, p.nama, p.harga, p.foto
order by total_terjual desc, jumlah_favorit desc;

create view toko_populer as
select
  t.id as toko_id,
  t.nama_toko,
  t.foto_banner,
  (select count(*) from kunjungan_toko k where k.toko_id = t.id) as jumlah_kunjungan,
  (select count(*) from pesanan p where p.toko_id = t.id) as jumlah_pesanan
from toko t
where t.status_verifikasi = 'approved'
order by jumlah_kunjungan desc, jumlah_pesanan desc;


-- ------------------------------------------------------------
-- 9. REVIEW
-- (tabelnya sudah dibuat di atas, sebelum view statistik)
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- 10. BANNER (Admin)
-- ------------------------------------------------------------
create table banner (
  id uuid primary key default uuid_generate_v4(),
  judul text,
  gambar text not null,
  link text,
  urutan integer default 0,
  status_aktif boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 11. PENGATURAN SISTEM (Super Admin, single row)
-- ------------------------------------------------------------
create table pengaturan_sistem (
  id integer primary key default 1,
  nama_web text not null default 'NOKA',
  logo text,
  admin_whatsapp text, -- nomor WA admin, dipakai di halaman klaim mitra & kontak
  konfigurasi jsonb default '{}',
  maintenance_mode boolean not null default false,
  constraint single_row check (id = 1)
);
insert into pengaturan_sistem (id) values (1);

-- ------------------------------------------------------------
-- 12. LOG AKTIVITAS (Super Admin)
-- ------------------------------------------------------------
create table log_aktivitas (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete set null,
  aksi text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Wajib dinyalain di Supabase biar data aman per role.
-- Ini contoh dasar, sesuaikan lagi kalau makin kompleks.
-- ============================================================

alter table profiles enable row level security;
alter table toko enable row level security;
alter table kurir enable row level security;
alter table produk enable row level security;
alter table kategori enable row level security;
alter table kategori_toko enable row level security;
alter table favorit enable row level security;
alter table keranjang enable row level security;
alter table pesanan enable row level security;
alter table pesanan_item enable row level security;
alter table review_produk enable row level security;
alter table review_toko enable row level security;
alter table review_kurir enable row level security;
alter table banner enable row level security;

-- Semua orang boleh baca data publik (produk, toko, kategori, banner, review)
create policy "public read produk" on produk for select using (status_aktif = true);
create policy "public read toko" on toko for select using (status_verifikasi = 'approved');
create policy "public read kategori" on kategori for select using (true);
create policy "public read kategori_toko" on kategori_toko for select using (true);
create policy "public read banner" on banner for select using (status_aktif = true);
create policy "public read review_produk" on review_produk for select using (status_moderasi = 'tampil');
create policy "public read review_toko" on review_toko for select using (status_moderasi = 'tampil');
create policy "public read review_kurir" on review_kurir for select using (status_moderasi = 'tampil');

-- Profile: user cuma bisa liat & edit datanya sendiri
create policy "user read own profile" on profiles for select using (auth.uid() = id);
create policy "user update own profile" on profiles for update using (auth.uid() = id);

-- Favorit & keranjang: cuma pemiliknya yang bisa akses
create policy "user manage own favorit" on favorit for all using (auth.uid() = user_id);
create policy "user manage own keranjang" on keranjang for all using (auth.uid() = user_id);

-- Mitra toko: boleh baca (bukan ubah) item pesanan & favorit dari produk miliknya sendiri,
-- dipakai oleh view toko_stats yang privat (security_invoker) di dashboard mitra.
create policy "mitra toko baca item pesanan miliknya" on pesanan_item for select using (
  produk_id in (
    select id from produk where toko_id in (select id from toko where user_id = auth.uid())
  )
);
create policy "mitra toko baca favorit produk miliknya" on favorit for select using (
  produk_id in (
    select id from produk where toko_id in (select id from toko where user_id = auth.uid())
  )
);

-- Insert item pesanan dibuka untuk pemilik pesanan itu sendiri (guest atau login),
-- dipakai sekali di momen checkout untuk simpan rincian produk yang dibeli.
create policy "insert item pesanan milik sendiri" on pesanan_item for insert with check (
  pesanan_id in (
    select id from pesanan where pembeli_id = auth.uid() or (pembeli_id is null and auth.uid() is null)
  )
);

-- Pesanan: murni catatan/struk, tidak ada update status.
-- Pembeli login lihat riwayat pesanan sendiri. Mitra toko lihat pesanan masuk ke tokonya.
-- Insert dibuka untuk guest (pembeli_id null, wajib isi guest_nama & guest_whatsapp)
-- maupun pembeli yang login (pembeli_id wajib sama dengan auth.uid()).
create policy "pembeli read own pesanan" on pesanan for select using (auth.uid() = pembeli_id);
create policy "insert pesanan guest atau login" on pesanan for insert with check (
  (pembeli_id is null and guest_nama is not null and guest_whatsapp is not null)
  or auth.uid() = pembeli_id
);
create policy "mitra toko read pesanan masuk" on pesanan for select using (
  toko_id in (select id from toko where user_id = auth.uid())
);
create policy "mitra kurir read pesanan yang pilih dia" on pesanan for select using (
  kurir_id in (select id from kurir where user_id = auth.uid())
);

-- Review: user cuma bisa insert atas namanya sendiri
-- Review: pemilik akun boleh CRUD review miliknya sendiri (bukan cuma insert),
-- publik cuma boleh baca yang lolos moderasi (lihat policy select di atas).
create policy "user insert review_produk" on review_produk for insert with check (auth.uid() = user_id);
create policy "user update review_produk sendiri" on review_produk for update using (auth.uid() = user_id);
create policy "user delete review_produk sendiri" on review_produk for delete using (auth.uid() = user_id);

create policy "user insert review_toko" on review_toko for insert with check (auth.uid() = user_id);
create policy "user update review_toko sendiri" on review_toko for update using (auth.uid() = user_id);
create policy "user delete review_toko sendiri" on review_toko for delete using (auth.uid() = user_id);

create policy "user insert review_kurir" on review_kurir for insert with check (auth.uid() = user_id);
create policy "user update review_kurir sendiri" on review_kurir for update using (auth.uid() = user_id);
create policy "user delete review_kurir sendiri" on review_kurir for delete using (auth.uid() = user_id);
create policy "user baca review_kurir sendiri" on review_kurir for select using (auth.uid() = user_id);

-- Mitra kurir boleh baca review yang masuk buat layanannya sendiri
create policy "mitra kurir baca review miliknya" on review_kurir for select using (
  kurir_id in (select id from kurir where user_id = auth.uid())
);

-- Mitra toko: kelola toko & produk miliknya sendiri
create policy "mitra kelola toko sendiri" on toko for all using (auth.uid() = user_id);
create policy "mitra kelola produk sendiri" on produk for all using (
  toko_id in (select id from toko where user_id = auth.uid())
);

-- Mitra kurir: kelola profil kurir miliknya sendiri
alter table kurir enable row level security;
create policy "mitra kelola kurir sendiri" on kurir for all using (auth.uid() = user_id);
create policy "public read kurir approved" on kurir for select using (status_verifikasi = 'approved');

-- ============================================================
-- KLAIM MITRA
-- Buat toko/kurir yang admin tambahkan duluan (belum ada pemiliknya,
-- user_id = null) tapi UMKM aslinya belum join. Pemilik asli bisa ajukan
-- klaim, lalu admin verifikasi manual via WhatsApp (sama seperti alur
-- lain di NOKA - bukan verifikasi otomatis).
-- ============================================================
create type jenis_klaim as enum ('toko', 'kurir');

create table klaim_mitra (
  id uuid primary key default uuid_generate_v4(),
  jenis jenis_klaim not null,
  toko_id uuid references toko(id) on delete cascade,
  kurir_id uuid references kurir(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  catatan text, -- bukti/keterangan kepemilikan yang diisi pengklaim
  status status_verifikasi not null default 'pending',
  created_at timestamptz not null default now(),
  constraint klaim_target_valid check (
    (jenis = 'toko' and toko_id is not null and kurir_id is null)
    or (jenis = 'kurir' and kurir_id is not null and toko_id is null)
  )
);

alter table klaim_mitra enable row level security;

create policy "user ajukan klaim sendiri" on klaim_mitra for insert with check (auth.uid() = user_id);
create policy "user lihat klaim sendiri" on klaim_mitra for select using (auth.uid() = user_id);

-- ============================================================
-- ADMIN & SUPER ADMIN - RLS beneran (bukan sekadar starter)
-- Pakai fungsi is_admin() (security definer) supaya nggak perlu
-- Edge Function terpisah hanya untuk baca/verifikasi data.
-- Tetap disarankan pakai service_role/Edge Function untuk aksi
-- sensitif lain (hapus akun, ubah role user, dst).
-- ============================================================
create function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('admin', 'super_admin')
  );
$$;

create function is_super_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$;

-- Toko & kurir: admin boleh baca semua (termasuk yang pending) & ubah status verifikasi
-- Admin & super admin butuh baca semua profiles (buat hitung statistik & Kelola Pengguna)
-- dan semua pesanan (buat statistik pendapatan/pesanan global)
create policy "admin baca semua profiles" on profiles for select using (is_admin());

-- Kelola Pengguna: Admin Website cuma boleh ubah akun DI BAWAHNYA (pembeli/mitra),
-- nggak boleh ngutak-atik sesama admin atau super admin. Super Admin boleh ubah semua.
create policy "admin update profiles non-admin" on profiles for update using (
  is_admin() and role not in ('admin', 'super_admin')
);
create policy "super admin update semua profiles" on profiles for update using (is_super_admin());

create policy "admin baca semua pesanan" on pesanan for select using (is_admin());
create policy "admin baca semua pesanan_item" on pesanan_item for select using (is_admin());

create policy "admin baca semua toko" on toko for select using (is_admin());
create policy "admin update toko" on toko for update using (is_admin());
create policy "admin hapus toko" on toko for delete using (is_admin());
create policy "admin tambah toko" on toko for insert with check (is_admin());
create policy "admin kelola produk semua toko" on produk for all using (is_admin());
create policy "admin baca semua kurir" on kurir for select using (is_admin());
create policy "admin update kurir" on kurir for update using (is_admin());
create policy "admin hapus kurir" on kurir for delete using (is_admin());
create policy "admin tambah kurir" on kurir for insert with check (is_admin());

-- Klaim mitra: admin baca semua & verifikasi
create policy "admin kelola klaim" on klaim_mitra for all using (is_admin());

-- Moderasi review & kelola konten Home
create policy "admin moderasi review_produk" on review_produk for update using (is_admin());
create policy "admin hapus review_produk" on review_produk for delete using (is_admin());
create policy "admin moderasi review_toko" on review_toko for update using (is_admin());
create policy "admin hapus review_toko" on review_toko for delete using (is_admin());
create policy "admin moderasi review_kurir" on review_kurir for update using (is_admin());
create policy "admin hapus review_kurir" on review_kurir for delete using (is_admin());
create policy "admin baca semua review_kurir" on review_kurir for select using (is_admin());
create policy "admin kelola banner" on banner for all using (is_admin());
create policy "admin kelola kategori" on kategori for all using (is_admin());
create policy "admin kelola kategori_toko" on kategori_toko for all using (is_admin());

-- Super admin: kelola pengaturan sistem
create policy "super admin kelola pengaturan" on pengaturan_sistem for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'super_admin')
);
alter table pengaturan_sistem enable row level security;
create policy "publik baca pengaturan (maintenance mode dll)" on pengaturan_sistem for select using (true);

-- ============================================================
-- STORAGE - bucket buat foto produk/toko/kurir (Supabase Storage, gratis)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('noka-foto', 'noka-foto', true)
on conflict (id) do nothing;

create policy "publik lihat foto noka" on storage.objects for select using (bucket_id = 'noka-foto');
create policy "user login boleh upload foto" on storage.objects for insert with check (
  bucket_id = 'noka-foto' and auth.role() = 'authenticated'
);
create policy "user login boleh hapus foto miliknya" on storage.objects for delete using (
  bucket_id = 'noka-foto' and auth.uid()::text = owner::text
);

-- ============================================================
-- STATISTIK GLOBAL - buat dashboard Super Admin & Admin Website
-- Pakai security_invoker: cuma admin/super_admin yang bisa baca
-- (dijamin lewat policy "admin baca semua ..." di atas).
-- ============================================================
create view statistik_global with (security_invoker = true) as
select
  (select count(*) from toko) as total_toko,
  (select count(*) from kurir) as total_kurir,
  (select count(*) from produk) as total_produk,
  (select count(*) from profiles where role = 'mitra_toko') as total_penjual,
  (select count(*) from profiles where role = 'mitra_kurir') as total_akun_kurir,
  (select count(*) from profiles where role = 'pembeli') as total_pelanggan,
  (select count(*) from pesanan) as total_pesanan,
  (select coalesce(sum(total_harga), 0) from pesanan) as total_pendapatan,
  (select count(*) from pesanan where created_at >= current_date) as pesanan_hari_ini;

-- Agregat penjualan harian - dasar buat grafik mingguan/bulanan di frontend
-- (tinggal di-group ulang per minggu/bulan di sisi client dari data harian ini).
create view penjualan_harian with (security_invoker = true) as
select
  date_trunc('day', created_at)::date as tanggal,
  count(*) as jumlah_pesanan,
  coalesce(sum(total_harga), 0) as total_pendapatan
from pesanan
group by date_trunc('day', created_at)::date
order by tanggal desc;
