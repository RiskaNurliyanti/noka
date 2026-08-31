<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\FiltersRiwayatPesanan;
use App\Http\Controllers\Controller;
use App\Models\Pesanan;
use App\Services\AuditLogger;
use App\Services\LaporanPesananExcel;
use App\Support\AlasanPembatalan;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PesananController extends Controller
{
    use FiltersRiwayatPesanan;

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
        $query = Pesanan::with(['item.produk', 'toko:id,nama_toko', 'kurir:id,nama_layanan', 'pembeli:id,nama']);

        if ($request->filled('toko_id')) {
            $query->where('toko_id', $request->input('toko_id'));
        }
        if ($request->filled('kurir_id')) {
            $query->where('kurir_id', $request->input('kurir_id'));
        }
        if ($request->filled('pembeli_id')) {
            $query->where('pembeli_id', $request->input('pembeli_id'));
        }
        $this->filterPeriode($request, $query);
        $this->filterCari($request, $query);

        $pesanan = $query->orderByDesc('created_at')->paginate($request->integer('per_page', 20));

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $pesanan]);
    }

    public function show(string $id): JsonResponse
    {
        $pesanan = Pesanan::with(['item.produk', 'toko', 'kurir', 'pembeli:id,nama,no_whatsapp'])->find($id);

        if (! $pesanan) {
            return response()->json(['success' => false, 'message' => 'Pesanan tidak ditemukan'], 404);
        }

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $pesanan]);
    }

    /**
     * Update status pesanan toko manapun - dipakai admin/super_admin buat
     * catat pembatalan manual dari WhatsApp atau perubahan status lain,
     * sama seperti Mitra\PesananController::updateStatus() tapi tanpa
     * batasan toko (admin boleh ubah pesanan toko manapun).
     */

    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $pesanan = Pesanan::find($id);

        if (! $pesanan) {
            return response()->json(['success' => false, 'message' => 'Pesanan tidak ditemukan'], 404);
        }

        $data = $request->validate([
            'status' => ['required', Rule::in(Pesanan::STATUS_VALID)],
            'alasan_pembatalan' => [
                Rule::requiredIf(fn () => $request->input('status') === 'dibatalkan'),
                Rule::in(AlasanPembatalan::UNTUK_ADMIN),
            ],
        ]);

        if ($data['status'] === 'dibatalkan') {
            $data['dibatalkan_oleh_role'] = $request->user()->role; // 'admin' atau 'super_admin'
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
     * Export laporan Excel - seluruh toko, atau satu toko tertentu kalau
     * 'toko_id' diisi (dipakai saat admin mau laporan terpisah per toko).
     */
    public function export(Request $request): StreamedResponse
    {
        $query = Pesanan::with(['item.produk', 'toko:id,nama_toko', 'kurir:id,nama_layanan', 'pembeli:id,nama']);

        $namaToko = 'Semua Toko';
        if ($request->filled('toko_id')) {
            $query->where('toko_id', $request->input('toko_id'));
            $toko = \App\Models\Toko::find($request->input('toko_id'));
            $namaToko = $toko?->nama_toko ?? 'Toko';
        }
        if ($request->filled('kurir_id')) {
            $query->where('kurir_id', $request->input('kurir_id'));
        }
        if ($request->filled('pembeli_id')) {
            $query->where('pembeli_id', $request->input('pembeli_id'));
        }
        $this->filterPeriode($request, $query);

        $pesananList = $query->orderBy('created_at')->get();

        $bulan = $request->input('bulan');
        $labelPeriode = $bulan ? Carbon::createFromFormat('Y-m', $bulan)->translatedFormat('F Y') : 'Semua Periode';
        $namaFile = 'Laporan-'.Str::slug($namaToko).'-'.($bulan ?: 'semua').'.xlsx';

        return LaporanPesananExcel::generate($pesananList, $namaFile, "Laporan Pesanan {$namaToko} - {$labelPeriode}");
    }
}
