<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Stage 16: notifikasi kurir. Daripada bikin tabel notifikasi terpisah
     * (lebih rumit, butuh cleanup, dan berisiko duplikasi), dipakai
     * pendekatan sederhana: 1 timestamp "terakhir kurir lihat notifikasi".
     * Jumlah notifikasi = pesanan miliknya yang dibuat SETELAH timestamp
     * ini. Begitu kurir buka dropdown notifikasi, timestamp di-update ke
     * sekarang, otomatis badge-nya reset - tidak ada notifikasi yang
     * "nempel" terus setelah dilihat.
     */
    public function up(): void
    {
        Schema::table('kurir', function (Blueprint $table) {
            $table->timestamp('notifikasi_dilihat_at')->nullable()->after('status_ketersediaan');
        });
    }

    public function down(): void
    {
        Schema::table('kurir', function (Blueprint $table) {
            $table->dropColumn('notifikasi_dilihat_at');
        });
    }
};
