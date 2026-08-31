<?php

namespace App\Http\Controllers\Marketplace;

use App\Http\Controllers\Controller;
use App\Models\PengaturanSistem;
use Illuminate\Http\JsonResponse;

/**
 * Endpoint publik TERBATAS - cuma field yang aman dilihat siapa saja
 * (nama_web, logo, maintenance_mode). admin_whatsapp & konfigurasi TIDAK
 * diekspos di sini, itu tetap lewat /admin/pengaturan (super_admin only).
 * Dibutuhkan App.jsx untuk cek maintenance_mode tanpa perlu login.
 */
// Pengaturan sistem yang boleh dilihat publik (nama web, logo, dll).
class PengaturanController extends Controller
{
    public function show(): JsonResponse
    {
        $pengaturan = PengaturanSistem::current();

        return response()->json([
            'success' => true,
            'message' => 'OK',
            'data' => [
                'nama_web' => $pengaturan->nama_web,
                'logo' => $pengaturan->logo,
                'maintenance_mode' => $pengaturan->maintenance_mode,
            ],
        ]);
    }
}
