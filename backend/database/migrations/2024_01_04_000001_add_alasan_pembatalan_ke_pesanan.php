<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Stage 18 (pembatalan pesanan semua role + riwayat per peran):
     * requirement eksplisit minta setiap pembatalan pesanan punya ALASAN
     * yang tercatat (pilihannya beda-beda tergantung siapa yang
     * membatalkan - lihat App\Support\AlasanPembatalan), dan admin/super
     * admin perlu tahu pesanan dibatalkan oleh peran apa (pembeli/toko/
     * kurir/admin) buat kelola riwayat per peran serta buat menghitung
     * batas pembatalan 2x/hari khusus kalau yang membatalkan itu pembeli.
     *
     * Kolom status sendiri (dibuat/diproses/selesai/dibatalkan) SUDAH ada
     * dari migration 2024_01_03_000004 - di sini cuma menambah detail
     * pembatalannya, bukan mengubah siklus status yang sudah ada.
     */
    public function up(): void
    {
        Schema::table('pesanan', function (Blueprint $table) {
            $table->string('alasan_pembatalan', 40)->nullable()->after('status');
            $table->string('dibatalkan_oleh_role', 20)->nullable()->after('alasan_pembatalan');
        });

        DB::statement("
            alter table pesanan add constraint pesanan_alasan_pembatalan_check
            check (alasan_pembatalan in (
                'toko_tutup', 'stok_tidak_tersedia', 'kurir_libur', 'ganti_toko_lain', 'tidak_jadi_beli'
            ))
        ");

        DB::statement("
            alter table pesanan add constraint pesanan_dibatalkan_oleh_role_check
            check (dibatalkan_oleh_role in ('pembeli', 'penjual', 'kurir', 'admin', 'super_admin'))
        ");
    }

    public function down(): void
    {
        DB::statement('alter table pesanan drop constraint if exists pesanan_alasan_pembatalan_check');
        DB::statement('alter table pesanan drop constraint if exists pesanan_dibatalkan_oleh_role_check');

        Schema::table('pesanan', function (Blueprint $table) {
            $table->dropColumn(['alasan_pembatalan', 'dibatalkan_oleh_role']);
        });
    }
};
