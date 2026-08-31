<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Notifikasi pesanan untuk PEMBELI - begitu status pesanan mereka
     * berubah (terutama dibatalkan/selesai oleh kurir atau penjual),
     * pembeli perlu tahu lewat NOKA, bukan cuma nunggu WhatsApp manual.
     *
     * Tabel 'pesanan' pakai $timestamps = false sejak awal (cuma
     * created_at yang di-set DB default), jadi TIDAK ADA cara tahu kapan
     * pesanan terakhir diubah - perlu kolom updated_at buat itu. Diisi
     * manual di controller yang mengubah status (bukan aktifkan
     * $timestamps=true penuh, supaya tidak mengubah behavior created_at
     * yang sudah berjalan sejak awal).
     *
     * notifikasi_pesanan_dilihat_at di users - pola sama seperti
     * notifikasi_dilihat_at di kurir (Stage 16): timestamp "terakhir
     * dilihat", bukan tabel notifikasi terpisah.
     */
    public function up(): void
    {
        Schema::table('pesanan', function (Blueprint $table) {
            $table->timestamp('updated_at')->nullable()->after('status');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('notifikasi_pesanan_dilihat_at')->nullable()->after('email_verified_at');
        });
    }

    public function down(): void
    {
        Schema::table('pesanan', function (Blueprint $table) {
            $table->dropColumn('updated_at');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('notifikasi_pesanan_dilihat_at');
        });
    }
};
