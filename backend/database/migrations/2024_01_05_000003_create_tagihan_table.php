<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

    public function up(): void
    {
        Schema::create('tagihan', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->uuid('toko_id');
            $table->foreign('toko_id')->references('id')->on('toko')->cascadeOnDelete();

            $table->string('periode', 7); // format 'YYYY-MM'
            $table->integer('jumlah_transaksi')->default(0);
            $table->integer('biaya_langganan')->default(5000);
            $table->integer('biaya_tambahan')->default(0);
            $table->integer('total')->default(5000);
            $table->string('status_bayar', 20)->default('belum_dibayar'); // belum_dibayar, lunas
            $table->date('jatuh_tempo')->nullable();
            $table->timestamp('dibayar_at')->nullable();

            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->nullable();

            $table->unique(['toko_id', 'periode']);
        });

        DB::statement("alter table tagihan add constraint tagihan_status_bayar_check check (status_bayar in ('belum_dibayar', 'lunas'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('tagihan');
    }
};
