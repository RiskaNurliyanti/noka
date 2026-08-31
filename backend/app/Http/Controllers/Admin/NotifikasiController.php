<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KlaimMitra;
use App\Models\Kurir;
use App\Models\LaporanPengguna;
use App\Models\Langganan;
use App\Models\Tagihan;
use App\Models\Toko;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Notifikasi lonceng admin/super admin - dipecah 2 kategori:
 *
 * 1. "Dapat ditandai dibaca" (toko/kurir baru daftar, klaim baru, aduan
 *    baru) - hitung item yang DIBUAT SETELAH admin ini terakhir lihat
 *    (notifikasi_dilihat_at di tabel users), sama seperti pola notifikasi
 *    pesanan toko/kurir. Begitu lonceng dibuka, tandaiDilihat() dipanggil,
 *    badge otomatis reset ke 0 - item pending yang SAMA tidak akan
 *    "muncul lagi" cuma karena masih menunggu diproses.
 *
 * 2. "SELALU tampil" (langganan toko mau habis, tagihan belum lunas) -
 *    SENGAJA TIDAK ikut mekanisme tandai-dibaca di atas. Ini bukan
 *    "kejadian baru" seperti pendaftaran/aduan, tapi kondisi BERISIKO yang
 *    terus berlangsung (uang atau langganan toko bisa mati kalau
 *    ke-skip) - kalau admin "menandai dibaca" lalu lupa, dampaknya bisa ke
 *    pendapatan NOKA. Jumlahnya selalu apa adanya sampai kondisinya
 *    beneran selesai (toko bayar / langganan diperpanjang), bukan sampai
 *    "dilihat".
 */
<<<<<<< HEAD
// Notifikasi buat admin, mis. ada pengajuan mitra baru yang perlu ditinjau.
class NotifikasiController extends Controller
{
    // Hal-hal yang perlu perhatian admin (klaim baru, laporan baru, dll).
=======
class NotifikasiController extends Controller
{
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $dilihatSejak = $user->notifikasi_dilihat_at;

        $hitungBaru = function ($query) use ($dilihatSejak) {
            if ($dilihatSejak) {
                $query->where('created_at', '>', $dilihatSejak);
            }

            return $query->count();
        };

        $toko = $hitungBaru(Toko::where('status_verifikasi', 'pending'));
        $kurir = $hitungBaru(Kurir::where('status_verifikasi', 'pending'));
        $klaim = $hitungBaru(KlaimMitra::where('status', 'pending'));
        $laporan = $hitungBaru(LaporanPengguna::where('status', 'pending'));

        // Kategori 2 - TIDAK dipengaruhi notifikasi_dilihat_at sama sekali,
        // selalu hitung apa adanya (lihat penjelasan panjang di atas kelas ini).
        $akanHabis = Langganan::where('status', 'aktif')
            ->whereBetween('berakhir_tanggal', [now(), now()->addDays(7)])
            ->count();
        $tagihanBelumLunas = Tagihan::where('status_bayar', 'belum_dibayar')
            ->where('periode', '<', now()->format('Y-m'))
            ->count();
        $langganan = $akanHabis + $tagihanBelumLunas;

        return response()->json([
            'success' => true,
            'message' => 'OK',
            'data' => [
                'toko' => $toko,
                'kurir' => $kurir,
                'klaim' => $klaim,
                'laporan' => $laporan,
                'langganan' => $langganan,
                'total' => $toko + $kurir + $klaim + $laporan + $langganan,
            ],
        ]);
    }

<<<<<<< HEAD
    // Tandai notifikasi admin sudah dilihat.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
    public function tandaiDilihat(Request $request): JsonResponse
    {
        $request->user()->update(['notifikasi_dilihat_at' => now()]);

        return response()->json(['success' => true, 'message' => 'OK', 'data' => null]);
    }
}
