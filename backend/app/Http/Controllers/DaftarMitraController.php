<?php

namespace App\Http\Controllers;

use App\Models\Kurir;
use App\Models\Toko;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Pendaftaran mitra BARU - beda dari KlaimController (yang mengklaim
 * toko/kurir yang SUDAH ADA tanpa pemilik). Di sini user bikin toko/kurir
 * BARU dengan user_id langsung diisi ke dirinya sendiri, status_verifikasi
 * mulai dari 'pending'.
 *
 * PENTING: role user TIDAK diubah di sini, tetap 'pembeli' sampai admin
 * approve verifikasi DAN mengubah role secara manual lewat Kelola Pengguna.
 * Ini konsisten dengan instruksi "Pembeli tidak boleh berubah role hanya
 * karena operasi UI biasa" - insert toko/kurir bukan alasan otomatis buat
 * naik role.
 */
// Form pendaftaran jadi mitra toko atau mitra kurir baru.
class DaftarMitraController extends Controller
{
    // Ajukan pendaftaran jadi mitra toko baru.
    public function storeToko(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nama_toko' => ['required', 'string', 'max:150'],
            'no_whatsapp' => ['required', 'string', 'max:20'],
            'kategori_toko_id' => ['nullable', 'uuid', 'exists:kategori_toko,id'],
            'deskripsi' => ['nullable', 'string'],
            'alamat' => ['nullable', 'string'],
        ]);

        $toko = Toko::create([
            ...$data,
            'user_id' => $request->user()->id,
            'status_verifikasi' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengajuan toko terkirim, menunggu verifikasi admin',
            'data' => $toko,
        ], 201);
    }

    // Ajukan pendaftaran jadi mitra kurir baru.
    public function storeKurir(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nama_layanan' => ['required', 'string', 'max:150'],
            'no_whatsapp' => ['required', 'string', 'max:20'],
            'kendaraan' => ['nullable', 'string'],
            'area_layanan' => ['nullable', 'string'],
        ]);

        $kurir = Kurir::create([
            ...$data,
            'user_id' => $request->user()->id,
            'status_verifikasi' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengajuan kurir terkirim, menunggu verifikasi admin',
            'data' => $kurir,
        ], 201);
    }
}
