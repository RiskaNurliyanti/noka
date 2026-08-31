<?php

namespace App\Http\Controllers;

use App\Models\Kurir;
use App\Models\Pesanan;
use App\Models\Produk;
use App\Models\ReviewKurir;
use App\Models\ReviewProduk;
use App\Models\ReviewToko;
use App\Models\Toko;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Satu controller menangani 3 tabel review terpisah (produk/toko/kurir) -
 * bukan digabung jadi satu tabel polymorphic, sesuai keputusan audit
 * (menghindari refactor besar tanpa alasan teknis kuat).
 *
 * Stage 2 fix: review sekarang WAJIB terikat ke pesanan (pesanan_id) yang
 * memang berisi target yang direview, dan dibatasi max 1x update. Validasi
 * dilakukan di backend (bukan cuma disembunyikan di frontend) karena API
 * tetap bisa dipanggil langsung.
 */
class ReviewController extends Controller
{
    private function rules(): array
    {
        return [
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'komentar' => ['nullable', 'string', 'max:1000'],
        ];
    }

    private function modelFor(string $jenis): string
    {
        return match ($jenis) {
            'produk' => ReviewProduk::class,
            'toko' => ReviewToko::class,
            'kurir' => ReviewKurir::class,
        };
    }

    /**
     * Ambil pesanan milik user yang sedang login & pastikan pesanan
     * tersebut memang "memenuhi syarat" untuk direview jenis+target ini,
     * yaitu pesanan itu benar-benar mengandung toko/produk/kurir tsb.
     * Return null kalau tidak valid (dipakai buat 422 di caller).
     */
    private function pesananValidUntuk(Request $request, string $jenis, string $targetId): ?Pesanan
    {
        $pesananId = $request->input('pesanan_id');
        if (! $pesananId) {
            return null;
        }

        $pesanan = Pesanan::with('item')->find($pesananId);
        if (! $pesanan || $pesanan->pembeli_id !== $request->user()->id) {
            return null;
        }

        if ($pesanan->status === 'dibatalkan') {
            return null;
        }

        $cocok = match ($jenis) {
            'toko' => $pesanan->toko_id === $targetId,
            'kurir' => $pesanan->kurir_id === $targetId,
            'produk' => $pesanan->item->contains('produk_id', $targetId),
        };

        return $cocok ? $pesanan : null;
    }

    private function simpanReview(Request $request, string $jenis, string $targetId): JsonResponse
    {
        $pesananId = $request->input('pesanan_id');
        $pesananMentah = $pesananId ? Pesanan::find($pesananId) : null;

        $pesanan = $this->pesananValidUntuk($request, $jenis, $targetId);
        if (! $pesanan) {
            // Pesan error lebih spesifik kalau memang gara-gara dibatalkan
            // (bukan disamaratakan dengan "pesanan tidak cocok").
            if ($pesananMentah && $pesananMentah->status === 'dibatalkan') {
                return response()->json([
                    'success' => false,
                    'message' => 'Pesanan yang dibatalkan tidak bisa direview.',
                ], 422);
            }

            return response()->json([
                'success' => false,
                'message' => 'Kamu hanya bisa review dari pesanan yang memang berisi produk/toko/kurir ini.',
            ], 422);
        }

        $model = $this->modelFor($jenis);
        $targetCol = $jenis === 'produk' ? 'produk_id' : ($jenis === 'toko' ? 'toko_id' : 'kurir_id');

        $sudahAda = $model::where('user_id', $request->user()->id)
            ->where('pesanan_id', $pesanan->id)
            ->where($targetCol, $targetId)
            ->exists();

        if ($sudahAda) {
            return response()->json([
                'success' => false,
                'message' => 'Kamu sudah pernah memberikan review untuk pesanan ini. Silakan update review yang sudah ada.',
            ], 422);
        }

        $data = $request->validate($this->rules());

        $review = $model::create([
            ...$data,
            'user_id' => $request->user()->id,
            'pesanan_id' => $pesanan->id,
            $targetCol => $targetId,
        ]);

        return response()->json(['success' => true, 'message' => 'Review terkirim', 'data' => $review], 201);
    }

    public function storeProduk(Request $request, string $produkId): JsonResponse
    {
        if (! Produk::find($produkId)) {
            return response()->json(['success' => false, 'message' => 'Produk tidak ditemukan'], 404);
        }

        return $this->simpanReview($request, 'produk', $produkId);
    }

    public function storeToko(Request $request, string $tokoId): JsonResponse
    {
        if (! Toko::find($tokoId)) {
            return response()->json(['success' => false, 'message' => 'Toko tidak ditemukan'], 404);
        }

        return $this->simpanReview($request, 'toko', $tokoId);
    }

    public function storeKurir(Request $request, string $kurirId): JsonResponse
    {
        if (! Kurir::find($kurirId)) {
            return response()->json(['success' => false, 'message' => 'Kurir tidak ditemukan'], 404);
        }

        return $this->simpanReview($request, 'kurir', $kurirId);
    }

    /**
     * Semua review milik user yang sedang login, dikelompokkan per jenis -
     * dipakai halaman ReviewSaya.jsx DAN PesananSaya.jsx (buat tahu item
     * mana yang sudah direview supaya tombolnya berubah jadi "Edit review").
     */
    public function riwayatSaya(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $data = [
            'produk' => ReviewProduk::with('produk:id,nama')->where('user_id', $userId)->orderByDesc('created_at')->get(),
            'toko' => ReviewToko::with('toko:id,nama_toko')->where('user_id', $userId)->orderByDesc('created_at')->get(),
            'kurir' => ReviewKurir::with('kurir:id,nama_layanan')->where('user_id', $userId)->orderByDesc('created_at')->get(),
        ];

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $data]);
    }

    /**
     * Update review - HANYA boleh oleh pemilik review itu sendiri (dicek
     * via user_id, bukan cuma disembunyikan tombolnya di frontend), DAN
     * maksimal 1x update (update_count). Percobaan update ke-2 ditolak.
     * $jenis diambil dari body/query ('produk'|'toko'|'kurir') karena
     * route-nya generik (dipakai ReviewSaya.jsx buat 3 tabel sekaligus).
     */
    public function update(Request $request, string $jenis, string $id): JsonResponse
    {
        if (! in_array($jenis, ['produk', 'toko', 'kurir'], true)) {
            return response()->json(['success' => false, 'message' => 'Jenis review tidak valid'], 422);
        }

        $model = $this->modelFor($jenis);
        $review = $model::find($id);

        if (! $review || $review->user_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Review tidak ditemukan'], 404);
        }

        if ($review->update_count >= 1) {
            return response()->json([
                'success' => false,
                'message' => 'Review ini sudah pernah diupdate 1x. Setiap review hanya boleh diupdate maksimal 1 kali.',
            ], 422);
        }

        $data = $request->validate($this->rules());
        $review->update([...$data, 'update_count' => $review->update_count + 1]);

        return response()->json(['success' => true, 'message' => 'Review diperbarui', 'data' => $review]);
    }

    public function destroy(Request $request, string $jenis, string $id): JsonResponse
    {
        if (! in_array($jenis, ['produk', 'toko', 'kurir'], true)) {
            return response()->json(['success' => false, 'message' => 'Jenis review tidak valid'], 422);
        }

        $model = $this->modelFor($jenis);
        $review = $model::find($id);

        if (! $review || $review->user_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Review tidak ditemukan'], 404);
        }

        $review->delete();

        return response()->json(['success' => true, 'message' => 'Review dihapus', 'data' => null]);
    }
}
