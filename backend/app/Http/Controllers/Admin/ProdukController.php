<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Produk;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

// Kelola produk dari sisi admin (moderasi lintas toko).
class ProdukController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Produk::with(['toko:id,nama_toko', 'kategori']);

        if ($request->filled('toko_id')) {
            $query->where('toko_id', $request->input('toko_id'));
        }

        if ($request->filled('q')) {
            $query->where('nama', 'ilike', '%'.$request->input('q').'%');
        }

        $produk = $query->orderByDesc('created_at')->paginate($request->integer('per_page', 20));

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $produk]);
    }

    /**
     * Admin/super_admin bisa tambah produk buat toko MANA PUN - berguna
     * terutama buat toko yang belum diklaim pemiliknya (belum ada mitra
     * yang bisa input produk sendiri).
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'toko_id' => ['required', 'uuid', 'exists:toko,id'],
            'nama' => ['required', 'string', 'max:150'],
            'deskripsi' => ['nullable', 'string'],
            'harga' => ['required', 'numeric', 'min:0'],
            'harga_diskon' => ['nullable', 'numeric', 'min:0', 'lt:harga'],
            'kategori_id' => ['nullable', 'uuid', 'exists:kategori,id'],
            'foto' => ['sometimes', 'nullable', 'string'],
            'galeri' => ['nullable', 'array'],
        ]);

        $produk = Produk::create($data);

        return response()->json(['success' => true, 'message' => 'Produk berhasil ditambahkan', 'data' => $produk], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $produk = Produk::findOrFail($id);

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

    public function destroy(string $id): JsonResponse
    {
        Produk::findOrFail($id)->delete();

        return response()->json(['success' => true, 'message' => 'Produk berhasil dihapus', 'data' => null]);
    }
}
