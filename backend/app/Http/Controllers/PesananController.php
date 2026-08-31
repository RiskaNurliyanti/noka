<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\FiltersRiwayatPesanan;
use App\Http\Requests\Pesanan\CheckoutRequest;
use App\Models\Pesanan;
use App\Models\Produk;
use App\Models\Toko;
use App\Services\AuditLogger;
use App\Support\AlasanPembatalan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PesananController extends Controller
{
    use FiltersRiwayatPesanan;

    // Batas pembatalan pesanan oleh PEMBELI sendiri per hari (WIB) -
    // requirement eksplisit "dibatasin 2x sehari" supaya tidak disalahgunakan
    // buat spam-batal pesanan toko. Batas ini HANYA berlaku kalau yang
    // membatalkan itu pembeli - pembatalan oleh toko/kurir/admin tidak
    // mengurangi jatah ini (lihat dibatalkan_oleh_role di query bawah).
    private const BATAS_BATAL_PEMBELI_PER_HARI = 2;

    /**
     * Checkout. TIDAK ada proses pembayaran/pengiriman di sini - ini cuma
     * mencatat pesanan (harga dikunci di harga_satuan/subtotal saat checkout,
     * supaya kalau harga produk berubah nanti riwayat pesanan tidak ikut
     * berubah). Koordinasi pembayaran/pengiriman selanjutnya manual via
     * WhatsApp (link WA dibuat di frontend, bukan di sini).
     */
    public function store(CheckoutRequest $request): JsonResponse
    {
        $data = $request->validated();

        $pesanan = DB::transaction(function () use ($data, $request) {
            // Cek status buka toko SEBELUM memproses item apa pun - pakai
            // accessor sedang_buka (Toko model) yang sudah menghitung toggle
            // manual mitra + jam operasional real-time, bukan cuma
            // status_buka mentah, supaya konsisten dengan status yang
            // dilihat pembeli di halaman toko (kalau di sana kelihatan
            // "Tutup", checkout juga harus ditolak - jangan sampai beda).
            $toko = Toko::find($data['toko_id']);
            if (! $toko || ! $toko->sedang_buka) {
                abort(422, 'Toko sedang tutup, tidak bisa menerima pesanan saat ini. Coba lagi nanti atau pilih toko lain.');
            }

            $produkIds = collect($data['item'])->pluck('produk_id');
            $produkMap = Produk::whereIn('id', $produkIds)->where('status_aktif', true)->get()->keyBy('id');

            $total = 0;
            $itemsToInsert = [];

            foreach ($data['item'] as $item) {
                $produk = $produkMap->get($item['produk_id']);

                if (! $produk) {
                    abort(422, 'Salah satu produk di keranjang sudah tidak tersedia');
                }

                if ($produk->toko_id !== $data['toko_id']) {
                    abort(422, 'Semua produk di satu pesanan harus dari toko yang sama');
                }

                $hargaSatuan = $produk->harga_diskon ?? $produk->harga;
                $subtotal = $hargaSatuan * $item['qty'];
                $total += $subtotal;

                $itemsToInsert[] = [
                    'produk_id' => $produk->id,
                    'qty' => $item['qty'],
                    'harga_satuan' => $hargaSatuan,
                    'subtotal' => $subtotal,
                    'catatan' => $item['catatan'] ?? null,
                ];
            }

            $pesanan = Pesanan::create([
                'pembeli_id' => $request->user()?->id,
                'guest_nama' => $data['guest_nama'] ?? null,
                'guest_whatsapp' => $data['guest_whatsapp'] ?? null,
                'toko_id' => $data['toko_id'],
                'kurir_id' => $data['kurir_id'] ?? null,
                'total_harga' => $total,
                'alamat_antar' => $data['alamat_antar'] ?? null,
                'catatan' => $data['catatan'] ?? null,
            ]);

            foreach ($itemsToInsert as $item) {
                $pesanan->item()->create($item);
            }

            return $pesanan->load('item.produk', 'toko', 'kurir');
        });

        return response()->json(['success' => true, 'message' => 'Pesanan berhasil dibuat', 'data' => $pesanan], 201);
    }

    /**
     * Riwayat pesanan milik pembeli yang sedang login (guest tidak punya
     * riwayat tersimpan di akun - sesuai sifat guest checkout).
     */
    /**
     * Stage 18: riwayat pesanan pembeli sekarang bisa difilter per
     * bulan/minggu/hari dan dicari bebas (nama toko/kurir/produk) - dulu
     * cuma daftar polos tanpa filter sama sekali.
     */
    public function riwayatSaya(Request $request): JsonResponse
    {
        $query = Pesanan::with(['item.produk', 'toko', 'kurir'])
            ->where('pembeli_id', $request->user()->id);

        $this->filterPeriode($request, $query);
        $this->filterCariPesanan($request, $query);

        $pesanan = $query->orderByDesc('created_at')->paginate($request->integer('per_page', 20));

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $pesanan]);
    }

    /**
     * Berapa kali PEMBELI ini sendiri sudah membatalkan pesanan hari ini
     * (WIB) - dipakai buat menegakkan batas 2x/hari. Cuma menghitung
     * pembatalan yang memang diinisiasi pembeli (dibatalkan_oleh_role =
     * 'pembeli'), bukan pembatalan oleh toko/kurir/admin terhadap
     * pesanannya, supaya pembeli tidak "kena jatah" gara-gara toko yang
     * membatalkan.
     */
    private function jumlahPembatalanPembeliHariIni(string $pembeliId): int
    {
        $awal = now('Asia/Makassar')->startOfDay();
        $akhir = now('Asia/Makassar')->endOfDay();

        return Pesanan::where('pembeli_id', $pembeliId)
            ->where('dibatalkan_oleh_role', 'pembeli')
            ->whereBetween('updated_at', [$awal, $akhir])
            ->count();
    }

    /**
     * Pembeli membatalkan pesanan miliknya sendiri (Stage 18). Alasan WAJIB
     * salah satu dari AlasanPembatalan::UNTUK_PEMBELI (ganti toko lain /
     * tidak jadi beli / toko tutup - BUKAN alasan milik toko/kurir seperti
     * "stok tidak tersedia" atau "kurir libur"). Dibatasi 2x/hari khusus
     * pembatalan yang diinisiasi pembeli sendiri.
     */
    public function batalkan(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $pesanan = Pesanan::where('pembeli_id', $user->id)->find($id);

        if (! $pesanan) {
            return response()->json(['success' => false, 'message' => 'Pesanan tidak ditemukan'], 404);
        }

        if (in_array($pesanan->status, Pesanan::STATUS_FINAL, true)) {
            return response()->json(['success' => false, 'message' => 'Pesanan ini sudah '.$pesanan->status.', tidak bisa dibatalkan lagi'], 422);
        }

        if ($this->jumlahPembatalanPembeliHariIni($user->id) >= self::BATAS_BATAL_PEMBELI_PER_HARI) {
            return response()->json([
                'success' => false,
                'message' => 'Kamu sudah membatalkan '.self::BATAS_BATAL_PEMBELI_PER_HARI.' pesanan hari ini. Batas pembatalan harian tercapai - coba lagi besok, atau hubungi toko langsung lewat WhatsApp.',
            ], 422);
        }

        $data = $request->validate([
            'alasan_pembatalan' => ['required', Rule::in(AlasanPembatalan::UNTUK_PEMBELI)],
        ]);

        $sebelum = $pesanan->only(['status', 'alasan_pembatalan', 'dibatalkan_oleh_role']);
        $pesanan->update([
            'status' => 'dibatalkan',
            'alasan_pembatalan' => $data['alasan_pembatalan'],
            'dibatalkan_oleh_role' => 'pembeli',
        ]);
        AuditLogger::catatPesanan($pesanan, $user, 'dibatalkan', $sebelum, $pesanan->only(['status', 'alasan_pembatalan', 'dibatalkan_oleh_role']), $request);

        return response()->json(['success' => true, 'message' => 'Pesanan dibatalkan', 'data' => $pesanan]);
    }

    /**
     * Pembeli menandai pesanan miliknya sendiri selesai (Stage 18) - mis.
     * begitu pesanan sudah diterima/diambil. Sama seperti toko & kurir,
     * pembeli juga berwenang menyelesaikan pesanan sendiri.
     */
    public function selesaikan(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $pesanan = Pesanan::where('pembeli_id', $user->id)->find($id);

        if (! $pesanan) {
            return response()->json(['success' => false, 'message' => 'Pesanan tidak ditemukan'], 404);
        }

        if (in_array($pesanan->status, Pesanan::STATUS_FINAL, true)) {
            return response()->json(['success' => false, 'message' => 'Pesanan ini sudah '.$pesanan->status], 422);
        }

        $sebelum = $pesanan->only(['status', 'alasan_pembatalan', 'dibatalkan_oleh_role']);
        $pesanan->update(['status' => 'selesai', 'alasan_pembatalan' => null, 'dibatalkan_oleh_role' => null]);
        AuditLogger::catatPesanan($pesanan, $user, 'selesai', $sebelum, $pesanan->only(['status', 'alasan_pembatalan', 'dibatalkan_oleh_role']), $request);

        return response()->json(['success' => true, 'message' => 'Pesanan ditandai selesai', 'data' => $pesanan]);
    }

    /**
     * Notifikasi perubahan status pesanan untuk pembeli - begitu penjual/
     * admin/kurir mengubah status pesanan mereka (terutama dibatalkan),
     * pembeli perlu tahu lewat NOKA, bukan cuma nunggu WhatsApp manual.
     * Pola sama seperti notifikasi kurir (Stage 16): bandingkan timestamp
     * "terakhir dilihat" dengan updated_at pesanan, bukan tabel notifikasi
     * terpisah. Status 'dibuat' TIDAK dihitung sebagai "perubahan" karena
     * itu status awal saat pesanan pertama kali dibuat, bukan update.
     */
    public function notifikasi(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Pesanan::where('pembeli_id', $user->id)
            ->whereNotNull('updated_at')
            ->where('status', '!=', 'dibuat');

        if ($user->notifikasi_pesanan_dilihat_at) {
            $query->where('updated_at', '>', $user->notifikasi_pesanan_dilihat_at);
        }

        $jumlahBaru = (clone $query)->count();
        $pesananTerbaru = $query->with('toko:id,nama_toko')
            ->orderByDesc('updated_at')
            ->limit(5)
            ->get(['id', 'toko_id', 'status', 'updated_at']);

        return response()->json([
            'success' => true,
            'message' => 'OK',
            'data' => ['jumlah_baru' => $jumlahBaru, 'pesanan_terbaru' => $pesananTerbaru],
        ]);
    }

    public function tandaiNotifikasiDilihat(Request $request): JsonResponse
    {
        $request->user()->forceFill(['notifikasi_pesanan_dilihat_at' => now()])->save();

        return response()->json(['success' => true, 'message' => 'OK', 'data' => null]);
    }
}
