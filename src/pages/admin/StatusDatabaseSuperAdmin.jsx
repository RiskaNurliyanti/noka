<<<<<<< HEAD
// Cek kesehatan koneksi database Neon & Supabase (super admin).
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
import { useEffect, useState } from 'react'
import { api } from '../../lib/apiClient'
import { useToast } from '../../context/ToastContext'
import PageHeader from '../../components/PageHeader'
import Card from '../../components/Card'
import Badge from '../../components/Badge'
import Spinner from '../../components/Spinner'
import Button from '../../components/Button'

function formatWaktu(t) {
  if (!t) return '-'
  return new Date(t).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const LABEL_STATUS = {
  ok: 'OK',
  tabel_belum_ada: 'Tabel belum ada',
  tidak_terhubung: 'Tidak terhubung',
  error: 'Error',
}

function KolomDb({ judul, data }) {
  if (!data || data.status !== 'ok') {
    return (
      <div className="flex-1 min-w-[140px]">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-1">{judul}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 italic">
          {LABEL_STATUS[data?.status] || 'Tidak diketahui'}
          {data?.pesan_error && <span className="block text-[10px] text-red-400 mt-0.5 break-all">{data.pesan_error}</span>}
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 min-w-[140px]">
      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-1">{judul}</p>
      <p className="text-lg font-bold">{data.jumlah.toLocaleString('id-ID')} <span className="text-xs font-normal text-gray-400">baris</span></p>
      {data.contoh.length > 0 && (
        <ul className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 space-y-0.5">
          {data.contoh.map((c) => (
            <li key={c.id} className="truncate">
              {c.ringkas || c.id?.slice(0, 8)} <span className="text-gray-300 dark:text-gray-600">· {formatWaktu(c.created_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function StatusDatabaseSuperAdmin() {
  const { showToast } = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  async function muat() {
    setLoading(true)
    try {
      const res = await api.get('/admin/status-database')
      setData(res.data)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { muat() }, [])

  const tabelCocok = data?.tabel?.filter((t) => t.cocok).length || 0
  const totalTabel = data?.tabel?.length || 0

  return (
    <div>
      <PageHeader
        badge="🔍 Diagnostik"
        title="Status Database"
        subtitle="Bandingkan data yang benar-benar kebaca dari Neon (database utama) dan Supabase (cadangan/dual-write), per menu."
        action={<Button onClick={muat} loading={loading}>{loading ? 'Memuat...' : '🔄 Cek ulang'}</Button>}
      />

      {loading && !data ? (
        <Spinner label="Membandingkan Neon vs Supabase..." />
      ) : (
        <>
          <Card className="mb-6">
            {!data?.supabase_tersedia ? (
              <div className="flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Supabase belum terhubung</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Isi <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">DB_LEGACY_*</code> di <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">.env</code> backend
                    dan jalankan <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">SUPABASE-SCHEMA-LENGKAP.sql</code> dulu. Sampai saat itu, aplikasi tetap jalan normal 100% pakai Neon saja.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-xl">✅</span>
                <div>
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">Supabase terhubung</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {tabelCocok} dari {totalTabel} tabel jumlah barisnya cocok persis antara Neon & Supabase.
                    {tabelCocok < totalTabel && ' Selisih wajar kalau baru saja ada perubahan data (mirror sedikit delay), atau kalau belum pernah jalankan backfill untuk data lama.'}
                  </p>
                </div>
              </div>
            )}
          </Card>

          <div className="space-y-2">
            {data?.tabel?.map((t) => (
              <Card key={t.tabel}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold">{t.menu}</p>
                  <Badge color={t.cocok ? 'green' : 'gray'}>{t.cocok ? '✓ Cocok' : 'Beda/cek'}</Badge>
                </div>
                <div className="flex flex-wrap gap-4">
                  <KolomDb judul="🐘 Neon (utama)" data={t.neon} />
                  <KolomDb judul="⚡ Supabase (cadangan)" data={t.supabase} />
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
