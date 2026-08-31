<?php

namespace App\Http\Controllers\Marketplace;

use App\Http\Controllers\Concerns\SortsReview;
use App\Http\Controllers\Controller;
use App\Models\Toko;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TokoController extends Controller
{
    use SortsReview;

    /**
     * List toko publik - hanya yang aktif & sudah approved (belum
     * approved/nonaktif tidak boleh muncul di marketplace publik).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Toko::query()
            ->where('status_aktif', true)
            ->where('status_verifikasi', 'approved')
            ->with('kategoriToko')
            // Agregat dipakai StoreCard.jsx (rating_rata, jumlah_review, jumlah_produk) -
            // dulu dihitung manual di frontend lewat 2 query terpisah, sekarang cukup 1
            // query lewat withCount/withAvg bawaan Eloquent.
            ->withCount(['produk as jumlah_produk' => fn ($q) => $q->where('status_aktif', true)])
            ->withCount('review as jumlah_review')
            ->withAvg('review as rating_rata', 'rating');

        if ($request->filled('kategori_toko_id')) {
            $query->where('kategori_toko_id', $request->input('kategori_toko_id'));
        }

        if ($request->filled('q')) {
            $query->where('nama_toko', 'ilike', '%'.$request->input('q').'%');
        }

        // Dipakai halaman Peta.jsx - cuma toko yang sudah isi koordinat.
        if ($request->boolean('punya_lokasi')) {
            $query->whereNotNull('lokasi_lat')->whereNotNull('lokasi_lng');
        }

        $toko = $query->orderBy('nama_toko')->paginate($request->integer('per_page', 20));

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $toko]);
    }

    public function show(string $id, Request $request): JsonResponse
    {
        $toko = Toko::with([
                'kategoriToko',
                'produk' => fn ($q) => $q->where('status_aktif', true),
                // Cuma review yang lolos moderasi (status_moderasi='tampil') yang
                // tampil ke publik - review yang disembunyikan admin tidak ikut.
                // ?sort= (terbaru/terlama/tertinggi/terendah/relevan) didukung di sini.
                'review' => fn ($q) => $this->urutanReview($request, $q->where('status_moderasi', 'tampil')->with('user:id,nama')),
            ])
            ->where('status_aktif', true)
            ->where('status_verifikasi', 'approved')
            ->find($id);

        if (! $toko) {
            return response()->json(['success' => false, 'message' => 'Toko tidak ditemukan'], 404);
        }

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $toko]);
    }

    /**
     * Tracking kunjungan sederhana (kunjungan_toko) - dipanggil frontend
     * setiap kali halaman detail toko dibuka. Tidak perlu login.
     */
    public function catatKunjungan(string $id): JsonResponse
    {
        $toko = Toko::find($id);

        if (! $toko) {
            return response()->json(['success' => false, 'message' => 'Toko tidak ditemukan'], 404);
        }

        $toko->kunjunganToko()->create([]);

        return response()->json(['success' => true, 'message' => 'OK', 'data' => null], 201);
    }
}
