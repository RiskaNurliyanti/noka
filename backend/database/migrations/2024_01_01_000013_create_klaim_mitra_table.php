<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Inti mekanisme klaim mitra (Section 14 instruksi). CHECK constraint
     * klaim_target_valid direplikasi PERSIS dari schema asli - jangan
     * disederhanakan, ini yang menjamin satu klaim cuma boleh menunjuk
     * toko ATAU kurir, tidak dua-duanya / tidak kosong dua-duanya.
     */
    public function up(): void
    {
        DB::statement('drop type if exists jenis_klaim'); // idempotent - aman kalau migrate:fresh diulang setelah gagal di tengah jalan
        DB::statement("create type jenis_klaim as enum ('toko', 'kurir')");

        Schema::create('klaim_mitra', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->uuid('toko_id')->nullable();
            $table->foreign('toko_id')->references('id')->on('toko')->cascadeOnDelete();

            $table->uuid('kurir_id')->nullable();
            $table->foreign('kurir_id')->references('id')->on('kurir')->cascadeOnDelete();

            $table->uuid('user_id');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();

            $table->text('catatan')->nullable(); // bukti/keterangan kepemilikan dari pengklaim
            $table->timestamp('created_at')->useCurrent();
        });

        DB::statement("alter table klaim_mitra add column jenis jenis_klaim not null");
        DB::statement("alter table klaim_mitra add column status status_verifikasi not null default 'pending'");

        DB::statement(<<<'SQL'
            alter table klaim_mitra add constraint klaim_target_valid check (
                (jenis = 'toko' and toko_id is not null and kurir_id is null)
                or (jenis = 'kurir' and kurir_id is not null and toko_id is null)
            )
        SQL);
    }

    public function down(): void
    {
        Schema::dropIfExists('klaim_mitra');
        DB::statement('drop type if exists jenis_klaim');
    }
};
