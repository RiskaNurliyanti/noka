// Kartu toko (foto, nama, rating), dipakai di daftar toko.
import { Link } from 'react-router-dom'
import SafeImage from './SafeImage'

export default function StoreCard({ toko }) {
  return (
    <Link
      to={`/toko/${toko.id}`}
      className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden hover:border-brand-400 hover:shadow-lg transition block"
    >
      {/* Foto toko */}
      <div className="w-full h-36 bg-gray-100 dark:bg-gray-800 overflow-hidden relative">
        {toko.foto_banner || toko.foto_logo ? (
          <SafeImage
            src={toko.foto_banner || toko.foto_logo}
            alt={toko.nama_toko}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            Tidak ada foto
          </div>
        )}
        {toko.user_id === null && (
          <span className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            BELUM DIKLAIM
          </span>
        )}
      </div>

      <div className="p-4">

        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-sm truncate">{toko.nama_toko}</h3>
          {toko.sedang_buka === false && (
            <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-0.5 whitespace-nowrap">Tutup</span>
          )}
        </div>

        {toko.kategoriToko?.nama && (
          <span className="inline-block text-xs font-medium text-brand-600 bg-brand-50 dark:bg-brand-950/40 rounded-full px-2 py-0.5 mt-1.5">
            {toko.kategoriToko.nama}
          </span>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 truncate">
          📍 {toko.desa || toko.kecamatan || 'Lokasi belum diisi'}
        </p>

        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
          <span>👁 {toko.jumlah_kunjungan ?? 0}</span>
          <span>⭐ {toko.rating_rata ? `${Number(toko.rating_rata).toFixed(1)} (${toko.jumlah_review})` : '-'}</span>
          <span>📦 {toko.jumlah_produk ?? 0}</span>
        </div>

      </div>
    </Link>
  )
}
