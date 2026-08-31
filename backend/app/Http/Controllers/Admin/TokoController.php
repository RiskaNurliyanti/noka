<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Langganan;
use App\Models\Toko;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

// Kelola akun toko dari sisi admin: verifikasi, aktif/nonaktifkan, dll.
class TokoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Toko::with(['kategoriToko', 'pemilik:id,nama,email']);

        if ($request->filled('status_verifikasi')) {
            $query->where('status_verifikasi', $request->input('status_verifikasi'));
        }

        if ($request->filled('q')) {
            $query->where('nama_toko', 'ilike', '%'.$request->input('q').'%');
        }

        $toko = $query->orderByDesc('created_at')->paginate($request->integer('per_page', 20));

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $toko]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validatedData($request);
        $data['status_verifikasi'] = 'approved';
        $data['user_id'] = null;

        $toko = Toko::create($data);

        return response()->json(['success' => true, 'message' => 'Toko berhasil ditambahkan', 'data' => $toko], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $toko = Toko::findOrFail($id);
        $data = $this->validatedData($request, partial: true);
        $toko->update($data);

        return response()->json(['success' => true, 'message' => 'Toko berhasil diperbarui', 'data' => $toko]);
    }

    public function destroy(string $id): JsonResponse
    {
        Toko::findOrFail($id)->delete();

        return response()->json(['success' => true, 'message' => 'Toko berhasil dihapus', 'data' => null]);
    }

    // Setujui/tolak pendaftaran toko baru.
    public function verifikasi(Request $request, string $id): JsonResponse
    {
        $toko = Toko::findOrFail($id);
        $data = $request->validate(['status_verifikasi' => ['required', Rule::in(['pending', 'approved', 'rejected'])]]);
        $sebelumnyaApproved = $toko->status_verifikasi === 'approved';
        $toko->update($data);

        if ($data['status_verifikasi'] === 'approved' && ! $sebelumnyaApproved) {
            Langganan::firstOrCreate(
                ['toko_id' => $toko->id],
                ['mulai_tanggal' => now(), 'berakhir_tanggal' => now()->addDays(30), 'status' => 'aktif']
            );
        }

        return response()->json(['success' => true, 'message' => 'Status verifikasi diperbarui', 'data' => $toko]);
    }

    // Aktifkan/nonaktifkan akun toko.
    public function statusAktif(Request $request, string $id): JsonResponse
    {
        $toko = Toko::findOrFail($id);
        $data = $request->validate(['status_aktif' => ['required', 'boolean']]);
        $toko->update($data);

        return response()->json(['success' => true, 'message' => 'Status aktif diperbarui', 'data' => $toko]);
    }

    // Aturan validasi input, dipakai bareng oleh store() dan update().
    private function validatedData(Request $request, bool $partial = false): array
    {
        $req = $partial ? 'sometimes' : 'required';

        // '' -> null: lihat catatan di Mitra\TokoController::update() -
        // <input type="time"> yang dikosongkan browser mengirim string
        // kosong, dan 'nullable' Laravel tidak menganggap itu sama dengan
        // null, jadi date_format tetap divalidasi dan gagal kalau tidak
        // dikonversi dulu.
        foreach (['jam_buka', 'jam_tutup'] as $field) {
            if ($request->input($field) === '') {
                $request->merge([$field => null]);
            }
        }

        return $request->validate([
            'nama_toko' => [$req, 'string', 'max:150'],
            'deskripsi' => ['nullable', 'string'],
            'no_whatsapp' => [$req, 'string', 'max:20'],
            'kategori_toko_id' => ['nullable', 'uuid', 'exists:kategori_toko,id'],
            'foto_banner' => ['sometimes', 'nullable', 'string'],
            'foto_logo' => ['sometimes', 'nullable', 'string'],
            'galeri' => ['nullable', 'array'],
            'alamat' => ['nullable', 'string'],
            'kecamatan' => ['nullable', 'string'],
            'desa' => ['nullable', 'string'],
            'lokasi_lat' => ['nullable', 'numeric'],
            'lokasi_lng' => ['nullable', 'numeric'],
            'jam_buka' => ['nullable', 'date_format:H:i'],
            'jam_tutup' => ['nullable', 'date_format:H:i'],
        ]);
    }
}
