<?php

namespace App\Models;

use App\Models\Concerns\MirrorsToSupabase;
use App\Notifications\ResetPasswordNotification;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

<<<<<<< HEAD
// Akun pengguna NOKA - satu tabel untuk semua role (pembeli, mitra toko, mitra kurir, admin, super admin).
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasUuids, MirrorsToSupabase, Notifiable;

    protected $fillable = [
        'nama', 'email', 'password', 'google_id', 'foto',
        'no_whatsapp', 'status_aktif', 'role', 'notifikasi_dilihat_at',
    ];

    protected $hidden = [
        'password', 'remember_token', 'google_id',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'status_aktif' => 'boolean',
        ];
    }

    // ---- Role helpers (nama role TIDAK diubah, persis 5 nilai lama) ----

<<<<<<< HEAD
    // Cek apakah role user ini sama dengan yang dicek.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
    public function isRole(string $role): bool
    {
        return $this->role === $role;
    }

<<<<<<< HEAD
    // Cek apakah user ini admin (atau super admin).
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
    public function isAdmin(): bool
    {
        return in_array($this->role, ['admin', 'super_admin'], true);
    }

<<<<<<< HEAD
    // Cek apakah user ini super admin.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    // Override notifikasi reset password bawaan Laravel supaya link mengarah
    // ke halaman React (FRONTEND_URL/reset-password), bukan route Blade.
    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification($token));
    }

<<<<<<< HEAD
    // Override bawaan Laravel biar email verifikasi pakai template sendiri.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new VerifyEmailNotification);
    }

    // ---- Relasi ----

    public function toko(): HasMany
    {
        return $this->hasMany(Toko::class);
    }

    public function kurir(): HasMany
    {
        return $this->hasMany(Kurir::class);
    }

    public function pesanan(): HasMany
    {
        return $this->hasMany(Pesanan::class, 'pembeli_id');
    }

    public function favorit(): HasMany
    {
        return $this->hasMany(Favorit::class);
    }

    public function keranjang(): HasMany
    {
        return $this->hasMany(Keranjang::class);
    }

    public function klaimMitra(): HasMany
    {
        return $this->hasMany(KlaimMitra::class);
    }
}
