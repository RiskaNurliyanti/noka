// Laporan penjualan toko sendiri, bisa diexport.
import { useEffect, useState } from 'react'
import { api, unduhFile } from '../../lib/apiClient'
import { useToast } from '../../context/ToastContext'
import { LABEL_ALASAN_PEMBATALAN, ALASAN_UNTUK_TOKO } from '../../lib/alasanPembatalan'
import PageHeader from '../../components/PageHeader'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Badge from '../../components/Badge'
import Spinner from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import Pagination from '../../components/Pagination'
import SearchableSelect from '../../components/SearchableSelect'
import FilterPeriode from '../../components/FilterPeriode'
import ModalAlasanPembatalan from '../../components/ModalAlasanPembatalan'

const LABEL_STATUS = { dibuat: 'Dibuat', diproses: 'Diproses', selesai: 'Selesai', dibatalkan: 'Dibatalkan' }
const WARNA_STATUS = { dibuat: 'gray', diproses: 'brand', selesai: 'green', dibatalkan: 'red' }
const OPSI_STATUS = Object.keys(LABEL_STATUS)

function bulanIni() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function LaporanToko() {
  const { showToast } = useToast()
  const [periode, setPeriode] = useState({ bulan: bulanIni() })
  const [cari, setCari] = useState('')
  const [pesanan, setPesanan] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [mengunduh, setMengunduh] = useState(false)
  const [detailId, setDetailId] = useState(null)
  const [pesananDibatalkan, setPesananDibatalkan] = useState(null)
  const [prosesLoading, setProsesLoading] = useState(false)

  async function muat(pageNum = page) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ per_page: '10', page: String(pageNum) })
      if (periode.bulan) params.set('bulan', periode.bulan)
      if (periode.minggu) params.set('minggu', periode.minggu)
      if (periode.hari) params.set('hari', periode.hari)
      if (cari) params.set('q', cari)
      const res = await api.get(`/mitra/toko/pesanan?${params.toString()}`)
      setPesanan(res.data?.data || [])
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
  }, [periode, cari])
  useEffect(() => { muat(page) }, [page])

  async function ubahStatus(id, status, alasan_pembatalan) {
    setProsesLoading(true)
    try {
      await api.put(`/mitra/toko/pesanan/${id}/status`, { status, ...(alasan_pembatalan ? { alasan_pembatalan } : {}) })
      showToast('Status pesanan diperbarui')
      setPesananDibatalkan(null)
      muat(page)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setProsesLoading(false)
    }
  }

  function pilihStatus(id, status) {
    if (status === 'dibatalkan') {
      setPesananDibatalkan(id)
    } else {
      ubahStatus(id, status)
    }
  }

  async function exportExcel() {
    setMengunduh(true)
    try {
      const params = new URLSearchParams()
      if (periode.bulan) params.set('bulan', periode.bulan)
      if (periode.minggu) params.set('minggu', periode.minggu)
      if (periode.hari) params.set('hari', periode.hari)
      await unduhFile(`/mitra/toko/pesanan/export?${params.toString()}`, `Laporan-${periode.bulan || periode.minggu || periode.hari || 'semua'}.xlsx`)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setMengunduh(false)
    }
  }

  return (
    <div>
      <PageHeader
        badge="📊 Laporan"
        title="Laporan Pesanan"
        subtitle="Riwayat pesanan tokomu, bisa difilter per bulan/minggu/hari dan diunduh dalam format Excel."
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <input
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              placeholder="🔍 Cari nama pembeli/produk..."
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400 w-48"
            />
            <FilterPeriode onChange={setPeriode} />
            <Button onClick={exportExcel} loading={mengunduh}>
              {mengunduh ? 'Mengunduh...' : '📥 Export Excel'}
            </Button>
          </div>
        }
      />

      {loading ? (
        <Spinner label="Memuat laporan..." />
      ) : pesanan.length === 0 ? (
        <EmptyState
          icon="📊"
          title={cari ? 'Tidak ada pesanan yang cocok' : 'Tidak ada pesanan'}
          description={cari ? 'Coba ubah kata kunci pencarian.' : 'Belum ada pesanan pada periode ini.'}
        />
      ) : (
        <div className="space-y-2">
          {pesanan.map((p) => (
            <Card key={p.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {p.item?.length || 0} produk · Rp{Number(p.total_harga).toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                    Pembeli: {p.pembeli?.nama || p.guest_nama || '-'}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge color={WARNA_STATUS[p.status]}>{LABEL_STATUS[p.status]}</Badge>

                  <SearchableSelect
                    value={p.status}
                    onChange={(status) => pilihStatus(p.id, status)}
                    options={OPSI_STATUS.map((s) => ({ value: s, label: LABEL_STATUS[s] }))}
                    allowClear={false}
                    className="w-36"
                  />

                  <button
                    onClick={() => setDetailId(detailId === p.id ? null : p.id)}
                    className="text-xs font-semibold text-brand-600 bg-brand-50 dark:bg-brand-950/40 rounded-full px-3 py-1.5"
                  >
                    {detailId === p.id ? 'Tutup' : 'Detail'}
                  </button>
                </div>
              </div>

              {detailId === p.id && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-sm space-y-1.5">
                  {p.item?.map((it) => (
                    <div key={it.id} className="flex justify-between text-gray-600 dark:text-gray-300">
                      <span>{it.produk?.nama || 'Produk'} × {it.qty}</span>
                      <span>Rp{Number(it.subtotal).toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                  {p.kurir && <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Kurir: {p.kurir.nama_layanan}</p>}
                  {p.catatan && <p className="text-xs text-gray-400 dark:text-gray-500">Catatan: {p.catatan}</p>}
                  {p.status === 'dibatalkan' && p.alasan_pembatalan && (
                    <p className="text-xs text-red-500 dark:text-red-400">❌ Alasan pembatalan: {LABEL_ALASAN_PEMBATALAN[p.alasan_pembatalan] || p.alasan_pembatalan}</p>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {pesananDibatalkan && (
        <ModalAlasanPembatalan
          opsiAlasan={ALASAN_UNTUK_TOKO}
          loading={prosesLoading}
          onKonfirmasi={(alasan) => ubahStatus(pesananDibatalkan, 'dibatalkan', alasan)}
          onBatal={() => setPesananDibatalkan(null)}
        />
      )}
    </div>
  )
}
