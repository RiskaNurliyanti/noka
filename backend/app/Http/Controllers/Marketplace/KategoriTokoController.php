<?php

namespace App\Http\Controllers\Marketplace;

use App\Http\Controllers\Controller;
use App\Models\KategoriToko;
use Illuminate\Http\JsonResponse;

<<<<<<< HEAD
// Daftar kategori toko untuk publik (dropdown filter, dll).
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
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
