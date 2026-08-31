<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Stage 21: hitung ulang tagihan bulanan tiap toko - dijadwalkan tiap hari
// jam 01:00 WIB supaya angka "jumlah_transaksi" bulan berjalan selalu naik
// mengikuti transaksi yang selesai, bukan cuma dihitung sekali di awal
// bulan. CATATAN: scheduler Laravel butuh 1 baris cron di server yang
// menjalankan `php artisan schedule:run` tiap menit - lihat
// CHECKPOINT-2-CATATAN.md untuk instruksi setup-nya.
Schedule::command('tagihan:generate')->dailyAt('01:00')->timezone('Asia/Makassar');

