import { useEffect, useState } from 'react'
import { api, unduhFile } from '../../lib/apiClient'
import { useToast } from '../../context/ToastContext'
import { LABEL_ALASAN_PEMBATALAN, ALASAN_UNTUK_ADMIN } from '../../lib/alasanPembatalan'
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

const OPSI_PERAN = [
  { value: 'semua', label: 'Semua peran' },
  { value: 'penjual', label: 'Penjual (toko)' },
  { value: 'kurir', label: 'Kurir' },
  { value: 'pembeli', label: 'Pembeli' },
]

export default function LaporanAdmin() {
  const { showToast } = useToast()
  const [periode, setPeriode] = useState({})
  const [peran, setPeran] = useState('semua')
  const [tokoId, setTokoId] = useState('')
  const [kurirId, setKurirId] = useState('')
  const [pembeliId, setPembeliId] = useState('')
  const [cari, setCari] = useState('')
  const [daftarToko, setDaftarToko] = useState([])
  const [daftarKurir, setDaftarKurir] = useState([])
  const [daftarPembeli, setDaftarPembeli] = useState([])
  const [pesanan, setPesanan] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [mengunduh, setMengunduh] = useState(false)
  const [detailId, setDetailId] = useState(null)
  const [pesananDibatalkan, setPesananDibatalkan] = useState(null)
  const [prosesLoading, setProsesLoading] = useState(false)

  // Dropdown pilih toko/kurir/pembeli butuh daftar penuh - dimuat sekali di awal.
  useEffect(() => {
    api.get('/admin/toko?per_page=500').then((res) => {
      setDaftarToko((res.data?.data || []).map((t) => ({ value: t.id, label: t.nama_toko })))
    })
    api.get('/admin/kurir?per_page=500').then((res) => {
      setDaftarKurir((res.data?.data || []).map((k) => ({ value: k.id, label: k.nama_layanan })))
    })
    api.get('/admin/users?role=pembeli&per_page=500').then((res) => {
      setDaftarPembeli((res.data?.data || []).map((u) => ({ value: u.id, label: `${u.nama} (${u.email})` })))
    })
  }, [])

  // Ganti peran -> reset filter id peran lain, biar tidak nyangkut gabungan
  // filter yang membingungkan (mis. toko_id + kurir_id sekaligus).
  function gantiPeran(p) {
    setPeran(p)
    setTokoId('')
    setKurirId('')
    setPembeliId('')
  }

  async function muat(pageNum = page) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ per_page: '10', page: String(pageNum) })
      if (periode.bulan) params.set('bulan', periode.bulan)
      if (periode.minggu) params.set('minggu', periode.minggu)
      if (periode.hari) params.set('hari', periode.hari)
      if (peran === 'penjual' && tokoId) params.set('toko_id', tokoId)
      if (peran === 'kurir' && kurirId) params.set('kurir_id', kurirId)
      if (peran === 'pembeli' && pembeliId) params.set('pembeli_id', pembeliId)
      if (cari) params.set('q', cari)
      const res = await api.get(`/admin/pesanan?${params.toString()}`)
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
  }, [periode, peran, tokoId, kurirId, pembeliId, cari])
  useEffect(() => { muat(page) }, [page])

  async function ubahStatus(id, status, alasan_pembatalan) {
    setProsesLoading(true)
    try {
      await api.put(`/admin/pesanan/${id}/status`, { status, ...(alasan_pembatalan ? { alasan_pembatalan } : {}) })
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
      if (peran === 'penjual' && tokoId) params.set('toko_id', tokoId)
      if (peran === 'kurir' && kurirId) params.set('kurir_id', kurirId)
      if (peran === 'pembeli' && pembeliId) params.set('pembeli_id', pembeliId)
      const namaTokoTerpilih = daftarToko.find((t) => t.value === tokoId)?.label || 'semua-toko'
      await unduhFile(`/admin/pesanan/export?${params.toString()}`, `Laporan-${namaTokoTerpilih}-${periode.bulan || periode.minggu || periode.hari || 'semua'}.xlsx`)
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
        subtitle="Laporan pesanan seluruh toko NOKA - bisa dikelola per peran (penjual/kurir/pembeli) dan per periode (bulan/minggu/hari)."
      />

      <Card className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Peran</label>
          <select
            value={peran}
            onChange={(e) => gantiPeran(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-400"
          >
            {OPSI_PERAN.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {peran === 'penjual' && (
          <div className="w-full md:w-64">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Toko</label>
            <SearchableSelect value={tokoId} onChange={setTokoId} placeholder="Semua toko" options={[{ value: '', label: 'Semua toko' }, ...daftarToko]} />
          </div>
        )}
        {peran === 'kurir' && (
          <div className="w-full md:w-64">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Kurir</label>
            <SearchableSelect value={kurirId} onChange={setKurirId} placeholder="Semua kurir" options={[{ value: '', label: 'Semua kurir' }, ...daftarKurir]} />
          </div>
        )}
        {peran === 'pembeli' && (
          <div className="w-full md:w-64">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Pembeli</label>
            <SearchableSelect value={pembeliId} onChange={setPembeliId} placeholder="Semua pembeli" options={[{ value: '', label: 'Semua pembeli' }, ...daftarPembeli]} />
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Periode</label>
          <FilterPeriode onChange={setPeriode} />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Cari</label>
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="🔍 Nama pembeli/produk..."
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
        <Button onClick={exportExcel} loading={mengunduh}>
          {mengunduh ? 'Mengunduh...' : '📥 Export Excel'}
        </Button>
      </Card>

      {loading ? (
        <Spinner label="Memuat laporan..." />
      ) : pesanan.length === 0 ? (
        <EmptyState
          icon="📊"
          title={cari ? 'Tidak ada pesanan yang cocok' : 'Tidak ada pesanan'}
          description={cari ? 'Coba ubah kata kunci pencarian.' : 'Tidak ada pesanan yang cocok dengan filter ini.'}
        />
      ) : (
        <div className="space-y-2">
          {pesanan.map((p) => (
            <Card key={p.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{p.toko?.nama_toko || '-'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {' · '}{p.item?.length || 0} produk · Rp{Number(p.total_harga).toLocaleString('id-ID')}
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
                    <p className="text-xs text-red-500 dark:text-red-400">
                      ❌ Alasan: {LABEL_ALASAN_PEMBATALAN[p.alasan_pembatalan] || p.alasan_pembatalan}
                      {p.dibatalkan_oleh_role && <> · dibatalkan oleh <span className="font-medium">{p.dibatalkan_oleh_role}</span></>}
                    </p>
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
          opsiAlasan={ALASAN_UNTUK_ADMIN}
          loading={prosesLoading}
          onKonfirmasi={(alasan) => ubahStatus(pesananDibatalkan, 'dibatalkan', alasan)}
          onBatal={() => setPesananDibatalkan(null)}
        />
      )}
    </div>
  )
}
