<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class ForgotPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // 'exists:users,email' SENGAJA tidak dipakai di sini - kalau dipakai,
        // response error akan langsung membocorkan apakah suatu email
        // terdaftar di NOKA atau tidak. Cek keberadaan email ditangani di
        // controller lewat Password::sendResetLink(), yang balasannya
        // digeneralisir supaya aman (sesuai instruksi Section 9).
        return [
            'email' => ['required', 'string', 'email'],
        ];
    }
}
