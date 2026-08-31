<<<<<<< HEAD
// Moderasi review produk/toko/kurir (admin).
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
import { useEffect, useState } from 'react'
import { api } from '../../lib/apiClient'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../components/ConfirmDialog'
import PageHeader from '../../components/PageHeader'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Badge from '../../components/Badge'
import RatingStars from '../../components/RatingStars'
import Spinner from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import Pagination from '../../components/Pagination'

const PER_HALAMAN = 6

const JENIS = [
  { key: 'produk', label: 'Produk', namaField: (r) => r.produk?.nama },
  { key: 'toko', label: 'Toko', namaField: (r) => r.toko?.nama_toko },
  { key: 'kurir', label: 'Kurir', namaField: (r) => r.kurir?.nama_layanan },
]

export default function ModerasiReview() {
  const { showToast } = useToast()
  const confirmAsync = useConfirm()
  const [semua, setSemua] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [cari, setCari] = useState('')

  async function muat() {
    const hasil = await Promise.all(
      JENIS.map(async (j) => {
        const res = await api.get(`/admin/review?jenis=${j.key}&per_page=500`)
        return (res.data?.data || []).map((r) => ({ ...r, _jenis: j }))
      })
    )
    setSemua(hasil.flat())
    setLoading(false)
  }
  useEffect(() => { muat() }, [])

  const tersaring = cari
    ? semua.filter((r) => {
        const kata = cari.toLowerCase()
        return (
          (r._jenis.namaField(r) || '').toLowerCase().includes(kata) ||
          (r.user?.nama || '').toLowerCase().includes(kata) ||
          (r.komentar || '').toLowerCase().includes(kata)
        )
      })
    : semua

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(tersaring.length / PER_HALAMAN))
    if (page > totalPages) setPage(totalPages)
  }, [tersaring, page])

  async function toggleTampil(r) {
    const status = r.status_moderasi === 'tampil' ? 'disembunyikan' : 'tampil'
    await api.patch(`/admin/review/${r.id}/status`, { jenis: r._jenis.key, status_moderasi: status })
    showToast(status === 'tampil' ? 'Review ditampilkan' : 'Review disembunyikan')
    muat()
  }

  async function hapus(r) {
    const yakin = await confirmAsync('Hapus review ini permanen?')
    if (!yakin) return
    await api.delete(`/admin/review/${r.id}?jenis=${r._jenis.key}`)
    showToast('Review dihapus')
    muat()
  }

  return (
    <div className="max-w-3xl">
      <PageHeader badge="💬 Review" title="Moderasi review" subtitle="Kelola semua review produk, toko, dan kurir yang masuk." />

      <input
        value={cari}
        onChange={(e) => { setCari(e.target.value); setPage(1) }}
        placeholder="🔍 Cari nama produk/toko/kurir, penulis, atau isi komentar..."
        className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 mb-6"
      />

      {loading ? (
        <Spinner label="Memuat review..." />
      ) : tersaring.length === 0 ? (
        <EmptyState
          icon="💬"
          title={cari ? 'Tidak ada review yang cocok' : 'Belum ada review'}
          description={cari ? 'Coba ubah kata kunci pencarian.' : 'Review yang masuk akan muncul di sini.'}
        />
      ) : (
        <div className="space-y-2">
          {tersaring.slice((page - 1) * PER_HALAMAN, page * PER_HALAMAN).map((r) => (
            <Card key={`${r._jenis.key}-${r.id}`}>
              <div className="flex items-center justify-between flex-wrap gap-1">
                <p className="text-sm font-medium">
                  {r.user?.nama ?? 'Pengguna'} <span className="text-xs text-gray-400 dark:text-gray-500">→ {r._jenis.namaField(r)} ({r._jenis.label})</span>
                </p>
                <RatingStars rating={r.rating} />
              </div>
              {r.komentar && <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{r.komentar}</p>}
              <div className="flex gap-2 mt-2.5 items-center">
                <Badge color={r.status_moderasi === 'tampil' ? 'green' : 'gray'}>{r.status_moderasi}</Badge>
                <Button size="sm" variant="ghost" onClick={() => toggleTampil(r)}>
                  {r.status_moderasi === 'tampil' ? 'Sembunyikan' : 'Tampilkan'}
                </Button>
                <Button size="sm" variant="danger" onClick={() => hapus(r)}>Hapus</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={Math.max(1, Math.ceil(tersaring.length / PER_HALAMAN))} onChange={setPage} />
    </div>
  )
}
