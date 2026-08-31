<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

<<<<<<< HEAD
// Validasi input form "lupa password" (cuma butuh email).
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
class ForgotPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
        ];
    }
}
