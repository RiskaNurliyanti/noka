<?php

namespace App\Http\Controllers\Marketplace;

use App\Http\Controllers\Controller;
use App\Models\KategoriToko;
use Illuminate\Http\JsonResponse;

class KategoriTokoController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'OK',
            'data' => KategoriToko::orderBy('nama')->get(),
        ]);
    }
}
