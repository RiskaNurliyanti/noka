<<<<<<< HEAD
// Tinjau laporan bug/pelanggaran dari pengguna (admin).
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
import { useEffect, useState } from 'react'
import { api } from '../../lib/apiClient'
import { useToast } from '../../context/ToastContext'
import PageHeader from '../../components/PageHeader'
import Card from '../../components/Card'
import Badge from '../../components/Badge'
import Spinner from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import Pagination from '../../components/Pagination'
import SearchableSelect from '../../components/SearchableSelect'
import SafeImage from '../../components/SafeImage'

const LABEL_JENIS = { bug: '🐞 Bug', pelanggaran: '⚠️ Pelanggaran' }
const LABEL_STATUS = { pending: 'Menunggu', diproses: 'Diproses', selesai: 'Selesai', ditolak: 'Ditolak' }
const WARNA_STATUS = { pending: 'gray', diproses: 'brand', selesai: 'green', ditolak: 'red' }
const OPSI_STATUS = Object.keys(LABEL_STATUS)

export default function KelolaLaporan() {
  const { showToast } = useToast()
  const [jenis, setJenis] = useState('')
  const [status, setStatus] = useState('')
  const [cari, setCari] = useState('')
  const [laporan, setLaporan] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [detailId, setDetailId] = useState(null)
  const [catatanForm, setCatatanForm] = useState({})
  const [simpanId, setSimpanId] = useState(null)

  async function muat(pageNum = page) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ per_page: '10', page: String(pageNum) })
      if (jenis) params.set('jenis', jenis)
      if (status) params.set('status', status)
      if (cari) params.set('q', cari)
      const res = await api.get(`/admin/laporan?${params.toString()}`)
      setLaporan(res.data?.data || [])
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
  }, [jenis, status, cari])
  useEffect(() => { muat(page) }, [page])

  async function simpanStatus(l, statusBaru) {
    setSimpanId(l.id)
    try {
      await api.patch(`/admin/laporan/${l.id}/status`, {
        status: statusBaru,
        catatan_admin: catatanForm[l.id] ?? l.catatan_admin ?? '',
      })
      showToast('Status laporan diperbarui')
      muat(page)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSimpanId(null)
    }
  }

  return (
    <div>
      <PageHeader
        badge="📮 Aduan"
        title="Kelola aduan"
        subtitle="Laporan bug aplikasi dan pelanggaran dari pengguna NOKA (pembeli, penjual, kurir)."
      />

      <Card className="mb-6 flex flex-wrap items-end gap-3">
        <div className="w-full md:w-48">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Jenis</label>
          <SearchableSelect
            value={jenis}
            onChange={setJenis}
            placeholder="Semua jenis"
            options={[{ value: '', label: 'Semua jenis' }, ...Object.entries(LABEL_JENIS).map(([v, l]) => ({ value: v, label: l }))]}
          />
        </div>
        <div className="w-full md:w-48">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Status</label>
          <SearchableSelect
            value={status}
            onChange={setStatus}
            placeholder="Semua status"
            options={[{ value: '', label: 'Semua status' }, ...OPSI_STATUS.map((s) => ({ value: s, label: LABEL_STATUS[s] }))]}
          />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Cari</label>
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="🔍 Judul, isi laporan, atau nama pelapor..."
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
      </Card>

      {loading ? (
        <Spinner label="Memuat laporan..." />
      ) : laporan.length === 0 ? (
        <EmptyState
          icon="📮"
          title={cari ? 'Tidak ada laporan yang cocok' : 'Belum ada laporan'}
          description={cari ? 'Coba ubah kata kunci pencarian.' : 'Laporan bug/pelanggaran dari pengguna akan muncul di sini.'}
        />
      ) : (
        <div className="space-y-2">
          {laporan.map((l) => (
            <Card key={l.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{LABEL_JENIS[l.jenis]} — {l.judul}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    Oleh {l.user?.nama || 'Pengguna'} ({l.user?.role}) ·{' '}
                    {new Date(l.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge color={WARNA_STATUS[l.status]}>{LABEL_STATUS[l.status]}</Badge>
                  <button
                    onClick={() => setDetailId(detailId === l.id ? null : l.id)}
                    className="text-xs font-semibold text-brand-600 bg-brand-50 dark:bg-brand-950/40 rounded-full px-3 py-1.5"
                  >
                    {detailId === l.id ? 'Tutup' : 'Detail'}
                  </button>
                </div>
              </div>

              {detailId === l.id && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-sm space-y-3">
                  <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">{l.deskripsi}</p>
                  {l.lampiran_url && (
                    <SafeImage src={l.lampiran_url} alt="Lampiran laporan" className="max-w-xs rounded-xl border border-gray-200 dark:border-gray-700 object-cover" />
                  )}
                  {l.user?.email && <p className="text-xs text-gray-400 dark:text-gray-500">Kontak: {l.user.email}{l.user?.no_whatsapp ? ` · ${l.user.no_whatsapp}` : ''}</p>}

                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Catatan tindak lanjut</label>
                    <textarea
                      value={catatanForm[l.id] ?? l.catatan_admin ?? ''}
                      onChange={(e) => setCatatanForm((f) => ({ ...f, [l.id]: e.target.value }))}
                      rows={2}
                      placeholder="Mis. Sudah diperbaiki di update terbaru / Toko sudah ditegur lewat WhatsApp"
                      className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {OPSI_STATUS.map((s) => (
                      <button
                        key={s}
                        onClick={() => simpanStatus(l, s)}
                        disabled={simpanId === l.id}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full disabled:opacity-50 ${
                          l.status === s
                            ? 'bg-brand-500 text-white'
                            : 'border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        {LABEL_STATUS[s]}
                      </button>
                    ))}
                  </div>
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
