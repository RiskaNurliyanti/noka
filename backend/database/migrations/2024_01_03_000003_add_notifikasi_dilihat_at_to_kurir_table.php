<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

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
