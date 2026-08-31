<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

    public function up(): void
    {
        Schema::create('laporan_pengguna', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->uuid('user_id');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();

            $table->string('jenis', 20); // 'bug' atau 'pelanggaran'
            $table->string('judul', 150);
            $table->text('deskripsi');

            $table->string('target_jenis', 20)->nullable(); // toko/kurir/produk/pesanan/pengguna/lainnya
            $table->uuid('target_id')->nullable();
            $table->string('lampiran_url')->nullable(); // screenshot bukti, upload lewat /upload

            $table->string('status', 20)->default('pending'); // pending, diproses, selesai, ditolak
            $table->text('catatan_admin')->nullable();

            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->nullable();
        });

        DB::statement("alter table laporan_pengguna add constraint laporan_jenis_check check (jenis in ('bug', 'pelanggaran'))");
        DB::statement("alter table laporan_pengguna add constraint laporan_status_check check (status in ('pending', 'diproses', 'selesai', 'ditolak'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('laporan_pengguna');
    }
};
