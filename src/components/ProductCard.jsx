<<<<<<< HEAD
// Kartu produk (foto, nama, harga), dipakai di daftar produk.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
import { Link } from 'react-router-dom'
import SafeImage from './SafeImage'

export default function ProductCard({ produk }) {
  const adaDiskon = produk.harga_diskon && Number(produk.harga_diskon) < Number(produk.harga)

  return (
    <Link
      to={`/produk/${produk.id ?? produk.produk_id}`}
      className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden hover:border-brand-400 hover:shadow-lg transition"
    >
      <div className="h-32 bg-brand-50 dark:bg-gray-800 relative overflow-hidden">
        <SafeImage src={produk.foto} alt={produk.nama} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
        {adaDiskon && (
          <span className="absolute top-2 left-2 bg-accent-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            DISKON
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-medium truncate">{produk.nama}</p>
        {adaDiskon ? (
          <div className="flex items-center gap-1.5 mt-1">
            <p className="text-sm font-semibold text-accent-500">Rp{Number(produk.harga_diskon).toLocaleString('id-ID')}</p>
            <p className="text-xs text-gray-400 line-through">Rp{Number(produk.harga).toLocaleString('id-ID')}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Rp{Number(produk.harga).toLocaleString('id-ID')}</p>
        )}
      </div>
    </Link>
  )
}
