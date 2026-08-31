<?php

namespace App\Http\Controllers\Mitra;

use App\Http\Controllers\Controller;
use App\Models\Langganan;
use App\Models\Tagihan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LanggananController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $toko = $request->user()->toko()->first();

        if (! $toko) {
            return response()->json(['success' => false, 'message' => 'Kamu belum punya toko'], 404);
        }

        $langganan = Langganan::where('toko_id', $toko->id)->first();
        $tagihan = Tagihan::where('toko_id', $toko->id)->orderByDesc('periode')->limit(12)->get();

        return response()->json([
            'success' => true,
            'message' => 'OK',
            'data' => [
                'langganan' => $langganan,
                'akan_habis' => $langganan?->akanHabis() ?? false,
                'sisa_hari' => $langganan?->sisaHari(),
                'tagihan' => $tagihan,
            ],
        ]);
    }
}
