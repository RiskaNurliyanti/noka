import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/apiClient'
import { LABEL_ALASAN_PEMBATALAN, ALASAN_UNTUK_TOKO } from '../../lib/alasanPembatalan'
import { formatNomor, pesanTokoKePembeli, pesanTokoKeKurir } from '../../lib/whatsapp'
import { useToast } from '../../context/ToastContext'
import Spinner from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import Pagination from '../../components/Pagination'
import ModalAlasanPembatalan from '../../components/ModalAlasanPembatalan'

const PER_HALAMAN = 6

const LABEL_STATUS = { dibuat: 'Dibuat', diproses: 'Diproses', selesai: 'Selesai', dibatalkan: 'Dibatalkan' }
const WARNA_STATUS = {
  dibuat: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
  diproses: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600',
  selesai: 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400',
  dibatalkan: 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400',
}

export default function PesananMasuk() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [toko, setToko] = useState(null)
  const [pesanan, setPesanan] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [cari, setCari] = useState('')
  const [prosesId, setProsesId] = useState(null)
  const [pesananDibatalkan, setPesananDibatalkan] = useState(null)

  async function muat() {
    try {
      const t = await api.get('/mitra/toko')
      setToko(t.data)
      const p = await api.get('/mitra/toko/pesanan?per_page=100')
      setPesanan(p.data?.data || [])
    } catch {
      setToko(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (user) muat() }, [user])

  const LABEL_TOAST_STATUS = {
    selesai: 'Pesanan ditandai selesai',
    diproses: 'Pesanan diserahkan ke kurir',
    dibatalkan: 'Pesanan dibatalkan',
  }

  async function ubahStatus(id, status, alasan_pembatalan) {
    setProsesId(id)
    try {
      await api.put(`/mitra/toko/pesanan/${id}/status`, { status, ...(alasan_pembatalan ? { alasan_pembatalan } : {}) })
      // Bug lama: pesan toast cuma nebak 2 kemungkinan (selesai / selain
      // itu dianggap "dibatalkan") - begitu status "diproses" ditambahkan
      // (buat toko yang serahkan ke kurir), datanya benar tersimpan tapi
      // toastnya salah bunyi "Pesanan dibatalkan". Sekarang dipetakan per
      // status secara eksplisit.
      showToast(LABEL_TOAST_STATUS[status] || 'Status pesanan diperbarui')
      setPesananDibatalkan(null)
      muat()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setProsesId(null)
    }
  }

  if (loading) return <Spinner label="Memuat pesanan..." />
  if (!toko) return <EmptyState icon="🏪" title="Toko belum ditemukan" description="Kamu belum punya toko atau masih menunggu verifikasi admin." />

  const tersaring = cari
    ? pesanan.filter((p) => {
        const kata = cari.toLowerCase()
        const namaPembeli = (p.pembeli?.nama || p.guest_nama || '').toLowerCase()
        const namaProduk = (p.item || []).map((it) => it.produk?.nama || '').join(' ').toLowerCase()
        return namaPembeli.includes(kata) || namaProduk.includes(kata)
      })
    : pesanan

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">📥 Pesanan masuk</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Pesanan yang masuk ke <strong>{toko.nama_toko}</strong>. Pembeli sudah menghubungimu duluan lewat WhatsApp begitu
        checkout - tandai selesai atau batalkan di sini setelah kesepakatan tercapai, supaya riwayatnya rapi.
      </p>

      <input
        value={cari}
        onChange={(e) => { setCari(e.target.value); setPage(1) }}
        placeholder="🔍 Cari nama pembeli atau nama produk..."
        className="w-full md:w-80 border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 mb-6"
      />

      {tersaring.length === 0 ? (
        <EmptyState
          icon="📥"
          title={cari ? 'Tidak ada pesanan yang cocok' : 'Belum ada pesanan masuk'}
          description={cari ? 'Coba ubah kata kunci pencarian.' : 'Pesanan dari pembeli akan muncul di sini.'}
        />
      ) : (
        <div className="space-y-3">
          {tersaring.slice((page - 1) * PER_HALAMAN, page * PER_HALAMAN).map((p) => {
            const namaPembeli = p.pembeli?.nama || p.guest_nama || 'Pembeli'
            const statusFinal = p.status === 'selesai' || p.status === 'dibatalkan'
            return (
              <div key={p.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-1 gap-2">
                  <p className="font-semibold text-sm">👤 {namaPembeli}</p>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${WARNA_STATUS[p.status]}`}>
                    {LABEL_STATUS[p.status] || p.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{new Date(p.created_at).toLocaleString('id-ID')}</p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc list-inside">
                  {p.item?.map((it) => <li key={it.id}>{it.produk?.nama} x{it.qty}</li>)}
                </ul>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  Perkiraan total: <span className="font-semibold text-brand-600">Rp{Number(p.total_harga).toLocaleString('id-ID')}</span>
                </p>
                {p.alamat_antar && <p className="text-xs text-gray-500 dark:text-gray-400">📍 {p.alamat_antar}</p>}
                {p.catatan && <p className="text-xs text-gray-500 dark:text-gray-400">📝 {p.catatan}</p>}
                {p.kurir && <p className="text-xs text-gray-500 dark:text-gray-400">🛵 {p.kurir.nama_layanan}</p>}
                {p.status === 'dibatalkan' && p.alasan_pembatalan && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">❌ Dibatalkan: {LABEL_ALASAN_PEMBATALAN[p.alasan_pembatalan] || p.alasan_pembatalan}</p>
                )}

                {!statusFinal && (
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">

                    {p.kurir ? (
                      p.status === 'dibuat' ? (
                        <button
                          onClick={() => ubahStatus(p.id, 'diproses')}
                          disabled={prosesId === p.id}
                          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50"
                        >
                          {prosesId === p.id ? 'Menyimpan...' : '🚚 Sudah diserahkan ke kurir'}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500 italic px-1 py-1.5">
                          Menunggu kurir/pembeli menyelesaikan pengantaran
                        </span>
                      )
                    ) : (
                      <button
                        onClick={() => ubahStatus(p.id, 'selesai')}
                        disabled={prosesId === p.id}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-50"
                      >
                        {prosesId === p.id ? 'Menyimpan...' : '✅ Tandai selesai'}
                      </button>
                    )}
                    <button
                      onClick={() => setPesananDibatalkan(p.id)}
                      disabled={prosesId === p.id}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full border border-red-200 dark:border-red-900 text-red-500 disabled:opacity-50"
                    >
                      ❌ Batalkan
                    </button>

                    {(p.pembeli?.no_whatsapp || p.guest_whatsapp) && (
                      <a
                        href={`https://wa.me/${formatNomor(p.pembeli?.no_whatsapp || p.guest_whatsapp)}?text=${encodeURIComponent(pesanTokoKePembeli(p))}`}
                        target="_blank" rel="noreferrer"
                        className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                      >
                        💬 Chat pembeli
                      </a>
                    )}

                    {p.kurir?.no_whatsapp && (
                      <a
                        href={`https://wa.me/${formatNomor(p.kurir.no_whatsapp)}?text=${encodeURIComponent(pesanTokoKeKurir(p))}`}
                        target="_blank" rel="noreferrer"
                        className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                      >
                        💬 Chat kurir
                      </a>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      <Pagination page={page} totalPages={Math.max(1, Math.ceil(tersaring.length / PER_HALAMAN))} onChange={setPage} />

      {pesananDibatalkan && (
        <ModalAlasanPembatalan
          opsiAlasan={ALASAN_UNTUK_TOKO}
          loading={prosesId === pesananDibatalkan}
          onKonfirmasi={(alasan) => ubahStatus(pesananDibatalkan, 'dibatalkan', alasan)}
          onBatal={() => setPesananDibatalkan(null)}
        />
      )}
    </div>
  )
}
