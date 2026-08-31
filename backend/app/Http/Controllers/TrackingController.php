<?php

namespace App\Http\Controllers;

use App\Models\KunjunganSitus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

// Catat kunjungan/aktivitas pengunjung situs (analitik).
class TrackingController extends Controller
{
    // Catat satu event kunjungan/aktivitas pengunjung.
    public function catat(Request $request): JsonResponse
    {
        $data = $request->validate([
            'halaman' => ['required', 'string', 'max:255'],
            'sesi_id' => ['required', 'string', 'max:64'],
            'perangkat' => ['nullable', 'string', 'in:mobile,desktop,tablet'],
            'referrer' => ['nullable', 'string', 'max:255'],
        ]);

        KunjunganSitus::create([
            ...$data,
            'user_id' => $request->user()?->id,
            'user_agent' => substr((string) $request->userAgent(), 0, 255),
            'ip_address' => $request->ip(),
        ]);

        // 201 tanpa body berarti - frontend fire-and-forget, tidak perlu apa-apa balik.
        return response()->json(['success' => true, 'message' => 'OK', 'data' => null], 201);
    }
}
