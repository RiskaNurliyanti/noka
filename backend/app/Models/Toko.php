<?php

namespace App\Models;

use App\Models\Concerns\MirrorsToSupabase;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Toko extends Model
{
    use HasUuids, MirrorsToSupabase;

    // WAJIB eksplisit - Eloquent salah tebak nama tabel jadi bentuk jamak
    // ala Inggris (mis. "tokos") kalau tidak di-set manual, padahal
    // tabel bahasa Indonesia tidak berubah bentuk jamak.
    protected $table = 'toko';

    public $timestamps = false;

    protected $fillable = [
        'user_id', 'kategori_toko_id', 'nama_toko', 'deskripsi', 'no_whatsapp',
        'foto_banner', 'foto_logo', 'galeri', 'alamat', 'kecamatan', 'desa',
        'lokasi_lat', 'lokasi_lng', 'jam_buka', 'jam_tutup',
        'status_buka', 'status_aktif', 'status_verifikasi', 'notifikasi_dilihat_at',
    ];

    // 'sedang_buka' BUKAN kolom database - dihitung on-the-fly setiap toko
    // di-serialize ke JSON. Ditambahkan atas permintaan tambahan di luar
    // 17 poin resmi (real-time auto-tutup berdasarkan jam operasional).
    protected $appends = ['sedang_buka'];

    protected function casts(): array
    {
        return [
            'galeri' => 'array',
            'status_buka' => 'boolean',
            'status_aktif' => 'boolean',
            'lokasi_lat' => 'float',
            'lokasi_lng' => 'float',
        ];
    }

    /**
     * Status buka REAL-TIME yang dilihat pembeli - beda dengan status_buka
     * (toggle manual mitra). Aturan:
     *  - Toggle manual mitra tetap prioritas utama: kalau mitra matikan
     *    manual (status_buka=false), toko SELALU dianggap tutup, apapun
     *    jam operasionalnya - mitra mungkin sengaja tutup lebih awal
     *    (kehabisan stok, dsb), bukan cuma soal jam.
     *  - Kalau jam_buka/jam_tutup tidak diisi (opsional, lihat Stage 9),
     *    tidak ada dasar untuk auto-tutup - ikuti toggle manual apa adanya.
     *  - Kalau toggle manual "buka" TAPI waktu sekarang di luar rentang
     *    jam operasional, otomatis dianggap tutup.
     *  - Menangani toko yang buka lewat tengah malam (mis. jam_buka 20:00,
     *    jam_tutup 02:00) - rentang "wrap around" tengah malam.
     *  - Pakai timezone eksplisit 'Asia/Makassar', BUKAN mengubah
     *    config('app.timezone') secara global - supaya tidak berdampak ke
     *    timestamp lain (created_at pesanan, dsb) di seluruh aplikasi.
     */
    protected function sedangBuka(): Attribute
    {
        return Attribute::make(
            get: function () {
                if (! $this->status_buka) {
                    return false;
                }

                if (! $this->jam_buka || ! $this->jam_tutup) {
                    return true;
                }

                $sekarang = now('Asia/Makassar')->format('H:i:s');
                $buka = $this->jam_buka;
                $tutup = $this->jam_tutup;

                if ($buka <= $tutup) {
                    return $sekarang >= $buka && $sekarang <= $tutup;
                }

                // Rentang lewat tengah malam, mis. 20:00 - 02:00.
                return $sekarang >= $buka || $sekarang <= $tutup;
            }
        );
    }

    // user_id NULLABLE dengan sengaja - toko bisa belum punya pemilik
    // (diinput admin), lalu diklaim mitra lewat tabel klaim_mitra.
    public function pemilik(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function kategoriToko(): BelongsTo
    {
        return $this->belongsTo(KategoriToko::class);
    }

    public function produk(): HasMany
    {
        return $this->hasMany(Produk::class);
    }

    public function pesanan(): HasMany
    {
        return $this->hasMany(Pesanan::class);
    }

    public function review(): HasMany
    {
        return $this->hasMany(ReviewToko::class);
    }

    public function klaim(): HasMany
    {
        return $this->hasMany(KlaimMitra::class);
    }

    public function kunjunganToko(): HasMany
    {
        return $this->hasMany(KunjunganToko::class);
    }

    // Stage 21: fitur langganan - 1 toko punya 1 baris langganan aktif
    // (diperpanjang, bukan histori per periode) + banyak baris tagihan
    // (histori tagihan per bulan, lihat App\Models\Tagihan).
    public function langganan(): HasOne
    {
        return $this->hasOne(Langganan::class);
    }

    public function tagihan(): HasMany
    {
        return $this->hasMany(Tagihan::class);
    }
}
