<?php

namespace App\Models;

use App\Models\Concerns\MirrorsToSupabase;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Tagihan langganan bulanan yang harus dibayar toko.
class Tagihan extends Model
{
    use HasUuids, MirrorsToSupabase;

    protected $table = 'tagihan';

    public $timestamps = false;

    protected $fillable = [
        'toko_id', 'periode', 'jumlah_transaksi', 'biaya_langganan',
        'biaya_tambahan', 'total', 'status_bayar', 'jatuh_tempo', 'dibayar_at',
    ];

    protected function casts(): array
    {
        return [
            'jatuh_tempo' => 'date',
            'dibayar_at' => 'datetime',
        ];
    }

    public function toko(): BelongsTo
    {
        return $this->belongsTo(Toko::class);
    }
}
