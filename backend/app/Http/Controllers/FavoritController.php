<?php

namespace App\Http\Controllers;

use App\Models\Favorit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FavoritController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $favorit = Favorit::with('produk.toko')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $favorit]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'produk_id' => ['required', 'uuid', 'exists:produk,id'],
        ]);

        $favorit = Favorit::firstOrCreate([
            'user_id' => $request->user()->id,
            'produk_id' => $data['produk_id'],
        ]);

        return response()->json(['success' => true, 'message' => 'Ditambahkan ke favorit', 'data' => $favorit], 201);
    }

    public function destroy(Request $request, string $produkId): JsonResponse
    {
        Favorit::where('user_id', $request->user()->id)->where('produk_id', $produkId)->delete();

        return response()->json(['success' => true, 'message' => 'Dihapus dari favorit', 'data' => null]);
    }
}
