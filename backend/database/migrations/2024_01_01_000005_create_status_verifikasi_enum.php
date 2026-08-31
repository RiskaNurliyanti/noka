<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Enum dipakai bersama oleh toko.status_verifikasi, kurir.status_verifikasi,
     * dan klaim_mitra.status — dibuat sekali di migration terpisah supaya
     * jelas ini shared type, persis seperti di schema Supabase asli.
     */
    public function up(): void
    {
        DB::statement('drop type if exists status_verifikasi'); // idempotent - aman kalau migrate:fresh diulang setelah gagal di tengah jalan
        DB::statement("create type status_verifikasi as enum ('pending', 'approved', 'rejected')");
    }

    public function down(): void
    {
        DB::statement('drop type if exists status_verifikasi');
    }
};
