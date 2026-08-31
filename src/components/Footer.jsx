<<<<<<< HEAD
// Footer aplikasi.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-700 mt-16 bg-white dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-4 gap-8 text-sm">
        <div className="md:col-span-2">
          <p className="flex items-center gap-1.5 text-brand-500 font-extrabold text-xl mb-2">
            <span className="w-7 h-7 rounded-lg bg-brand-500 text-white flex items-center justify-center text-sm">N</span>
            NOKA
          </p>
          <p className="text-gray-500 dark:text-gray-400 max-w-xs">
            Platform perantara toko UMKM, produk, dan kurir lokal. Pesan langsung, lanjut chat WhatsApp.
          </p>
        </div>

        <div>
          <p className="font-semibold mb-3">Jelajahi</p>
          <div className="flex flex-col gap-2 text-gray-500 dark:text-gray-400">
            <Link to="/toko" className="hover:text-brand-500 transition">Toko</Link>
            <Link to="/produk" className="hover:text-brand-500 transition">Produk</Link>
            <Link to="/layanan-antar" className="hover:text-brand-500 transition">Layanan Antar</Link>
            <Link to="/peta" className="hover:text-brand-500 transition">Peta</Link>
          </div>
        </div>

        <div>
          <p className="font-semibold mb-3">Info</p>
          <div className="flex flex-col gap-2 text-gray-500 dark:text-gray-400">
            <Link to="/cara-kerja" className="hover:text-brand-500 transition">Cara kerja</Link>
            <Link to="/ketentuan" className="hover:text-brand-500 transition">Syarat & ketentuan</Link>
            <Link to="/daftar-mitra" className="hover:text-brand-500 transition">Daftar mitra</Link>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-gray-800 py-4">
        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
          © {new Date().getFullYear()} NOKA. Platform hanya berperan sebagai perantara.
        </p>
      </div>
    </footer>
  )
}
