<?php

namespace App\Http\Controllers;

use App\Models\KlaimMitra;
use App\Models\Kurir;
use App\Models\Toko;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

<<<<<<< HEAD
// Ajukan klaim kepemilikan toko/kurir yang belum ada pemiliknya (dari sisi pengaju).
class KlaimController extends Controller
{
    // Ajukan klaim kepemilikan toko/kurir.
=======
class KlaimController extends Controller
{
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'jenis' => ['required', 'in:toko,kurir'],
            'toko_id' => ['required_if:jenis,toko', 'nullable', 'uuid', 'exists:toko,id'],
            'kurir_id' => ['required_if:jenis,kurir', 'nullable', 'uuid', 'exists:kurir,id'],
            'catatan' => ['nullable', 'string', 'max:1000'],
        ]);

        $userId = $request->user()->id;

        if ($data['jenis'] === 'toko') {
            $toko = Toko::find($data['toko_id']);
            if ($toko->user_id !== null) {
                return response()->json(['success' => false, 'message' => 'Toko ini sudah punya pemilik'], 422);
            }
            $target = ['toko_id' => $data['toko_id'], 'kurir_id' => null];
        } else {
            $kurir = Kurir::find($data['kurir_id']);
            if ($kurir->user_id !== null) {
                return response()->json(['success' => false, 'message' => 'Kurir ini sudah punya pemilik'], 422);
            }
            $target = ['toko_id' => null, 'kurir_id' => $data['kurir_id']];
        }

        $klaim = KlaimMitra::create([
            'jenis' => $data['jenis'],
            ...$target,
            'user_id' => $userId,
            'catatan' => $data['catatan'] ?? null,
            'status' => 'pending',
        ]);

        return response()->json(['success' => true, 'message' => 'Klaim diajukan, menunggu verifikasi admin', 'data' => $klaim], 201);
    }

<<<<<<< HEAD
    // Riwayat klaim yang pernah diajukan user ini.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
    public function riwayatSaya(Request $request): JsonResponse
    {
        $klaim = KlaimMitra::with(['toko', 'kurir'])
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $klaim]);
    }
}
