<?php

namespace App\Models;

use App\Models\Concerns\MirrorsToSupabase;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Kategori PRODUK (Makanan, Minuman, Snack, dst). Nama tabel `kategori`
 * dipertahankan dari schema lama meski agak ambigu dengan kategori_toko.
 */
// Kategori produk (mis. Makanan, Minuman) - dipakai buat filter di halaman produk.
class Kategori extends Model
{
    use HasUuids, MirrorsToSupabase;

    // WAJIB eksplisit - tanpa ini Eloquent menebak nama tabel "kategoris"
    // (pluralisasi ala Inggris), padahal tabel aslinya "kategori" (Indonesia,
    // tidak berubah bentuk jamak). Bug ini sempat lolos sampai ketahuan saat
    // pemakaian nyata - pelajaran buat dicek ulang di model lain juga.
    protected $table = 'kategori';

    public $timestamps = false;
    protected $fillable = ['nama', 'icon'];

    public function produk(): HasMany
    {
        return $this->hasMany(Produk::class);
    }
}
