<?php

namespace App\Http\Controllers\Marketplace;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use Illuminate\Http\JsonResponse;

// Daftar banner promosi untuk ditampilkan di halaman utama (publik).
class BannerController extends Controller
{
    public function index(): JsonResponse
    {
        $banner = Banner::where('status_aktif', true)->orderBy('urutan')->get();

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $banner]);
    }
}
