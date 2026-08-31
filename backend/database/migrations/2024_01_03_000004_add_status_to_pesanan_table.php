<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Stage 17 (Laporan + CRUD berdasarkan role): sebelumnya tabel pesanan
     * SENGAJA tidak punya kolom status (lihat komentar di migration
     * 2024_01_01_000012 dan Model Pesanan - "jangan tambah tanpa instruksi
     * eksplisit"). Sudah dicek dulu, memang belum ada enum/kolom status apa
     * pun sebelumnya di skema. Requirement Stage 17 secara eksplisit minta
     * kemampuan mencatat status pesanan (terutama pembatalan manual yang
     * terjadi di luar sistem lewat WhatsApp), jadi kolom ini ditambahkan
     * sekarang - BUKAN untuk jadi order-tracking system real-time, tetap
     * cuma pencatatan status oleh penjual/admin secara manual.
     *
     * 4 nilai ini mencakup siklus yang diminta requirement:
     * dibuat -> diproses -> selesai / dibatalkan.
     */
    public function up(): void
    {
        Schema::table('pesanan', function (Blueprint $table) {
            $table->string('status', 20)->default('dibuat')->after('catatan');
        });

        DB::statement("
            alter table pesanan add constraint pesanan_status_check
            check (status in ('dibuat', 'diproses', 'selesai', 'dibatalkan'))
        ");
    }

    public function down(): void
    {
        DB::statement('alter table pesanan drop constraint if exists pesanan_status_check');

        Schema::table('pesanan', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
