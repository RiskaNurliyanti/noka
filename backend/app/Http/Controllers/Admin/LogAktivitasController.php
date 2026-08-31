<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LogAktivitas;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

<<<<<<< HEAD
// Lihat log aktivitas pengguna di sistem.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
class LogAktivitasController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $log = LogAktivitas::with('user:id,nama')
            ->orderByDesc('created_at')
            ->limit($request->integer('limit', 5))
            ->get();

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $log]);
    }
}
