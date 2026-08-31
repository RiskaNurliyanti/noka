<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class BackfillSupabase extends Command
{
    protected $signature = 'supabase:backfill
        {--tabel= : Backfill tabel tertentu saja, pisah koma kalau lebih dari 1, mis. --tabel=users,toko}
        {--chunk=200 : Jumlah baris per batch}';

    protected $description = 'Salin SEMUA data yang sudah ada di Neon ke Supabase (setup awal dual-write)';

    private const URUTAN_TABEL = [
        'users', 'kategori', 'kategori_toko', 'toko', 'kurir', 'produk',
        'favorit', 'keranjang', 'review_produk', 'review_toko', 'review_kurir',
        'kunjungan_toko', 'banner', 'pengaturan_sistem', 'log_aktivitas', 'kunjungan_situs',
        'pesanan', 'pesanan_item', 'klaim_mitra', 'laporan_pengguna',
        'audit_log_pesanan', 'langganan', 'tagihan',
    ];

    public function handle(): int
    {
        if (! config('database.connections.pgsql_legacy.host')) {
            $this->error('DB_LEGACY_HOST belum diisi di .env - isi dulu kredensial Supabase sebelum backfill. Lihat SETUP-DARI-AWAL.md.');

            return self::FAILURE;
        }

        try {
            DB::connection('pgsql_legacy')->getPdo();
        } catch (\Throwable $e) {
            $this->error('Gagal konek ke Supabase: '.$e->getMessage());

            return self::FAILURE;
        }

        $pilihan = $this->option('tabel');
        $daftarTabel = $pilihan ? array_map('trim', explode(',', $pilihan)) : self::URUTAN_TABEL;
        $ukuranChunk = max(1, (int) $this->option('chunk'));

        foreach ($daftarTabel as $tabel) {
            $this->backfillTabel($tabel, $ukuranChunk);
        }

        $this->newLine();
        $this->info('Backfill selesai.');

        return self::SUCCESS;
    }

    private function backfillTabel(string $tabel, int $ukuranChunk): void
    {
        if (! DB::getSchemaBuilder()->hasTable($tabel)) {
            $this->warn("Lewati '{$tabel}' - tabel tidak ada di Neon.");

            return;
        }

        if (! DB::connection('pgsql_legacy')->getSchemaBuilder()->hasTable($tabel)) {
            $this->warn("Lewati '{$tabel}' - tabel belum ada di Supabase. Jalankan SUPABASE-SCHEMA-LENGKAP.sql dulu.");

            return;
        }

        $total = DB::table($tabel)->count();

        if ($total === 0) {
            $this->line("{$tabel}: kosong, dilewati.");

            return;
        }

        $bar = $this->output->createProgressBar($total);
        $bar->setMessage($tabel);
        $bar->start();

        $disalin = 0;
        $gagal = 0;

        DB::table($tabel)->orderBy('id')->chunk($ukuranChunk, function ($baris) use ($tabel, &$disalin, &$gagal, $bar) {
            $data = $baris->map(fn ($b) => (array) $b)->all();

            if (empty($data)) {
                return;
            }

            try {
                DB::connection('pgsql_legacy')->table($tabel)->upsert($data, ['id'], array_keys($data[0]));
                $disalin += count($data);
            } catch (\Throwable $e) {
                $gagal += count($data);
                $this->newLine();
                $this->warn("  Sebagian baris '{$tabel}' gagal disalin: ".$e->getMessage());
            }

            $bar->advance(count($data));
        });

        $bar->finish();
        $this->newLine();
        $pesan = "{$tabel}: {$disalin}/{$total} baris disalin.";
        if ($gagal > 0) {
            $pesan .= " ({$gagal} gagal - lihat pesan di atas)";
        }
        $this->info($pesan);
    }
}
