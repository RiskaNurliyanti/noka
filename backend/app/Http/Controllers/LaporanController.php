<?php

namespace App\Http\Controllers;

use App\Models\LaporanPengguna;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LaporanController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'jenis' => ['required', Rule::in(LaporanPengguna::JENIS_VALID)],
            'judul' => ['required', 'string', 'max:150'],
            'deskripsi' => ['required', 'string', 'max:3000'],
            'target_jenis' => ['nullable', Rule::in(LaporanPengguna::TARGET_JENIS_VALID)],
            'target_id' => ['nullable', 'uuid'],
            'lampiran_url' => ['nullable', 'string'],
        ]);

        $laporan = LaporanPengguna::create([
            ...$data,
            'user_id' => $request->user()->id,
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Laporan berhasil dikirim, tim NOKA akan segera menindaklanjuti',
            'data' => $laporan,
        ], 201);
    }

    public function riwayatSaya(Request $request): JsonResponse
    {
        $laporan = LaporanPengguna::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 20));

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $laporan]);
    }
}
