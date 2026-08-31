<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Http\Request;

/**
 * Sortir review produk/toko yang ditampilkan ke publik (ProdukDetail.jsx,
 * TokoDetail.jsx). Opsi 'relevan' mendahulukan review yang ada komentarnya
 * (dianggap lebih informatif buat calon pembeli) - tidak berbasis vote
 * "membantu" karena fitur itu belum ada di skema database.
 */
trait SortsReview
{
    protected function urutanReview(Request $request, $query)
    {
        $sort = $request->input('sort', 'terbaru');

        return match ($sort) {
            'terlama' => $query->orderBy('created_at'),
            'tertinggi' => $query->orderByDesc('rating')->orderByDesc('created_at'),
            'terendah' => $query->orderBy('rating')->orderByDesc('created_at'),
            'relevan' => $query->orderByRaw('komentar IS NULL')->orderByDesc('rating')->orderByDesc('created_at'),
            default => $query->orderByDesc('created_at'), // 'terbaru'
        };
    }
}
