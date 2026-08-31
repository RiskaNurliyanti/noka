<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ReviewKurir;
use App\Models\ReviewProduk;
use App\Models\ReviewToko;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

<<<<<<< HEAD
// Moderasi review produk/toko/kurir - admin bisa sembunyikan atau hapus review.
class ReviewController extends Controller
{
    // Petakan jenis review ('produk'/'toko'/'kurir') ke Model class-nya.
=======
class ReviewController extends Controller
{
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
    private function modelFor(string $jenis): string
    {
        return match ($jenis) {
            'produk' => ReviewProduk::class,
            'toko' => ReviewToko::class,
            'kurir' => ReviewKurir::class,
        };
    }

    public function index(Request $request): JsonResponse
    {
        $jenis = $request->validate(['jenis' => ['required', Rule::in(['produk', 'toko', 'kurir'])]])['jenis'];
        $model = $this->modelFor($jenis);

        $review = $model::with('user:id,nama')->orderByDesc('created_at')->paginate($request->integer('per_page', 20));

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $review]);
    }

<<<<<<< HEAD
    // Sembunyikan/tampilkan lagi sebuah review (moderasi).
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'jenis' => ['required', Rule::in(['produk', 'toko', 'kurir'])],
            'status_moderasi' => ['required', Rule::in(['tampil', 'disembunyikan'])],
        ]);

        $model = $this->modelFor($data['jenis']);
        $review = $model::findOrFail($id);
        $review->update(['status_moderasi' => $data['status_moderasi']]);

        return response()->json(['success' => true, 'message' => 'Status moderasi diperbarui', 'data' => $review]);
    }

<<<<<<< HEAD
    // Hapus permanen sebuah review.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
    public function destroy(Request $request, string $id): JsonResponse
    {
        $jenis = $request->validate(['jenis' => ['required', Rule::in(['produk', 'toko', 'kurir'])]])['jenis'];
        $model = $this->modelFor($jenis);

        $model::findOrFail($id)->delete();

        return response()->json(['success' => true, 'message' => 'Review berhasil dihapus', 'data' => null]);
    }
}
