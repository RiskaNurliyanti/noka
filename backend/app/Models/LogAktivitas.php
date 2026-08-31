<?php

namespace App\Models;

use App\Models\Concerns\MirrorsToSupabase;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

<<<<<<< HEAD
// Catatan aktivitas penting pengguna, buat keperluan audit/debug.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
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
