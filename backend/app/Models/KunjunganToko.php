<?php

namespace App\Models;

use App\Models\Concerns\MirrorsToSupabase;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

<<<<<<< HEAD
// Catatan kunjungan ke halaman satu toko tertentu.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
class KunjunganToko extends Model
{
    use HasUuids, MirrorsToSupabase;

    // WAJIB eksplisit - Eloquent salah tebak nama tabel jadi bentuk jamak
    // ala Inggris (mis. "kunjungan_tokos") kalau tidak di-set manual, padahal
    // tabel bahasa Indonesia tidak berubah bentuk jamak.
    protected $table = 'kunjungan_toko';

    public $timestamps = false;
    protected $fillable = ['toko_id'];

    public function toko(): BelongsTo
    {
        return $this->belongsTo(Toko::class);
    }
}
