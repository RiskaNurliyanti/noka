<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

    public function up(): void
    {
        Schema::table('pesanan', function (Blueprint $table) {
            $table->string('status', 20)->default('dibuat')->after('catatan');
        });

        DB::statement("
            alter table pesanan add constraint pesanan_status_check
            check (status in ('dibuat', 'diproses', 'selesai', 'dibatalkan'))
        ");
    }

    public function down(): void
    {
        DB::statement('alter table pesanan drop constraint if exists pesanan_status_check');

        Schema::table('pesanan', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
