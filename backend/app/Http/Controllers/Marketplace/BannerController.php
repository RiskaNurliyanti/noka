<?php

namespace App\Http\Controllers\Marketplace;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use Illuminate\Http\JsonResponse;

<<<<<<< HEAD
// Daftar banner promosi untuk ditampilkan di halaman utama (publik).
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
class BannerController extends Controller
{
    public function index(): JsonResponse
    {
        $banner = Banner::where('status_aktif', true)->orderBy('urutan')->get();

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $banner]);
    }
}
