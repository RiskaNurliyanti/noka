<<<<<<< HEAD
// Kelola pesanan yang ditugaskan ke kurir sendiri.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/apiClient'
import { formatNomor, pesanKurirKePembeli, pesanKurirKeToko } from '../../lib/whatsapp'
import { ALASAN_UNTUK_KURIR } from '../../lib/alasanPembatalan'
import { useToast } from '../../context/ToastContext'
import Card from '../../components/Card'
import PageHeader from '../../components/PageHeader'
import FilterPeriode from '../../components/FilterPeriode'
import ModalAlasanPembatalan from '../../components/ModalAlasanPembatalan'
import Pagination from '../../components/Pagination'

/**
 * Daftar pesanan pengantaran kurir - dulu digabung jadi satu dengan
 * DashboardKurir.jsx (profil+status+statistik+edit), dipisah supaya "lihat
 * pesanan" dan "kelola profil" jadi 2 tujuan yang jelas beda, sama seperti
 * mitra_toko yang punya Pengaturan Toko terpisah dari halaman Pesanan.
 * Notifikasi lonceng & menu sidebar "Pesanan" mengarah langsung ke sini.
 */
export default function PesananKurir() {
  const { user } = useAuth()
  const { showToast } = useToast()

  const [pesanan, setPesanan] = useState([])
  const [loading, setLoading] = useState(true)
  const [selesaiLoadingId, setSelesaiLoadingId] = useState(null)

  const [cari, setCari] = useState('')
  const [periode, setPeriode] = useState({})
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pesananDibatalkan, setPesananDibatalkan] = useState(null)

  async function muatData(pageNum = page) {
    if (!user) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ per_page: '10', page: String(pageNum) })
      if (cari) params.set('q', cari)
      if (periode.bulan) params.set('bulan', periode.bulan)
      if (periode.minggu) params.set('minggu', periode.minggu)
      if (periode.hari) params.set('hari', periode.hari)

      const p = await api.get(`/mitra/kurir/pesanan?${params.toString()}`)
      setPesanan(p.data?.data || [])
      setTotalPages(Math.max(1, p.data?.last_page || 1))
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    const timer = setTimeout(() => { setPage(1); muatData(1) }, 400)
    return () => clearTimeout(timer)
  }, [user, cari, periode])
  useEffect(() => { if (user) muatData(page) }, [page])

  async function ubahStatusPesanan(id, status, alasan_pembatalan) {
    setSelesaiLoadingId(id)
    try {
      await api.put(`/mitra/kurir/pesanan/${id}/status`, { status, ...(alasan_pembatalan ? { alasan_pembatalan } : {}) })
      showToast(status === 'selesai' ? 'Pesanan ditandai selesai' : 'Pesanan ditandai dibatalkan')
      setPesananDibatalkan(null)
      muatData(page)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSelesaiLoadingId(null)
    }
  }

  return (
    <div>
      <PageHeader
        badge="📦 Pesanan"
        title="Pesanan Pengantaran"
        subtitle="Daftar pesanan yang kamu antar - bisa dicari dan difilter per bulan/minggu/hari."
      />

      <Card>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="🔍 Cari nama toko, pembeli, atau produk..."
            className="flex-1 min-w-[180px] border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
          />
          <FilterPeriode onChange={setPeriode} />
        </div>

        {loading ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">Memuat pesanan...</p>
        ) : pesanan.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">Belum ada pesanan yang cocok dengan filter ini.</p>
        ) : (
          <div className="space-y-3">
            {pesanan.map((p) => {
              const sudahSelesai = p.status === 'selesai'
              const sudahDibatalkan = p.status === 'dibatalkan'
              const statusFinal = sudahSelesai || sudahDibatalkan
              return (
                <div key={p.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold">{p.toko?.nama_toko}</p>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
                      sudahSelesai ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400'
                      : sudahDibatalkan ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                      : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600'
                    }`}>
                      {sudahSelesai ? '✅ Selesai' : sudahDibatalkan ? '❌ Dibatalkan' : '🕒 Dalam pengantaran'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Alamat: {p.alamat_antar || '-'}</p>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {statusFinal ? (
                      <span
                        className="inline-block px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 text-xs font-semibold cursor-not-allowed"
                        title="Pesanan sudah tuntas, chat dengan pembeli tidak diperlukan lagi"
                      >
                        Chat pembeli
                      </span>
                    ) : (
                      <a
                        href={`https://wa.me/${formatNomor(p.pembeli?.no_whatsapp || p.guest_whatsapp || '')}?text=${encodeURIComponent(pesanKurirKePembeli(p))}`}
                        target="_blank" rel="noreferrer"
                        className="inline-block px-4 py-2 rounded-xl bg-green-100 text-green-700 text-xs font-semibold"
                      >
                        Chat pembeli
                      </a>
                    )}

                    {p.toko?.no_whatsapp && (
                      statusFinal ? (
                        <span
                          className="inline-block px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 text-xs font-semibold cursor-not-allowed"
                          title="Pesanan sudah tuntas, chat dengan toko tidak diperlukan lagi"
                        >
                          Chat toko
                        </span>
                      ) : (
                        <a
                          href={`https://wa.me/${formatNomor(p.toko.no_whatsapp)}?text=${encodeURIComponent(pesanKurirKeToko(p))}`}
                          target="_blank" rel="noreferrer"
                          className="inline-block px-4 py-2 rounded-xl bg-green-100 text-green-700 text-xs font-semibold"
                        >
                          Chat toko
                        </a>
                      )
                    )}

                    {!statusFinal && (
                      <>
                        <button
                          onClick={() => ubahStatusPesanan(p.id, 'selesai')}
                          disabled={selesaiLoadingId === p.id}
                          className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold disabled:opacity-50"
                        >
                          {selesaiLoadingId === p.id ? 'Menyimpan...' : '✅ Tandai selesai'}
                        </button>
                        <button
                          onClick={() => setPesananDibatalkan(p.id)}
                          disabled={selesaiLoadingId === p.id}
                          className="px-4 py-2 rounded-xl border border-red-200 dark:border-red-900 text-red-500 text-xs font-semibold disabled:opacity-50"
                        >
                          ❌ Batalkan
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </Card>

      {pesananDibatalkan && (
        <ModalAlasanPembatalan
          opsiAlasan={ALASAN_UNTUK_KURIR}
          loading={selesaiLoadingId === pesananDibatalkan}
          onKonfirmasi={(alasan) => ubahStatusPesanan(pesananDibatalkan, 'dibatalkan', alasan)}
          onBatal={() => setPesananDibatalkan(null)}
        />
      )}
    </div>
  )
}
