<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PengaturanSistem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

/**
 * Route ini dipasang di belakang middleware role:super_admin (bukan admin
 * biasa) - lihat routes/api.php. Ini pengaturan tingkat sistem (maintenance
 * mode, dll), bukan operasional harian.
 */
<<<<<<< HEAD
// Kelola pengaturan global aplikasi (nama web, logo, dll) dan tes kirim email.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
class PengaturanController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json(['success' => true, 'message' => 'OK', 'data' => PengaturanSistem::current()]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nama_web' => ['sometimes', 'string', 'max:100'],
            'logo' => ['sometimes', 'nullable', 'string'],
            'admin_whatsapp' => ['nullable', 'string', 'max:20'],
            'konfigurasi' => ['nullable', 'array'],
            'maintenance_mode' => ['sometimes', 'boolean'],
        ]);

        $pengaturan = PengaturanSistem::current();
        $pengaturan->update($data);

        return response()->json(['success' => true, 'message' => 'Pengaturan berhasil diperbarui', 'data' => $pengaturan]);
    }

    /**
     * Tes kirim email langsung dari UI, tanpa perlu akses terminal/log
     * server sama sekali - dibuat karena banyak masalah SMTP (kredensial
     * Gmail App Password salah, host/port keliru, dll) sebelumnya cuma
     * bisa didiagnosis lewat storage/logs/laravel.log, yang butuh akses
     * server yang tidak semua pengelola NOKA punya.
     *
     * KHUSUS super_admin (rawan disalahgunakan buat kirim email sembarangan
     * kalau dibuka ke role lain) - dan BEDA dari alur reset password publik
     * yang sengaja menyembunyikan pesan error asli (di sini pesan error
     * SMTP mentah SENGAJA ditampilkan apa adanya, karena yang minta
     * memang admin yang perlu tahu detail teknisnya buat debug).
     */
    public function testEmail(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        try {
            Mail::raw(
                "Ini email tes dari NOKA, dikirim lewat menu Pengaturan Sistem > Tes Email.\n\n".
                'Kalau email ini sampai ke inbox kamu, berarti konfigurasi SMTP di .env sudah benar.',
                function ($message) use ($data) {
                    $message->to($data['email'])->subject('NOKA - Tes konfigurasi email');
                }
            );

            return response()->json([
                'success' => true,
                'message' => "Email tes berhasil dikirim ke {$data['email']}. Cek inbox (dan folder spam) - kalau tidak sampai dalam beberapa menit, kemungkinan bukan masalah SMTP lagi, coba cek alamat emailnya.",
                'data' => null,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengirim email tes. Ini pesan error asli dari server SMTP:',
                'data' => ['error_asli' => $e->getMessage()],
            ], 422);
        }
    }
}
