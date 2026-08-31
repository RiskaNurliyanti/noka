<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{

    public function register(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = User::create([
            'nama' => $data['nama'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'no_whatsapp' => $data['no_whatsapp'] ?? null,
            'role' => 'pembeli',
            'status_aktif' => true,
        ]);

        // Akun SUDAH tersimpan di atas sebelum baris ini - kalau pengiriman
        // email verifikasi gagal (mis. SMTP server salah kredensial/down),
        // itu TIDAK BOLEH bikin seluruh request register dianggap gagal
        // (respons 500 ke user), karena akunnya toh sudah benar-benar ada.
        // User cukup diberi tahu untuk pakai tombol "kirim ulang" nanti.
        try {
            $user->sendEmailVerificationNotification();
        } catch (\Throwable $e) {
            Log::error('Gagal mengirim email verifikasi saat registrasi (kemungkinan konfigurasi SMTP salah): '.$e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Registrasi berhasil! Cek email kamu dan klik link verifikasi sebelum login.',
            'data' => ['email' => $user->email],
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();

        if (! Auth::guard('web')->attempt($credentials, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Email atau password salah',
            ], 422);
        }

        $request->session()->regenerate();

        /** @var User $user */
        $user = Auth::guard('web')->user();

        if (! $user->hasVerifiedEmail()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();

            return response()->json([
                'success' => false,
                'code' => 'email_belum_verifikasi',
                'message' => 'Email kamu belum diverifikasi. Cek inbox/spam kamu, atau kirim ulang link verifikasi.',
            ], 403);
        }

        if (! $user->status_aktif) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();

            return response()->json([
                'success' => false,
                'message' => 'Akun kamu dinonaktifkan. Hubungi admin NOKA kalau menurutmu ini keliru.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil',
            'data' => $this->formatUser($user),
        ]);
    }

    /**
     * Diklik dari link di email verifikasi (route bertanda tangan/signed,
     * lihat VerifyEmailNotification). Setelah sukses, redirect balik ke
     * halaman login React.
     */
    public function verifyEmail(Request $request, string $id, string $hash): RedirectResponse
    {
        $frontendUrl = rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/');

        if (! $request->hasValidSignature()) {
            return redirect($frontendUrl.'/login?error=verifikasi_kedaluwarsa');
        }

        $user = User::find($id);

        if (! $user || ! hash_equals(sha1($user->getEmailForVerification()), $hash)) {
            return redirect($frontendUrl.'/login?error=verifikasi_gagal');
        }

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }

        return redirect($frontendUrl.'/login?verified=1');
    }

    /**
     * Kirim ulang email verifikasi. Response SELALU sukses generik (sama
     * seperti PasswordResetController::forgotPassword) supaya tidak
     * membocorkan email mana yang terdaftar di NOKA.
     */
    public function resendVerification(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        $user = User::where('email', $request->input('email'))->first();
        if ($user && ! $user->hasVerifiedEmail()) {
            try {
                $user->sendEmailVerificationNotification();
            } catch (\Throwable $e) {
                Log::error('Gagal mengirim ulang email verifikasi (kemungkinan konfigurasi SMTP salah): '.$e->getMessage());
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Kalau email tersebut terdaftar dan belum terverifikasi, link verifikasi baru sudah dikirim.',
            'data' => null,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil',
            'data' => null,
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['success' => false, 'message' => 'Belum login'], 401);
        }

        return response()->json([
            'success' => true,
            'message' => 'OK',
            'data' => $this->formatUser($user),
        ]);
    }

    /**
     * Update profil sendiri - HANYA nama, foto, no_whatsapp. Field sensitif
     * (email, role, status_aktif) SENGAJA tidak ada di sini - user tidak
     * boleh ubah role/status dirinya sendiri lewat endpoint ini.
     */
    public function updateMe(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'nama' => ['sometimes', 'string', 'max:150'],
            'no_whatsapp' => ['nullable', 'string', 'max:20'],
            'foto' => ['nullable', 'string'],
        ]);

        $user->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui',
            'data' => $this->formatUser($user),
        ]);
    }

    private function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'nama' => $user->nama,
            'email' => $user->email,
            'foto' => $user->foto,
            'no_whatsapp' => $user->no_whatsapp,
            'role' => $user->role,
            'status_aktif' => $user->status_aktif,
        ];
    }
}
