<?php

namespace App\Http\Controllers\Mitra;

use App\Http\Controllers\Concerns\FiltersRiwayatPesanan;
use App\Http\Controllers\Controller;
use App\Models\Pesanan;
use App\Services\AuditLogger;
use App\Support\AlasanPembatalan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class KurirController extends Controller
{
    use FiltersRiwayatPesanan;

    public function show(Request $request): JsonResponse
    {
        $kurir = $request->user()->kurir()->first();

        if (! $kurir) {
            return response()->json(['success' => false, 'message' => 'Kamu belum punya profil kurir. Ajukan klaim kurir dulu.'], 404);
        }

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $kurir]);
    }

    public function update(Request $request): JsonResponse
    {
        $kurir = $request->user()->kurir()->first();

        if (! $kurir) {
            return response()->json(['success' => false, 'message' => 'Kamu belum punya profil kurir'], 404);
        }

        $data = $request->validate([
            'nama_layanan' => ['sometimes', 'string', 'max:150'],
            'foto_logo' => ['sometimes', 'nullable', 'string'],
            'no_whatsapp' => ['sometimes', 'string', 'max:20'],
            'kendaraan' => ['nullable', 'string'],
            'area_layanan' => ['nullable', 'string'],
            'jam_operasional' => ['nullable', 'string'],
        ]);

        // status_verifikasi & status_aktif tidak boleh diubah mitra sendiri -
        // sama seperti toko, wewenang admin.
        $kurir->update($data);

        return response()->json(['success' => true, 'message' => 'Profil kurir berhasil diperbarui', 'data' => $kurir]);
    }

    public function updateKetersediaan(Request $request): JsonResponse
    {
        $kurir = $request->user()->kurir()->first();

        if (! $kurir) {
            return response()->json(['success' => false, 'message' => 'Kamu belum punya profil kurir'], 404);
        }

        $data = $request->validate(['status_ketersediaan' => ['required', 'boolean']]);
        $kurir->update(['status_ketersediaan' => $data['status_ketersediaan']]);

        return response()->json(['success' => true, 'message' => 'Status ketersediaan diperbarui', 'data' => $kurir]);
    }

    /**
     * Pesanan pengantaran yang kurir ini kebagian (pesanan.kurir_id = kurir
     * ini) - dipakai DashboardKurir.jsx & riwayat pesanan kurir.
     *
     * Stage 18: sekarang bisa difilter per bulan/minggu/hari dan dicari
     * bebas (nama toko/pembeli/produk) - dulu cuma daftar polos.
     */
    public function pesanan(Request $request): JsonResponse
    {
        $kurir = $request->user()->kurir()->first();

        if (! $kurir) {
            return response()->json(['success' => false, 'message' => 'Kamu belum punya profil kurir'], 404);
        }

        $query = $kurir->pesanan()->with(['toko:id,nama_toko,alamat,no_whatsapp', 'pembeli:id,nama,no_whatsapp', 'item.produk']);
        $this->filterPeriode($request, $query);
        $this->filterCariPesanan($request, $query);

        $pesanan = $query->orderByDesc('created_at')->paginate($request->integer('per_page', 10));

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $pesanan]);
    }

    /**
     * Data harian jumlah pengantaran (14 hari terakhir) buat diagram
     * statistik di dashboard kurir (Stage 12). Data aktual dari tabel
     * 'pesanan' (kurir_id = kurir ini), bukan angka dummy. Hari tanpa
     * pengantaran tetap muncul dengan nilai 0 supaya diagramnya kontinu.
     */
    public function statsHarian(Request $request): JsonResponse
    {
        $kurir = $request->user()->kurir()->first();

        if (! $kurir) {
            return response()->json(['success' => false, 'message' => 'Kamu belum punya profil kurir'], 404);
        }

        $mulai = now('Asia/Makassar')->subDays(13)->startOfDay();

        $perTanggal = DB::table('pesanan')
            ->selectRaw("to_char(created_at, 'YYYY-MM-DD') as tanggal, count(*) as jumlah")
            ->where('kurir_id', $kurir->id)
            ->where('created_at', '>=', $mulai)
            ->groupBy('tanggal')
            ->pluck('jumlah', 'tanggal');

        $hasil = [];
        for ($i = 13; $i >= 0; $i--) {
            $tanggal = now('Asia/Makassar')->subDays($i)->format('Y-m-d');
            $hasil[] = ['tanggal' => $tanggal, 'jumlah_pengantaran' => (int) ($perTanggal[$tanggal] ?? 0)];
        }

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $hasil]);
    }

    /**
     * Notifikasi pesanan baru untuk kurir (Stage 16). Tidak pakai tabel
     * notifikasi terpisah - cukup bandingkan created_at pesanan dengan
     * kolom notifikasi_dilihat_at milik kurir. Begitu kurir buka dropdown
     * notifikasi (lihat tandaiDilihat()), timestamp diupdate, otomatis
     * pesanan yang sama tidak lagi terhitung "baru" - jadi tidak ada
     * notifikasi yang duplikat/nempel terus buat pesanan yang sama.
     */
    public function notifikasi(Request $request): JsonResponse
    {
        $kurir = $request->user()->kurir()->first();

        if (! $kurir) {
            return response()->json(['success' => false, 'message' => 'Kamu belum punya profil kurir'], 404);
        }

        $dilihatAt = $kurir->notifikasi_dilihat_at;

        // Kategori 1: pesanan baru untuk diantar (perilaku lama, tetap dipertahankan).
        $queryBaru = $kurir->pesanan();
        if ($dilihatAt) {
            $queryBaru->where('created_at', '>', $dilihatAt);
        }
        $jumlahBaru = (clone $queryBaru)->count();
        $pesananBaru = (clone $queryBaru)
            ->with('toko:id,nama_toko')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get(['id', 'toko_id', 'status', 'created_at', 'updated_at']);

        // Kategori 2: pesanan yang dibatalkan BUKAN oleh kurir sendiri (mis.
        // toko/pembeli/admin membatalkan pesanan yang sudah ditugaskan ke
        // kurir ini) - kurir sudah tahu soal pembatalan yang dia lakukan
        // sendiri, jadi cuma yang dari pihak lain yang perlu dinotifikasi.
        $queryStatus = $kurir->pesanan()
            ->whereColumn('updated_at', '!=', 'created_at')
            ->where('status', 'dibatalkan')
            ->where('dibatalkan_oleh_role', '!=', 'kurir');
        if ($dilihatAt) {
            $queryStatus->where('updated_at', '>', $dilihatAt);
        }
        $jumlahStatus = (clone $queryStatus)->count();
        $pesananStatus = (clone $queryStatus)
            ->with('toko:id,nama_toko')
            ->orderByDesc('updated_at')
            ->limit(5)
            ->get(['id', 'toko_id', 'status', 'created_at', 'updated_at']);

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

    public function tandaiDilihat(Request $request): JsonResponse
    {
        $kurir = $request->user()->kurir()->first();

        if (! $kurir) {
            return response()->json(['success' => false, 'message' => 'Kamu belum punya profil kurir'], 404);
        }

        $kurir->update(['notifikasi_dilihat_at' => now()]);

        return response()->json(['success' => true, 'message' => 'OK', 'data' => null]);
    }

    /**
     * Kurir menandai pesanan yang diantarnya sudah selesai. SENGAJA
     * dibatasi cuma bisa set ke 'selesai' (bukan endpoint generic seperti
     * updateStatus milik penjual/admin) - kurir bukan pihak yang berwenang
     * mencatat pembatalan atau status lain, itu wewenang penjual/toko.
     * Dibatasi juga ke pesanan yang kurir_id-nya memang kurir ini.
     */
    /**
     * Kurir menandai status akhir pesanan yang diantarnya: selesai atau
     * dibatalkan. SENGAJA dibatasi cuma 2 opsi ini (bukan endpoint generic
     * seperti updateStatus milik penjual/admin yang bisa 'dibuat'/
     * 'diproses' juga) - kurir kadang tahu duluan kalau pengantaran gagal
     * (alamat tidak ketemu, pembeli tidak bisa dihubungi, dll), jadi perlu
     * bisa catat itu juga, bukan cuma "selesai". Dibatasi ke pesanan yang
     * kurir_id-nya memang kurir ini.
     */
    public function updateStatusPesanan(Request $request, string $id): JsonResponse
    {
        $kurir = $request->user()->kurir()->first();

        if (! $kurir) {
            return response()->json(['success' => false, 'message' => 'Kamu belum punya profil kurir'], 404);
        }

        $pesanan = $kurir->pesanan()->find($id);

        if (! $pesanan) {
            return response()->json(['success' => false, 'message' => 'Pesanan tidak ditemukan'], 404);
        }

        $data = $request->validate([
            'status' => ['required', Rule::in(['selesai', 'dibatalkan'])],
            'alasan_pembatalan' => [
                Rule::requiredIf(fn () => $request->input('status') === 'dibatalkan'),
                Rule::in(AlasanPembatalan::UNTUK_KURIR),
            ],
        ]);

        if ($data['status'] === 'dibatalkan') {
            $data['dibatalkan_oleh_role'] = 'kurir';
        } else {
            $data['alasan_pembatalan'] = null;
            $data['dibatalkan_oleh_role'] = null;
        }

        $sebelum = $pesanan->only(['status', 'alasan_pembatalan', 'dibatalkan_oleh_role']);

        $pesanan->update($data);
        AuditLogger::catatPesanan($pesanan, $request->user(), $data['status'], $sebelum, $pesanan->only(['status', 'alasan_pembatalan', 'dibatalkan_oleh_role']), $request);

        $pesan = $data['status'] === 'selesai' ? 'Pesanan ditandai selesai' : 'Pesanan ditandai dibatalkan';

        return response()->json(['success' => true, 'message' => $pesan, 'data' => $pesanan]);
    }
}
