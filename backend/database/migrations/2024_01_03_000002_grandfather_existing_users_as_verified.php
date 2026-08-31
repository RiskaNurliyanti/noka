<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Stage 4: login sekarang mensyaratkan email_verified_at terisi.
     * Tanpa migration ini, SEMUA user yang sudah ada (dibuat sebelum fitur
     * ini ada, baik lewat email/password maupun Google) akan mendadak
     * tidak bisa login sama sekali karena email_verified_at mereka NULL -
     * itu jelas melanggar instruksi "tetap kompatibel dengan data lama".
     * Jadi user existing di-grandfather jadi terverifikasi otomatis;
     * hanya pendaftar BARU (setelah migration ini jalan) yang wajib
     * verifikasi email dulu.
     */
    public function up(): void
    {
        DB::table('users')
            ->whereNull('email_verified_at')
            ->update(['email_verified_at' => DB::raw('created_at')]);
    }

    public function down(): void
    {
        // Sengaja tidak di-null-kan lagi saat rollback - tidak ada cara
        // membedakan "memang belum verifikasi" vs "di-grandfather migration
        // ini" setelah faktanya digabung, dan menge-null-kan massal akan
        // mengunci semua user existing dari akunnya sendiri.
    }
};
