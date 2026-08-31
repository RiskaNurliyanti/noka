<?php

namespace App\Models\Concerns;

use App\Services\DualWriteMirror;

/**
 * Stage 24: dual-write ke SEMUA tabel (bukan cuma pesanan seperti Stage
 * 22). Pasang `use MirrorsToSupabase;` di model mana pun supaya SETIAP
 * create/update/delete lewat model itu otomatis ke-mirror ke Supabase -
 * tidak perlu manggil DualWriteMirror manual di tiap controller lagi,
 * jadi tidak ada titik simpan yang kelewat.
 *
 * Dipasang lewat Eloquent model events ('saved' & 'deleted'), bukan di
 * controller, supaya konsisten ke-cover dari SEMUA jalur simpan (create,
 * update, factory/seeder, artisan tinker, dst) - bukan cuma yang lewat
 * endpoint API tertentu.
 *
 * getAttributes() dipakai (bukan toArray()) supaya nilai yang dikirim ke
 * Supabase adalah nilai MENTAH siap-simpan persis seperti yang baru saja
 * ditulis ke Neon (kolom jsonb/datetime sudah dalam bentuk string yang
 * benar, relasi yang di-eager-load TIDAK ikut terbawa).
 */
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
