<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

// Statistik marketplace: produk terlaris, penjualan harian, dll.
class StatistikController extends Controller
{
    // Statistik keseluruhan marketplace (total pesanan, pendapatan, dll).
    public function global(Request $request): JsonResponse
    {
        $stat = (array) DB::table('statistik_global')->first();

        if ($request->user()->role !== 'super_admin') {
            unset($stat['total_pendapatan']);
        }

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $stat]);
    }

    // Daftar produk dengan penjualan terbanyak.
    public function produkTerlaris(Request $request): JsonResponse
    {
        $data = DB::table('produk_terlaris')->limit($request->integer('limit', 5))->get();

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $data]);
    }

    // Data penjualan per hari, buat grafik tren.
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

