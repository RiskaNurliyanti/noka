import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/apiClient'
import ProductCard from '../components/ProductCard'
import PageHeader from '../components/PageHeader'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import Pagination from '../components/Pagination'

const PER_HALAMAN = 6

export default function ProdukList() {
  const [params] = useSearchParams()
  const [produk, setProduk] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [kategoriList, setKategoriList] = useState([])
  const [cari, setCari] = useState(params.get('cari') || '')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const requestId = useRef(0)

  const modeDiskon = params.get('diskon') === '1'
  const kategoriId = params.get('kategori')

  useEffect(() => {
    api.get('/kategori').then((res) => setKategoriList(res.data || []))
  }, [])

  // Balik ke halaman 1 setiap kali filter kategori/diskon dari URL berubah
  // (mis. user klik kategori lain dari navbar) - jangan nyangkut di halaman
  // 5 kategori lama yang mungkin nggak sebanyak itu di kategori baru.
  useEffect(() => { setPage(1) }, [kategoriId, modeDiskon])

  // Stage 8: debounce 400ms + guard nomor urut request, sama seperti
  // perbaikan TokoList.jsx (Stage 5) - ngetik cepat di kolom cari tidak lagi
  // nembak request per huruf & tidak ada race condition response basi
  // menimpa hasil yang lebih baru.
  useEffect(() => {
    const id = requestId.current + 1
    requestId.current = id
    setLoading(true)
    setError('')

    const timer = setTimeout(async () => {
      const query = new URLSearchParams({ per_page: String(PER_HALAMAN), page: String(page) })
      if (cari) query.set('q', cari)
      if (kategoriId) query.set('kategori_id', kategoriId)
      if (modeDiskon) query.set('diskon', '1')

      try {
        const res = await api.get(`/produk?${query.toString()}`)
        if (requestId.current !== id) return
        setProduk(res.data?.data || [])
        setTotalPages(Math.max(1, res.data?.last_page || 1))
      } catch (err) {
        if (requestId.current !== id) return
        setError(err.message || 'Gagal memuat produk')
        setProduk([])
      } finally {
        if (requestId.current === id) setLoading(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [cari, kategoriId, modeDiskon, page])

  const kategoriAktif = kategoriList.find((k) => String(k.id) === String(kategoriId))

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <PageHeader
        badge={modeDiskon ? '🔥 Promo' : '📦 Katalog Produk'}
        title={modeDiskon ? 'Lagi Diskon' : kategoriAktif ? kategoriAktif.nama : 'Semua Produk'}
        subtitle={
          modeDiskon
            ? 'Semua produk dengan harga spesial saat ini'
            : kategoriAktif
              ? `Produk dengan kategori ${kategoriAktif.nama}`
              : 'Jelajahi seluruh produk dari toko UMKM di NOKA'
        }
      />

      <input
        value={cari}
        onChange={(e) => { setCari(e.target.value); setPage(1) }}
        placeholder="🔍 Cari produk..."
        className="w-full md:w-80 border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-xl px-4 py-2.5 text-sm mb-6 outline-none focus:ring-2 focus:ring-brand-500"
      />

      {loading ? (
        <Spinner label="Memuat produk..." />
      ) : error ? (
        <EmptyState icon="⚠️" title="Gagal memuat produk" description={error} />
      ) : produk.length === 0 ? (
        <EmptyState
          icon={modeDiskon ? '🔥' : '📦'}
          title={modeDiskon ? 'Belum ada produk diskon' : 'Belum ada produk yang cocok'}
          description={modeDiskon ? 'Coba cek lagi nanti ya.' : 'Coba ubah kata kunci pencarian.'}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {produk.map((p) => <ProductCard key={p.id} produk={p} />)}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  )
}
