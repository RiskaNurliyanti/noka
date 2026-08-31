<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Notifikasi pesanan baru untuk toko - pola sama persis dengan
     * notifikasi_dilihat_at di kurir (lihat migration
     * 2024_01_03_000003_add_notifikasi_dilihat_at_to_kurir_table): 1
     * timestamp "terakhir toko lihat notifikasi", jumlah notifikasi =
     * pesanan toko yang dibuat SETELAH timestamp ini. Begitu penjual buka
     * dropdown notifikasi, timestamp di-update ke sekarang, badge-nya
     * otomatis reset - tidak ada angka yang "nempel" terus walau sudah
     * dilihat (beda dari sebelumnya yang cuma nampilin total SEMUA
     * pesanan, jumlahnya tidak pernah berkurang walau sudah dicek).
     */
    public function up(): void
    {
        Schema::table('toko', function (Blueprint $table) {
            $table->timestamp('notifikasi_dilihat_at')->nullable()->after('status_buka');
        });
    }

    public function down(): void
    {
        Schema::table('toko', function (Blueprint $table) {
            $table->dropColumn('notifikasi_dilihat_at');
        });
    }
};
