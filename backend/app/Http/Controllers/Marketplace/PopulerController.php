<?php

namespace App\Http\Controllers\Marketplace;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Query langsung ke VIEW produk_populer / toko_populer (lihat migration
 * 2024_01_02_000001_create_stats_views.php) - bukan bikin ulang logic
 * agregasinya di PHP, biar hasilnya persis sama seperti perilaku
 * Supabase lama.
 */
class PopulerController extends Controller
{
    public function produk(Request $request): JsonResponse
    {
        $data = DB::table('produk_populer')->limit($request->integer('limit', 8))->get();

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $data]);
    }

    public function toko(Request $request): JsonResponse
    {
        $data = DB::table('toko_populer')->limit($request->integer('limit', 6))->get();

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $data]);
    }
}
