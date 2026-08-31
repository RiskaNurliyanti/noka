<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{

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
