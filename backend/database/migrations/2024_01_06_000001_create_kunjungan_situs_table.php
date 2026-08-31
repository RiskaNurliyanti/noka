<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Stage 25: analitik pengunjung SITUS (beda dari `kunjungan_toko` yang
     * cuma catat kunjungan ke 1 halaman toko tertentu) - buat tahu sejauh
     * mana website NOKA diakses secara keseluruhan: halaman mana yang
     * paling sering dibuka, berapa pengunjung unik, dari perangkat apa.
     *
     * `sesi_id` = ID anonim yang dibuat FRONTEND (disimpan di localStorage,
     * bukan cookie/tracking lintas-situs) - dipakai buat menghitung
     * "pengunjung unik" tanpa perlu user login atau memasang tracker pihak
     * ketiga (Google Analytics dkk). `user_id` cuma terisi kalau pengunjung
     * itu sedang login.
     */
    public function up(): void
    {
        Schema::create('kunjungan_situs', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->string('halaman', 255);
            $table->uuid('user_id')->nullable();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();

            $table->string('sesi_id', 64);
            $table->string('perangkat', 20)->nullable(); // mobile, desktop, tablet
            $table->string('referrer', 255)->nullable();
            $table->string('user_agent', 255)->nullable();
            $table->string('ip_address', 45)->nullable();

            $table->timestamp('created_at')->useCurrent();

            $table->index('sesi_id');
            $table->index('created_at');
            $table->index('halaman');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kunjungan_situs');
    }
};
