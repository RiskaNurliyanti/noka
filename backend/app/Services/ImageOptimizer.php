<?php

namespace App\Services;

/**
 * Stage 20 (kualitas foto HD): foto yang diupload user (dari HP, kamera,
 * dsb) kadang beresolusi SANGAT besar (4000px+) atau justru diupload apa
 * adanya tanpa kompresi yang wajar. Service ini menstandarkan foto yang
 * masuk supaya tetap tajam/HD saat ditampilkan tapi tidak membengkak:
 *
 * - Foto yang lebih besar dari MAX_DIMENSI di-resize turun (sisi terpanjang
 *   dipotong ke MAX_DIMENSI px, rasio aspek dipertahankan) - TIDAK PERNAH
 *   di-upscale (foto kecil dibiarkan apa adanya, upscale cuma bikin buram).
 * - Disimpan ulang dengan kualitas tinggi (JPEG quality 90, PNG compression
 *   level ringan) - jauh di atas kompresi default kamera HP kebanyakan,
 *   supaya hasil akhir terlihat jernih di ProductCard/StoreCard/galeri.
 * - Orientasi EXIF (dari foto kamera HP yang sering "kesimpan miring")
 *   diperbaiki otomatis sebelum resize.
 *
 * Pakai GD (extension bawaan PHP) bukan Intervention Image - supaya tidak
 * butuh composer install paket baru yang belum ada di composer.lock.
 * Kalau GD tidak tersedia atau file gagal diproses, GAGAL SENYAP (biarkan
 * file asli apa adanya) - optimasi foto tidak boleh menggagalkan upload.
 */
class ImageOptimizer
{
    private const MAX_DIMENSI = 2000; // px, sisi terpanjang

    private const KUALITAS_JPEG = 90; // 0-100, default GD cuma 75

    private const KOMPRESI_PNG = 6; // 0 (tanpa kompresi) - 9 (maksimal), 6 = seimbang

    public static function optimize(string $path): void
    {
        if (! extension_loaded('gd') || ! is_file($path)) {
            return;
        }

        try {
            $info = @getimagesize($path);
            if (! $info) {
                return;
            }

            [$lebar, $tinggi, $tipe] = $info;

            $gambar = match ($tipe) {
                IMAGETYPE_JPEG => @imagecreatefromjpeg($path),
                IMAGETYPE_PNG => @imagecreatefrompng($path),
                IMAGETYPE_WEBP => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($path) : null,
                default => null, // gif, dll - dibiarkan apa adanya
            };

            if (! $gambar) {
                return;
            }

            $gambar = self::perbaikiOrientasi($gambar, $path, $tipe);
            $lebar = imagesx($gambar);
            $tinggi = imagesy($gambar);

            if (max($lebar, $tinggi) > self::MAX_DIMENSI) {
                $gambar = self::resize($gambar, $lebar, $tinggi);
            }

            self::simpan($gambar, $path, $tipe);
            imagedestroy($gambar);
        } catch (\Throwable $e) {
            // Sengaja ditelan - optimasi cuma "bonus", upload tetap dianggap
            // berhasil dengan file asli kalau proses ini gagal karena apa pun.
        }
    }

    private static function resize($gambar, int $lebar, int $tinggi)
    {
        $rasio = $lebar / $tinggi;
        if ($lebar >= $tinggi) {
            $lebarBaru = self::MAX_DIMENSI;
            $tinggiBaru = (int) round(self::MAX_DIMENSI / $rasio);
        } else {
            $tinggiBaru = self::MAX_DIMENSI;
            $lebarBaru = (int) round(self::MAX_DIMENSI * $rasio);
        }

        $tujuan = imagecreatetruecolor($lebarBaru, $tinggiBaru);
        // Pertahankan transparansi PNG/WEBP - tanpa ini area transparan
        // berubah jadi hitam solid setelah resize.
        imagealphablending($tujuan, false);
        imagesavealpha($tujuan, true);

        // imagecopyresampled (bukan imagecopyresized) - pakai interpolasi
        // bicubic, hasil jauh lebih halus/tajam daripada nearest-neighbor.
        imagecopyresampled($tujuan, $gambar, 0, 0, 0, 0, $lebarBaru, $tinggiBaru, $lebar, $tinggi);
        imagedestroy($gambar);

        return $tujuan;
    }

    private static function simpan($gambar, string $path, int $tipe): void
    {
        match ($tipe) {
            IMAGETYPE_JPEG => imagejpeg($gambar, $path, self::KUALITAS_JPEG),
            IMAGETYPE_PNG => imagepng($gambar, $path, self::KOMPRESI_PNG),
            IMAGETYPE_WEBP => function_exists('imagewebp') ? imagewebp($gambar, $path, self::KUALITAS_JPEG) : null,
            default => null,
        };
    }

    /**
     * Foto dari kamera HP sering punya tag EXIF Orientation (mis. HP
     * dipegang miring saat motret) - tanpa dikoreksi, hasil resize ikut
     * miring/kesimpan salah arah walau tampak benar di preview HP.
     */
    private static function perbaikiOrientasi($gambar, string $path, int $tipe)
    {
        if ($tipe !== IMAGETYPE_JPEG || ! function_exists('exif_read_data')) {
            return $gambar;
        }

        $exif = @exif_read_data($path);
        $orientasi = $exif['Orientation'] ?? 1;

        return match ($orientasi) {
            3 => imagerotate($gambar, 180, 0),
            6 => imagerotate($gambar, -90, 0),
            8 => imagerotate($gambar, 90, 0),
            default => $gambar,
        };
    }
}
