<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DualWriteMirror
{
    private static ?bool $tersedia = null;

    /** Cek (dan cache per-request) apakah koneksi ke Supabase tersedia - dipakai juga oleh Admin\StatusDatabaseController buat halaman diagnostik "Status Database". */
    public static function tersedia(): bool
    {
        if (self::$tersedia !== null) {
            return self::$tersedia;
        }

        if (! config('database.connections.pgsql_legacy.host')) {
            return self::$tersedia = false;
        }

        try {
            DB::connection('pgsql_legacy')->getPdo();

            return self::$tersedia = true;
        } catch (\Throwable $e) {
            Log::warning('DualWriteMirror: koneksi ke Supabase tidak tersedia - '.$e->getMessage());

            return self::$tersedia = false;
        }
    }

    /**
     * Upsert satu baris ke tabel yang sama di Supabase berdasarkan kolom
     * 'id'. $data WAJIB sudah termasuk 'id'.
     */
    public static function salin(string $tabel, array $data): void
    {
        if (! self::tersedia() || empty($data['id'])) {
            return;
        }

        try {
            DB::connection('pgsql_legacy')->table($tabel)->upsert([$data], ['id'], array_keys($data));
        } catch (\Throwable $e) {
            // Sengaja tidak dilempar ulang - kegagalan mirror TIDAK BOLEH
            // menggagalkan aksi utama yang sudah berhasil tersimpan di Neon.
            Log::warning("DualWriteMirror gagal menyalin ke Supabase ({$tabel}): ".$e->getMessage());
        }
    }

    public static function hapus(string $tabel, $id): void
    {
        if (! self::tersedia() || empty($id)) {
            return;
        }

        try {
            DB::connection('pgsql_legacy')->table($tabel)->where('id', $id)->delete();
        } catch (\Throwable $e) {
            Log::warning("DualWriteMirror gagal menghapus di Supabase ({$tabel}): ".$e->getMessage());
        }
    }
}
