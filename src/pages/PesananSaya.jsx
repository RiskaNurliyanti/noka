import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/apiClient'
import { useToast } from '../context/ToastContext'
import { LABEL_ALASAN_PEMBATALAN, ALASAN_UNTUK_PEMBELI } from '../lib/alasanPembatalan'
import { formatNomor, pesanUlangKeToko, pesanUlangKeKurir } from '../lib/whatsapp'
import ReviewForm from '../components/ReviewForm'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import SafeImage from '../components/SafeImage'
import Badge from '../components/Badge'
import Pagination from '../components/Pagination'
import FilterPeriode from '../components/FilterPeriode'
import ModalAlasanPembatalan from '../components/ModalAlasanPembatalan'

const LABEL_STATUS = { dibuat: 'Dibuat', diproses: 'Diproses', selesai: 'Selesai', dibatalkan: 'Dibatalkan' }
const WARNA_STATUS = { dibuat: 'gray', diproses: 'brand', selesai: 'green', dibatalkan: 'red' }

export default function PesananSaya() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [pesanan, setPesanan] = useState([])
  const [loading, setLoading] = useState(true)
  const [reviewAktif, setReviewAktif] = useState(null)
  // { produk: [...], toko: [...], kurir: [...] } - dipakai buat tahu item
  // mana yang sudah direview di pesanan mana, supaya tombolnya berubah
  // jadi "Edit review" alih-alih membiarkan user coba kirim review kedua
  // (yang toh bakal ditolak backend).
  const [reviewSaya, setReviewSaya] = useState({ produk: [], toko: [], kurir: [] })

  const [cari, setCari] = useState('')
  const [periode, setPeriode] = useState({ bulan: '' }) // { bulan } | { minggu } | { hari }
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [pesananDibatalkan, setPesananDibatalkan] = useState(null) // id pesanan yang lagi dipilih buat dibatalkan
  const [prosesId, setProsesId] = useState(null)

  async function muat(pageNum = page) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ per_page: '10', page: String(pageNum) })
      if (cari) params.set('q', cari)
      if (periode.bulan) params.set('bulan', periode.bulan)
      if (periode.minggu) params.set('minggu', periode.minggu)
      if (periode.hari) params.set('hari', periode.hari)

      const [resPesanan, resReview] = await Promise.all([
        api.get(`/pesanan-saya?${params.toString()}`),
        api.get('/review-saya'),
      ])
      setPesanan(resPesanan.data?.data || [])
      setTotalPages(Math.max(1, resPesanan.data?.last_page || 1))
      setReviewSaya(resReview.data || { produk: [], toko: [], kurir: [] })
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (user) { const timer = setTimeout(() => { muat(1); setPage(1) }, 400); return () => clearTimeout(timer) } }, [user, cari, periode])
  useEffect(() => { if (user) muat(page) }, [page])

  // Cari review yang sudah ada untuk kombinasi pesanan+target tertentu.
  function cariReview(jenis, pesananId, targetId) {
    const kolom = jenis === 'produk' ? 'produk_id' : jenis === 'toko' ? 'toko_id' : 'kurir_id'
    return reviewSaya[jenis]?.find((r) => r.pesanan_id === pesananId && r[kolom] === targetId) || null
  }

  async function konfirmasiBatalkan(alasan) {
    setProsesId(pesananDibatalkan)
    try {
      await api.put(`/pesanan-saya/${pesananDibatalkan}/batalkan`, { alasan_pembatalan: alasan })
      showToast('Pesanan dibatalkan')
      setPesananDibatalkan(null)
      muat(page)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setProsesId(null)
    }
  }

  async function tandaiSelesai(id) {
    setProsesId(id)
    try {
      await api.put(`/pesanan-saya/${id}/selesai`)
      showToast('Pesanan ditandai selesai')
      muat(page)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setProsesId(null)
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">🧾 Pesanan saya</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Riwayat pesanan yang pernah kamu buat. Kalau ada perubahan (misal dibatalkan), toko/kurir akan tetap menghubungimu lewat WhatsApp - status di sini cuma catatan.
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <input
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder="🔍 Cari nama toko, kurir, atau produk..."
          className="flex-1 min-w-[200px] border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
        />
        <FilterPeriode onChange={setPeriode} />
      </div>

      {loading ? (
        <Spinner label="Memuat pesanan..." />
      ) : pesanan.length === 0 ? (
        <EmptyState icon="🧾" title="Belum ada pesanan" description="Riwayat pesananmu akan muncul di sini setelah checkout, atau coba ubah filter/kata kunci pencarian." />
      ) : (
        <div className="space-y-4">
          {pesanan.map((p) => {
            const statusFinal = p.status === 'selesai' || p.status === 'dibatalkan'
            return (
            <div key={p.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                  <SafeImage src={p.toko?.foto_banner} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{p.toko?.nama_toko}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {' · '}
                    {new Date(p.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                  </p>
                </div>
                <Badge color={WARNA_STATUS[p.status]}>{LABEL_STATUS[p.status] || p.status}</Badge>
              </div>
              <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc list-inside pl-1">
                {p.item?.map((it) => (
                  <li key={it.id}>{it.produk?.nama} x{it.qty}</li>
                ))}
              </ul>
              <p className="text-sm font-semibold text-brand-600 mt-2">Rp{Number(p.total_harga).toLocaleString('id-ID')}</p>

              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 space-y-0.5">
                {p.kurir ? (
                  <p>🛵 Diantar {p.kurir.nama_layanan}{p.alamat_antar ? ` — ${p.alamat_antar}` : ''}</p>
                ) : (
                  <p>🚶 Ambil sendiri di toko</p>
                )}
                {p.catatan && <p>📝 {p.catatan}</p>}
                {p.status === 'dibatalkan' && p.alasan_pembatalan && (
                  <p className="text-red-500 dark:text-red-400">❌ Alasan: {LABEL_ALASAN_PEMBATALAN[p.alasan_pembatalan] || p.alasan_pembatalan}</p>
                )}
              </div>

              {!statusFinal && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  {p.toko?.no_whatsapp && (
                    <a
                      href={`https://wa.me/${formatNomor(p.toko.no_whatsapp)}?text=${encodeURIComponent(pesanUlangKeToko(p))}`}
                      target="_blank" rel="noreferrer"
                      className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                    >
                      💬 Chat toko
                    </a>
                  )}
                  {p.kurir?.no_whatsapp && (
                    <a
                      href={`https://wa.me/${formatNomor(p.kurir.no_whatsapp)}?text=${encodeURIComponent(pesanUlangKeKurir(p))}`}
                      target="_blank" rel="noreferrer"
                      className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                    >
                      💬 Chat kurir
                    </a>
                  )}
                </div>
              )}

              {!statusFinal && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => tandaiSelesai(p.id)}
                    disabled={prosesId === p.id}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-50"
                  >
                    {prosesId === p.id ? 'Menyimpan...' : '✅ Tandai selesai'}
                  </button>
                  <button
                    onClick={() => setPesananDibatalkan(p.id)}
                    disabled={prosesId === p.id}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full border border-red-200 dark:border-red-900 text-red-500 disabled:opacity-50"
                  >
                    ❌ Batalkan pesanan
                  </button>
                </div>
              )}

              {p.status !== 'dibatalkan' && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  {p.toko?.id && (() => {
                    const rToko = cariReview('toko', p.id, p.toko.id)
                    return (
                      <button
                        onClick={() => setReviewAktif({ key: `toko-${p.id}`, tabel: 'review_toko', targetId: p.toko.id, existing: rToko })}
                        className={`text-xs font-medium rounded-full px-3 py-1.5 ${rToko ? 'text-green-700 bg-green-50 dark:bg-green-950/30 dark:text-green-400' : 'text-brand-600 bg-brand-50 dark:bg-brand-950/40'}`}
                      >
                        {rToko ? '✓ Edit review toko' : '⭐ Review toko'}
                      </button>
                    )
                  })()}
                  {p.item?.map((it) => {
                    const rProduk = it.produk?.id ? cariReview('produk', p.id, it.produk.id) : null
                    return (
                      <button
                        key={it.id}
                        onClick={() => setReviewAktif({ key: `produk-${it.id}`, tabel: 'review_produk', targetId: it.produk?.id, existing: rProduk })}
                        className={`text-xs font-medium rounded-full px-3 py-1.5 ${rProduk ? 'text-green-700 bg-green-50 dark:bg-green-950/30 dark:text-green-400' : 'text-brand-600 bg-brand-50 dark:bg-brand-950/40'}`}
                      >
                        {rProduk ? `✓ Edit review ${it.produk?.nama}` : `⭐ Review ${it.produk?.nama}`}
                      </button>
                    )
                  })}
                  {p.kurir && (() => {
                    const rKurir = cariReview('kurir', p.id, p.kurir.id)
                    return (
                      <button
                        onClick={() => setReviewAktif({ key: `kurir-${p.id}`, tabel: 'review_kurir', targetId: p.kurir.id, existing: rKurir })}
                        className={`text-xs font-medium rounded-full px-3 py-1.5 ${rKurir ? 'text-green-700 bg-green-50 dark:bg-green-950/30 dark:text-green-400' : 'text-brand-600 bg-brand-50 dark:bg-brand-950/40'}`}
                      >
                        {rKurir ? '✓ Edit review kurir' : '⭐ Review kurir'}
                      </button>
                    )
                  })()}
                </div>
              )}

              {p.status !== 'dibatalkan' && reviewAktif?.targetId && (
                reviewAktif.key === `toko-${p.id}` ||
                p.item?.some((it) => reviewAktif.key === `produk-${it.id}`) ||
                reviewAktif.key === `kurir-${p.id}`
              ) && (
                <ReviewForm
                  key={reviewAktif.key}
                  tabel={reviewAktif.tabel}
                  targetId={reviewAktif.targetId}
                  pesananId={p.id}
                  existing={reviewAktif.existing}
                  onCancel={() => setReviewAktif(null)}
                  onSaved={() => { setReviewAktif(null); showToast('Review tersimpan, makasih! 🙏'); muat(page) }}
                />
              )}
            </div>
          )})}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {pesananDibatalkan && (
        <ModalAlasanPembatalan
          opsiAlasan={ALASAN_UNTUK_PEMBELI}
          loading={prosesId === pesananDibatalkan}
          onKonfirmasi={konfirmasiBatalkan}
          onBatal={() => setPesananDibatalkan(null)}
        />
      )}
    </div>
  )
}
