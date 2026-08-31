<?php

namespace App\Http\Controllers\Marketplace;

use App\Http\Controllers\Controller;
use App\Models\Kategori;
use Illuminate\Http\JsonResponse;

// Daftar kategori produk untuk publik (dropdown filter, dll).
class KategoriController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'OK',
            'data' => Kategori::orderBy('nama')->get(),
        ]);
    }
}
