<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KlaimMitra;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class KlaimController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = KlaimMitra::with(['toko', 'kurir', 'user:id,nama,email,no_whatsapp']);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $klaim = $query->orderByDesc('created_at')->paginate($request->integer('per_page', 20));

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $klaim]);
    }

    /**
     * Approve klaim. Replikasi PERSIS flow di Section 14 instruksi:
     * - toko/kurir.user_id di-set ke pengklaim
     * - user.role diubah ke mitra_toko / mitra_kurir sesuai jenis klaim
     * - klaim_mitra.status -> approved
     * Semua dalam satu DB transaction (atomicity) - kalau ada yang gagal,
     * semua rollback, tidak ada state setengah-jadi (toko punya pemilik
     * tapi role user belum berubah, atau sebaliknya).
     *
     * PENTING: approve toko TIDAK BOLEH mengubah akun kurir, dan sebaliknya
     * (pesan eksplisit di instruksi) - makanya update role di sini SELALU
     * spesifik sesuai $klaim->jenis, tidak pernah menyentuh field lain.
     */
    public function approve(Request $request, string $id): JsonResponse
    {
        $klaim = KlaimMitra::with(['toko', 'kurir', 'user'])->findOrFail($id);

        if ($klaim->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Klaim ini sudah diproses sebelumnya'], 422);
        }

        DB::transaction(function () use ($klaim) {
            if ($klaim->jenis === 'toko') {
                if ($klaim->toko->user_id !== null) {
                    abort(422, 'Toko ini sudah keburu diklaim orang lain');
                }
                $klaim->toko->update(['user_id' => $klaim->user_id]);
                $klaim->user->update(['role' => 'mitra_toko']);
            } else {
                if ($klaim->kurir->user_id !== null) {
                    abort(422, 'Kurir ini sudah keburu diklaim orang lain');
                }
                $klaim->kurir->update(['user_id' => $klaim->user_id]);
                $klaim->user->update(['role' => 'mitra_kurir']);
            }

            $klaim->update(['status' => 'approved']);
        });

        return response()->json(['success' => true, 'message' => 'Klaim disetujui', 'data' => $klaim->fresh(['toko', 'kurir', 'user'])]);
    }

    public function reject(Request $request, string $id): JsonResponse
    {
        $klaim = KlaimMitra::findOrFail($id);

        if ($klaim->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Klaim ini sudah diproses sebelumnya'], 422);
        }

        $klaim->update(['status' => 'rejected']);

        return response()->json(['success' => true, 'message' => 'Klaim ditolak', 'data' => $klaim]);
    }
}
