<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kurir', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            // Nullable dengan sengaja, sama seperti toko - fondasi klaim mitra.
            $table->uuid('user_id')->nullable();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();

            $table->string('nama_layanan');
            $table->string('foto_logo')->nullable();
            $table->string('no_whatsapp');
            $table->string('kendaraan')->nullable();
            $table->text('area_layanan')->nullable();
            $table->string('jam_operasional')->nullable();
            $table->boolean('status_ketersediaan')->default(true); // online/offline saat ini
            $table->boolean('status_aktif')->default(true);
            $table->timestamp('created_at')->useCurrent();
        });

        DB::statement("alter table kurir add column status_verifikasi status_verifikasi not null default 'pending'");
    }

    public function down(): void
    {
        Schema::dropIfExists('kurir');
    }
};
