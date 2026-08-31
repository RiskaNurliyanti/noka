<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * PHASE 4 — Migrasi Data.
 *
 * Baca dari koneksi 'pgsql_legacy' (Supabase Postgres lama), tulis ke
 * koneksi 'pgsql' (PostgreSQL Laravel baru). Urutan tabel MENGIKUTI foreign
 * key (parent dulu baru child), sesuai rencana di Phase 2/ARCHITECTURE.md.
 *
 * AMAN DIJALANKAN BERULANG: pakai insertOrIgnore berdasarkan primary key
 * (id) yang sama persis dengan Supabase (UUID dipertahankan apa adanya,
 * bukan digenerate ulang) - kalau command ini dijalankan 2x, baris yang
 * sudah ada di-skip, bukan diduplikasi atau bikin migrasi setengah jalan
 * jadi error.
 *
 * TIDAK menghapus/mengubah database Supabase sumber sama sekali - cuma
 * baca (SELECT), tidak pernah nulis ke koneksi pgsql_legacy.
 */
class MigrateFromSupabase extends Command
{
    protected $signature = 'noka:migrate-from-supabase
                            {--dry-run : Cuma hitung jumlah baris di sumber & tujuan, tidak menulis apa pun}
                            {--force : Lewati konfirmasi interaktif}';

    protected $description = 'Migrasi data NOKA dari Supabase Postgres lama ke PostgreSQL Laravel baru (Phase 4)';

    /**
     * Urutan MENGIKUTI foreign key - jangan diubah urutannya.
     * profiles->users ditangani terpisah (perlu mapping kolom, lihat migrateUsers()).
     */
    private array $tabelSederhana = [
        'kategori',
        'kategori_toko',
        'toko',
        'kurir',
        'produk',
        'favorit',
        'keranjang',
        'pesanan',
        'pesanan_item',
        'review_produk',
        'review_toko',
        'review_kurir',
        'kunjungan_toko',
        'banner',
        'log_aktivitas',
        'klaim_mitra',
    ];

    public function handle(): int
    {
        if (! config('database.connections.pgsql_legacy.host')) {
            $this->error('DB_LEGACY_HOST belum diisi di .env. Ambil connection string dari Supabase Dashboard > Project Settings > Database.');

            return self::FAILURE;
        }

        try {
            DB::connection('pgsql_legacy')->getPdo();
        } catch (\Throwable $e) {
            $this->error('Gagal konek ke database Supabase lama: '.$e->getMessage());

            return self::FAILURE;
        }

        $dryRun = (bool) $this->option('dry-run');

        if (! $dryRun && ! $this->option('force')) {
            $this->warn('Ini akan menyalin data dari Supabase ke database PostgreSQL Laravel yang aktif sekarang.');
            $this->warn('Database Supabase TIDAK akan diubah/dihapus. Proses ini aman dijalankan berulang.');
            if (! $this->confirm('Lanjutkan?')) {
                $this->info('Dibatalkan.');

                return self::SUCCESS;
            }
        }

        $this->info($dryRun ? 'DRY RUN - cuma menghitung, tidak menulis data' : 'Memulai migrasi data...');
        $this->newLine();

        $ringkasan = [];

        $ringkasan['users (dari profiles)'] = $this->migrateUsers($dryRun);

        foreach ($this->tabelSederhana as $tabel) {
            $ringkasan[$tabel] = $this->migrateTabelSederhana($tabel, $dryRun);
        }

        $ringkasan['pengaturan_sistem'] = $this->migratePengaturanSistem($dryRun);

        $this->newLine();
        $this->table(
            ['Tabel', 'Baris di Supabase', 'Baris disalin/cocok', 'Status'],
            collect($ringkasan)->map(fn ($r, $tabel) => [
                $tabel, $r['sumber'], $r['disalin'], $r['sumber'] === $r['disalin'] ? '✅ cocok' : '⚠️  cek manual',
            ])->values()
        );

        $adaSelisih = collect($ringkasan)->contains(fn ($r) => $r['sumber'] !== $r['disalin']);

        if ($adaSelisih && ! $dryRun) {
            $this->warn('Ada tabel yang jumlah barisnya tidak cocok persis. Ini BISA NORMAL kalau command');
            $this->warn('pernah dijalankan sebagian sebelumnya (baris lama di-skip, bukan error) - tapi');
            $this->warn('sebaiknya diperiksa manual sebelum mematikan Supabase lama.');
        }

        $this->newLine();
        $this->info($dryRun
            ? 'Dry run selesai. Jalankan tanpa --dry-run untuk migrasi sungguhan.'
            : 'Migrasi selesai. JANGAN matikan/hapus project Supabase lama sebelum verifikasi manual.');

        return self::SUCCESS;
    }

    /**
     * profiles (Supabase) -> users (Laravel). Field password & google_id
     * SENGAJA dikosongkan - Supabase tidak pernah menyimpan password di
     * profiles (auth ada di auth.users terpisah, dan NOKA lama cuma pakai
     * Google OAuth). User lama otomatis bisa login lagi dengan 2 cara:
     *   1. Login Google lagi -> google_id otomatis ditautkan by email
     *      (lihat GoogleAuthController::callback)
     *   2. Pakai "Lupa Password" untuk set password baru
     * Ini BUKAN kehilangan data - password memang tidak pernah ada untuk
     * user Google-only, dan Supabase auth.users tidak bisa/boleh diakses
     * langsung untuk ambil password hash (juga tidak berguna, algoritma
     * hash berbeda dengan Laravel).
     */
    private function migrateUsers(bool $dryRun): array
    {
        $sumber = DB::connection('pgsql_legacy')->table('profiles')->count();

        if ($dryRun) {
            return ['sumber' => $sumber, 'disalin' => DB::table('users')->count()];
        }

        DB::connection('pgsql_legacy')->table('profiles')->orderBy('id')->chunk(500, function ($rows) {
            $data = $rows->map(fn ($r) => [
                'id' => $r->id,
                'nama' => $r->nama,
                'email' => $r->email,
                'password' => null,
                'google_id' => null,
                'foto' => $r->foto,
                'no_whatsapp' => $r->no_whatsapp,
                'status_aktif' => $r->status_aktif,
                'role' => $r->role,
                'created_at' => $r->created_at,
                'updated_at' => null,
            ])->toArray();

            DB::table('users')->insertOrIgnore($data);
        });

        return ['sumber' => $sumber, 'disalin' => DB::table('users')->count()];
    }

    private function migrateTabelSederhana(string $tabel, bool $dryRun): array
    {
        $sumber = DB::connection('pgsql_legacy')->table($tabel)->count();

        if ($dryRun) {
            return ['sumber' => $sumber, 'disalin' => DB::table($tabel)->count()];
        }

        DB::connection('pgsql_legacy')->table($tabel)->orderBy('id')->chunk(500, function ($rows) use ($tabel) {
            $data = $rows->map(fn ($r) => (array) $r)->toArray();
            DB::table($tabel)->insertOrIgnore($data);
        });

        return ['sumber' => $sumber, 'disalin' => DB::table($tabel)->count()];
    }

    /**
     * Singleton row (id=1) sudah di-seed migration - jadi di sini UPDATE,
     * bukan insert, supaya tidak bentrok sama constraint single_row.
     */
    private function migratePengaturanSistem(bool $dryRun): array
    {
        $sumber = DB::connection('pgsql_legacy')->table('pengaturan_sistem')->where('id', 1)->first();

        if (! $sumber) {
            return ['sumber' => 0, 'disalin' => 0];
        }

        if (! $dryRun) {
            DB::table('pengaturan_sistem')->where('id', 1)->update([
                'nama_web' => $sumber->nama_web,
                'logo' => $sumber->logo,
                'admin_whatsapp' => $sumber->admin_whatsapp,
                'konfigurasi' => $sumber->konfigurasi,
                'maintenance_mode' => $sumber->maintenance_mode,
            ]);
        }

        return ['sumber' => 1, 'disalin' => 1];
    }
}
