<?php

namespace App\Services;

use App\Models\Pesanan;
use App\Models\Tagihan;
use App\Models\Toko;
use Carbon\Carbon;

/**
 * Stage 21 (fitur langganan): hitung & catat tagihan bulanan toko.
 * Biaya langganan flat Rp5.000/bulan MENCAKUP 5 transaksi selesai
 * pertama - transaksi ke-6 dan seterusnya kena tambahan Rp500/transaksi.
 * Contoh (persis sesuai panduan yang diminta):
 *
 *  Transaksi | Langganan | Tambahan    | Total
 *  3         | Rp5.000   | Rp0         | Rp5.000
 *  5         | Rp5.000   | Rp0         | Rp5.000
 *  10        | Rp5.000   | 5 x Rp500   | Rp7.500
 *  20        | Rp5.000   | 15 x Rp500  | Rp12.500
 *  50        | Rp5.000   | 45 x Rp500  | Rp27.500
 *  100       | Rp5.000   | 95 x Rp500  | Rp52.500
 *
 * "Transaksi" dihitung dari pesanan berstatus SELESAI di toko itu pada
 * bulan (periode) yang dihitung - pesanan yang masih diproses atau
 * dibatalkan tidak dihitung sebagai transaksi (toko tidak dikenai biaya
 * untuk pesanan yang gagal/batal).
 */
class TagihanService
{
    public const BIAYA_LANGGANAN = 5000;

    public const GRATIS_TRANSAKSI = 5;

    public const BIAYA_PER_TRANSAKSI = 500;

    /** Hitung ulang & simpan (upsert) tagihan toko untuk 1 periode ('YYYY-MM'). */
    public static function hitungUntuk(Toko $toko, string $periode): Tagihan
    {
        [$tahun, $bulan] = explode('-', $periode);

        $jumlahTransaksi = Pesanan::where('toko_id', $toko->id)
            ->where('status', 'selesai')
            ->whereYear('created_at', (int) $tahun)
            ->whereMonth('created_at', (int) $bulan)
            ->count();

        $biayaTambahan = max(0, $jumlahTransaksi - self::GRATIS_TRANSAKSI) * self::BIAYA_PER_TRANSAKSI;
        $total = self::BIAYA_LANGGANAN + $biayaTambahan;

        return Tagihan::updateOrCreate(
            ['toko_id' => $toko->id, 'periode' => $periode],
            [
                'jumlah_transaksi' => $jumlahTransaksi,
                'biaya_langganan' => self::BIAYA_LANGGANAN,
                'biaya_tambahan' => $biayaTambahan,
                'total' => $total,
                // Jatuh tempo: 7 hari setelah bulan periode berakhir - cukup
                // longgar buat UMKM tanpa sistem pembayaran otomatis.
                'jatuh_tempo' => Carbon::createFromFormat('Y-m-d', "{$periode}-01")->endOfMonth()->addDays(7),
                'updated_at' => now(),
            ]
        );
    }

    /** Hitung ulang tagihan SEMUA toko yang sudah disetujui, untuk 1 periode. Dipakai command tagihan:generate. */
    public static function hitungSemuaToko(string $periode): int
    {
        $jumlah = 0;

        Toko::where('status_verifikasi', 'approved')->chunkById(50, function ($tokos) use ($periode, &$jumlah) {
            foreach ($tokos as $toko) {
                self::hitungUntuk($toko, $periode);
                $jumlah++;
            }
        });

        return $jumlah;
    }
}
