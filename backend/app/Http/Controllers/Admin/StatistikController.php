<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Query langsung ke VIEW statistik_global / produk_terlaris (lihat migration
 * 2024_01_02_000001_create_stats_views.php) - 2 VIEW terakhir dari 4 yang
 * sempat ditunda sejak audit Phase 1, dibuka sekarang untuk dashboard admin.
 *
 * Stage 21 poin 3: admin BIASA (bukan super_admin) tidak boleh lihat data
 * PENJUALAN toko (total pendapatan/omset dalam rupiah) - cuma metrik
 * operasional (jumlah toko, jumlah pesanan, dst). super_admin tetap lihat
 * semuanya. Ini beda dari langganan/tagihan (Admin\LanggananController) -
 * itu soal toko BAYAR ke NOKA, bukan toko JUALAN ke pelanggan.
 */
class StatistikController extends Controller
{
    public function global(Request $request): JsonResponse
    {
        $stat = (array) DB::table('statistik_global')->first();

        if ($request->user()->role !== 'super_admin') {
            unset($stat['total_pendapatan']);
        }

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $stat]);
    }

    public function produkTerlaris(Request $request): JsonResponse
    {
        $data = DB::table('produk_terlaris')->limit($request->integer('limit', 5))->get();

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $data]);
    }

    public function penjualanHarian(Request $request): JsonResponse
    {
        $data = DB::table('penjualan_harian')->limit($request->integer('limit', 30))->get();

        if ($request->user()->role !== 'super_admin') {
            $data = $data->map(function ($row) {
                unset($row->total_pendapatan);

                return $row;
            });
        }

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $data]);
    }
}

