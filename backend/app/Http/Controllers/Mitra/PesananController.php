<?php

namespace App\Http\Controllers\Mitra;

use App\Http\Controllers\Concerns\FiltersRiwayatPesanan;
use App\Http\Controllers\Controller;
use App\Models\Pesanan;
use App\Models\Toko;
use App\Services\AuditLogger;
use App\Services\LaporanPesananExcel;
use App\Support\AlasanPembatalan;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

<<<<<<< HEAD
// Kelola pesanan masuk milik toko sendiri: lihat, ubah status, export laporan.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
class PesananController extends Controller
{
    use FiltersRiwayatPesanan;

<<<<<<< HEAD
    // Ambil toko milik user yang sedang login (jaga-jaga kalau belum/tidak punya toko).
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
    private function tokoMilikUser(Request $request): ?Toko
    {
        return $request->user()->toko()->first();
    }

<<<<<<< HEAD
    // Filter pesanan berdasarkan kata kunci pencarian.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
    private function filterCari(Request $request, $query)
    {
        if ($request->filled('q')) {
            $kata = $request->input('q');
            $query->where(function ($q) use ($kata) {
                $q->where('guest_nama', 'ilike', "%{$kata}%")
                    ->orWhereHas('pembeli', fn ($p) => $p->where('nama', 'ilike', "%{$kata}%"))
                    ->orWhereHas('item.produk', fn ($p) => $p->where('nama', 'ilike', "%{$kata}%"));
            });
        }

        return $query;
    }

    public function index(Request $request): JsonResponse
    {
        $toko = $this->tokoMilikUser($request);

        if (! $toko) {
            return response()->json(['success' => false, 'message' => 'Kamu belum punya toko'], 404);
        }

        $query = $toko->pesanan()->with(['item.produk', 'pembeli:id,nama,no_whatsapp', 'kurir']);
        $this->filterPeriode($request, $query);
        $this->filterCari($request, $query);

        $pesanan = $query->orderByDesc('created_at')->paginate($request->integer('per_page', 20));

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $pesanan]);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $toko = $this->tokoMilikUser($request);

        if (! $toko) {
            return response()->json(['success' => false, 'message' => 'Kamu belum punya toko'], 404);
        }

        $pesanan = $toko->pesanan()->with(['item.produk', 'kurir', 'pembeli:id,nama,no_whatsapp'])->find($id);

        if (! $pesanan) {
            return response()->json(['success' => false, 'message' => 'Pesanan tidak ditemukan'], 404);
        }

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $pesanan]);
    }

<<<<<<< HEAD
    // Ubah status pesanan toko sendiri (gak bisa 'selesai' kalau diantar kurir, dst).
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $toko = $this->tokoMilikUser($request);

        if (! $toko) {
            return response()->json(['success' => false, 'message' => 'Kamu belum punya toko'], 404);
        }

        $pesanan = $toko->pesanan()->find($id);

        if (! $pesanan) {
            return response()->json(['success' => false, 'message' => 'Pesanan tidak ditemukan'], 404);
        }

        $data = $request->validate([
            'status' => ['required', Rule::in(Pesanan::STATUS_VALID)],
            'alasan_pembatalan' => [
                Rule::requiredIf(fn () => $request->input('status') === 'dibatalkan'),
                Rule::in(AlasanPembatalan::UNTUK_TOKO),
            ],
        ]);

        if ($data['status'] === 'selesai' && $pesanan->kurir_id !== null) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan ini diantar kurir - hanya kurir, pembeli, atau admin yang bisa menandai pesanan selesai (supaya statusnya benar-benar mencerminkan barang sudah sampai). Kamu tetap bisa ubah status ke "Diproses" kalau pesanan sedang disiapkan.',
            ], 422);
        }

        if ($data['status'] === 'dibatalkan') {
            $data['dibatalkan_oleh_role'] = 'penjual';
        } else {
            $data['alasan_pembatalan'] = null;
            $data['dibatalkan_oleh_role'] = null;
        }

        $sebelum = $pesanan->only(['status', 'alasan_pembatalan', 'dibatalkan_oleh_role']);
        $pesanan->update($data);
        AuditLogger::catatPesanan($pesanan, $request->user(), $data['status'], $sebelum, $pesanan->only(['status', 'alasan_pembatalan', 'dibatalkan_oleh_role']), $request);

        return response()->json(['success' => true, 'message' => 'Status pesanan diperbarui', 'data' => $pesanan]);
    }

<<<<<<< HEAD
    // Export daftar pesanan toko sendiri ke Excel.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
    public function export(Request $request): StreamedResponse|JsonResponse
    {
        $toko = $this->tokoMilikUser($request);

        if (! $toko) {
            return response()->json(['success' => false, 'message' => 'Kamu belum punya toko'], 404);
        }

        $query = $toko->pesanan()->with(['item.produk', 'toko:id,nama_toko', 'kurir:id,nama_layanan', 'pembeli:id,nama']);
        $this->filterPeriode($request, $query);
        $pesananList = $query->orderBy('created_at')->get();

        $bulan = $request->input('bulan');
        $labelPeriode = $bulan ? Carbon::createFromFormat('Y-m', $bulan)->translatedFormat('F Y') : 'Semua Periode';
        $namaFile = 'Laporan-'.Str::slug($toko->nama_toko).'-'.($bulan ?: 'semua').'.xlsx';

        return LaporanPesananExcel::generate($pesananList, $namaFile, "Laporan Pesanan {$toko->nama_toko} - {$labelPeriode}");
    }
}
