<?php

use Illuminate\Support\Facades\Route;

// NOKA adalah pure API backend - frontend React terpisah (bukan Blade).
// Route web ini cuma dipakai Sanctum untuk endpoint /sanctum/csrf-cookie
// (didaftarkan otomatis oleh package Sanctum, tidak perlu didefinisikan manual).
Route::get('/', function () {
    return response()->json(['message' => 'NOKA API - lihat /api/health']);
});

/**
 * Server file storage TANPA bergantung sama sekali pada symlink
 * public/storage. Normalnya Laravel serve file upload lewat symlink itu
 * (dibuat `php artisan storage:link`) - tapi symlink SERING gagal berfungsi
 * dengan benar di Windows kalau PHP tidak dijalankan sebagai Administrator
 * atau "Developer Mode" Windows belum diaktifkan: symlink-nya "berhasil
 * dibuat" tapi begitu diakses lewat php artisan serve, hasilnya 403
 * Forbidden (bukan 404) - file-nya SEBENARNYA ada, tapi builtin PHP dev
 * server tidak bisa membaca lewat symlink itu.
 *
 * SENGAJA pakai prefix "/media/" (bukan "/storage/") - kalau dipakai
 * "/storage/", request ke situ BISA KETIBAN symlink public/storage yang
 * fisiknya memang ada di folder public (PHP built-in server mencoba serve
 * itu duluan sebagai file statis SEBELUM request sempat sampai ke Laravel
 * sama sekali kalau symlink terdeteksi "ada", walau ujung-ujungnya gagal
 * baca juga - jadi route Laravel di sini tidak akan pernah kepanggil).
 * "/media/" dijamin tidak collide dengan apa pun secara fisik di folder
 * public, jadi PHP SELALU meneruskan request ini ke Laravel tanpa
 * ambiguitas, terlepas symlink-nya berfungsi atau tidak.
 */
Route::get('/media/{path}', function (string $path) {
    $fullPath = storage_path('app/public/'.$path);

    // Cegah path traversal (mis. "/media/../../.env") - realpath() lalu
    // dipastikan hasilnya masih di DALAM folder storage/app/public.
    $realPath = realpath($fullPath);
    $realBase = realpath(storage_path('app/public'));

    if (! $realPath || ! $realBase || ! str_starts_with($realPath, $realBase) || ! is_file($realPath)) {
        abort(404);
    }

    return response()->file($realPath);
})->where('path', '.*')->name('media.serve');
