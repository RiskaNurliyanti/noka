<?php

namespace App\Models;

use App\Models\Concerns\MirrorsToSupabase;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Laporan bug atau pelanggaran yang dikirim pengguna ke admin.
class LaporanPengguna extends Model
{
    use HasUuids, MirrorsToSupabase;

    protected $table = 'laporan_pengguna';

    public $timestamps = false; // updated_at diisi manual, sama seperti Pesanan

    public const JENIS_VALID = ['bug', 'pelanggaran'];

    public const STATUS_VALID = ['pending', 'diproses', 'selesai', 'ditolak'];

    public const TARGET_JENIS_VALID = ['toko', 'kurir', 'produk', 'pesanan', 'pengguna', 'lainnya'];

    protected $fillable = [
        'user_id', 'jenis', 'judul', 'deskripsi', 'target_jenis', 'target_id',
        'lampiran_url', 'status', 'catatan_admin',
    ];

    protected function casts(): array
    {
        // 'created_at' WAJIB ikut di-cast eksplisit di sini (bukan cuma
        // updated_at) - $timestamps=false bikin Eloquent tidak otomatis
        // cast created_at ke Carbon, jadi kalau tidak dicantumkan di sini
        // nilainya cuma string mentah dari database (pola bug yang sama
        // pernah bikin export Excel pesanan error "Call to a member
        // function format() on string" - lihat App\Models\Pesanan).
        return ['created_at' => 'datetime', 'updated_at' => 'datetime'];
    }

    protected static function booted(): void
    {
        static::updating(function (self $laporan) {
            $laporan->updated_at = now();
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
