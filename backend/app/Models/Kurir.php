<?php

namespace App\Models;

use App\Models\Concerns\MirrorsToSupabase;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

<<<<<<< HEAD
// Profil mitra kurir (jasa antar) beserta status ketersediaan dan verifikasinya.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
class Kurir extends Model
{
    use HasUuids, MirrorsToSupabase;

    // WAJIB eksplisit - Eloquent salah tebak nama tabel jadi bentuk jamak
    // ala Inggris (mis. "kurirs") kalau tidak di-set manual, padahal
    // tabel bahasa Indonesia tidak berubah bentuk jamak.
    protected $table = 'kurir';

    public $timestamps = false;

    protected $fillable = [
        'user_id', 'nama_layanan', 'foto_logo', 'no_whatsapp', 'kendaraan',
        'area_layanan', 'jam_operasional', 'status_ketersediaan',
        'status_aktif', 'status_verifikasi', 'notifikasi_dilihat_at',
    ];

    protected function casts(): array
    {
        return [
            'status_ketersediaan' => 'boolean',
            'status_aktif' => 'boolean',
        ];
    }

    // user_id NULLABLE dengan sengaja - sama seperti toko, fondasi klaim mitra.
    public function pemilik(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function pesanan(): HasMany
    {
        return $this->hasMany(Pesanan::class);
    }

    public function review(): HasMany
    {
        return $this->hasMany(ReviewKurir::class);
    }

    public function klaim(): HasMany
    {
        return $this->hasMany(KlaimMitra::class);
    }
}
