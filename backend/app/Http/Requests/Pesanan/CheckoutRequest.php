<?php

namespace App\Http\Requests\Pesanan;

use Illuminate\Foundation\Http\FormRequest;

// Validasi input checkout: toko, kurir (opsional), daftar produk, dan catatan.
class CheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // guest checkout diperbolehkan, dicek manual di controller
    }

    public function rules(): array
    {
        $rules = [
            'toko_id' => ['required', 'uuid', 'exists:toko,id'],
            'kurir_id' => ['nullable', 'uuid', 'exists:kurir,id'],
            'alamat_antar' => ['nullable', 'string'],
            'catatan' => ['nullable', 'string'],
            'item' => ['required', 'array', 'min:1'],
            'item.*.produk_id' => ['required', 'uuid', 'exists:produk,id'],
            'item.*.qty' => ['required', 'integer', 'min:1'],
            // Catatan PER PRODUK (mis. "sausnya manis mayo") - beda dari
            // 'catatan' di atas yang catatan UMUM satu pesanan.
            'item.*.catatan' => ['nullable', 'string'],
        ];

        // Guest (belum login) WAJIB isi nama & whatsapp - replikasi persis
        // constraint pembeli_or_guest di database.
        if (! $this->user()) {
            $rules['guest_nama'] = ['required', 'string', 'max:150'];
            $rules['guest_whatsapp'] = ['required', 'string', 'max:20'];
        }

        return $rules;
    }
}
