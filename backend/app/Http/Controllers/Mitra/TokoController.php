<?php

namespace App\Http\Controllers\Mitra;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Semua method di sini SELALU beroperasi pada toko milik user yang sedang
 * login (where('user_id', $request->user()->id)) - mitra tidak pernah bisa
 * pilih/pegang toko_id dari input, supaya tidak bisa edit toko orang lain.
 */
class TokoController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $toko = $request->user()->toko()->with('kategoriToko')->first();

        if (! $toko) {
            return response()->json(['success' => false, 'message' => 'Kamu belum punya toko. Ajukan klaim toko dulu.'], 404);
        }

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $toko]);
    }

    public function update(Request $request): JsonResponse
    {
        $toko = $request->user()->toko()->first();

        if (! $toko) {
            return response()->json(['success' => false, 'message' => 'Kamu belum punya toko'], 404);
        }

        // '' -> null supaya jam operasional yang sengaja dikosongkan
        // (field ini opsional) tidak ditolak validasi date_format di bawah.
        // Tanpa ini, <input type="time"> yang dikosongkan browser mengirim
        // string kosong, bukan null, dan 'nullable' Laravel cuma mengizinkan
        // null - bukan string kosong - jadi validasi date_format tetap jalan
        // dan gagal.
        foreach (['jam_buka', 'jam_tutup'] as $field) {
            if ($request->input($field) === '') {
                $request->merge([$field => null]);
            }
        }

        $data = $request->validate([
            'nama_toko' => ['sometimes', 'string', 'max:150'],
            'deskripsi' => ['nullable', 'string'],
            'no_whatsapp' => ['sometimes', 'string', 'max:20'],
            'kategori_toko_id' => ['nullable', 'uuid', 'exists:kategori_toko,id'],
            'foto_banner' => ['sometimes', 'nullable', 'string'],
            'foto_logo' => ['sometimes', 'nullable', 'string'],
            'galeri' => ['nullable', 'array'],
            'alamat' => ['nullable', 'string'],
            'kecamatan' => ['nullable', 'string'],
            'desa' => ['nullable', 'string'],
            'lokasi_lat' => ['nullable', 'numeric'],
            'lokasi_lng' => ['nullable', 'numeric'],
            'jam_buka' => ['nullable', 'date_format:H:i'],
            'jam_tutup' => ['nullable', 'date_format:H:i'],
        ]);

        // status_verifikasi & status_aktif SENGAJA tidak ada di rules di atas -
        // mitra tidak boleh ubah status verifikasi/aktif toko sendiri, itu
        // wewenang admin (Section 16-18 instruksi).
        $toko->update($data);

        return response()->json(['success' => true, 'message' => 'Toko berhasil diperbarui', 'data' => $toko]);
    }

    public function updateStatusBuka(Request $request): JsonResponse
    {
        $toko = $request->user()->toko()->first();

        if (! $toko) {
            return response()->json(['success' => false, 'message' => 'Kamu belum punya toko'], 404);
        }

        $data = $request->validate(['status_buka' => ['required', 'boolean']]);
        $toko->update(['status_buka' => $data['status_buka']]);

        return response()->json(['success' => true, 'message' => 'Status toko diperbarui', 'data' => $toko]);
    }

    /**
     * Statistik dashboard (kunjungan, pesanan, pendapatan, rating, dll) -
     * query langsung ke VIEW toko_stats (lihat migration
     * 2024_01_02_000001_create_stats_views.php), bukan dihitung ulang di PHP.
     */
    public function stats(Request $request): JsonResponse
    {
        $toko = $request->user()->toko()->first();

        if (! $toko) {
            return response()->json(['success' => false, 'message' => 'Kamu belum punya toko'], 404);
        }

        $stats = DB::table('toko_stats')->where('toko_id', $toko->id)->first();

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $stats]);
    }

    /**
     * Data harian jumlah pesanan (14 hari terakhir) buat diagram statistik
     * di dashboard penjual (Stage 12). Data aktual dari tabel 'pesanan',
     * BUKAN dari VIEW toko_stats (yang cuma total keseluruhan, bukan
     * time-series). Hari tanpa pesanan tetap muncul dengan nilai 0 supaya
     * diagramnya kontinu 14 hari penuh, bukan bolong-bolong.
     */
    public function statsHarian(Request $request): JsonResponse
    {
        $toko = $request->user()->toko()->first();

        if (! $toko) {
            return response()->json(['success' => false, 'message' => 'Kamu belum punya toko'], 404);
        }

        $mulai = now('Asia/Makassar')->subDays(13)->startOfDay();

        $perTanggal = DB::table('pesanan')
            ->selectRaw("to_char(created_at, 'YYYY-MM-DD') as tanggal, count(*) as jumlah")
            ->where('toko_id', $toko->id)
            ->where('created_at', '>=', $mulai)
            ->groupBy('tanggal')
            ->pluck('jumlah', 'tanggal');

        $hasil = [];
        for ($i = 13; $i >= 0; $i--) {
            $tanggal = now('Asia/Makassar')->subDays($i)->format('Y-m-d');
            $hasil[] = ['tanggal' => $tanggal, 'jumlah_pesanan' => (int) ($perTanggal[$tanggal] ?? 0)];
        }

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $hasil]);
    }

    /**
     * Notifikasi pesanan baru untuk toko - pola sama persis dengan
     * Mitra\KurirController::notifikasi (lihat komentar di sana untuk
     * penjelasan lengkap kenapa tidak pakai tabel notifikasi terpisah).
     */
    public function notifikasi(Request $request): JsonResponse
    {
        $toko = $request->user()->toko()->first();

        if (! $toko) {
            return response()->json(['success' => false, 'message' => 'Kamu belum punya toko'], 404);
        }

        $dilihatAt = $toko->notifikasi_dilihat_at;

        // Kategori 1: pesanan baru masuk (perilaku lama, tetap dipertahankan).
        $queryBaru = $toko->pesanan();
        if ($dilihatAt) {
            $queryBaru->where('created_at', '>', $dilihatAt);
        }
        $jumlahBaru = (clone $queryBaru)->count();
        $pesananBaru = (clone $queryBaru)
            ->with('pembeli:id,nama')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get(['id', 'pembeli_id', 'guest_nama', 'total_harga', 'status', 'created_at', 'updated_at']);

        // Kategori 2: perubahan status yang BUKAN diinisiasi toko sendiri -
        // toko sudah tahu soal aksinya sendiri (klik "Diproses"/"Batalkan"),
        // jadi tidak perlu dinotifikasi lagi soal itu.
        // - 'selesai' pada pesanan berkurir dijamin BUKAN dari toko (backend
        //   menolak toko men-set status itu untuk pesanan berkurir).
        // - 'dibatalkan' cuma dihitung kalau pembatalnya bukan 'penjual'.
        $queryStatus = $toko->pesanan()
            ->whereColumn('updated_at', '!=', 'created_at')
            ->where(function ($q) {
                $q->where(function ($q2) {
                    $q2->where('status', 'selesai')->whereNotNull('kurir_id');
                })->orWhere(function ($q2) {
                    $q2->where('status', 'dibatalkan')->where('dibatalkan_oleh_role', '!=', 'penjual');
                });
            });
        if ($dilihatAt) {
            $queryStatus->where('updated_at', '>', $dilihatAt);
        }
        $jumlahStatus = (clone $queryStatus)->count();
        $pesananStatus = (clone $queryStatus)
            ->with('pembeli:id,nama')
            ->orderByDesc('updated_at')
            ->limit(5)
            ->get(['id', 'pembeli_id', 'guest_nama', 'total_harga', 'status', 'created_at', 'updated_at']);

        $pesananBaru->each(fn ($p) => $p->setAttribute('tipe', 'baru'));
        $pesananStatus->each(fn ($p) => $p->setAttribute('tipe', 'status'));

        $pesananTerbaru = $pesananBaru->concat($pesananStatus)
            ->sortByDesc(fn ($p) => $p->tipe === 'status' ? $p->updated_at : $p->created_at)
            ->take(5)
            ->values();

        return response()->json([
            'success' => true,
            'message' => 'OK',
            'data' => ['jumlah_baru' => $jumlahBaru + $jumlahStatus, 'pesanan_terbaru' => $pesananTerbaru],
        ]);
    }

    public function tandaiNotifikasiDilihat(Request $request): JsonResponse
    {
        $toko = $request->user()->toko()->first();

        if (! $toko) {
            return response()->json(['success' => false, 'message' => 'Kamu belum punya toko'], 404);
        }

        $toko->update(['notifikasi_dilihat_at' => now()]);

        return response()->json(['success' => true, 'message' => 'OK', 'data' => null]);
    }
}
