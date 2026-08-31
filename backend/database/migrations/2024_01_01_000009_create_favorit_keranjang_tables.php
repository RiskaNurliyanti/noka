<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('favorit', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('user_id');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->uuid('produk_id');
            $table->foreign('produk_id')->references('id')->on('produk')->cascadeOnDelete();
            $table->timestamp('created_at')->useCurrent();
            $table->unique(['user_id', 'produk_id']); // satu user tidak bisa favorit produk yang sama 2x
        });

        Schema::create('keranjang', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('user_id');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->uuid('produk_id');
            $table->foreign('produk_id')->references('id')->on('produk')->cascadeOnDelete();
            $table->integer('qty')->default(1);
            $table->text('catatan')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        DB::statement('alter table keranjang add constraint keranjang_qty_check check (qty > 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('keranjang');
        Schema::dropIfExists('favorit');
    }
};
