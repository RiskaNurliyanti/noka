<?php

use Illuminate\Support\Str;

return [

    // NOKA pakai PostgreSQL sebagai database utama (bukan MySQL/sqlite default Laravel).
    'default' => env('DB_CONNECTION', 'pgsql'),

    'connections' => [

        'pgsql' => [
            'driver' => 'pgsql',
            'url' => env('DB_URL'),
            'host' => env('DB_HOST', '127.0.0.1'),
            'port' => env('DB_PORT', '5432'),
            'database' => env('DB_DATABASE', 'noka'),
            'username' => env('DB_USERNAME', 'postgres'),
            'password' => env('DB_PASSWORD', ''),
            'charset' => env('DB_CHARSET', 'utf8'),
            'prefix' => '',
            'prefix_indexes' => true,
            'search_path' => 'public',
            'sslmode' => env('DB_SSLMODE', 'prefer'),
        ],

        // Koneksi SUMBER (Supabase Postgres lama) - HANYA dipakai sekali oleh
        // Artisan command `noka:migrate-from-supabase` (Phase 4). Bukan
        // dipakai aplikasi sehari-hari. Ambil connection string ini dari
        // Supabase Dashboard > Project Settings > Database > Connection string
        // (bukan REST API key/anon key - itu beda hal).
        'pgsql_legacy' => [
            'driver' => 'pgsql',
            'host' => env('DB_LEGACY_HOST'),
            'port' => env('DB_LEGACY_PORT', '5432'),
            'database' => env('DB_LEGACY_DATABASE', 'postgres'),
            'username' => env('DB_LEGACY_USERNAME', 'postgres'),
            'password' => env('DB_LEGACY_PASSWORD', ''),
            'charset' => 'utf8',
            'prefix' => '',
            'search_path' => 'public',
            'sslmode' => 'require', // Supabase mewajibkan SSL
        ],

    ],

    'migrations' => [
        'table' => 'migrations',
        'update_date_on_publish' => true,
    ],

    'redis' => [
        'client' => env('REDIS_CLIENT', 'phpredis'),

        'options' => [
            'cluster' => env('REDIS_CLUSTER', 'redis'),
            'prefix' => env('REDIS_PREFIX', Str::slug(env('APP_NAME', 'noka'), '_') . '_database_'),
        ],

        'default' => [
            'url' => env('REDIS_URL'),
            'host' => env('REDIS_HOST', '127.0.0.1'),
            'username' => env('REDIS_USERNAME'),
            'password' => env('REDIS_PASSWORD'),
            'port' => env('REDIS_PORT', '6379'),
            'database' => env('REDIS_DB', '0'),
        ],
    ],

];
