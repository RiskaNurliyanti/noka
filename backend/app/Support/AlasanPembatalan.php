<?php

namespace App\Support;

/**
 * Daftar alasan pembatalan pesanan per role (Stage 18). Dipakai supaya
 * validasi alasan pembatalan KONSISTEN di semua controller yang bisa
 * membatalkan pesanan (pembeli, penjual/toko, kurir, admin & super_admin):
 *
 * - Toko: toko tutup, atau stok pesanan tidak tersedia (untuk toko).
 * - Kurir: kurir libur, toko tutup, atau stok pesanan tidak tersedia
 *   (untuk kurir - kurir kadang tahu duluan sebelum toko konfirmasi).
 * - Pembeli: mau ganti pesanan di toko lain, tidak jadi membeli, atau
 *   toko tutup.
 * - Admin/super_admin: SEMUA pilihan di atas tersedia (union, tanpa
 *   duplikat) - admin boleh mencatat pembatalan atas nama peran mana pun.
 */
class AlasanPembatalan
{
    public const TOKO_TUTUP = 'toko_tutup';
    public const STOK_TIDAK_TERSEDIA = 'stok_tidak_tersedia';
    public const KURIR_LIBUR = 'kurir_libur';
    public const GANTI_TOKO_LAIN = 'ganti_toko_lain';
    public const TIDAK_JADI_BELI = 'tidak_jadi_beli';

    public const UNTUK_TOKO = [self::TOKO_TUTUP, self::STOK_TIDAK_TERSEDIA];

    public const UNTUK_KURIR = [self::KURIR_LIBUR, self::TOKO_TUTUP, self::STOK_TIDAK_TERSEDIA];

    public const UNTUK_PEMBELI = [self::GANTI_TOKO_LAIN, self::TIDAK_JADI_BELI, self::TOKO_TUTUP];

    public const UNTUK_ADMIN = [
        self::TOKO_TUTUP, self::STOK_TIDAK_TERSEDIA, self::KURIR_LIBUR,
        self::GANTI_TOKO_LAIN, self::TIDAK_JADI_BELI,
    ];

    public const LABEL = [
        self::TOKO_TUTUP => 'Toko tutup',
        self::STOK_TIDAK_TERSEDIA => 'Stok pesanan tidak tersedia',
        self::KURIR_LIBUR => 'Kurir libur',
        self::GANTI_TOKO_LAIN => 'Pembeli mau ganti pesanan di toko lain',
        self::TIDAK_JADI_BELI => 'Pembeli tidak jadi membeli',
    ];

    /** Daftar alasan yang boleh dipakai role tertentu (dipakai validasi). */
    public static function untukRole(string $role): array
    {
        return match ($role) {
            'penjual', 'mitra_toko' => self::UNTUK_TOKO,
            'kurir', 'mitra_kurir' => self::UNTUK_KURIR,
            'pembeli' => self::UNTUK_PEMBELI,
            default => self::UNTUK_ADMIN, // admin & super_admin
        };
    }
}
