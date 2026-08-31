<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Stage 22 (2 penyimpanan - Neon + Supabase): mirror tulis-jalan
 * (best-effort) dari database utama (Neon, koneksi default 'pgsql') ke
 * database Supabase lama (koneksi 'pgsql_legacy' - SUDAH ada sejak
 * migrasi Phase 4, lihat config/database.php & MigrateFromSupabase).
 *
 * PENTING - Neon tetap SATU-SATUNYA sumber kebenaran (source of truth):
 * aplikasi HANYA PERNAH membaca dari koneksi 'pgsql' (default). Tulisan
 * ke Supabase di sini murni SALINAN CADANGAN buat keamanan data (kalau
 * Neon down/hilang, ada cadangan) - bukan dipakai untuk baca data sama
 * sekali. Kalau DB_LEGACY_HOST belum diisi di .env, atau koneksi ke
 * Supabase gagal/timeout, mirror ini diam-diam di-skip - TIDAK PERNAH
 * membuat request utama gagal atau lambat menunggu Supabase.
 *
 * Tabel yang mau di-mirror harus SUDAH ADA di project Supabase dengan
 * struktur kolom yang sama - untuk tabel baru (audit_log_pesanan,
 * langganan, tagihan, laporan_pengguna) perlu dibuat manual dulu di
 * Supabase SQL Editor (lihat file SUPABASE-DUAL-WRITE.md di checkpoint).
 */
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

    /**
     * Stage 24: hapus baris yang sama di Supabase - dipanggil otomatis
     * lewat trait MirrorsToSupabase saat model dihapus di Neon, supaya
     * data yang dihapus juga hilang di cadangan (bukan cuma numpuk sampah).
     */
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
