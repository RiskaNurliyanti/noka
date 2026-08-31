<?php

namespace App\Models;

use App\Models\Concerns\MirrorsToSupabase;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

<<<<<<< HEAD
// Banner promosi yang tampil di halaman utama.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
class Banner extends Model
{
    use HasUuids, MirrorsToSupabase;

    // WAJIB eksplisit - Eloquent salah tebak nama tabel jadi bentuk jamak
    // ala Inggris (mis. "banners") kalau tidak di-set manual, padahal
    // tabel bahasa Indonesia tidak berubah bentuk jamak.
    protected $table = 'banner';

    public $timestamps = false;
    protected $fillable = ['judul', 'gambar', 'link', 'urutan', 'status_aktif'];

    protected function casts(): array
    {
        return ['status_aktif' => 'boolean'];
    }
}
