<?php

namespace App\Models;

use App\Models\Concerns\MirrorsToSupabase;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

<<<<<<< HEAD
// Review & rating pembeli untuk sebuah toko.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
class ReviewToko extends Model
{
    use HasUuids, MirrorsToSupabase;

    // WAJIB eksplisit - Eloquent salah tebak nama tabel jadi bentuk jamak
    // ala Inggris (mis. "review_tokos") kalau tidak di-set manual, padahal
    // tabel bahasa Indonesia tidak berubah bentuk jamak.
    protected $table = 'review_toko';

    public $timestamps = false;
    protected $fillable = ['user_id', 'pesanan_id', 'toko_id', 'rating', 'komentar', 'status_moderasi', 'update_count'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function pesanan(): BelongsTo
    {
        return $this->belongsTo(Pesanan::class);
    }

    public function toko(): BelongsTo
    {
        return $this->belongsTo(Toko::class);
    }
}
