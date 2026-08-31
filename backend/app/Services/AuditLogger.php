<?php

namespace App\Services;

use App\Models\AuditLogPesanan;
use App\Models\Pesanan;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

<<<<<<< HEAD
// Catat riwayat perubahan status pesanan ke tabel audit log.
class AuditLogger
{
    // Simpan satu baris riwayat perubahan pesanan ke audit log.
=======
class AuditLogger
{
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
    public static function catatPesanan(
        Pesanan $pesanan,
        ?User $user,
        string $aksi,
        array $sebelum,
        array $sesudah,
        Request $request
    ): void {
        try {
            AuditLogPesanan::create([
                'pesanan_id' => $pesanan->id,
                'user_id' => $user?->id,
                'role' => $user?->role,
                'aksi' => $aksi,
                'data_sebelum' => $sebelum,
                'data_sesudah' => $sesudah,
                'ip_address' => $request->ip(),
                'user_agent' => substr((string) $request->userAgent(), 0, 255),
            ]);
        } catch (\Throwable $e) {
            Log::warning('AuditLogger gagal mencatat perubahan pesanan: '.$e->getMessage());
        }
    }
}
