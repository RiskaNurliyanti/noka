<?php

namespace App\Http\Controllers\Marketplace;

use App\Http\Controllers\Concerns\SortsReview;
use App\Http\Controllers\Controller;
use App\Models\Produk;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

<<<<<<< HEAD
// Direktori produk untuk publik: daftar dan detail satu produk.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
class ProdukController extends Controller
{
    use SortsReview;

    public function index(Request $request): JsonResponse
    {
        $query = Produk::query()
            ->where('status_aktif', true)
            ->whereHas('toko', fn ($q) => $q->where('status_aktif', true)->where('status_verifikasi', 'approved'))
            ->with(['toko:id,nama_toko,foto_logo,kecamatan,desa', 'kategori']);

        if ($request->filled('kategori_id')) {
            $query->where('kategori_id', $request->input('kategori_id'));
        }

        if ($request->filled('toko_id')) {
            $query->where('toko_id', $request->input('toko_id'));
        }

        // Dipakai Peta.jsx - ambil produk dari banyak toko sekaligus dalam
        // satu request (bukan N request per toko).
        if ($request->filled('toko_ids')) {
            $ids = array_filter(explode(',', $request->input('toko_ids')));
            $query->whereIn('toko_id', $ids);
        }

        if ($request->filled('q')) {
            $query->where('nama', 'ilike', '%'.$request->input('q').'%');
        }

        // Dipakai halaman Home ("Lagi Diskon") - produk yang harga_diskon-nya
        // diisi DAN lebih murah dari harga normal (bukan sekadar kolom terisi).
        if ($request->boolean('diskon')) {
            $query->whereNotNull('harga_diskon')->whereColumn('harga_diskon', '<', 'harga');
        }

        $produk = $query->orderByDesc('created_at')->paginate($request->integer('per_page', 20));

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $produk]);
    }

    public function show(string $id, Request $request): JsonResponse
    {
        $produk = Produk::with([
            'toko',
            'kategori',
            'review' => fn ($q) => $this->urutanReview($request, $q->where('status_moderasi', 'tampil')->with('user:id,nama,foto')),
        ])
            ->where('status_aktif', true)
            ->find($id);

        if (! $produk) {
            return response()->json(['success' => false, 'message' => 'Produk tidak ditemukan'], 404);
        }

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $produk]);
    }
}
