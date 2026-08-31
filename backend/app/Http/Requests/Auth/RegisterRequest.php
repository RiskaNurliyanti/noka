<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

<<<<<<< HEAD
// Validasi input form registrasi akun baru.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // publik, siapa saja boleh daftar
    }

    public function rules(): array
    {
        return [
            'nama' => ['required', 'string', 'max:150'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            // Password::defaults() dikonfigurasi di AppServiceProvider (min 8 karakter, sesuai
            // instruksi "password minimum sesuai konfigurasi aplikasi")
            'password' => ['required', 'confirmed', Password::defaults()],
            'no_whatsapp' => ['nullable', 'string', 'max:20'],
        ];

        // CATATAN PENTING: 'role' SENGAJA tidak ada di sini. Role registrasi
        // publik SELALU 'pembeli' (di-set di controller, bukan dari input
        // user) - mencegah orang daftar langsung jadi admin/mitra.
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'Email ini sudah terdaftar. Coba login atau pakai email lain.',
            'password.confirmed' => 'Konfirmasi password tidak sama.',
        ];
    }
}
