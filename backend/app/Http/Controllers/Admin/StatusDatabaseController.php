<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\DualWriteMirror;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StatusDatabaseController extends Controller
{
    /**
     * Daftar tabel yang dicek, dikelompokkan sesuai nama menu di sidebar -
     * 'kolom_tampil' dipakai buat preview baris contoh (opsional, null
     * kalau tabelnya tidak punya kolom teks yang cocok ditampilkan).
     */
    private const DAFTAR_TABEL = [
        ['tabel' => 'users', 'menu' => 'Kelola Pengguna', 'kolom_tampil' => 'nama'],
        ['tabel' => 'toko', 'menu' => 'Kelola Toko', 'kolom_tampil' => 'nama_toko'],
        ['tabel' => 'kurir', 'menu' => 'Kelola Kurir', 'kolom_tampil' => 'nama_layanan'],
        ['tabel' => 'produk', 'menu' => 'Kelola Produk', 'kolom_tampil' => 'nama'],
        ['tabel' => 'kategori', 'menu' => 'Kategori Produk', 'kolom_tampil' => 'nama'],
        ['tabel' => 'kategori_toko', 'menu' => 'Kategori Toko', 'kolom_tampil' => 'nama'],
        ['tabel' => 'favorit', 'menu' => 'Favorit', 'kolom_tampil' => null],
        ['tabel' => 'keranjang', 'menu' => 'Keranjang', 'kolom_tampil' => null],
        ['tabel' => 'pesanan', 'menu' => 'Kelola Pesanan', 'kolom_tampil' => 'status'],
        ['tabel' => 'pesanan_item', 'menu' => 'Item Pesanan', 'kolom_tampil' => null],
        ['tabel' => 'review_produk', 'menu' => 'Review Produk', 'kolom_tampil' => 'komentar'],
        ['tabel' => 'review_toko', 'menu' => 'Review Toko', 'kolom_tampil' => 'komentar'],
        ['tabel' => 'review_kurir', 'menu' => 'Review Kurir', 'kolom_tampil' => 'komentar'],
        ['tabel' => 'klaim_mitra', 'menu' => 'Klaim Mitra', 'kolom_tampil' => 'jenis'],
        ['tabel' => 'laporan_pengguna', 'menu' => 'Kelola Aduan', 'kolom_tampil' => 'judul'],
        ['tabel' => 'audit_log_pesanan', 'menu' => 'Audit Log', 'kolom_tampil' => 'aksi'],
        ['tabel' => 'langganan', 'menu' => 'Langganan Toko', 'kolom_tampil' => 'status'],
        ['tabel' => 'tagihan', 'menu' => 'Tagihan', 'kolom_tampil' => 'periode'],
        ['tabel' => 'banner', 'menu' => 'Banner', 'kolom_tampil' => 'judul'],
        ['tabel' => 'kunjungan_toko', 'menu' => 'Kunjungan Toko', 'kolom_tampil' => null],
        ['tabel' => 'kunjungan_situs', 'menu' => 'Analitik Pengunjung', 'kolom_tampil' => 'halaman'],
        ['tabel' => 'pengaturan_sistem', 'menu' => 'Pengaturan Sistem', 'kolom_tampil' => 'nama_web'],
        ['tabel' => 'log_aktivitas', 'menu' => 'Log Aktivitas', 'kolom_tampil' => 'aksi'],
    ];

    public function index(Request $request): JsonResponse
    {
        $supabaseTersedia = DualWriteMirror::tersedia();
        $hasil = [];

        foreach (self::DAFTAR_TABEL as $def) {
            $hasil[] = $this->cekTabel($def, $supabaseTersedia);
        }

        return response()->json([
            'success' => true,
            'message' => 'OK',
            'data' => [
                'supabase_tersedia' => $supabaseTersedia,
                'tabel' => $hasil,
            ],
        ]);
    }

    private function cekTabel(array $def, bool $supabaseTersedia): array
    {
        $tabel = $def['tabel'];
        $kolom = $def['kolom_tampil'];

        $neon = $this->ringkasan('pgsql', $tabel, $kolom);

        if (! $supabaseTersedia) {
            $supabase = ['status' => 'tidak_terhubung', 'jumlah' => null, 'contoh' => []];
        } else {
            $supabase = $this->ringkasan('pgsql_legacy', $tabel, $kolom);
        }

        return [
            'tabel' => $tabel,
            'menu' => $def['menu'],
            'neon' => $neon,
            'supabase' => $supabase,
            'cocok' => $neon['status'] === 'ok' && $supabase['status'] === 'ok' && $neon['jumlah'] === $supabase['jumlah'],
        ];
    }

    /** Hitung jumlah baris + ambil 3 contoh terbaru dari 1 koneksi. Gagal-aman kalau tabel belum ada di sisi itu. */
    private function ringkasan(string $koneksi, string $tabel, ?string $kolomTampil): array
    {
        try {
            if (! DB::connection($koneksi)->getSchemaBuilder()->hasTable($tabel)) {
                return ['status' => 'tabel_belum_ada', 'jumlah' => null, 'contoh' => []];
            }

            $jumlah = DB::connection($koneksi)->table($tabel)->count();

            $kolomAda = DB::connection($koneksi)->getSchemaBuilder()->hasColumn($tabel, 'created_at');
            $query = DB::connection($koneksi)->table($tabel);
            $baris = $kolomAda ? $query->orderByDesc('created_at')->limit(3)->get() : $query->limit(3)->get();

            $contoh = $baris->map(function ($b) use ($kolomTampil) {
                $b = (array) $b;

                return [
                    'id' => $b['id'] ?? null,
                    'ringkas' => ($kolomTampil && isset($b[$kolomTampil])) ? mb_strimwidth((string) $b[$kolomTampil], 0, 60, '...') : null,
                    'created_at' => $b['created_at'] ?? null,
                ];
            })->all();

            return ['status' => 'ok', 'jumlah' => $jumlah, 'contoh' => $contoh];
        } catch (\Throwable $e) {
            return ['status' => 'error', 'jumlah' => null, 'contoh' => [], 'pesan_error' => $e->getMessage()];
        }
    }
}
