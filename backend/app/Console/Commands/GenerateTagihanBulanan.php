<?php

namespace App\Console\Commands;

use App\Models\Langganan;
use App\Services\TagihanService;
use Illuminate\Console\Command;

/**
 * Stage 21: hitung & catat tagihan bulanan tiap toko. Dijadwalkan jalan
 * otomatis tiap hari (lihat routes/console.php) supaya tagihan bulan
 * berjalan selalu up to date sampai akhir bulan (bukan cuma dihitung 1x
 * di awal bulan) - jumlah transaksi kan terus bertambah sepanjang bulan.
 */
class GenerateTagihanBulanan extends Command
{
    protected $signature = 'tagihan:generate {periode? : Format YYYY-MM, default bulan berjalan}';

    protected $description = 'Hitung & catat tagihan langganan bulanan tiap toko (Stage 21)';

    public function handle(): int
    {
        $periode = $this->argument('periode') ?? now()->format('Y-m');

        if (! preg_match('/^\d{4}-\d{2}$/', $periode)) {
            $this->error('Format periode harus YYYY-MM, mis. 2026-08');

            return self::FAILURE;
        }

        $jumlah = TagihanService::hitungSemuaToko($periode);
        $this->info("Tagihan periode {$periode} dihitung ulang untuk {$jumlah} toko.");

        // Sambil di sini, tandai juga langganan yang sudah lewat tanggal
        // berakhir sebagai 'kadaluarsa' - supaya status di dashboard toko &
        // admin akurat tanpa perlu job terpisah.
        $kadaluarsa = Langganan::where('status', 'aktif')->where('berakhir_tanggal', '<', now())->update(['status' => 'kadaluarsa']);
        if ($kadaluarsa > 0) {
            $this->info("{$kadaluarsa} langganan ditandai kadaluarsa.");
        }

        return self::SUCCESS;
    }
}
