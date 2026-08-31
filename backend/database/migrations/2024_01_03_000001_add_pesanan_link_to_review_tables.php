<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

    public function up(): void
    {
        $map = [
            'review_produk' => ['pesanan_id' => 'pesanan', 'target' => 'produk_id'],
            'review_toko' => ['pesanan_id' => 'pesanan', 'target' => 'toko_id'],
            'review_kurir' => ['pesanan_id' => 'pesanan', 'target' => 'kurir_id'],
        ];

        foreach ($map as $table => $cfg) {
            Schema::table($table, function (Blueprint $t) {
                $t->uuid('pesanan_id')->nullable()->after('user_id');
                $t->foreign('pesanan_id')->references('id')->on('pesanan')->nullOnDelete();

                $t->smallInteger('update_count')->default(0)->after('status_moderasi');
            });

            // Satu user hanya boleh 1 review per pesanan per target (produk/toko/kurir).
            // Partial unique index: hanya berlaku untuk review yang punya pesanan_id
            // (review lama yang pesanan_id-nya NULL tidak kena constraint ini).
            $target = $cfg['target'];
            DB::statement("
                create unique index {$table}_user_pesanan_{$target}_unique
                on {$table} (user_id, pesanan_id, {$target})
                where pesanan_id is not null
            ");
        }
    }

    public function down(): void
    {
        foreach (['review_produk' => 'produk_id', 'review_toko' => 'toko_id', 'review_kurir' => 'kurir_id'] as $table => $target) {
            DB::statement("drop index if exists {$table}_user_pesanan_{$target}_unique");

            Schema::table($table, function (Blueprint $t) {
                $t->dropForeign(['pesanan_id']);
                $t->dropColumn(['pesanan_id', 'update_count']);
            });
        }
    }
};
