<?php

namespace App\Http\Controllers\Concerns;

use Carbon\Carbon;
use Illuminate\Http\Request;

<<<<<<< HEAD
// Filter riwayat pesanan berdasarkan periode (bulan/minggu/hari) dan kata kunci pencarian.
trait FiltersRiwayatPesanan
{

    // Filter query berdasarkan periode: hari/minggu/bulan tertentu.
=======
trait FiltersRiwayatPesanan
{

>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
    protected function filterPeriode(Request $request, $query)
    {
        if ($request->filled('hari')) {
            $query->whereRaw("to_char(created_at, 'YYYY-MM-DD') = ?", [$request->input('hari')]);
        } elseif ($request->filled('minggu')) {
            $mulai = Carbon::parse($request->input('minggu'))->startOfDay();
            $selesai = (clone $mulai)->addDays(6)->endOfDay();
            $query->whereBetween('created_at', [$mulai, $selesai]);
        } elseif ($request->filled('bulan')) {
            $query->whereRaw("to_char(created_at, 'YYYY-MM') = ?", [$request->input('bulan')]);
        }

        return $query;
    }

    /**
     * Pencarian bebas: nama pembeli (login/guest), nama toko, nama layanan
     * kurir, atau nama produk di dalam pesanan.
     */
    protected function filterCariPesanan(Request $request, $query)
    {
        if ($request->filled('q')) {
            $kata = $request->input('q');
            $query->where(function ($q) use ($kata) {
                $q->where('guest_nama', 'ilike', "%{$kata}%")
                    ->orWhereHas('pembeli', fn ($p) => $p->where('nama', 'ilike', "%{$kata}%"))
                    ->orWhereHas('toko', fn ($p) => $p->where('nama_toko', 'ilike', "%{$kata}%"))
                    ->orWhereHas('kurir', fn ($p) => $p->where('nama_layanan', 'ilike', "%{$kata}%"))
                    ->orWhereHas('item.produk', fn ($p) => $p->where('nama', 'ilike', "%{$kata}%"));
            });
        }

        return $query;
    }
}
