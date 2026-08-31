<?php

namespace App\Models;

use App\Models\Concerns\MirrorsToSupabase;
use Illuminate\Database\Eloquent\Model;

/**
 * Singleton row (id selalu 1). Dipakai App.jsx frontend buat cek
 * maintenance_mode dan admin_whatsapp buat halaman klaim mitra/kontak.
 */
<<<<<<< HEAD
// Pengaturan global aplikasi (nama web, logo, mode maintenance) - satu baris untuk seluruh sistem.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
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

<<<<<<< HEAD
    // Ambil baris pengaturan sistem (cuma ada 1 baris untuk seluruh aplikasi).
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
    public static function current(): self
    {
        return static::findOrFail(1);
    }
}
