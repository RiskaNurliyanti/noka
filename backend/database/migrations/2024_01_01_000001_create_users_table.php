<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Menggantikan tabel `profiles` (Supabase) + auth.users bawaan Supabase,
     * digabung jadi satu tabel `users` milik Laravel.
     *
     * Field lama dipertahankan persis: nama, email, foto, no_whatsapp,
     * status_aktif, role, created_at.
     *
     * Field baru (dual login, sesuai keputusan): password & google_id
     * nullable, karena user bisa cuma login Google, cuma password,
     * atau dua-duanya.
     */
    public function up(): void
    {
        DB::statement('drop type if exists user_role'); // idempotent - aman kalau migrate:fresh diulang setelah gagal di tengah jalan
        DB::statement("create type user_role as enum ('pembeli', 'mitra_toko', 'mitra_kurir', 'admin', 'super_admin')");

        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('nama')->nullable();
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password')->nullable(); // nullable: user Google-only belum punya password
            $table->string('google_id')->nullable()->unique();
            $table->string('foto')->nullable();
            $table->string('no_whatsapp')->nullable();
            $table->boolean('status_aktif')->default(true);
            $table->rememberToken();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->nullable();
        });

        // Kolom enum ditambah terpisah karena Laravel Blueprint tidak native
        // support custom PostgreSQL enum type di dalam create().
        DB::statement("alter table users add column role user_role not null default 'pembeli'");
        DB::statement('create index users_role_index on users (role)');
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
        DB::statement('drop type if exists user_role');
    }
};
