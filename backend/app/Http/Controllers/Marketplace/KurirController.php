<?php

namespace App\Http\Controllers\Marketplace;

use App\Http\Controllers\Controller;
use App\Models\Kurir;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

<<<<<<< HEAD
// Direktori kurir untuk publik: daftar dan detail satu kurir.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
class KurirController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Kurir::query()
            ->where('status_aktif', true)
            ->where('status_verifikasi', 'approved');

        // Dipakai halaman Checkout - cuma kurir yang lagi online/tersedia
        // yang boleh dipilih buat pengantaran.
        if ($request->boolean('tersedia')) {
            $query->where('status_ketersediaan', true);
        }

        $kurir = $query->orderBy('nama_layanan')->paginate($request->integer('per_page', 20));

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $kurir]);
    }

    public function show(string $id): JsonResponse
    {
        $kurir = Kurir::where('status_aktif', true)
            ->where('status_verifikasi', 'approved')
            ->find($id);

        if (! $kurir) {
            return response()->json(['success' => false, 'message' => 'Kurir tidak ditemukan'], 404);
        }

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $kurir]);
    }
}
