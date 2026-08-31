<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLogPesanan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

// Lihat log audit perubahan status pesanan - khusus super admin.
class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AuditLogPesanan::with([
            'user:id,nama,email,role',
            'pesanan:id,toko_id,total_harga',
            'pesanan.toko:id,nama_toko',
        ]);

        if ($request->filled('bulan')) {
            $query->whereRaw("to_char(created_at, 'YYYY-MM') = ?", [$request->input('bulan')]);
        }

        if ($request->filled('toko_id')) {
            $query->whereHas('pesanan', fn ($p) => $p->where('toko_id', $request->input('toko_id')));
        }

        if ($request->filled('q')) {
            $kata = $request->input('q');
            $query->where(function ($q) use ($kata) {
                $q->where('aksi', 'ilike', "%{$kata}%")
                    ->orWhere('ip_address', 'ilike', "%{$kata}%")
                    ->orWhereHas('user', fn ($u) => $u->where('nama', 'ilike', "%{$kata}%")->orWhere('email', 'ilike', "%{$kata}%"))
                    ->orWhereHas('pesanan.toko', fn ($t) => $t->where('nama_toko', 'ilike', "%{$kata}%"));
            });
        }

        $logs = $query->orderByDesc('created_at')->paginate($request->integer('per_page', 25));

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $logs]);
    }
}
