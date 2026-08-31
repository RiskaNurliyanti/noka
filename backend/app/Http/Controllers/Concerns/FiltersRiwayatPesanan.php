<?php

namespace App\Http\Controllers\Concerns;

use Carbon\Carbon;
use Illuminate\Http\Request;

/**
 * Stage 18: riwayat pesanan (pembeli, kurir, penjual, admin/super_admin)
 * semuanya perlu bisa difilter per bulan/minggu/hari, plus pencarian bebas
 * - trait ini menyatukan logikanya supaya konsisten di semua controller,
 * bukan disalin-tempel beda-beda di tiap tempat.
 */
trait FiltersRiwayatPesanan
{
    /**
     * Filter periode. Prioritas kalau lebih dari satu parameter dikirim
     * (harusnya tidak terjadi dari UI, tapi dijaga di sini juga):
     * 'hari' (tanggal spesifik, format 'YYYY-MM-DD') paling spesifik,
     * lalu 'minggu' (format 'YYYY-MM-DD' = tanggal Senin awal minggu itu),
     * lalu 'bulan' (format 'YYYY-MM', sudah ada sejak Stage 17).
     */
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
