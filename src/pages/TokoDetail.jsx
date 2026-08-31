// Halaman detail satu toko, termasuk daftar produk & review.
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/apiClient'
import ProductCard from '../components/ProductCard'
import RatingStars from '../components/RatingStars'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import SafeImage from '../components/SafeImage'

export default function TokoDetail() {
  const { id } = useParams()
  const [toko, setToko] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [sortReview, setSortReview] = useState('terbaru')

  useEffect(() => {
    api.post(`/toko/${id}/kunjungan`).catch(() => {}) // gagal catat kunjungan bukan hal fatal
  }, [id])

  useEffect(() => {
    api.get(`/toko/${id}?sort=${sortReview}`)
      .then((res) => setToko(res.data))
      .catch(() => setNotFound(true))
  }, [id, sortReview])

  if (notFound) {
    return <div className="max-w-6xl mx-auto px-4 py-10">
      <EmptyState icon="🏪" title="Toko tidak ditemukan" description="Toko ini mungkin sudah tidak aktif atau belum disetujui." />
    </div>
  }

  if (!toko) return <div className="max-w-6xl mx-auto px-4 py-10"><Spinner label="Memuat toko..." /></div>

  const produk = toko.produk || []
  const reviews = toko.review || []
  const ratingRata = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* COVER */}
      <div className="h-48 md:h-56 rounded-3xl bg-gradient-to-br from-brand-100 to-brand-50 dark:from-gray-800 dark:to-gray-900 overflow-hidden mb-4 relative shadow-sm">
        <SafeImage src={toko.foto_banner} className="w-full h-full object-cover" alt={toko.nama_toko} />
        <span className={`absolute top-3 right-3 text-xs px-3 py-1 rounded-full font-semibold shadow ${toko.sedang_buka ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
          {toko.sedang_buka ? '🟢 Buka' : '⚪ Tutup'}
        </span>
      </div>

      <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
        <div>
          <h1 className="text-2xl font-extrabold">{toko.nama_toko}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {toko.kategoriToko?.nama && (
              <span className="text-xs font-medium text-brand-600 bg-brand-50 dark:bg-brand-950/40 rounded-full px-2.5 py-1">
                {toko.kategoriToko.nama}
              </span>
            )}
            <RatingStars rating={ratingRata} jumlahReview={reviews.length} />
          </div>
        </div>
      </div>

      {!toko.user_id && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3 mb-4 flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs text-amber-700 dark:text-amber-400">Toko ini belum diklaim pemiliknya. Ini usaha kamu?</p>
          <Link to={`/klaim/toko?id=${toko.id}`} className="text-xs font-semibold text-white bg-brand-500 rounded-full px-3 py-1.5 whitespace-nowrap">
            Klaim toko ini →
          </Link>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 mb-8">
        <p className="text-sm text-gray-600 dark:text-gray-300">{toko.deskripsi || 'Belum ada deskripsi.'}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-gray-500 dark:text-gray-400">
          <span>🕒 {toko.jam_buka && toko.jam_tutup ? `${toko.jam_buka.slice(0, 5)} - ${toko.jam_tutup.slice(0, 5)}` : 'Jam operasional belum diisi'}</span>
          <span>📍 {toko.alamat || 'Alamat belum diisi'}</span>
        </div>
      </div>

      {toko.galeri && toko.galeri.length > 0 && (
        <>
          <h2 className="text-lg font-bold mb-3">Galeri</h2>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-10">
            {toko.galeri.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer" className="block aspect-square rounded-xl overflow-hidden bg-brand-50 dark:bg-gray-800">
                <SafeImage src={url} alt={`Galeri ${toko.nama_toko} ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition" />
              </a>
            ))}
          </div>
        </>
      )}

      <h2 className="text-lg font-bold mb-3">Produk ({produk.length})</h2>
      {produk.length === 0 ? (
        <div className="mb-10"><EmptyState icon="📦" title="Belum ada produk" description="Toko ini belum menambahkan produk." /></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {produk.map((p) => <ProductCard key={p.id} produk={p} />)}
        </div>
      )}

      <h2 className="text-lg font-bold mb-3">Review toko ({reviews.length})</h2>
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
        <EmptyState icon="⭐" title="Belum ada review" description="Jadi yang pertama kasih review toko ini." />
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
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
  )
}
