<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('toko', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            // Nullable dengan sengaja: toko bisa diinput admin dulu tanpa
            // pemilik, lalu diklaim mitra asli lewat tabel klaim_mitra.
            // JANGAN dibuat not-null — ini fondasi mekanisme klaim mitra.
            $table->uuid('user_id')->nullable();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();

            $table->uuid('kategori_toko_id')->nullable();
            $table->foreign('kategori_toko_id')->references('id')->on('kategori_toko')->nullOnDelete();

            $table->string('nama_toko');
            $table->text('deskripsi')->nullable();
            $table->string('no_whatsapp')->default(''); // wajib diisi, dipakai redirect checkout WhatsApp
            $table->string('foto_banner')->nullable();
            $table->string('foto_logo')->nullable();
            $table->jsonb('galeri')->nullable(); // array URL foto galeri toko
            $table->text('alamat')->nullable();
            $table->string('kecamatan')->nullable();
            $table->string('desa')->nullable();
            $table->decimal('lokasi_lat', 10, 7)->nullable();
            $table->decimal('lokasi_lng', 10, 7)->nullable();
            $table->time('jam_buka')->nullable();
            $table->time('jam_tutup')->nullable();
            $table->boolean('status_buka')->default(true);
            $table->boolean('status_aktif')->default(true);
            $table->timestamp('created_at')->useCurrent();
        });

        DB::statement("alter table toko add column status_verifikasi status_verifikasi not null default 'pending'");
    }

    public function down(): void
    {
        Schema::dropIfExists('toko');
    }
};
