<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class PasswordResetController extends Controller
{
    /**
     * Kirim link reset password. Response SELALU sukses generik, tidak
     * peduli email terdaftar atau tidak - supaya tidak membocorkan email
     * mana yang punya akun NOKA (sesuai instruksi Section 9: "tidak
     * membocorkan apakah email tertentu terdaftar").
     *
     * Password::sendResetLink() dibungkus try-catch - kalau server SMTP
     * gagal (kredensial salah, server mail down, dsb), Laravel melempar
     * exception dari dalam pengiriman mail SYNCHRONOUS ini, yang tanpa
     * try-catch akan (1) membocorkan detail teknis SMTP mentah ke response
     * API, dan (2) membatalkan janji "response selalu generik" di atas -
     * pengguna jadi bisa membedakan email terdaftar/tidak dari ada-tidaknya
     * error 500. Exception dicatat ke log server buat admin, TAPI response
     * ke pengguna tetap pesan generik yang sama persis seperti kalau
     * berhasil.
     */
    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        try {
            Password::sendResetLink($request->only('email'));
        } catch (\Throwable $e) {
            Log::error('Gagal mengirim email reset password (kemungkinan konfigurasi SMTP salah): '.$e->getMessage());
        }

        // Status dari Password::sendResetLink() SENGAJA tidak dicek/dibedakan
        // di response - baik email ada maupun tidak, pesan yang balik sama.
        return response()->json([
            'success' => true,
            'message' => 'Kalau email tersebut terdaftar, link reset password sudah dikirim.',
            'data' => null,
        ]);
    }

    /**
     * Reset password pakai token. Laravel built-in Password::reset()
     * otomatis handle: token harus valid & belum expired (default 60
     * menit), dan token dihapus setelah dipakai (tidak bisa dipakai ulang).
     */
    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'success' => false,
                'message' => 'Token reset password tidak valid atau sudah kedaluwarsa. Silakan minta link baru.',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Password berhasil diperbarui. Silakan login dengan password baru.',
            'data' => null,
        ]);
    }
}
