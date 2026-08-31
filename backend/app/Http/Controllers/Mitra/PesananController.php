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

/**
 * Laporan pesanan & update status untuk PENJUAL (Stage 17). SELALU
 * dibatasi ke toko milik user yang login lewat $toko->pesanan() - penjual
 * tidak pernah bisa lihat/ubah pesanan toko lain sama sekali, bahkan
 * dengan menebak-nebak ID pesanan (selalu 404, bukan 403, supaya tidak
 * membocorkan pesanan itu ada tapi milik toko lain).
 */
class PesananController extends Controller
{
    use FiltersRiwayatPesanan;

    private function tokoMilikUser(Request $request): ?Toko
    {
        return $request->user()->toko()->first();
    }

    /**
     * Search bebas (Stage 13.5) - nama pembeli (baik user login maupun
     * guest) atau nama produk di dalam pesanan.
     */
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

        // Filter 'bulan' opsional (Stage 17) - PesananMasuk.jsx (dashboard
        // pesanan masuk) tidak mengirim parameter ini jadi perilakunya
        // untuk halaman itu tidak berubah sama sekali.
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

    /**
     * Update status pesanan - dipakai penjual buat catat pembatalan manual
     * dari WhatsApp (atau update status lain sesuai siklus yang tersedia,
     * termasuk menandai pesanan selesai). TIDAK ada sistem pembatalan
     * WhatsApp baru di sini - ini murni pencatatan status yang terjadi di
     * luar sistem.
     *
     * Stage 18: kalau status di-set 'dibatalkan', WAJIB sertakan
     * alasan_pembatalan dari AlasanPembatalan::UNTUK_TOKO (toko tutup /
     * stok tidak tersedia) - toko tidak boleh pakai alasan milik peran
     * lain (mis. "kurir libur").
     */
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

    /**
     * Export laporan Excel toko sendiri (Stage 17). Kolom lengkap: tanggal
     * penjualan, ID pesanan, toko, pembeli, nama produk, jumlah, harga
     * satuan, subtotal, total pesanan, status, kurir - lihat
     * LaporanPesananExcel untuk detail formatnya.
     */
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
