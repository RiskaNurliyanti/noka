<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::query();

        if ($request->filled('role')) {
            $query->where('role', $request->input('role'));
        }

        if ($request->filled('q')) {
            $query->where(fn ($q) => $q->where('nama', 'ilike', '%'.$request->input('q').'%')
                ->orWhere('email', 'ilike', '%'.$request->input('q').'%'));
        }

        $users = $query->orderByDesc('created_at')->paginate($request->integer('per_page', 20));

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $users]);
    }

    /**
     * Edit nama/no_whatsapp user lain (BUKAN role/email/status_aktif - itu
     * endpoint terpisah). Otorisasi sama seperti updateRole: admin biasa
     * tidak boleh edit akun admin/super_admin lain.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $actor = $request->user();
        $target = User::findOrFail($id);

        if (! $actor->isSuperAdmin() && in_array($target->role, ['admin', 'super_admin'], true)) {
            return response()->json(['success' => false, 'message' => 'Kamu tidak boleh mengedit akun admin/super_admin'], 403);
        }

        $data = $request->validate([
            'nama' => ['sometimes', 'string', 'max:150'],
            'no_whatsapp' => ['nullable', 'string', 'max:20'],
        ]);

        $target->update($data);

        return response()->json(['success' => true, 'message' => 'Profil pengguna diperbarui', 'data' => $target]);
    }

    public function updateRole(Request $request, string $id): JsonResponse
    {
        $actor = $request->user();
        $target = User::findOrFail($id);

        $rolesBolehAdmin = ['pembeli', 'mitra_toko', 'mitra_kurir'];
        $rolesBolehSuperAdmin = ['pembeli', 'mitra_toko', 'mitra_kurir', 'admin', 'super_admin'];

        $allowedRoles = $actor->isSuperAdmin() ? $rolesBolehSuperAdmin : $rolesBolehAdmin;

        $data = $request->validate([
            'role' => ['required', Rule::in($allowedRoles)],
        ]);

        if (! $actor->isSuperAdmin() && in_array($target->role, ['admin', 'super_admin'], true)) {
            return response()->json(['success' => false, 'message' => 'Kamu tidak boleh mengubah role admin/super_admin'], 403);
        }

        DB::transaction(function () use ($target, $data) {
            $roleLama = $target->role;
            $roleBaru = $data['role'];

            // Lepas kepemilikan toko/kurir kalau role mitra dicabut - riwayat
            // klaim TETAP ada di tabel klaim_mitra, cuma kepemilikan toko/kurir
            // yang dilepas (bisa diklaim ulang orang lain nanti).
            if ($roleLama === 'mitra_toko' && $roleBaru !== 'mitra_toko') {
                $target->toko()->update(['user_id' => null]);
            }
            if ($roleLama === 'mitra_kurir' && $roleBaru !== 'mitra_kurir') {
                $target->kurir()->update(['user_id' => null]);
            }

            $target->update(['role' => $roleBaru]);
        });

        return response()->json(['success' => true, 'message' => 'Role berhasil diubah', 'data' => $target->fresh()]);
    }

    public function updateStatusAktif(Request $request, string $id): JsonResponse
    {
        $actor = $request->user();
        $target = User::findOrFail($id);

        if (! $actor->isSuperAdmin() && in_array($target->role, ['admin', 'super_admin'], true)) {
            return response()->json(['success' => false, 'message' => 'Kamu tidak boleh menonaktifkan akun admin/super_admin'], 403);
        }

        if ($target->id === $actor->id) {
            return response()->json(['success' => false, 'message' => 'Kamu tidak bisa menonaktifkan akunmu sendiri'], 422);
        }

        $data = $request->validate(['status_aktif' => ['required', 'boolean']]);
        $target->update(['status_aktif' => $data['status_aktif']]);

        return response()->json(['success' => true, 'message' => 'Status akun diperbarui', 'data' => $target]);
    }
}
