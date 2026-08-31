<?php

use App\Http\Middleware\EnsureUserHasRole;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    // CATATAN: registrasi App\Providers\AppServiceProvider TIDAK di sini -
    // itu sudah otomatis ada di bootstrap/providers.php bawaan Laravel 11/12
    // (file terpisah, jangan ditimpa). Jangan tambah ->withProviders() di
    // sini kalau tidak yakin method itu ada di versi Laravel yang dipakai.
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Sanctum SPA cookie auth - butuh stateful middleware di grup 'api'
        $middleware->statefulApi();

        // Role middleware kustom, dipakai sebagai role:admin, role:super_admin, dst
        $middleware->alias([
            'role' => EnsureUserHasRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Response error konsisten sesuai format yang ditentukan (Section 23):
        // { success: false, message: "..." } - tidak membocorkan stack trace/SQL ke user.
        $exceptions->render(function (\Throwable $e, \Illuminate\Http\Request $request) {
            if (! $request->is('api/*')) {
                return null; // biarkan Laravel handle normal buat non-API request
            }

            $status = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;

            if ($e instanceof \Illuminate\Validation\ValidationException) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data yang dikirim tidak valid',
                    'errors' => $e->errors(),
                ], 422);
            }

            if ($e instanceof \Illuminate\Auth\AuthenticationException) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kamu harus login dulu',
                ], 401);
            }

            $message = $status === 500 && ! config('app.debug')
                ? 'Terjadi kesalahan pada server'
                : $e->getMessage();

            return response()->json([
                'success' => false,
                'message' => $message,
            ], $status ?: 500);
        });
    })->create();
