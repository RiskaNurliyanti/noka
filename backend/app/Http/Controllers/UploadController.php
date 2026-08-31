<?php

namespace App\Http\Controllers;

use App\Services\ImageOptimizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Menggantikan src/lib/storage.js (upload ke Supabase Storage bucket
 * noka-foto). Foto lama TETAP di Supabase (URL utuh di DB, tidak disentuh)
 * - ini cuma untuk upload BARU setelah frontend migrasi ke Laravel API.
 */
// Upload file (foto produk, toko, dll) ke storage.
class UploadController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'image', 'max:5120'], // max 5MB
            // Nilai ini harus sinkron dengan semua folder yang dipakai
            // src/lib/storage.js di frontend (uploadFoto/uploadGaleri).
            // toko/banner & toko/logo dipakai KelolaToko.jsx (admin) - beda
            // dari 'toko' polos yang dipakai DashboardToko.jsx (mitra).
            'folder' => ['required', 'string', 'in:produk,toko,toko/banner,toko/logo,kurir,kurir/logo,profil,laporan'],
        ]);

        $folder = str_replace('/', '-', $request->input('folder')); // "kurir/logo" -> subfolder aman
        $filename = Str::uuid().'.'.$request->file('file')->extension();

        // PENTING: disk harus eksplisit 'public'. Sebelumnya tanpa argumen
        // disk, storeAs() memakai FILESYSTEM_DISK default (.env = "local"),
        // yang root-nya storage/app/private - BUKAN storage/app/public
        // tempat symlink public/storage menunjuk. Akibatnya file tersimpan
        // tapi URL publiknya selalu 404 (broken image) walau upload "berhasil".
        $path = $request->file('file')->storeAs($folder, $filename, 'public');

        ImageOptimizer::optimize(Storage::disk('public')->path($path));

        // PENTING: path yang disimpan pakai prefix "/media/" (BUKAN
        // "/storage/") dan RELATIF (bukan URL absolut lewat asset()).
        //
        // Kenapa relatif: APP_URL di .env backend gampang tidak sinkron
        // dengan alamat backend yang SUNGGUHAN dipakai browser buat akses
        // (khususnya di local dev) - kalau itu terjadi, URL yang KE-SIMPAN
        // DI DATABASE bakal permanen menunjuk ke domain yang salah. Dengan
        // path relatif, frontend (yang PASTI tahu alamat backend yang
        // benar lewat VITE_API_URL) yang menggabungkannya jadi URL utuh
        // saat menampilkan (lihat SafeImage.jsx).
        //
        // Kenapa "/media/" bukan "/storage/": lihat komentar route
        // '/media/{path}' di routes/web.php - intinya supaya request foto
        // SELALU ditangani Laravel sendiri (baca file langsung dari disk),
        // tidak pernah "ketiban" symlink public/storage yang di beberapa
        // environment (terutama Windows tanpa Developer Mode aktif) gagal
        // dibaca dan malah balikin 403 Forbidden walau filenya ada.
        $url = '/media/'.$path;

        return response()->json([
            'success' => true,
            'message' => 'Upload berhasil',
            'data' => ['url' => $url],
        ], 201);
    }
}
