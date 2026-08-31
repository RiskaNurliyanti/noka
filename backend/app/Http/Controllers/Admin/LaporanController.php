<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LaporanPengguna;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

<<<<<<< HEAD
// Tinjau laporan bug/pelanggaran yang dikirim pengguna.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
class LaporanController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = LaporanPengguna::with('user:id,nama,email,role,no_whatsapp');

        if ($request->filled('jenis')) {
            $query->where('jenis', $request->input('jenis'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        if ($request->filled('q')) {
            $kata = $request->input('q');
            $query->where(function ($q) use ($kata) {
                $q->where('judul', 'ilike', "%{$kata}%")
                    ->orWhere('deskripsi', 'ilike', "%{$kata}%")
                    ->orWhereHas('user', fn ($u) => $u->where('nama', 'ilike', "%{$kata}%"));
            });
        }

        $laporan = $query->orderByDesc('created_at')->paginate($request->integer('per_page', 20));

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $laporan]);
    }

    /**
     * Ubah status penanganan aduan + catatan admin opsional (mis. "sudah
     * diperbaiki di versi X" atau "toko sudah ditegur lewat WhatsApp").
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $laporan = LaporanPengguna::find($id);

        if (! $laporan) {
            return response()->json(['success' => false, 'message' => 'Laporan tidak ditemukan'], 404);
        }

        $data = $request->validate([
            'status' => ['required', Rule::in(LaporanPengguna::STATUS_VALID)],
            'catatan_admin' => ['nullable', 'string', 'max:2000'],
        ]);

        $laporan->update($data);

        return response()->json(['success' => true, 'message' => 'Status laporan diperbarui', 'data' => $laporan]);
    }
}
