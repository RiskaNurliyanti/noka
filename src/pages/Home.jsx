<<<<<<< HEAD
// Halaman utama/beranda aplikasi.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/apiClient'
import ProductCard from '../components/ProductCard'
import StoreCard from '../components/StoreCard'
import SafeImage from '../components/SafeImage'

const EMOJI_KATEGORI = ['🍜', '🥤', '🍰', '🛍️', '🍱', '☕', '🍖', '🥗', '🍞', '🧺']

export default function Home() {
  const navigate = useNavigate()

  const [banners, setBanners] = useState([])
  const [produkPopuler, setProdukPopuler] = useState([])
  const [produkDiskon, setProdukDiskon] = useState([])
  const [tokoPopuler, setTokoPopuler] = useState([])
  const [kategoriToko, setKategoriToko] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [bannerAktif, setBannerAktif] = useState(0)

  useEffect(() => {
    async function loadHome() {
      const [banner, produk, diskon, toko, kategori] = await Promise.all([
        api.get('/banner'),
        api.get('/produk-populer?limit=8'),
        // Produk yang lagi diskon - filter & urutan besar->kecil sudah dari
        // backend (?diskon=1), tinggal ambil 8 teratas berdasar persentase.
        api.get('/produk?diskon=1&per_page=20'),
        api.get('/toko-populer?limit=6'),
        api.get('/kategori-toko'),
      ])

      setBanners(banner.data || [])
      setProdukPopuler(produk.data || [])

      const diskonDiurutkan = (diskon.data?.data || [])
        .sort((a, b) => (1 - b.harga_diskon / b.harga) - (1 - a.harga_diskon / a.harga))
        .slice(0, 8)
      setProdukDiskon(diskonDiurutkan)

      setTokoPopuler(toko.data || [])
      setKategoriToko(kategori.data || [])

      setLoading(false)
    }
    loadHome()
  }, [])

  // Auto-geser banner promo tiap 4 detik kalau lebih dari 1
  useEffect(() => {
    if (banners.length <= 1) return
    const interval = setInterval(() => setBannerAktif((i) => (i + 1) % banners.length), 4000)
    return () => clearInterval(interval)
  }, [banners])

  function handleSearch(e) {
    e.preventDefault()
    navigate(`/produk?cari=${encodeURIComponent(search)}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-14 md:py-20">
          <span className="inline-block bg-white/20 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide mb-4">
            🛒 MARKETPLACE LOKAL
          </span>

          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight max-w-2xl">
            Belanja produk & jajanan lokal, dekat dari rumahmu
          </h1>

          <p className="mt-4 text-brand-50 text-sm md:text-base max-w-lg">
            Temukan toko UMKM, makanan, dan produk terbaik di sekitarmu. Pesan, lalu lanjut chat langsung ke toko via WhatsApp.
          </p>

          {/* SEARCH BAR */}
          <form onSubmit={handleSearch} className="mt-7 flex bg-white rounded-2xl p-1.5 max-w-xl shadow-xl">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari produk, misal: dimsum, kebab, pizza..."
              className="flex-1 px-4 text-gray-800 text-sm outline-none rounded-xl bg-transparent"
            />
            <button className="bg-brand-600 hover:bg-brand-700 transition text-white px-6 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap">
              🔍 Cari
            </button>
          </form>

          <div className="flex gap-4 mt-6 text-xs text-brand-50">
            <span>✅ 100% Gratis dipakai</span>
            <span>✅ Langsung chat WhatsApp</span>
            <span>✅ Dukung UMKM lokal</span>
          </div>
        </div>

        {/* dekorasi lengkung bawah biar nggak flat */}
        <div className="absolute -bottom-1 left-0 right-0 h-8 bg-gray-50 dark:bg-gray-950 rounded-t-[40px]" />
      </section>

      <div className="max-w-6xl mx-auto px-4 md:px-6 -mt-2 pb-16 space-y-14">

        {/* PROMO BANNER */}
        {banners.length > 0 && (
          <section className="pt-8">
            <div className="rounded-3xl overflow-hidden bg-gradient-to-r from-accent-500 to-accent-600 text-white px-6 py-8 md:px-10 md:py-10 shadow-lg relative min-h-[140px]">
              <p className="text-xs font-bold tracking-widest opacity-90">🔥 PROMO</p>
              <p key={bannerAktif} className="text-xl md:text-2xl font-extrabold mt-2 max-w-md animate-fade-in-up">
                {banners[bannerAktif].judul}
              </p>
              {banners.length > 1 && (
                <div className="flex gap-1.5 mt-4">
                  {banners.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setBannerAktif(i)}
                      aria-label={`Promo ke-${i + 1}`}
                      className={`h-1.5 rounded-full transition-all duration-500 ${i === bannerAktif ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* LAGI DISKON */}
        {produkDiskon.length > 0 && (
          <section className={banners.length === 0 ? 'pt-8' : ''}>
            <div className="rounded-3xl bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/10 border border-red-100 dark:border-red-900/40 p-5 md:p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                    <span className="inline-block animate-bounce">🔥</span> Lagi Diskon
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Buruan, harga spesial cuma hari ini</p>
                </div>
                <Link to="/produk?diskon=1" className="text-brand-600 font-semibold text-sm hover:underline whitespace-nowrap">Lihat semua</Link>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
                {produkDiskon.map((p, i) => {
                  const persen = Math.round((1 - p.harga_diskon / p.harga) * 100)
                  return (
                    <Link
                      key={p.id}
                      to={`/produk/${p.id}`}
                      style={{ animationDelay: `${i * 70}ms` }}
                      className="animate-fade-in-up opacity-0 group flex-shrink-0 w-40 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 snap-start"
                    >
                      <div className="h-28 bg-brand-50 dark:bg-gray-800 relative overflow-hidden">
                        <SafeImage src={p.foto} alt={p.nama} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                        <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                          -{persen}%
                        </span>
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-medium truncate">{p.nama}</p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{p.toko?.nama_toko}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <p className="text-sm font-bold text-red-500">Rp{Number(p.harga_diskon).toLocaleString('id-ID')}</p>
                        </div>
                        <p className="text-[11px] text-gray-400 line-through">Rp{Number(p.harga).toLocaleString('id-ID')}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* KATEGORI */}
        {kategoriToko.length > 0 && (
          <section className={banners.length === 0 && produkDiskon.length === 0 ? 'pt-8' : ''}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl md:text-2xl font-bold">Kategori Toko</h2>
              <Link to="/toko" className="text-brand-600 font-semibold text-sm hover:underline">Lihat semua</Link>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {kategoriToko.map((k, i) => (
                <Link
                  key={k.id}
                  to={`/toko?kategori=${k.id}`}
                  className="group flex flex-col items-center gap-2 bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 hover:border-brand-300 hover:shadow-md transition"
                >
                  <div className="w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center text-2xl group-hover:scale-110 transition overflow-hidden">
                    {k.icon ? <SafeImage src={k.icon} className="w-full h-full object-cover" alt="" /> : EMOJI_KATEGORI[i % EMOJI_KATEGORI.length]}
                  </div>
                  <p className="text-xs font-semibold text-center leading-tight">{k.nama}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* PRODUK POPULER */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl md:text-2xl font-bold">🔥 Produk Populer</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Paling banyak dipesan minggu ini</p>
            </div>
            <Link to="/produk" className="text-brand-600 font-semibold text-sm hover:underline whitespace-nowrap">Lihat semua</Link>
          </div>

          {!loading && produkPopuler.length === 0 ? (
            <p className="text-sm text-gray-400">Belum ada data produk.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {produkPopuler.map((p) => <ProductCard key={p.produk_id} produk={p} />)}
            </div>
          )}
        </section>

        {/* TOKO POPULER */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl md:text-2xl font-bold">🏪 Toko Populer</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Toko favorit di sekitarmu</p>
            </div>
            <Link to="/toko" className="text-brand-600 font-semibold text-sm hover:underline whitespace-nowrap">Lihat semua</Link>
          </div>

          {!loading && tokoPopuler.length === 0 ? (
            <p className="text-sm text-gray-400">Belum ada data toko.</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {tokoPopuler.map((t) => (
                <StoreCard key={t.toko_id} toko={{ id: t.toko_id, ...t }} />
              ))}
            </div>
          )}
        </section>

        {/* BENEFIT */}
        <section className="grid md:grid-cols-3 gap-4">
          {[
            ['🏪', 'UMKM Lokal', 'Dukung bisnis di sekitarmu tumbuh bersama'],
            ['🛵', 'Layanan Antar', 'Terhubung langsung dengan mitra kurir lokal'],
            ['💬', 'Chat WhatsApp', 'Pesan tanpa ribet, langsung ngobrol sama toko'],
          ].map(([icon, judul, deskripsi]) => (
            <div key={judul} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
              <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center text-2xl mb-3">
                {icon}
              </div>
              <h3 className="font-bold">{judul}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{deskripsi}</p>
            </div>
          ))}
        </section>

      </div>
    </div>
  )
}
