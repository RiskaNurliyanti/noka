<?php

namespace App\Models;

use App\Models\Concerns\MirrorsToSupabase;
use Illuminate\Database\Eloquent\Model;

/**
 * Singleton row (id selalu 1). Dipakai App.jsx frontend buat cek
 * maintenance_mode dan admin_whatsapp buat halaman klaim mitra/kontak.
 */
// Pengaturan global aplikasi (nama web, logo, mode maintenance) - satu baris untuk seluruh sistem.
class PengaturanSistem extends Model
{
    use MirrorsToSupabase;

    protected $table = 'pengaturan_sistem';
    public $timestamps = false;
    public $incrementing = false;
    protected $fillable = ['nama_web', 'logo', 'admin_whatsapp', 'konfigurasi', 'maintenance_mode'];

    protected function casts(): array
    {
        return [
            'konfigurasi' => 'array',
            'maintenance_mode' => 'boolean',
        ];
    }

    // Ambil baris pengaturan sistem (cuma ada 1 baris untuk seluruh aplikasi).
    public static function current(): self
    {
        return static::findOrFail(1);
    }
}
