<?php

namespace App\Models;

use App\Models\Concerns\MirrorsToSupabase;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

<<<<<<< HEAD
// Produk/menu yang dijual sebuah toko.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
class Produk extends Model
{
    use HasUuids, MirrorsToSupabase;

    // WAJIB eksplisit - Eloquent salah tebak nama tabel jadi bentuk jamak
    // ala Inggris (mis. "produks") kalau tidak di-set manual, padahal
    // tabel bahasa Indonesia tidak berubah bentuk jamak.
    protected $table = 'produk';

    public $timestamps = false;

    protected $fillable = [
        'toko_id', 'kategori_id', 'nama', 'deskripsi', 'harga',
        'harga_diskon', 'foto', 'galeri', 'status_aktif',
    ];

    protected function casts(): array
    {
        return [
            'galeri' => 'array',
            'status_aktif' => 'boolean',
            'harga' => 'decimal:2',
            'harga_diskon' => 'decimal:2',
        ];
    }

    public function toko(): BelongsTo
    {
        return $this->belongsTo(Toko::class);
    }

    public function kategori(): BelongsTo
    {
        return $this->belongsTo(Kategori::class);
    }

    public function review(): HasMany
    {
        return $this->hasMany(ReviewProduk::class);
    }
}
