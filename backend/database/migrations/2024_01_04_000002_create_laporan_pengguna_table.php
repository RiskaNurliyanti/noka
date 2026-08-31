<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Stage 19: pusat aduan - SEMUA role (pembeli, mitra_toko, mitra_kurir,
     * bahkan admin) bisa lapor kalau nemu BUG di aplikasi atau PELANGGARAN
     * (mis. toko/kurir/pembeli lain berlaku curang di luar sistem). Laporan
     * masuk ke admin & super_admin buat ditindaklanjuti - bukan pengganti
     * moderasi review (itu udah ada di review_produk/toko/kurir), ini murni
     * saluran aduan bebas dengan judul+deskripsi.
     *
     * target_jenis/target_id OPSIONAL - dipakai kalau laporan menunjuk ke
     * entitas tertentu (mis. toko X, pesanan Y). Sengaja TIDAK pakai foreign
     * key ke banyak tabel sekaligus (toko/kurir/produk/pesanan/users) -
     * cukup simpan id polos + label jenisnya, supaya laporan tetap valid
     * walau entitas yang dilaporkan nanti dihapus (riwayat aduan tidak
     * boleh ikut hilang).
     */
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
