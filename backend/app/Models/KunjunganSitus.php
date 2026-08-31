<?php

namespace App\Models;

use App\Models\Concerns\MirrorsToSupabase;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

<<<<<<< HEAD
// Catatan kunjungan ke situs NOKA secara umum (analitik pengunjung, bukan per toko).
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
class KunjunganSitus extends Model
{
    use HasUuids, MirrorsToSupabase;

    protected $table = 'kunjungan_situs';

    public $timestamps = false;

    protected $fillable = [
        'halaman', 'user_id', 'sesi_id', 'perangkat', 'referrer', 'user_agent', 'ip_address',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
