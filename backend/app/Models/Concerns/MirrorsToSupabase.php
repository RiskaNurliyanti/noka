<?php

namespace App\Models\Concerns;

use App\Services\DualWriteMirror;

trait MirrorsToSupabase
{
    public static function bootMirrorsToSupabase(): void
    {
        static::saved(function ($model) {
            DualWriteMirror::salin($model->getTable(), $model->getAttributes());
        });

        static::deleted(function ($model) {
            DualWriteMirror::hapus($model->getTable(), $model->getKey());
        });
    }
}
