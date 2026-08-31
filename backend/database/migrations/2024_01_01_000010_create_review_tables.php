<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tiga tabel review terpisah (produk/toko/kurir) dipertahankan sesuai
     * skema asli — TIDAK digabung jadi satu tabel polymorphic, karena itu
     * termasuk refactor besar tanpa alasan teknis kuat (dilarang instruksi).
     */
    public function up(): void
    {
        foreach (['review_produk' => 'produk_id', 'review_toko' => 'toko_id', 'review_kurir' => 'kurir_id'] as $table => $targetCol) {
            $target = str_replace('_id', '', $targetCol); // produk_id -> produk, dst

            Schema::create($table, function (Blueprint $t) use ($targetCol, $target) {
                $t->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

                $t->uuid('user_id');
                $t->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();

                $t->uuid($targetCol);
                $t->foreign($targetCol)->references('id')->on($target)->cascadeOnDelete();

                $t->smallInteger('rating');
                $t->text('komentar')->nullable();
                $t->string('status_moderasi')->default('tampil'); // tampil / disembunyikan
                $t->timestamp('created_at')->useCurrent();
            });

            DB::statement("alter table {$table} add constraint {$table}_rating_check check (rating between 1 and 5)");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('review_kurir');
        Schema::dropIfExists('review_toko');
        Schema::dropIfExists('review_produk');
    }
};
