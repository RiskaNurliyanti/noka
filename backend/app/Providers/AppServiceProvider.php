<?php

namespace App\Providers;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Password::defaults(function () {
            return Password::min(8)->letters()->numbers();
        });

        $this->pastikanStorageLinkAda();
    }

    /**
     * Perbaikan otomatis untuk penyebab paling umum "foto sama sekali
     * tidak muncul di mana pun" - symlink public/storage -> storage/app/public
     * belum dibuat di server (harusnya lewat `php artisan storage:link`
     * saat setup, tapi gampang kelewat kalau deploy tanpa akses terminal
     * penuh, mis. lewat cPanel/hosting panel). Tanpa symlink ini, SEMUA
     * URL foto (produk/toko/kurir/profil) akan selalu 404 walau upload-nya
     * sendiri berhasil tersimpan di disk.
     *
     * Pengecekan file_exists/is_link ini SANGAT murah (cuma stat sistem
     * file), jadi aman dijalankan di boot() tiap request - Artisan::call
     * yang lebih berat HANYA dipanggil sekali saat symlink memang belum
     * ada, sesudah itu pengecekan berikutnya langsung lolos tanpa aksi.
     */
    private function pastikanStorageLinkAda(): void
    {
        $target = public_path('storage');

        if (file_exists($target) || is_link($target)) {
            return;
        }

        try {
            Artisan::call('storage:link');
            Log::info('Symlink public/storage berhasil dibuat otomatis saat boot aplikasi.');
        } catch (\Throwable $e) {
            // Gagal-senyap - kalau memang tidak bisa (mis. permission
            // filesystem dibatasi hosting), jangan sampai bikin SELURUH
            // aplikasi down cuma karena ini. Tetap tercatat di log untuk
            // ditindaklanjuti manual kalau perlu.
            Log::warning('Gagal membuat symlink public/storage otomatis: '.$e->getMessage());
        }
    }
}
