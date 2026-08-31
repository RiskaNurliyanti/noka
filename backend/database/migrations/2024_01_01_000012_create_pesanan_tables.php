<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * NOKA tidak proses pembayaran/pengiriman in-app - checkout cuma
     * generate link WhatsApp ke toko. Makanya tabel ini TIDAK punya kolom
     * status pesanan (diproses/dikirim/selesai) - itu bukan fitur belum
     * selesai, itu memang desain arsitektur yang disengaja. Jangan tambah
     * kolom status di sini tanpa instruksi eksplisit.
     */
    public function up(): void
    {
        Schema::create('pesanan', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->uuid('pembeli_id')->nullable();
            $table->foreign('pembeli_id')->references('id')->on('users')->nullOnDelete();

            $table->string('guest_nama')->nullable();
            $table->string('guest_whatsapp')->nullable();

            $table->uuid('toko_id');
            $table->foreign('toko_id')->references('id')->on('toko')->cascadeOnDelete();

            $table->uuid('kurir_id')->nullable();
            $table->foreign('kurir_id')->references('id')->on('kurir')->nullOnDelete();

            $table->decimal('total_harga', 12, 2)->default(0);
            $table->text('alamat_antar')->nullable();
            $table->text('catatan')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        // Replikasi persis constraint pembeli_or_guest dari schema asli:
        // pesanan harus punya pembeli_id (user login) ATAU data guest lengkap.
        DB::statement(<<<'SQL'
            alter table pesanan add constraint pembeli_or_guest check (
                pembeli_id is not null or (guest_nama is not null and guest_whatsapp is not null)
            )
        SQL);

        Schema::create('pesanan_item', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->uuid('pesanan_id');
            $table->foreign('pesanan_id')->references('id')->on('pesanan')->cascadeOnDelete();

            $table->uuid('produk_id');
            $table->foreign('produk_id')->references('id')->on('produk')->restrictOnDelete();

            $table->integer('qty');
            $table->decimal('harga_satuan', 12, 2);
            $table->decimal('subtotal', 12, 2);
        });
        DB::statement('alter table pesanan_item add constraint pesanan_item_qty_check check (qty > 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('pesanan_item');
        Schema::dropIfExists('pesanan');
    }
};
