<?php

namespace App\Models;

use App\Models\Concerns\MirrorsToSupabase;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Langganan bulanan toko (Stage 21). Lihat migration 2024_01_05_000002
 * dan App\Services\TagihanService untuk skema biayanya.
 */
class Langganan extends Model
{
    use HasUuids, MirrorsToSupabase;

    protected $table = 'langganan';

    protected $fillable = ['toko_id', 'mulai_tanggal', 'berakhir_tanggal', 'status', 'harga_bulanan'];

    protected function casts(): array
    {
        return [
            'mulai_tanggal' => 'date',
            'berakhir_tanggal' => 'date',
        ];
    }

    public function toko(): BelongsTo
    {
        return $this->belongsTo(Toko::class);
    }

    /** Sisa hari sampai langganan berakhir - bisa negatif kalau sudah lewat. */
    public function sisaHari(): int
    {
        return (int) now('Asia/Makassar')->startOfDay()->diffInDays($this->berakhir_tanggal, false);
    }

    /** Dipakai buat notifikasi "langganan mau habis" - default ambang 7 hari. */
    public function akanHabis(int $ambangHari = 7): bool
    {
        $sisa = $this->sisaHari();

        return $this->status === 'aktif' && $sisa >= 0 && $sisa <= $ambangHari;
    }

    public function sudahKadaluarsa(): bool
    {
        return $this->sisaHari() < 0;
    }
}
