<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('produk', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->uuid('toko_id');
            $table->foreign('toko_id')->references('id')->on('toko')->cascadeOnDelete();

            $table->uuid('kategori_id')->nullable();
            $table->foreign('kategori_id')->references('id')->on('kategori')->nullOnDelete();

            $table->string('nama');
            $table->text('deskripsi')->nullable();
            $table->decimal('harga', 12, 2);
            $table->decimal('harga_diskon', 12, 2)->nullable(); // hanya diisi kalau lagi promo
            $table->string('foto')->nullable();
            $table->jsonb('galeri')->nullable();
            $table->boolean('status_aktif')->default(true); // "status tersedia"
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('produk');
    }
};
