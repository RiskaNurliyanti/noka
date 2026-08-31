<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KunjunganSitus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

<<<<<<< HEAD
// Statistik ringkas buat dashboard admin: total toko, kurir, pesanan, dll.
class AnalitikController extends Controller
{
    // Angka ringkas: total toko, kurir, pesanan, dst untuk kartu statistik di dashboard.
=======
class AnalitikController extends Controller
{
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
    public function ringkasan(Request $request): JsonResponse
    {
        $hari = max(1, $request->integer('hari', 30));
        $mulai = now()->subDays($hari)->startOfDay();

        $query = KunjunganSitus::where('created_at', '>=', $mulai);

        $totalKunjungan = (clone $query)->count();
        $pengunjungUnik = (clone $query)->distinct('sesi_id')->count('sesi_id');

        $halamanPopuler = (clone $query)
            ->select('halaman', DB::raw('count(*) as jumlah'))
            ->groupBy('halaman')
            ->orderByDesc('jumlah')
            ->limit(10)
            ->get();

        $perangkat = (clone $query)
            ->select('perangkat', DB::raw('count(*) as jumlah'))
            ->groupBy('perangkat')
            ->orderByDesc('jumlah')
            ->get();

        $trendHarian = (clone $query)
            ->selectRaw("to_char(created_at, 'YYYY-MM-DD') as tanggal, count(*) as jumlah, count(distinct sesi_id) as unik")
            ->groupBy('tanggal')
            ->orderBy('tanggal')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'OK',
            'data' => [
                'periode_hari' => $hari,
                'total_kunjungan' => $totalKunjungan,
                'pengunjung_unik' => $pengunjungUnik,
                'halaman_populer' => $halamanPopuler,
                'perangkat' => $perangkat,
                'trend_harian' => $trendHarian,
            ],
        ]);
    }
}
