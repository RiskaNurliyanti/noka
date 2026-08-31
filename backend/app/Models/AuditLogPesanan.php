<?php

namespace App\Models;

use App\Models\Concerns\MirrorsToSupabase;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

<<<<<<< HEAD
// Riwayat perubahan status pesanan (siapa mengubah apa, kapan) - buat audit, cuma bisa dilihat super admin.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
class AuditLogPesanan extends Model
{
    use HasUuids, MirrorsToSupabase;

    protected $table = 'audit_log_pesanan';

    public $timestamps = false;

    protected $fillable = [
        'pesanan_id', 'user_id', 'role', 'aksi', 'data_sebelum', 'data_sesudah', 'ip_address', 'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'data_sebelum' => 'array',
            'data_sesudah' => 'array',
            'created_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (self $log) {
            $log->created_at = $log->created_at ?? now();
        });
    }

    public function pesanan(): BelongsTo
    {
        return $this->belongsTo(Pesanan::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
