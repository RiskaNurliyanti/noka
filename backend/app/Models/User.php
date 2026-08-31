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

    public function isRole(string $role): bool
    {
        return $this->role === $role;
    }

    public function isAdmin(): bool
    {
        return in_array($this->role, ['admin', 'super_admin'], true);
    }

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

    // Override notifikasi verifikasi email bawaan Laravel (yang defaultnya
    // template polos tanpa branding) - dipakai saat register email/password
    // (Stage 4: verifikasi email menggantikan login Google).
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
