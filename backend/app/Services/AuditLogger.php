<?php

namespace App\Services;

use App\Models\AuditLogPesanan;
use App\Models\Pesanan;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Stage 21: catat siapa mengubah apa pada pesanan mana, kapan, nilai
 * sebelum & sesudah, plus IP/device - dipanggil dari SEMUA controller yang
 * bisa mengubah status pesanan (pembeli, toko, kurir, admin/super_admin).
 * Kegagalan mencatat audit TIDAK BOLEH menggagalkan aksi utama (update
 * status pesanan tetap jalan walau audit log gagal ditulis).
 */
class AuditLogger
{
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
