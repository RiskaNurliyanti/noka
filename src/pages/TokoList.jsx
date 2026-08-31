<<<<<<< HEAD
// Halaman daftar/pencarian semua toko.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/apiClient'
import StoreCard from '../components/StoreCard'
import PageHeader from '../components/PageHeader'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import Pagination from '../components/Pagination'

const PER_HALAMAN = 6

export default function TokoList() {

  const [searchParams, setSearchParams] = useSearchParams()
  const [toko, setToko] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [kategoriList, setKategoriList] = useState([])
  const [cari, setCari] = useState(searchParams.get('cari') || '')
  const [kategoriId, setKategoriId] = useState(searchParams.get('kategori') || '')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // Nomor urut tiap request - dipakai buat abaikan response dari request LAMA
  // yang kebetulan baru selesai belakangan (race condition kalau user ngetik
  // cepat: request pertama bisa saja resolve belakangan dari request kedua).
  const requestId = useRef(0)

  useEffect(() => {
    setKategoriId(searchParams.get('kategori') || '')
    setCari(searchParams.get('cari') || '')
    setPage(1)
  }, [searchParams])

  function pilihKategori(id) {
    setKategoriId(id)
    // Pertahankan param 'cari' yang sudah ada - sebelumnya setSearchParams()
    // di sini mengganti SELURUH query string, jadi kata kunci pencarian yang
    // sedang aktif ikut hilang begitu user pilih kategori.
    const next = {}
    if (cari) next.cari = cari
    if (id) next.kategori = id
    setSearchParams(next)
  }

  useEffect(() => {
    api.get('/kategori-toko').then((res) => setKategoriList(res.data || []))
  }, [])

  // Debounce 400ms - tanpa ini, tiap ketikan di kolom cari langsung nembak
  // request baru (ngetik "toko" = 4 request beruntun), yang gampang bikin
  // response saling susul-menyusul (race condition) dan spinner ngedip-ngedip
  // kayak halaman refresh terus-terusan.
  useEffect(() => {
    const id = requestId.current + 1
    requestId.current = id
    setLoading(true)
    setError('')

    const timer = setTimeout(async () => {
      const params = new URLSearchParams({ per_page: String(PER_HALAMAN), page: String(page) })
      if (cari) params.set('q', cari)
      if (kategoriId) params.set('kategori_toko_id', kategoriId)

      try {
        const res = await api.get(`/toko?${params.toString()}`)
        // Kalau ada request lebih baru yang sudah jalan (mis. user lanjut
        // ngetik), abaikan hasil request lama ini - jangan timpa state.
        if (requestId.current !== id) return
        // Rating & jumlah produk sudah dihitung backend (withCount/withAvg) -
        // tidak perlu lagi 2 query tambahan seperti versi Supabase.
        setToko(res.data?.data || [])
        setTotalPages(Math.max(1, res.data?.last_page || 1))
      } catch (err) {
        if (requestId.current !== id) return
        setError(err.message || 'Gagal memuat daftar toko')
        setToko([])
      } finally {
        if (requestId.current === id) setLoading(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [cari, kategoriId, page])

  const kategoriAktif = kategoriList.find((k) => String(k.id) === String(kategoriId))

  return (

    <div className="max-w-6xl mx-auto px-4 py-8">

      <PageHeader
        badge="🏪 Direktori Toko"
        title={kategoriAktif ? kategoriAktif.nama : 'Semua Toko'}
        subtitle={
          kategoriAktif
            ? `Menampilkan toko dengan kategori ${kategoriAktif.nama}`
            : 'Jelajahi seluruh toko UMKM yang terdaftar di NOKA'
        }
      />

      <div className="flex flex-col md:flex-row gap-2 mb-6">

        <input
          value={cari}
          onChange={(e)=>{ setCari(e.target.value); setPage(1) }}
          placeholder="🔍 Cari nama toko..."
          className="flex-1 border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
        />

        <select
          value={kategoriId}
          onChange={(e) => pilihKategori(e.target.value)}
          className="border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-xl px-4 py-2.5 text-sm md:w-56 outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Semua kategori</option>
          {kategoriList.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
        </select>

      </div>

      {kategoriId && (
        <button
          onClick={() => pilihKategori('')}
          className="mb-6 text-xs font-semibold text-brand-600 bg-brand-50 dark:bg-brand-950/40 rounded-full px-3 py-1.5"
        >
          ✕ Hapus filter kategori
        </button>
      )}

      {loading ? (
        <Spinner label="Memuat toko..." />
      ) : error ? (
        <EmptyState icon="⚠️" title="Gagal memuat daftar toko" description={error} />
      ) : toko.length === 0 ? (
        <EmptyState icon="🏪" title="Tidak ada toko yang cocok" description="Coba ubah kata kunci pencarian atau kategori." />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {toko.map((t)=>(
              <StoreCard key={t.id} toko={t} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}

    </div>

  )
}
