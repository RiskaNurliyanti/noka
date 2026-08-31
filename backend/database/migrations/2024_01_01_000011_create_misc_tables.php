<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kunjungan_toko', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('toko_id');
            $table->foreign('toko_id')->references('id')->on('toko')->cascadeOnDelete();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('banner', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('judul')->nullable();
            $table->string('gambar');
            $table->string('link')->nullable();
            $table->integer('urutan')->default(0);
            $table->boolean('status_aktif')->default(true);
            $table->timestamp('created_at')->useCurrent();
        });

        // Singleton row (id selalu 1) - dibaca App.jsx untuk cek maintenance_mode.
        Schema::create('pengaturan_sistem', function (Blueprint $table) {
            $table->integer('id')->primary()->default(1);
            $table->string('nama_web')->default('NOKA');
            $table->string('logo')->nullable();
            $table->string('admin_whatsapp')->nullable();
            $table->jsonb('konfigurasi')->default('{}');
            $table->boolean('maintenance_mode')->default(false);
        });
        DB::statement('alter table pengaturan_sistem add constraint single_row check (id = 1)');
        DB::statement("insert into pengaturan_sistem (id) values (1)"); // seed baris tunggal wajib ada

        Schema::create('log_aktivitas', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('user_id')->nullable();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->string('aksi');
            $table->jsonb('detail')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('log_aktivitas');
        Schema::dropIfExists('pengaturan_sistem');
        Schema::dropIfExists('banner');
        Schema::dropIfExists('kunjungan_toko');
    }
};
