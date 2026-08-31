<?php

namespace App\Models;

use App\Models\Concerns\MirrorsToSupabase;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KategoriToko extends Model
{
    use HasUuids, MirrorsToSupabase;

    protected $table = 'kategori_toko';
    public $timestamps = false;
    protected $fillable = ['nama', 'icon'];

    public function toko(): HasMany
    {
        return $this->hasMany(Toko::class);
    }
}
