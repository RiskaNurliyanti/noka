<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * 6 VIEW dari schema Supabase asli yang TERLEWAT di audit Phase 1 -
     * ditemukan saat migrasi Home.jsx (Phase 5 Batch 2). Direplikasi PERSIS
     * sama seperti definisi asli (cuma `security_invoker` dihapus karena itu
     * mekanisme RLS Supabase, otorisasi di Laravel sudah ditangani di layer
     * controller/middleware, bukan di level database).
     */
    public function up(): void
    {
        DB::statement(<<<'SQL'
            create view toko_stats as
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
            from toko t
        SQL);

        DB::statement(<<<'SQL'
            create view produk_terlaris as
            select
              pr.id as produk_id,
              pr.toko_id,
              pr.nama,
              sum(pi.qty) as total_terjual
            from pesanan_item pi
            join produk pr on pr.id = pi.produk_id
            group by pr.id, pr.toko_id, pr.nama
            order by total_terjual desc
        SQL);

        DB::statement(<<<'SQL'
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
            order by total_terjual desc, jumlah_favorit desc
        SQL);

        DB::statement(<<<'SQL'
            create view toko_populer as
            select
              t.id as toko_id,
              t.nama_toko,
              t.foto_banner,
              (select count(*) from kunjungan_toko k where k.toko_id = t.id) as jumlah_kunjungan,
              (select count(*) from pesanan p where p.toko_id = t.id) as jumlah_pesanan
            from toko t
            where t.status_verifikasi = 'approved'
            order by jumlah_kunjungan desc, jumlah_pesanan desc
        SQL);

        DB::statement(<<<'SQL'
            create view statistik_global as
            select
              (select count(*) from toko) as total_toko,
              (select count(*) from kurir) as total_kurir,
              (select count(*) from produk) as total_produk,
              (select count(*) from users where role = 'mitra_toko') as total_penjual,
              (select count(*) from users where role = 'mitra_kurir') as total_akun_kurir,
              (select count(*) from users where role = 'pembeli') as total_pelanggan,
              (select count(*) from pesanan) as total_pesanan,
              (select coalesce(sum(total_harga), 0) from pesanan) as total_pendapatan,
              (select count(*) from pesanan where created_at >= current_date) as pesanan_hari_ini
        SQL);

        DB::statement(<<<'SQL'
            create view penjualan_harian as
            select
              date_trunc('day', created_at)::date as tanggal,
              count(*) as jumlah_pesanan,
              coalesce(sum(total_harga), 0) as total_pendapatan
            from pesanan
            group by date_trunc('day', created_at)::date
            order by tanggal desc
        SQL);
    }

    public function down(): void
    {
        DB::statement('drop view if exists penjualan_harian');
        DB::statement('drop view if exists statistik_global');
        DB::statement('drop view if exists toko_populer');
        DB::statement('drop view if exists produk_populer');
        DB::statement('drop view if exists produk_terlaris');
        DB::statement('drop view if exists toko_stats');
    }
};
