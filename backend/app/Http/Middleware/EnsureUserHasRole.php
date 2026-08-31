<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware role, dipakai: ->middleware('role:admin') atau ->middleware('role:mitra_toko')
 *
 * Aturan (persis replikasi logic ProtectedRoute.jsx lama):
 * - super_admin SELALU boleh akses route yang butuh role 'admin' (super_admin
 *   adalah superset dari admin).
 * - Role lain harus cocok persis.
 * - Akun yang status_aktif = false diblokir di sini juga (bukan cuma di frontend).
 */
class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['success' => false, 'message' => 'Kamu harus login dulu'], 401);
        }

        if (! $user->status_aktif) {
            return response()->json(['success' => false, 'message' => 'Akun kamu dinonaktifkan'], 403);
        }

        $bolehMasuk = $user->role === $role || $user->role === 'super_admin';

        if (! $bolehMasuk) {
            return response()->json(['success' => false, 'message' => 'Kamu tidak punya akses ke fitur ini'], 403);
        }

        return $next($request);
    }
}
