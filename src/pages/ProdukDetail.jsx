<<<<<<< HEAD
// Halaman detail satu produk, termasuk review & tombol pesan.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/apiClient'
import { useAuth } from '../context/AuthContext'
import { addToCart, tokoIdDiKeranjang } from '../lib/cart'
import { useToast } from '../context/ToastContext'
import RatingStars from '../components/RatingStars'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import SafeImage from '../components/SafeImage'

export default function ProdukDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [produk, setProduk] = useState(null)
  const [qty, setQty] = useState(1)
  const [catatan, setCatatan] = useState('')
  const [sortReview, setSortReview] = useState('terbaru')

  useEffect(() => {
    api.get(`/produk/${id}?sort=${sortReview}`).then((res) => setProduk(res.data))
  }, [id, sortReview])

  function handleTambahKeranjang() {
    const tokoAktif = tokoIdDiKeranjang()
    if (tokoAktif && tokoAktif !== produk.toko_id) {
      showToast('Keranjang kamu berisi produk dari toko lain. 1 pesanan cuma bisa dari 1 toko - kosongkan keranjang dulu ya.', 'error')
      return
    }
    addToCart(produk, qty, catatan)
    showToast('Ditambahkan ke keranjang 🛒')
  }

  async function handleFavorit() {
    if (!user) return navigate('/login')
    try {
      await api.post('/favorit', { produk_id: produk.id })
      showToast('Ditambahkan ke favorit ❤️')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  if (!produk) return <div className="max-w-4xl mx-auto px-4 py-10"><Spinner label="Memuat produk..." /></div>

  const toko = produk.toko
  const reviews = produk.review || []
  const ratingRata = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0
  const adaDiskon = produk.harga_diskon && Number(produk.harga_diskon) < Number(produk.harga)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-8">
      <div className="h-72 rounded-3xl bg-brand-50 dark:bg-gray-800 overflow-hidden shadow-sm relative">
        <SafeImage src={produk.foto} className="w-full h-full object-cover" alt={produk.nama} />
        {adaDiskon && (
          <span className="absolute top-3 left-3 bg-accent-500 text-white text-xs font-bold px-3 py-1 rounded-full">DISKON</span>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-extrabold mb-1">{produk.nama}</h1>
        {toko && <Link to={`/toko/${toko.id}`} className="text-sm text-brand-500 font-medium mb-2 inline-block hover:underline">{toko.nama_toko}</Link>}
        <div className="mt-1"><RatingStars rating={ratingRata} jumlahReview={reviews.length} /></div>

        {adaDiskon ? (
          <div className="flex items-center gap-2 mt-3">
            <p className="text-2xl font-extrabold text-accent-500">Rp{Number(produk.harga_diskon).toLocaleString('id-ID')}</p>
            <p className="text-base text-gray-400 line-through">Rp{Number(produk.harga).toLocaleString('id-ID')}</p>
          </div>
        ) : (
          <p className="text-2xl font-extrabold mt-3">Rp{Number(produk.harga).toLocaleString('id-ID')}</p>
        )}

        <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">{produk.deskripsi}</p>

        <div className="mt-5 flex items-center gap-3">
          <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-full bg-white dark:bg-gray-900">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-10 h-10 font-semibold">-</button>
            <span className="w-8 text-center text-sm font-medium">{qty}</span>
            <button onClick={() => setQty((q) => q + 1)} className="w-10 h-10 font-semibold">+</button>
          </div>
        </div>

        <input
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          placeholder="Catatan pesanan (opsional), misal: pedas dikit"
          className="w-full mt-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
        />

        <div className="flex gap-2 mt-4">
          <button onClick={handleTambahKeranjang} className="flex-1 bg-brand-500 text-white font-semibold rounded-full py-2.5 text-sm hover:bg-brand-600 shadow-sm hover:shadow-md transition">
            🛒 Tambah ke keranjang
          </button>
          <button
            onClick={handleFavorit}
            aria-label="Tambah ke favorit"
            className="w-11 h-11 flex-shrink-0 rounded-full border-2 border-brand-200 dark:border-brand-800 text-brand-500 flex items-center justify-center hover:bg-brand-50 dark:hover:bg-brand-950/40 transition text-lg"
          >
            ♥
          </button>
        </div>

        <h2 className="text-base font-bold mt-8 mb-3">Review produk ({reviews.length})</h2>
        {reviews.length > 0 && (
          <select
            value={sortReview}
            onChange={(e) => setSortReview(e.target.value)}
            className="mb-3 text-xs border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="terbaru">Terbaru</option>
            <option value="terlama">Terlama</option>
            <option value="tertinggi">Rating tertinggi</option>
            <option value="terendah">Rating terendah</option>
            <option value="relevan">Paling relevan</option>
          </select>
        )}
        {reviews.length === 0 ? (
          <EmptyState icon="⭐" title="Belum ada review" description="Jadi yang pertama kasih review produk ini." />
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{r.user?.nama ?? 'Pengguna'}</p>
                  <RatingStars rating={r.rating} />
                </div>
                {r.komentar && <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{r.komentar}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
