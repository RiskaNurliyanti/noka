<?php

use App\Http\Controllers\Admin;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\DaftarMitraController;
use App\Http\Controllers\FavoritController;
use App\Http\Controllers\KlaimController;
use App\Http\Controllers\LaporanController;
use App\Http\Controllers\Mitra;
use App\Http\Controllers\PesananController;
use App\Http\Controllers\Marketplace as Pub;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\TrackingController;
use App\Http\Controllers\UploadController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — NOKA
|--------------------------------------------------------------------------
| CHECKPOINT 3 (Core API) selesai: toko, kurir, produk, kategori, pesanan,
| review, klaim, kelola pengguna, pengaturan sistem, upload.
*/

Route::get('/health', function () {
    return response()->json(['success' => true, 'message' => 'NOKA API aktif', 'data' => ['status' => 'ok']]);
});

// Stage 25: catat kunjungan halaman - publik, tidak perlu login (lihat
// TrackingController). Rate limit longgar (120/menit per IP) - cukup buat
// pemakaian wajar navigasi SPA, tapi tetap mencegah endpoint publik ini
// di-spam.
Route::post('/tracking', [TrackingController::class, 'catat'])->middleware('throttle:120,1');

/*
|--------------------------------------------------------------------------
| AUTH
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [PasswordResetController::class, 'forgotPassword']);
    Route::post('/reset-password', [PasswordResetController::class, 'resetPassword']);

    // Stage 4: verifikasi email (menggantikan login Google yang sudah dihapus).
    // TIDAK pakai middleware 'signed' di sini dengan sengaja - kalau
    // signature invalid/expired, middleware itu akan throw exception yang
    // ditangkap penanganan error API global (JSON mentah), padahal ini
    // diklik dari EMAIL/browser dan harus redirect balik ke halaman React
    // dengan pesan yang jelas. Makanya validasi signature dilakukan manual
    // di dalam AuthController::verifyEmail() sendiri (pola yang sama seperti
    // GoogleAuthController lama menangani error dengan redirect ke frontend).
    Route::get('/verify-email/{id}/{hash}', [AuthController::class, 'verifyEmail'])
        ->name('verification.verify');
    Route::post('/verify-email/resend', [AuthController::class, 'resendVerification'])
        ->middleware('throttle:6,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::put('/me', [AuthController::class, 'updateMe']);
    });
});

/*
|--------------------------------------------------------------------------
| PUBLIK — tidak butuh login (marketplace, browsing)
|--------------------------------------------------------------------------
*/
Route::get('/toko', [Pub\TokoController::class, 'index']);
Route::get('/toko/{id}', [Pub\TokoController::class, 'show']);
Route::post('/toko/{id}/kunjungan', [Pub\TokoController::class, 'catatKunjungan']);

Route::get('/kurir', [Pub\KurirController::class, 'index']);
Route::get('/kurir/{id}', [Pub\KurirController::class, 'show']);

Route::get('/produk', [Pub\ProdukController::class, 'index']);
Route::get('/produk/{id}', [Pub\ProdukController::class, 'show']);

Route::get('/kategori', [Pub\KategoriController::class, 'index']);
Route::get('/kategori-toko', [Pub\KategoriTokoController::class, 'index']);
Route::get('/pengaturan', [Pub\PengaturanController::class, 'show']);
Route::get('/admin-whatsapp', [Pub\AdminWhatsappController::class, 'show']);
Route::get('/banner', [Pub\BannerController::class, 'index']);
Route::get('/produk-populer', [Pub\PopulerController::class, 'produk']);
Route::get('/toko-populer', [Pub\PopulerController::class, 'toko']);

// Checkout: boleh guest ATAU login (dicek manual di CheckoutRequest/controller,
// bukan lewat middleware auth:sanctum yang akan mem-block guest).
Route::post('/pesanan', [PesananController::class, 'store']);

/*
|--------------------------------------------------------------------------
| BUTUH LOGIN (semua role) — favorit, review, riwayat pesanan, klaim
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/favorit', [FavoritController::class, 'index']);
    Route::post('/favorit', [FavoritController::class, 'store']);
    Route::delete('/favorit/{produkId}', [FavoritController::class, 'destroy']);

    Route::post('/produk/{id}/review', [ReviewController::class, 'storeProduk']);
    Route::post('/toko/{id}/review', [ReviewController::class, 'storeToko']);
    Route::post('/kurir/{id}/review', [ReviewController::class, 'storeKurir']);
    Route::get('/review-saya', [ReviewController::class, 'riwayatSaya']);
    Route::put('/review/{jenis}/{id}', [ReviewController::class, 'update']);
    Route::delete('/review/{jenis}/{id}', [ReviewController::class, 'destroy']);

    Route::get('/pesanan-saya', [PesananController::class, 'riwayatSaya']);
    // Stage 18: pembeli bisa membatalkan (dengan alasan, dibatasi 2x/hari)
    // atau menyelesaikan pesanan miliknya sendiri.
    Route::put('/pesanan-saya/{id}/batalkan', [PesananController::class, 'batalkan']);
    Route::put('/pesanan-saya/{id}/selesai', [PesananController::class, 'selesaikan']);
    Route::get('/pesanan-notifikasi', [PesananController::class, 'notifikasi']);
    Route::post('/pesanan-notifikasi/tandai-dilihat', [PesananController::class, 'tandaiNotifikasiDilihat']);

    Route::post('/klaim', [KlaimController::class, 'store']);
    Route::get('/klaim-saya', [KlaimController::class, 'riwayatSaya']);
    Route::post('/daftar-mitra/toko', [DaftarMitraController::class, 'storeToko']);
    Route::post('/daftar-mitra/kurir', [DaftarMitraController::class, 'storeKurir']);

    // Stage 19: pusat aduan - semua role yang login bisa lapor bug atau pelanggaran.
    Route::post('/laporan', [LaporanController::class, 'store']);
    Route::get('/laporan-saya', [LaporanController::class, 'riwayatSaya']);

    Route::post('/upload', [UploadController::class, 'store']);
});

/*
|--------------------------------------------------------------------------
| MITRA TOKO — hanya operasi terhadap toko milik sendiri
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'role:mitra_toko'])->prefix('mitra/toko')->group(function () {
    Route::get('/', [Mitra\TokoController::class, 'show']);
    Route::put('/', [Mitra\TokoController::class, 'update']);
    Route::put('/status-buka', [Mitra\TokoController::class, 'updateStatusBuka']);
    Route::get('/stats', [Mitra\TokoController::class, 'stats']);
    Route::get('/stats-harian', [Mitra\TokoController::class, 'statsHarian']);
    Route::get('/notifikasi', [Mitra\TokoController::class, 'notifikasi']);
    Route::post('/notifikasi/tandai-dilihat', [Mitra\TokoController::class, 'tandaiNotifikasiDilihat']);

    Route::get('/produk', [Mitra\ProdukController::class, 'index']);
    Route::post('/produk', [Mitra\ProdukController::class, 'store']);
    Route::put('/produk/{id}', [Mitra\ProdukController::class, 'update']);
    Route::delete('/produk/{id}', [Mitra\ProdukController::class, 'destroy']);

    Route::get('/pesanan', [Mitra\PesananController::class, 'index']);
    Route::get('/pesanan/export', [Mitra\PesananController::class, 'export']);
    Route::get('/pesanan/{id}', [Mitra\PesananController::class, 'show']);
    Route::put('/pesanan/{id}/status', [Mitra\PesananController::class, 'updateStatus']);
});

/*
|--------------------------------------------------------------------------
| MITRA KURIR — hanya operasi terhadap profil kurir milik sendiri
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'role:mitra_kurir'])->prefix('mitra/kurir')->group(function () {
    Route::get('/', [Mitra\KurirController::class, 'show']);
    Route::put('/', [Mitra\KurirController::class, 'update']);
    Route::put('/ketersediaan', [Mitra\KurirController::class, 'updateKetersediaan']);
    Route::get('/pesanan', [Mitra\KurirController::class, 'pesanan']);
    Route::put('/pesanan/{id}/status', [Mitra\KurirController::class, 'updateStatusPesanan']);
    Route::get('/stats-harian', [Mitra\KurirController::class, 'statsHarian']);
    Route::get('/notifikasi', [Mitra\KurirController::class, 'notifikasi']);
    Route::post('/notifikasi/tandai-dilihat', [Mitra\KurirController::class, 'tandaiDilihat']);
});

// Stage 21: toko lihat status langganan & tagihan sendiri.
Route::middleware(['auth:sanctum', 'role:mitra_toko'])->prefix('mitra')->group(function () {
    Route::get('/langganan', [Mitra\LanggananController::class, 'show']);
});

/*
|--------------------------------------------------------------------------
| ADMIN & SUPER ADMIN — role:admin otomatis meloloskan super_admin juga
| (lihat EnsureUserHasRole middleware)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
    Route::get('/toko', [Admin\TokoController::class, 'index']);
    Route::post('/toko', [Admin\TokoController::class, 'store']);
    Route::put('/toko/{id}', [Admin\TokoController::class, 'update']);
    Route::delete('/toko/{id}', [Admin\TokoController::class, 'destroy']);
    Route::patch('/toko/{id}/verifikasi', [Admin\TokoController::class, 'verifikasi']);
    Route::patch('/toko/{id}/status-aktif', [Admin\TokoController::class, 'statusAktif']);

    Route::get('/kurir', [Admin\KurirController::class, 'index']);
    Route::post('/kurir', [Admin\KurirController::class, 'store']);
    Route::put('/kurir/{id}', [Admin\KurirController::class, 'update']);
    Route::delete('/kurir/{id}', [Admin\KurirController::class, 'destroy']);
    Route::patch('/kurir/{id}/verifikasi', [Admin\KurirController::class, 'verifikasi']);
    Route::patch('/kurir/{id}/status-aktif', [Admin\KurirController::class, 'statusAktif']);
    Route::post('/kurir/{id}/klaim-email', [Admin\KurirController::class, 'klaimByEmail']);

    Route::get('/produk', [Admin\ProdukController::class, 'index']);
    Route::post('/produk', [Admin\ProdukController::class, 'store']);
    Route::put('/produk/{id}', [Admin\ProdukController::class, 'update']);
    Route::delete('/produk/{id}', [Admin\ProdukController::class, 'destroy']);

    Route::post('/kategori', [Admin\KategoriController::class, 'store']);
    Route::put('/kategori/{id}', [Admin\KategoriController::class, 'update']);
    Route::delete('/kategori/{id}', [Admin\KategoriController::class, 'destroy']);

    Route::post('/kategori-toko', [Admin\KategoriTokoController::class, 'store']);
    Route::put('/kategori-toko/{id}', [Admin\KategoriTokoController::class, 'update']);
    Route::delete('/kategori-toko/{id}', [Admin\KategoriTokoController::class, 'destroy']);

    Route::get('/pesanan', [Admin\PesananController::class, 'index']);
    Route::get('/pesanan/export', [Admin\PesananController::class, 'export']);
    Route::get('/pesanan/{id}', [Admin\PesananController::class, 'show']);
    Route::put('/pesanan/{id}/status', [Admin\PesananController::class, 'updateStatus']);

    Route::get('/review', [Admin\ReviewController::class, 'index']);
    Route::patch('/review/{id}/status', [Admin\ReviewController::class, 'updateStatus']);
    Route::delete('/review/{id}', [Admin\ReviewController::class, 'destroy']);

    Route::get('/klaim', [Admin\KlaimController::class, 'index']);
    Route::patch('/klaim/{id}/approve', [Admin\KlaimController::class, 'approve']);
    Route::patch('/klaim/{id}/reject', [Admin\KlaimController::class, 'reject']);

    // Stage 19: kelola aduan bug/pelanggaran dari user.
    Route::get('/laporan', [Admin\LaporanController::class, 'index']);
    Route::patch('/laporan/{id}/status', [Admin\LaporanController::class, 'updateStatus']);

    Route::get('/users', [Admin\UserController::class, 'index']);
    Route::put('/users/{id}', [Admin\UserController::class, 'update']);
    Route::patch('/users/{id}/role', [Admin\UserController::class, 'updateRole']);
    Route::patch('/users/{id}/status-aktif', [Admin\UserController::class, 'updateStatusAktif']);

    Route::get('/statistik', [Admin\StatistikController::class, 'global']);
    Route::get('/produk-terlaris', [Admin\StatistikController::class, 'produkTerlaris']);
    Route::get('/penjualan-harian', [Admin\StatistikController::class, 'penjualanHarian']);

    // Stage 21: langganan & tagihan toko - soal pendapatan NOKA dari toko
    // (bukan data penjualan toko itu sendiri), jadi tetap boleh diakses admin biasa.
    Route::get('/langganan', [Admin\LanggananController::class, 'index']);
    Route::get('/langganan/notifikasi-jumlah', [Admin\LanggananController::class, 'jumlahNotifikasi']);
    Route::post('/langganan/{tokoId}/perpanjang', [Admin\LanggananController::class, 'perpanjang']);
    Route::post('/langganan/{tokoId}/hitung-tagihan', [Admin\LanggananController::class, 'hitungTagihan']);
    Route::patch('/tagihan/{tagihanId}/lunas', [Admin\LanggananController::class, 'tandaiLunas']);

    // Stage 25: analitik pengunjung situs - metrik engagement platform, bukan data penjualan toko.
    Route::get('/analitik', [Admin\AnalitikController::class, 'ringkasan']);

    // Notifikasi lonceng admin/super admin - konsolidasi & bisa ditandai dibaca (lihat NotifikasiController).
    Route::get('/notifikasi', [Admin\NotifikasiController::class, 'index']);
    Route::post('/notifikasi/tandai-dilihat', [Admin\NotifikasiController::class, 'tandaiDilihat']);
});

/*
|--------------------------------------------------------------------------
| SUPER ADMIN SAJA — pengaturan tingkat sistem
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'role:super_admin'])->prefix('admin')->group(function () {
    Route::get('/pengaturan', [Admin\PengaturanController::class, 'show']);
    Route::put('/pengaturan', [Admin\PengaturanController::class, 'update']);
    Route::post('/pengaturan/tes-email', [Admin\PengaturanController::class, 'testEmail']);
    Route::get('/log-aktivitas', [Admin\LogAktivitasController::class, 'index']);

    // Stage 21: audit log perubahan pesanan - KHUSUS super_admin (bukan admin biasa).
    Route::get('/audit-log', [Admin\AuditLogController::class, 'index']);

    // Stage 23: diagnostik dual-write Neon vs Supabase - KHUSUS super_admin.
    Route::get('/status-database', [Admin\StatusDatabaseController::class, 'index']);
});
