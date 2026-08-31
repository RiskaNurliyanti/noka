<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Kategori;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

<<<<<<< HEAD
// Kelola (tambah/ubah/hapus) kategori produk dari sisi admin.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
class KategoriController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nama' => ['required', 'string', 'max:100'],
            'icon' => ['sometimes', 'nullable', 'string'],
        ]);

        $kategori = Kategori::create($data);

        return response()->json(['success' => true, 'message' => 'Kategori berhasil ditambahkan', 'data' => $kategori], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $kategori = Kategori::findOrFail($id);
        $data = $request->validate([
            'nama' => ['sometimes', 'string', 'max:100'],
            'icon' => ['sometimes', 'nullable', 'string'],
        ]);
        $kategori->update($data);

        return response()->json(['success' => true, 'message' => 'Kategori berhasil diperbarui', 'data' => $kategori]);
    }

    public function destroy(string $id): JsonResponse
    {
        // Produk yang masih pakai kategori ini tidak ikut terhapus -
        // kategori_id di produk otomatis jadi null (foreign key nullOnDelete
        // di migration), bukan produk-nya yang hilang.
        Kategori::findOrFail($id)->delete();

        return response()->json(['success' => true, 'message' => 'Kategori berhasil dihapus', 'data' => null]);
    }
}
