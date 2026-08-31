<?php

namespace App\Models;

use App\Models\Concerns\MirrorsToSupabase;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * NOKA tidak proses pembayaran/pengiriman in-app - checkout cuma generate
 * link WhatsApp. Kolom 'status' (Stage 17) BUKAN buat jadi order-tracking
 * real-time - itu tetap di luar scope NOKA. Statusnya cuma pencatatan
 * manual oleh penjual/admin, terutama untuk merekam pembatalan yang
 * terjadi di luar sistem (lewat chat WhatsApp langsung ke toko).
 */
class Pesanan extends Model
{
    use HasUuids, MirrorsToSupabase;

    // WAJIB eksplisit - Eloquent salah tebak nama tabel jadi bentuk jamak
    // ala Inggris (mis. "pesanans") kalau tidak di-set manual, padahal
    // tabel bahasa Indonesia tidak berubah bentuk jamak.
    protected $table = 'pesanan';

    public $timestamps = false;

    // Daftar status valid - HARUS sinkron dengan CHECK constraint di
    // migration 2024_01_03_000004. Dipakai buat validasi di controller
    // supaya pesan error jelas sebelum mentok ke constraint database.
    public const STATUS_VALID = ['dibuat', 'diproses', 'selesai', 'dibatalkan'];

    protected $fillable = [
        'pembeli_id', 'guest_nama', 'guest_whatsapp', 'toko_id', 'kurir_id',
        'total_harga', 'alamat_antar', 'catatan', 'status',
        'alasan_pembatalan', 'dibatalkan_oleh_role',
    ];

    // Status yang sudah final - tidak bisa diubah/dibatalkan/diselesaikan lagi.
    public const STATUS_FINAL = ['selesai', 'dibatalkan'];

    // Stage 22: daftar kolom yang di-mirror ke Supabase (DualWriteMirror) -
    // sengaja whitelist eksplisit, bukan getFillable()/toArray(), supaya
    // tidak ikut menyalin relasi yang sedang di-eager-load di request itu.
    public const KOLOM_MIRROR = [
        'id', 'pembeli_id', 'guest_nama', 'guest_whatsapp', 'toko_id', 'kurir_id',
        'total_harga', 'alamat_antar', 'catatan', 'status',
        'alasan_pembatalan', 'dibatalkan_oleh_role', 'created_at', 'updated_at',
    ];

    protected function casts(): array
    {
        // 'created_at' HARUS eksplisit di-cast di sini juga - $timestamps=false
        // bikin Eloquent TIDAK otomatis cast created_at/updated_at ke Carbon
        // (beda dari model normal). Tanpa baris ini, $pesanan->created_at
        // cuma string mentah dari database, dan pemanggilan method Carbon
        // apa pun di atasnya (mis. ->format(), ->diffForHumans()) akan fatal
        // error "Call to a member function ... on string" - ini sempat jadi
        // bug nyata di LaporanPesananExcel saat export Excel.
        return ['total_harga' => 'decimal:2', 'created_at' => 'datetime', 'updated_at' => 'datetime'];
    }

    /**
     * $timestamps=false berarti Eloquent TIDAK otomatis isi updated_at
     * saat update() dipanggil - jadi diisi manual di sini lewat event
     * listener, supaya SEMUA jalur update (Mitra\PesananController,
     * Admin\PesananController, Mitra\KurirController) otomatis konsisten
     * tanpa perlu diingat-ingat set manual di tiap tempat.
     */
    protected static function booted(): void
    {
        static::updating(function (self $pesanan) {
            $pesanan->updated_at = now();
        });
    }

    public function pembeli(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pembeli_id');
    }

    public function toko(): BelongsTo
    {
        return $this->belongsTo(Toko::class);
    }

    public function kurir(): BelongsTo
    {
        return $this->belongsTo(Kurir::class);
    }

    public function item(): HasMany
    {
        return $this->hasMany(PesananItem::class);
    }
}
