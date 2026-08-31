<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Stage 21: audit log KHUSUS perubahan pesanan (status/alasan
     * pembatalan) - siapa (user_id+role), kapan (created_at), pesanan mana
     * (pesanan_id), nilai sebelum & sesudah (jsonb), plus IP/device buat
     * keperluan keamanan kalau ada sengketa/kecurigaan. Hanya bisa dilihat
     * super_admin (lihat routes/api.php - role:super_admin, BUKAN role:admin
     * biasa, beda dari kebanyakan fitur admin lain).
     *
     * pesanan_id & user_id nullOnDelete (bukan cascade) - audit log HARUS
     * tetap ada walau pesanan/user-nya sudah dihapus, itu justru inti dari
     * audit trail (jangan sampai hapus akun = hapus jejak).
     */
    public function up(): void
    {
        Schema::create('audit_log_pesanan', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->uuid('pesanan_id')->nullable();
            $table->foreign('pesanan_id')->references('id')->on('pesanan')->nullOnDelete();

            $table->uuid('user_id')->nullable();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();

            $table->string('role', 20)->nullable(); // role aktor SAAT aksi terjadi (role bisa berubah setelahnya)
            $table->string('aksi', 30); // mis. 'dibuat', 'diproses', 'selesai', 'dibatalkan'
            $table->jsonb('data_sebelum')->nullable();
            $table->jsonb('data_sesudah')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 255)->nullable();

            $table->timestamp('created_at')->useCurrent();

            $table->index('pesanan_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_log_pesanan');
    }
};
