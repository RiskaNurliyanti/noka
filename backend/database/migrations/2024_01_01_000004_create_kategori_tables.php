<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * `kategori` = kategori PRODUK (Makanan, Minuman, dst).
     * `kategori_toko` = kategori TOKO (Warung, Cafe, dst).
     * Nama tabel dipertahankan persis seperti skema Supabase lama,
     * termasuk keputusan lama untuk tidak rename `kategori` jadi
     * `kategori_produk` meski agak ambigu (lihat komentar di schema asli).
     */
    public function up(): void
    {
        Schema::create('kategori', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('nama');
            $table->string('icon')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('kategori_toko', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('nama');
            $table->string('icon')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kategori_toko');
        Schema::dropIfExists('kategori');
    }
};
