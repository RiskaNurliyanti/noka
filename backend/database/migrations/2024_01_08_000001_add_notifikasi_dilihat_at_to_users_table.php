<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Notifikasi admin/super admin - pola sama dengan
     * notifikasi_dilihat_at di toko/kurir (lihat migration
     * 2024_01_07_000001), tapi ditaruh di tabel `users` (bukan toko/kurir)
     * karena yang butuh ini adalah AKUN admin/super_admin itu sendiri,
     * bukan 1 toko/kurir tertentu - dan supaya generik dipakai role apa
     * pun kalau nanti perlu.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('notifikasi_dilihat_at')->nullable()->after('status_aktif');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('notifikasi_dilihat_at');
        });
    }
};
