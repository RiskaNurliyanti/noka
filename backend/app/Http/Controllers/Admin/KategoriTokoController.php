<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KategoriToko;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KategoriTokoController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nama' => ['required', 'string', 'max:100'],
            'icon' => ['sometimes', 'nullable', 'string'],
        ]);

        $kategori = KategoriToko::create($data);

        return response()->json(['success' => true, 'message' => 'Kategori toko berhasil ditambahkan', 'data' => $kategori], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $kategori = KategoriToko::findOrFail($id);
        $data = $request->validate([
            'nama' => ['sometimes', 'string', 'max:100'],
            'icon' => ['sometimes', 'nullable', 'string'],
        ]);
        $kategori->update($data);

        return response()->json(['success' => true, 'message' => 'Kategori toko berhasil diperbarui', 'data' => $kategori]);
    }

    public function destroy(string $id): JsonResponse
    {
        KategoriToko::findOrFail($id)->delete();

        return response()->json(['success' => true, 'message' => 'Kategori toko berhasil dihapus', 'data' => null]);
    }
}
