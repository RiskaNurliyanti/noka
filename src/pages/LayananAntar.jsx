import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/apiClient'
import { linkWhatsApp } from '../lib/whatsapp'
import PageHeader from '../components/PageHeader'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import SafeImage from '../components/SafeImage'
import Pagination from '../components/Pagination'

const PER_HALAMAN = 6

export default function LayananAntar() {
  const [kurir, setKurir] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/kurir?per_page=100')
      .then((res) => setKurir(res.data?.data || []))
      .finally(() => setLoading(false))
  }, [])

  const totalPages = Math.max(1, Math.ceil(kurir.length / PER_HALAMAN))
  const halamanIni = kurir.slice((page - 1) * PER_HALAMAN, page * PER_HALAMAN)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <PageHeader
        badge="🛵 Layanan Antar"
        title="Mitra kurir NOKA"
        subtitle="Direktori kurir lokal - hubungi langsung via WhatsApp untuk atur pengantaran"
      />

      {loading ? (
        <Spinner label="Memuat mitra kurir..." />
      ) : kurir.length === 0 ? (
        <EmptyState icon="🛵" title="Belum ada mitra kurir" description="Coba cek lagi nanti." />
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            {halamanIni.map((k) => (
            <div key={k.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex gap-3 hover:shadow-md transition">
              <div className="w-14 h-14 rounded-xl bg-brand-50 dark:bg-gray-800 flex-shrink-0 overflow-hidden">
                <SafeImage src={k.foto_logo} className="w-full h-full object-cover" alt={k.nama_layanan} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm truncate">{k.nama_layanan}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${k.status_ketersediaan ? 'bg-green-100 text-green-700' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                    {k.status_ketersediaan ? '🟢 Tersedia' : '⚪ Tidak tersedia'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">📍 {k.area_layanan}</p>
                {k.kendaraan && <p className="text-xs text-gray-500 dark:text-gray-400">🛵 {k.kendaraan}</p>}
                <p className="text-xs text-gray-500 dark:text-gray-400">🕒 {k.jam_operasional || 'Tidak ditentukan'}</p>
                <a
                  href={linkWhatsApp(k.no_whatsapp, `Halo ${k.nama_layanan}, saya mau tanya ketersediaan layanan antar dari NOKA.`)}
                  target="_blank" rel="noreferrer"
                  className="inline-block mt-2.5 text-xs font-semibold text-white bg-brand-500 rounded-full px-3 py-1.5"
                >
                  Hubungi via WhatsApp →
                </a>
                {!k.user_id && (
                  <Link to={`/klaim/kurir?id=${k.id}`} className="block mt-1.5 text-xs font-semibold text-amber-600">
                    Ini layananmu? Klaim di sini →
                  </Link>
                )}
              </div>
            </div>
          ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  )
}
