<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KlaimMitra;
use App\Models\Kurir;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class KurirController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Kurir::with('pemilik:id,nama,email')
            ->withAvg('review as rating_rata_rata', 'rating')
            ->withCount('review as jumlah_review');

        if ($request->filled('status_verifikasi')) {
            $query->where('status_verifikasi', $request->input('status_verifikasi'));
        }

        if ($request->filled('q')) {
            $query->where('nama_layanan', 'ilike', '%'.$request->input('q').'%');
        }

        $kurir = $query->orderByDesc('created_at')->paginate($request->integer('per_page', 20));

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $kurir]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validatedData($request);
        $data['status_verifikasi'] = 'approved';
        $data['user_id'] = null;

        $kurir = Kurir::create($data);

        return response()->json(['success' => true, 'message' => 'Kurir berhasil ditambahkan', 'data' => $kurir], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $kurir = Kurir::findOrFail($id);
        $data = $this->validatedData($request, partial: true);
        $kurir->update($data);

        return response()->json(['success' => true, 'message' => 'Kurir berhasil diperbarui', 'data' => $kurir]);
    }

    public function destroy(string $id): JsonResponse
    {
        Kurir::findOrFail($id)->delete();

        return response()->json(['success' => true, 'message' => 'Kurir berhasil dihapus', 'data' => null]);
    }

    public function verifikasi(Request $request, string $id): JsonResponse
    {
        $kurir = Kurir::findOrFail($id);
        $data = $request->validate(['status_verifikasi' => ['required', Rule::in(['pending', 'approved', 'rejected'])]]);
        $kurir->update($data);

        return response()->json(['success' => true, 'message' => 'Status verifikasi diperbarui', 'data' => $kurir]);
    }

    public function statusAktif(Request $request, string $id): JsonResponse
    {
        $kurir = Kurir::findOrFail($id);
        $data = $request->validate(['status_aktif' => ['required', 'boolean']]);
        $kurir->update($data);

        return response()->json(['success' => true, 'message' => 'Status aktif diperbarui', 'data' => $kurir]);
    }

    /**
     * "Klaim cepat" oleh admin lewat email - dipakai KelolaKurir.jsx.
     *
     * CATATAN PERBAIKAN BUG: versi asli (Supabase) langsung UPDATE kolom
     * `status_klaim` di tabel `kurir` - kolom itu TIDAK PERNAH ADA di skema
     * SQL asli (dicek ulang, cuma ada status_verifikasi/status_aktif/
     * status_ketersediaan). Fitur ini kemungkinan sudah lama gagal/error di
     * produksi. Diperbaiki di sini dengan memakai jalur yang sudah benar
     * berjalan (tabel klaim_mitra + logic approve yang sama seperti
     * Admin\KlaimController::approve) - bukan mereplikasi kolom yang tidak
     * ada. Tetap tercatat di klaim_mitra untuk audit trail, cuma dibuat dan
     * langsung disetujui dalam satu langkah oleh admin.
     */
    public function klaimByEmail(Request $request, string $id): JsonResponse
    {
        $kurir = Kurir::findOrFail($id);

        if ($kurir->user_id !== null) {
            return response()->json(['success' => false, 'message' => 'Kurir ini sudah punya pemilik'], 422);
        }

        $data = $request->validate(['email' => ['required', 'email']]);
        $user = User::where('email', $data['email'])->first();

        if (! $user) {
            return response()->json(['success' => false, 'message' => 'Akun dengan email tersebut tidak ditemukan'], 404);
        }

        DB::transaction(function () use ($kurir, $user) {
            $klaim = KlaimMitra::create([
                'jenis' => 'kurir',
                'kurir_id' => $kurir->id,
                'toko_id' => null,
                'user_id' => $user->id,
                'catatan' => 'Ditautkan langsung oleh admin lewat email',
                'status' => 'approved',
            ]);

            $kurir->update(['user_id' => $user->id]);
            $user->update(['role' => 'mitra_kurir']);
        });

        return response()->json(['success' => true, 'message' => 'Kurir berhasil ditautkan ke akun tersebut', 'data' => $kurir->fresh()]);
    }

    private function validatedData(Request $request, bool $partial = false): array
    {
        $req = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'nama_layanan' => [$req, 'string', 'max:150'],
            'foto_logo' => ['sometimes', 'nullable', 'string'],
            'no_whatsapp' => [$req, 'string', 'max:20'],
            'kendaraan' => ['nullable', 'string'],
            'area_layanan' => ['nullable', 'string'],
            'jam_operasional' => ['nullable', 'string'],
        ]);
    }
}
