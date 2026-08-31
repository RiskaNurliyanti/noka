<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Langganan;
use App\Models\Tagihan;
use App\Models\Toko;
use App\Services\TagihanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

// Kelola langganan bulanan toko: hitung tagihan, tandai lunas, perpanjang.
class LanggananController extends Controller
{
    /** Daftar semua toko + status langganan & tagihan bulan berjalan (atau bulan pilihan). */
    public function index(Request $request): JsonResponse
    {
        $periode = $request->input('bulan') ?: now()->format('Y-m');

        $query = Toko::with(['langganan', 'tagihan' => fn ($q) => $q->where('periode', $periode)])
            ->where('status_verifikasi', 'approved');

        if ($request->filled('q')) {
            $query->where('nama_toko', 'ilike', '%'.$request->input('q').'%');
        }

        $toko = $query->orderBy('nama_toko')->paginate($request->integer('per_page', 20));

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $toko, 'periode' => $periode]);
    }

    /**
     * Jumlah toko yang langganannya mau habis (<=7 hari) atau punya
     * tagihan belum dibayar - dipakai badge notifikasi lonceng admin.
     */
    public function jumlahNotifikasi(): JsonResponse
    {
        $akanHabis = Langganan::where('status', 'aktif')
            ->whereBetween('berakhir_tanggal', [now(), now()->addDays(7)])
            ->count();

        $tagihanBelumLunas = Tagihan::where('status_bayar', 'belum_dibayar')
            ->where('periode', '<', now()->format('Y-m')) // bulan yang SUDAH lewat, bukan bulan berjalan yang masih terus dihitung
            ->count();

        return response()->json(['success' => true, 'message' => 'OK', 'data' => [
            'langganan_akan_habis' => $akanHabis,
            'tagihan_belum_lunas' => $tagihanBelumLunas,
            'total' => $akanHabis + $tagihanBelumLunas,
        ]]);
    }

    /**
     * Hitung ulang tagihan 1 toko untuk periode tertentu (default bulan
     * berjalan) - dipakai kalau admin mau lihat angka terbaru tanpa nunggu
     * command tagihan:generate jalan (mis. jadwal cron belum diatur).
     */
    public function hitungTagihan(Request $request, string $tokoId): JsonResponse
    {
        $toko = Toko::findOrFail($tokoId);
        $periode = $request->input('bulan') ?: now()->format('Y-m');

        $tagihan = TagihanService::hitungUntuk($toko, $periode);

        return response()->json(['success' => true, 'message' => 'Tagihan dihitung ulang', 'data' => $tagihan]);
    }

    /**
     * Tandai tagihan lunas - dipakai admin SETELAH toko konfirmasi
     * pembayaran manual lewat WhatsApp (belum ada payment gateway).
     */
    public function tandaiLunas(Request $request, string $tagihanId): JsonResponse
    {
        $tagihan = Tagihan::findOrFail($tagihanId);
        $tagihan->update(['status_bayar' => 'lunas', 'dibayar_at' => now()]);

        return response()->json(['success' => true, 'message' => 'Tagihan ditandai lunas', 'data' => $tagihan]);
    }

    /**
     * Aktifkan/perpanjang langganan toko - dipanggil admin setelah
     * verifikasi toko baru (30 hari pertama gratis-ish/percobaan) atau
     * setelah toko membayar tagihan bulan berjalan. `hari` default 30.
     */
    public function perpanjang(Request $request, string $tokoId): JsonResponse
    {
        $toko = Toko::findOrFail($tokoId);

        $data = $request->validate([
            'hari' => ['sometimes', 'integer', 'min:1', 'max:365'],
        ]);
        $hari = $data['hari'] ?? 30;

        $langganan = Langganan::where('toko_id', $toko->id)->first();
        // Kalau masih aktif, perpanjangan MENAMBAH dari tanggal berakhir yang
        // lama (bukan dari hari ini) - supaya toko yang bayar lebih awal
        // tidak dirugikan kehilangan sisa hari yang belum terpakai.
        $mulaiHitung = ($langganan && ! $langganan->sudahKadaluarsa()) ? $langganan->berakhir_tanggal : now();
        $berakhirBaru = \Carbon\Carbon::parse($mulaiHitung)->addDays($hari);

        $langganan = Langganan::updateOrCreate(
            ['toko_id' => $toko->id],
            [
                'mulai_tanggal' => $langganan?->mulai_tanggal ?? now(),
                'berakhir_tanggal' => $berakhirBaru,
                'status' => 'aktif',
                'updated_at' => now(),
            ]
        );

        return response()->json(['success' => true, 'message' => 'Langganan toko diperpanjang', 'data' => $langganan]);
    }
}
