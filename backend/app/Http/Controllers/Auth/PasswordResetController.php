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
