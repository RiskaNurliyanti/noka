<?php

return [

    'defaults' => [
        'guard' => 'web',
        'passwords' => 'users',
    ],

    'guards' => [
        // 'web' dipakai login session biasa (Auth::guard('web')->attempt() di AuthController).
        'web' => [
            'driver' => 'session',
            'provider' => 'users',
        ],

        // 'sanctum' dipakai middleware auth:sanctum - resolve user dari cookie
        // session (SPA stateful) untuk domain yang terdaftar di SANCTUM_STATEFUL_DOMAINS.
        'sanctum' => [
            'driver' => 'sanctum',
            'provider' => 'users',
        ],
    ],

    'providers' => [
        'users' => [
            'driver' => 'eloquent',
            'model' => App\Models\User::class,
        ],
    ],

    // Dipakai Password::sendResetLink() / Password::reset() di PasswordResetController.
    // expire dalam menit (60 = sesuai instruksi Section 9 "token reset memiliki expiry").
    'passwords' => [
        'users' => [
            'provider' => 'users',
            'table' => 'password_reset_tokens',
            'expire' => 60,
            'throttle' => 60,
        ],
    ],

    'password_timeout' => 10800,

];
