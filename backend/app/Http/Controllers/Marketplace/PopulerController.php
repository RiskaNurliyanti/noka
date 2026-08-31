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
<<<<<<< HEAD
// Produk dan toko paling populer, ditampilkan di halaman utama.
class PopulerController extends Controller
{
    // Produk paling banyak dilihat/dibeli, buat halaman utama.
=======
class PopulerController extends Controller
{
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
    public function produk(Request $request): JsonResponse
    {
        $data = DB::table('produk_populer')->limit($request->integer('limit', 8))->get();

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $data]);
    }

<<<<<<< HEAD
    // Toko paling banyak dikunjungi, buat halaman utama.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
    public function toko(Request $request): JsonResponse
    {
        $data = DB::table('toko_populer')->limit($request->integer('limit', 6))->get();

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $data]);
    }
}
