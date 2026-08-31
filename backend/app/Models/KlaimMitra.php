<?php

namespace App\Models;

use App\Models\Concerns\MirrorsToSupabase;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KlaimMitra extends Model
{
    use HasUuids, MirrorsToSupabase;

    public $timestamps = false;
    protected $table = 'klaim_mitra';

    protected $fillable = [
        'jenis', 'toko_id', 'kurir_id', 'user_id', 'catatan', 'status',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function toko(): BelongsTo
    {
        return $this->belongsTo(Toko::class);
    }

    public function kurir(): BelongsTo
    {
        return $this->belongsTo(Kurir::class);
    }

    /**
     * Note untuk Phase 3 lanjutan (ClaimController::approve):
     * approval HANYA boleh dilakukan admin/super_admin, dan saat approve:
     *   - toko/kurir.user_id di-set ke klaim_mitra.user_id
     *   - user.role diubah ke mitra_toko / mitra_kurir sesuai jenis
     *   - klaim_mitra.status -> 'approved'
     * Ini harus jalan dalam DB transaction (atomicity) - kalau salah satu
     * langkah gagal, semuanya rollback. Belum diimplementasi di checkpoint
     * ini (Foundation) - masuk ke Checkpoint 3 (Core API).
     */
}
