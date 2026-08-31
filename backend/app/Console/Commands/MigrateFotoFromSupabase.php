<?php

namespace App\Console\Commands;

use App\Models\Banner;
use App\Models\Kurir;
use App\Models\Produk;
use App\Models\Toko;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * PHASE 4b — Migrasi FOTO (bukan cuma data tabel).
 *
 * Keputusan awal Phase 2 adalah membiarkan foto lama tetap merujuk ke URL
 * Supabase Storage (aman, tidak berisiko rusak). Sesuai instruksi terbaru
 * Anda: NOKA harus BENAR-BENAR nol ketergantungan Supabase (API, backend,
 * DAN database/storage) - jadi command ini men-download tiap foto dari
 * Supabase Storage lalu upload ulang ke storage Laravel sendiri, dan
 * meng-update field URL di database supaya menunjuk ke lokasi baru.
 *
 * AMAN DIJALANKAN BERULANG: field yang URL-nya SUDAH bukan URL Supabase
 * (berarti sudah pernah dimigrasi, atau memang foto baru) otomatis di-skip.
 */
class MigrateFotoFromSupabase extends Command
{
    protected $signature = 'noka:migrate-foto-dari-supabase
                            {--dry-run : Cuma hitung berapa foto yang akan dipindah, tidak mengunduh/menulis apa pun}';

    protected $description = 'Pindahkan foto dari Supabase Storage ke storage Laravel sendiri (Phase 4b - lepas total dari Supabase)';

    private int $dipindah = 0;

    private int $gagal = 0;

    private int $dilewati = 0;

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $this->info($dryRun ? 'DRY RUN - cuma menghitung, tidak mengunduh/menulis apa pun' : 'Memulai migrasi foto dari Supabase Storage...');
        $this->newLine();

        $this->migrasiKolomTunggal(User::class, 'foto', 'profil', $dryRun);
        $this->migrasiKolomTunggal(Toko::class, 'foto_banner', 'toko/banner', $dryRun);
        $this->migrasiKolomTunggal(Toko::class, 'foto_logo', 'toko/logo', $dryRun);
        $this->migrasiKolomArray(Toko::class, 'galeri', 'toko', $dryRun);
        $this->migrasiKolomTunggal(Kurir::class, 'foto_logo', 'kurir/logo', $dryRun);
        $this->migrasiKolomTunggal(Produk::class, 'foto', 'produk', $dryRun);
        $this->migrasiKolomArray(Produk::class, 'galeri', 'produk', $dryRun);
        $this->migrasiKolomTunggal(Banner::class, 'gambar', 'banner', $dryRun);

        $this->newLine();
        $this->table(
            ['Dipindah', 'Dilewati (bukan URL Supabase)', 'Gagal diunduh'],
            [[$this->dipindah, $this->dilewati, $this->gagal]]
        );

        if ($this->gagal > 0) {
            $this->warn('Ada foto yang gagal diunduh (kemungkinan URL sudah tidak valid/dihapus dari Supabase).');
            $this->warn('Field yang gagal TIDAK diubah - URL lama tetap tersimpan, aman, tapi masih menunjuk ke Supabase.');
            $this->warn('Cek satu-satu foto yang gagal secara manual kalau perlu.');
        }

        $this->newLine();
        $this->info($dryRun
            ? 'Dry run selesai. Jalankan tanpa --dry-run untuk migrasi sungguhan.'
            : 'Migrasi foto selesai. Setelah dikonfirmasi semua foto tampil normal, project Supabase lama aman dimatikan sepenuhnya.');

        return self::SUCCESS;
    }

    private function isUrlSupabase(?string $url): bool
    {
        return $url && str_contains($url, '.supabase.co/storage/');
    }

    private function unduhDanSimpan(string $url, string $folder): ?string
    {
        try {
            $response = Http::timeout(30)->get($url);

            if (! $response->successful()) {
                $this->gagal++;

                return null;
            }

            $ekstensi = pathinfo(parse_url($url, PHP_URL_PATH), PATHINFO_EXTENSION) ?: 'jpg';
            $namaFile = Str::uuid().'.'.$ekstensi;
            $path = "public/{$folder}/{$namaFile}";

            Storage::put($path, $response->body());

            return asset(str_replace('public/', '/storage/', $path));
        } catch (\Throwable $e) {
            $this->gagal++;

            return null;
        }
    }

    private function migrasiKolomTunggal(string $modelClass, string $kolom, string $folder, bool $dryRun): void
    {
        $modelClass::whereNotNull($kolom)->chunk(100, function ($rows) use ($kolom, $folder, $dryRun) {
            foreach ($rows as $row) {
                $url = $row->{$kolom};

                if (! $this->isUrlSupabase($url)) {
                    $this->dilewati++;

                    continue;
                }

                if ($dryRun) {
                    $this->dipindah++;

                    continue;
                }

                $urlBaru = $this->unduhDanSimpan($url, $folder);

                if ($urlBaru) {
                    $row->update([$kolom => $urlBaru]);
                    $this->dipindah++;
                }
            }
        });
    }

    private function migrasiKolomArray(string $modelClass, string $kolom, string $folder, bool $dryRun): void
    {
        $modelClass::whereNotNull($kolom)->chunk(100, function ($rows) use ($kolom, $folder, $dryRun) {
            foreach ($rows as $row) {
                $daftarUrl = $row->{$kolom} ?? [];
                if (empty($daftarUrl)) {
                    continue;
                }

                $berubah = false;
                $daftarBaru = [];

                foreach ($daftarUrl as $url) {
                    if (! $this->isUrlSupabase($url)) {
                        $daftarBaru[] = $url;
                        $this->dilewati++;

                        continue;
                    }

                    if ($dryRun) {
                        $daftarBaru[] = $url;
                        $this->dipindah++;

                        continue;
                    }

                    $urlBaru = $this->unduhDanSimpan($url, $folder);
                    $daftarBaru[] = $urlBaru ?? $url; // gagal -> pertahankan URL lama, jangan hilang
                    if ($urlBaru) {
                        $berubah = true;
                        $this->dipindah++;
                    }
                }

                if ($berubah && ! $dryRun) {
                    $row->update([$kolom => $daftarBaru]);
                }
            }
        });
    }
}
