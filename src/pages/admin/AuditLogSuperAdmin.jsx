<<<<<<< HEAD
// Lihat log audit perubahan pesanan, khusus super admin.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
import { useEffect, useState } from 'react'
import { api } from '../../lib/apiClient'
import { useToast } from '../../context/ToastContext'
import { LABEL_ALASAN_PEMBATALAN } from '../../lib/alasanPembatalan'
import PageHeader from '../../components/PageHeader'
import Card from '../../components/Card'
import Badge from '../../components/Badge'
import Spinner from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import Pagination from '../../components/Pagination'
import SearchableSelect from '../../components/SearchableSelect'

const LABEL_AKSI = { dibuat: 'Dibuat', diproses: 'Diproses', selesai: 'Selesai', dibatalkan: 'Dibatalkan' }
const WARNA_AKSI = { dibuat: 'gray', diproses: 'brand', selesai: 'green', dibatalkan: 'red' }

function bulanIni() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function formatWaktu(t) {
  return new Date(t).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB'
}
function labelNilai(field, val) {
  if (val == null) return '-'
  if (field === 'status') return LABEL_AKSI[val] || val
  if (field === 'alasan_pembatalan') return LABEL_ALASAN_PEMBATALAN[val] || val
  return String(val)
}

export default function AuditLogSuperAdmin() {
  const { showToast } = useToast()
  const [bulan, setBulan] = useState(bulanIni())
  const [tokoId, setTokoId] = useState('')
  const [cari, setCari] = useState('')
  const [daftarToko, setDaftarToko] = useState([])
  const [logs, setLogs] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [detailId, setDetailId] = useState(null)

  useEffect(() => {
    api.get('/admin/toko?per_page=500').then((res) => {
      setDaftarToko((res.data?.data || []).map((t) => ({ value: t.id, label: t.nama_toko })))
    })
  }, [])

  async function muat(pageNum = page) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ per_page: '20', page: String(pageNum) })
      if (bulan) params.set('bulan', bulan)
      if (tokoId) params.set('toko_id', tokoId)
      if (cari) params.set('q', cari)
      const res = await api.get(`/admin/audit-log?${params.toString()}`)
      setLogs(res.data?.data || [])
      setTotalPages(Math.max(1, res.data?.last_page || 1))
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => { muat(1); setPage(1) }, 400)
    return () => clearTimeout(timer)
  }, [bulan, tokoId, cari])
  useEffect(() => { muat(page) }, [page])

  return (
    <div>
      <PageHeader
        badge="🔒 Keamanan"
        title="Audit Log Pesanan"
        subtitle="Jejak siapa mengubah apa pada pesanan mana, lengkap dengan nilai sebelum/sesudah, IP, dan device - khusus super admin."
      />

      <Card className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Bulan</label>
          <input
            type="month"
            value={bulan}
            onChange={(e) => setBulan(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
        <div className="w-full md:w-64">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Toko</label>
          <SearchableSelect value={tokoId} onChange={setTokoId} placeholder="Semua toko" options={[{ value: '', label: 'Semua toko' }, ...daftarToko]} />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Cari</label>
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="🔍 Nama pelaku, email, aksi, atau IP..."
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
      </Card>

      {loading ? (
        <Spinner label="Memuat audit log..." />
      ) : logs.length === 0 ? (
        <EmptyState icon="🔒" title="Belum ada log" description="Perubahan status pesanan akan tercatat di sini." />
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <Card key={log.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {log.user?.nama || 'Sistem'} <span className="text-xs font-normal text-gray-400 dark:text-gray-500">({log.role || '-'})</span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {formatWaktu(log.created_at)} · Toko: {log.pesanan?.toko?.nama_toko || '-'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color={WARNA_AKSI[log.aksi]}>{LABEL_AKSI[log.aksi] || log.aksi}</Badge>
                  <button
                    onClick={() => setDetailId(detailId === log.id ? null : log.id)}
                    className="text-xs font-semibold text-brand-600 bg-brand-50 dark:bg-brand-950/40 rounded-full px-3 py-1.5"
                  >
                    {detailId === log.id ? 'Tutup' : 'Detail'}
                  </button>
                </div>
              </div>

              {detailId === log.id && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-2">
                      <p className="font-semibold text-red-600 dark:text-red-400 mb-1">Sebelum</p>
                      {Object.entries(log.data_sebelum || {}).map(([k, v]) => (
                        <p key={k} className="text-gray-600 dark:text-gray-300">{k}: {labelNilai(k, v)}</p>
                      ))}
                    </div>
                    <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-2">
                      <p className="font-semibold text-green-600 dark:text-green-400 mb-1">Sesudah</p>
                      {Object.entries(log.data_sesudah || {}).map(([k, v]) => (
                        <p key={k} className="text-gray-600 dark:text-gray-300">{k}: {labelNilai(k, v)}</p>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-400 dark:text-gray-500">
                    Pesanan #{log.pesanan_id?.slice(0, 8) || '-'} · Nilai: Rp{Number(log.pesanan?.total_harga || 0).toLocaleString('id-ID')}
                  </p>
                  <p className="text-gray-400 dark:text-gray-500">
                    IP: {log.ip_address || '-'} · Device: <span className="break-all">{log.user_agent || '-'}</span>
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  )
}
