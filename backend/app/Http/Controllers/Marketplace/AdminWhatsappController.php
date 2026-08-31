<?php

namespace App\Http\Controllers\Marketplace;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;

/**
 * Dipakai halaman KlaimMitra.jsx - butuh nomor WA admin/super_admin buat
 * kirim pesan verifikasi klaim. Replikasi PERSIS query asli: ambil satu
 * admin/super_admin aktif yang no_whatsapp-nya terisi (bukan dari
 * pengaturan_sistem.admin_whatsapp - itu field terpisah, tidak dipakai
 * flow ini di kode lama, jadi tidak diubah di sini).
 */
<<<<<<< HEAD
// Ambil nomor WhatsApp admin, dipakai halaman klaim mitra.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
class AdminWhatsappController extends Controller
{
    public function show(): JsonResponse
    {
        $admin = User::whereIn('role', ['admin', 'super_admin'])
            ->where('status_aktif', true)
            ->whereNotNull('no_whatsapp')
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'OK',
            'data' => ['no_whatsapp' => $admin?->no_whatsapp],
        ]);
    }
}
