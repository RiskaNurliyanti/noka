<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // Cuma domain frontend NOKA yang boleh akses (bukan wildcard '*') karena
    // supports_credentials = true dibutuhkan Sanctum SPA cookie auth.
    'allowed_origins' => [env('FRONTEND_URL', 'http://noka.test')],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
