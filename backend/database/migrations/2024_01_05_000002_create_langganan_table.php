<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Stage 21: langganan bulanan toko - biaya flat murah ala UMKM
     * (default Rp5.000/bulan, lihat App\Services\TagihanService buat
     * skema biaya tambahan per transaksi). 1 toko = 1 baris langganan yang
     * terus diperpanjang (bukan histori per periode - histori pembayaran
     * ada di tabel `tagihan` terpisah).
     */
    public function up(): void
    {
        Schema::create('langganan', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->uuid('toko_id')->unique();
            $table->foreign('toko_id')->references('id')->on('toko')->cascadeOnDelete();

            $table->date('mulai_tanggal');
            $table->date('berakhir_tanggal');
            $table->string('status', 20)->default('aktif'); // aktif, kadaluarsa
            $table->integer('harga_bulanan')->default(5000);

            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->nullable();
        });

        DB::statement("alter table langganan add constraint langganan_status_check check (status in ('aktif', 'kadaluarsa'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('langganan');
    }
};
