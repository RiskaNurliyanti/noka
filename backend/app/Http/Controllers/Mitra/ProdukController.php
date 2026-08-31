<?php

namespace App\Http\Controllers\Mitra;

use App\Http\Controllers\Controller;
use App\Models\Toko;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Mitra toko cuma boleh CRUD produk di toko miliknya sendiri. Setiap method
 * cari toko dulu lewat $request->user()->toko, produk_id yang bukan milik
 * toko itu selalu dianggap "tidak ditemukan" (404), bukan 403 - supaya
 * tidak membocorkan bahwa produk itu ada tapi milik toko lain.
 */
class ProdukController extends Controller
{
    private function tokoMilikUser(Request $request): ?Toko
    {
        return $request->user()->toko()->first();
    }

    public function index(Request $request): JsonResponse
    {
        $toko = $this->tokoMilikUser($request);

        if (! $toko) {
            return response()->json(['success' => false, 'message' => 'Kamu belum punya toko'], 404);
        }

        $produk = $toko->produk()->with('kategori')->orderByDesc('created_at')->get();

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $produk]);
    }

    public function store(Request $request): JsonResponse
    {
        $toko = $this->tokoMilikUser($request);

        if (! $toko) {
            return response()->json(['success' => false, 'message' => 'Kamu belum punya toko'], 404);
        }

        $data = $request->validate([
            'nama' => ['required', 'string', 'max:150'],
            'deskripsi' => ['nullable', 'string'],
            'harga' => ['required', 'numeric', 'min:0'],
            'harga_diskon' => ['nullable', 'numeric', 'min:0', 'lt:harga'],
            'kategori_id' => ['nullable', 'uuid', 'exists:kategori,id'],
            'foto' => ['sometimes', 'nullable', 'string'],
            'galeri' => ['nullable', 'array'],
        ]);

        $produk = $toko->produk()->create($data);

        return response()->json(['success' => true, 'message' => 'Produk berhasil ditambahkan', 'data' => $produk], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $toko = $this->tokoMilikUser($request);

        if (! $toko) {
            return response()->json(['success' => false, 'message' => 'Kamu belum punya toko'], 404);
        }

        $produk = $toko->produk()->find($id);

        if (! $produk) {
            return response()->json(['success' => false, 'message' => 'Produk tidak ditemukan'], 404);
        }

        $data = $request->validate([
            'nama' => ['sometimes', 'string', 'max:150'],
            'deskripsi' => ['nullable', 'string'],
            'harga' => ['sometimes', 'numeric', 'min:0'],
            'harga_diskon' => ['nullable', 'numeric', 'min:0', 'lt:harga'],
            'kategori_id' => ['nullable', 'uuid', 'exists:kategori,id'],
            'foto' => ['sometimes', 'nullable', 'string'],
            'galeri' => ['nullable', 'array'],
            'status_aktif' => ['sometimes', 'boolean'],
        ]);

        $produk->update($data);

        return response()->json(['success' => true, 'message' => 'Produk berhasil diperbarui', 'data' => $produk]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $toko = $this->tokoMilikUser($request);

        if (! $toko) {
            return response()->json(['success' => false, 'message' => 'Kamu belum punya toko'], 404);
        }

        $produk = $toko->produk()->find($id);

        if (! $produk) {
            return response()->json(['success' => false, 'message' => 'Produk tidak ditemukan'], 404);
        }

        $produk->delete();

        return response()->json(['success' => true, 'message' => 'Produk berhasil dihapus', 'data' => null]);
    }
}
