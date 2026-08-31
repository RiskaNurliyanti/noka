<<<<<<< HEAD
// Menu samping buat halaman dashboard (admin/mitra).
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Menu per role, sesuai struktur roadmap. Beberapa item nunjuk ke halaman
// yang sama kalau fiturnya memang digabung jadi satu (misal statistik toko
// nempel di dashboard, bukan halaman "Laporan" terpisah).
const MENU = {
  pembeli: [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Pesanan Saya', to: '/pesanan-saya' },
    { label: 'Favorit', to: '/favorit' },
    { label: 'Review Saya', to: '/review-saya' },
    { label: 'Profil', to: '/profil' },
    { label: 'Lapor Masalah', to: '/lapor-masalah' },
  ],
  mitra_toko: [
    { label: 'Pengaturan Toko', to: '/mitra/toko' },
    { label: 'Kelola Menu', to: '/mitra/toko/menu' },
    { label: 'Pesanan', to: '/mitra/toko/pesanan' },
    { label: 'Laporan', to: '/mitra/toko/laporan' },
    { label: 'Langganan & Tagihan', to: '/mitra/toko/langganan' },
    { label: 'Lapor Masalah', to: '/lapor-masalah' },
  ],
  mitra_kurir: [
    { label: 'Dashboard', to: '/mitra/kurir' },
    { label: 'Pesanan', to: '/mitra/kurir/pesanan' },
    { label: 'Lapor Masalah', to: '/lapor-masalah' },
  ],
  admin: [
    { label: 'Dashboard', to: '/admin' },
    { label: 'Analitik Pengunjung', to: '/admin/analitik' },
    { label: 'Kelola Pengguna', to: '/admin/pengguna' },
    { label: 'Kelola Toko', to: '/admin/toko' },
    { label: 'Kelola Kurir', to: '/admin/kurir' },
    { label: 'Kelola Produk', to: '/admin/produk' },
    { label: 'Pesanan', to: '/admin/pesanan' },
    { label: 'Kelola Kategori Produk', to: '/admin/kategori' },
    { label: 'Kelola Kategori Toko', to: '/admin/kategori-toko' },
    { label: 'Kelola Aduan', to: '/admin/laporan' },
    { label: 'Langganan Toko', to: '/admin/langganan' },
    { label: 'Lapor Masalah', to: '/lapor-masalah' },
  ],
  super_admin: [
    { label: 'Dashboard', to: '/super-admin' },
    { label: 'Analitik Pengunjung', to: '/admin/analitik' },
    { label: 'Kelola Pengguna', to: '/admin/pengguna' },
    { label: 'Kelola Toko', to: '/admin/toko' },
    { label: 'Kelola Kurir', to: '/admin/kurir' },
    { label: 'Kelola Produk', to: '/admin/produk' },
    { label: 'Kelola Kategori Toko', to: '/admin/kategori-toko' },
    { label: 'Kelola Kategori Produk', to: '/admin/kategori' },
    { label: 'Kelola Pesanan', to: '/admin/pesanan' },
    { label: 'Moderasi Review', to: '/admin/review' },
    { label: 'Kelola Aduan', to: '/admin/laporan' },
    { label: 'Langganan Toko', to: '/admin/langganan' },
    { label: 'Audit Log', to: '/super-admin/audit-log' },
    { label: 'Status Database', to: '/super-admin/status-database' },
    { label: 'Pengaturan Sistem', to: '/super-admin/pengaturan' },
    { label: 'Lapor Masalah', to: '/lapor-masalah' },
  ],
}

export function useSidebarMenu() {
  const { role } = useAuth()
  return MENU[role] || []
}

export default function Sidebar({ onNavigate }) {
  const menu = useSidebarMenu()
  const location = useLocation()

  return (
    <nav className="space-y-1">
      {menu.map((item) => {
        const aktif = location.pathname === item.to
        return (
          <Link
            key={item.label}
            to={item.to}
            onClick={onNavigate}
            className={`block px-3 py-2 rounded-lg text-sm font-medium ${
              aktif
                ? 'bg-brand-500 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
