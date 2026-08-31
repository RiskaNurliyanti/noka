<?php

namespace App\Models;

use App\Models\Concerns\MirrorsToSupabase;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LogAktivitas extends Model
{
    use HasUuids, MirrorsToSupabase;

    public $timestamps = false;
    protected $table = 'log_aktivitas';
    protected $fillable = ['user_id', 'aksi', 'detail'];

    protected function casts(): array
    {
        return ['detail' => 'array'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
