// Navigasi atas aplikasi, termasuk lonceng notifikasi per role.
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { getCart } from '../lib/cart'
import { useNotifikasiAdmin } from '../lib/useNotifikasiAdmin'
import { useNotifikasiKurir } from '../lib/useNotifikasiKurir'
import { useNotifikasiToko } from '../lib/useNotifikasiToko'
import { useNotifikasiPembeli } from '../lib/useNotifikasiPembeli'
import { API_URL } from '../lib/apiClient'

export default function Navbar() {
  const { user, profile, logout } = useAuth()
  const { dark, toggleDark } = useTheme()
  const navigate = useNavigate()
  const [jumlahKeranjang, setJumlahKeranjang] = useState(0)
  const [menuMobileBuka, setMenuMobileBuka] = useState(false)
  const [lonceng, setLonceng] = useState(false)
  const [avatarError, setAvatarError] = useState(false)

  useEffect(() => {
    setAvatarError(false)
  }, [profile?.foto])

  const isAdminRole = profile?.role === 'admin' || profile?.role === 'super_admin'
  const notif = useNotifikasiAdmin(isAdminRole)

  const isKurirRole = profile?.role === 'mitra_kurir'
  const notifKurir = useNotifikasiKurir(isKurirRole)
  const [loncengKurir, setLoncengKurir] = useState(false)

  const isTokoRole = profile?.role === 'mitra_toko'
  const notifToko = useNotifikasiToko(isTokoRole)
  const [loncengToko, setLoncengToko] = useState(false)

  const isPembeliRole = !!user && profile?.role === 'pembeli'
  const notifPembeli = useNotifikasiPembeli(isPembeliRole)
  const [loncengPembeli, setLoncengPembeli] = useState(false)

  useEffect(() => {
    function hitung() {
      const items = getCart()
      setJumlahKeranjang(items.reduce((sum, it) => sum + it.qty, 0))
    }
    hitung()
    window.addEventListener('noka-cart-updated', hitung)
    return () => window.removeEventListener('noka-cart-updated', hitung)
  }, [])

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-6">
        <Link to="/" className="text-xl font-extrabold text-brand-500 tracking-tight flex items-center gap-1.5">
          <span className="w-8 h-8 rounded-xl bg-brand-500 text-white flex items-center justify-center text-sm">N</span>
          NOKA
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-300">
          <Link to="/" className="hover:text-brand-500 transition">Beranda</Link>
          <Link to="/toko" className="hover:text-brand-500 transition">Toko</Link>
          <Link to="/produk" className="hover:text-brand-500 transition">Produk</Link>
          <Link to="/layanan-antar" className="hover:text-brand-500 transition">Layanan Antar</Link>
          <Link to="/peta" className="hover:text-brand-500 transition">Peta</Link>
          {user && <Link to="/dashboard" className="hover:text-brand-500 transition">Dashboard</Link>}
          <Link to="/cara-kerja" className="hover:text-brand-500 transition">Tentang</Link>
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuMobileBuka((b) => !b) }}
            aria-label="Buka menu"
            aria-expanded={menuMobileBuka}
            className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition relative z-[71]"
          >
            {menuMobileBuka ? '✕' : '☰'}
          </button>

          <button
            onClick={toggleDark}
            aria-label="Ganti mode gelap/terang"
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            {dark ? '☀️' : '🌙'}
          </button>

          <Link to="/keranjang" className="relative w-9 h-9 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            🛒
            {jumlahKeranjang > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-accent-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
                {jumlahKeranjang}
              </span>
            )}
          </Link>

          {/* "Pesanan Saya" pribadi - tampil buat SEMUA akun yang login,
              tidak peduli role-nya apa (pembeli/mitra_toko/mitra_kurir/
              admin/super_admin). Setiap akun tetap punya sisi "pembeli"
              sendiri (bisa checkout produk kapan saja sebagai dirinya
              sendiri, terlepas dari peran utamanya) - dulu cuma pembeli
              yang lihat entry point ini walau halamannya sendiri sudah
              bisa diakses akun mana pun. */}
          {user && (
            <Link
              to="/pesanan-saya"
              title="Pesanan saya"
              className="relative w-9 h-9 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              🧾
            </Link>
          )}

          {isAdminRole && (
            <div className="relative">
              <button
                onClick={() => {
                  const buka = !lonceng
                  setLonceng(buka)
                  if (buka && (notif.toko > 0 || notif.kurir > 0 || notif.klaim > 0 || notif.laporan > 0)) notif.tandaiDilihat()
                }}
                aria-label="Notifikasi pengajuan"
                className="relative w-9 h-9 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                🔔
                {notif.total > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 animate-pulse">
                    {notif.total}
                  </span>
                )}
              </button>

              {lonceng && (
                <>
                  <div className="fixed inset-0 z-[1490]" onClick={() => setLonceng(false)} />
                  <div className="absolute right-0 mt-1 w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg py-2 z-[1500] overflow-hidden">
                    <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500">PENGAJUAN MENUNGGU</p>
                    {notif.total === 0 ? (
                      <p className="px-4 py-4 text-sm text-gray-400 dark:text-gray-500 text-center">Nggak ada yang baru 🎉</p>
                    ) : (
                      <>
                        {notif.toko > 0 && (
                          <Link onClick={() => setLonceng(false)} to="/admin/toko" className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                            <span>🏪 Toko baru mendaftar</span>
                            <span className="bg-red-100 text-red-600 text-xs font-bold rounded-full px-2 py-0.5">{notif.toko}</span>
                          </Link>
                        )}
                        {notif.kurir > 0 && (
                          <Link onClick={() => setLonceng(false)} to="/admin/kurir" className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                            <span>🛵 Kurir baru mendaftar</span>
                            <span className="bg-red-100 text-red-600 text-xs font-bold rounded-full px-2 py-0.5">{notif.kurir}</span>
                          </Link>
                        )}
                        {notif.klaim > 0 && (
                          <Link onClick={() => setLonceng(false)} to="/admin" className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                            <span>🤝 Klaim mitra baru</span>
                            <span className="bg-red-100 text-red-600 text-xs font-bold rounded-full px-2 py-0.5">{notif.klaim}</span>
                          </Link>
                        )}
                        {notif.laporan > 0 && (
                          <Link onClick={() => setLonceng(false)} to="/admin/laporan" className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                            <span>📮 Aduan baru</span>
                            <span className="bg-red-100 text-red-600 text-xs font-bold rounded-full px-2 py-0.5">{notif.laporan}</span>
                          </Link>
                        )}
                        {notif.langganan > 0 && (
                          <Link onClick={() => setLonceng(false)} to="/admin/langganan" className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                            <span>💳 Langganan/tagihan toko</span>
                            <span className="bg-red-100 text-red-600 text-xs font-bold rounded-full px-2 py-0.5">{notif.langganan}</span>
                          </Link>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {isKurirRole && (
            <div className="relative">
              <button
                onClick={() => {
                  const buka = !loncengKurir
                  setLoncengKurir(buka)
                  if (buka && notifKurir.jumlah_baru > 0) notifKurir.tandaiDilihat()
                }}
                aria-label="Notifikasi pesanan"
                className="relative w-9 h-9 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                🔔
                {notifKurir.jumlah_baru > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 animate-pulse">
                    {notifKurir.jumlah_baru}
                  </span>
                )}
              </button>

              {loncengKurir && (
                <>
                  <div className="fixed inset-0 z-[1490]" onClick={() => setLoncengKurir(false)} />
                  <div className="absolute right-0 mt-1 w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg py-2 z-[1500] overflow-hidden">
                    <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500">PESANAN & STATUS TERBARU</p>
                    {notifKurir.pesanan_terbaru.length === 0 ? (
                      <p className="px-4 py-4 text-sm text-gray-400 dark:text-gray-500 text-center">Belum ada pesanan baru 🛵</p>
                    ) : (
                      notifKurir.pesanan_terbaru.map((p) => (
                        <Link
                          key={p.id}
                          onClick={() => setLoncengKurir(false)}
                          to="/mitra/kurir/pesanan"
                          className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <span className="truncate">
                            {p.tipe === 'status'
                              ? `❌ Dibatalkan - ${p.toko?.nama_toko || 'Pesanan'}`
                              : `📦 ${p.toko?.nama_toko || 'Pesanan baru'}`}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                            {new Date(p.tipe === 'status' ? p.updated_at : p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </span>
                        </Link>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {isTokoRole && (
            <div className="relative">
              <button
                onClick={() => {
                  const buka = !loncengToko
                  setLoncengToko(buka)
                  if (buka && notifToko.jumlah_baru > 0) notifToko.tandaiDilihat()
                }}
                aria-label="Notifikasi pesanan"
                className="relative w-9 h-9 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                🔔
                {notifToko.jumlah_baru > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 animate-pulse">
                    {notifToko.jumlah_baru}
                  </span>
                )}
              </button>

              {loncengToko && (
                <>
                  <div className="fixed inset-0 z-[1490]" onClick={() => setLoncengToko(false)} />
                  <div className="absolute right-0 mt-1 w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg py-2 z-[1500] overflow-hidden">
                    <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500">PESANAN & STATUS TERBARU</p>
                    {notifToko.pesanan_terbaru.length === 0 ? (
                      <p className="px-4 py-4 text-sm text-gray-400 dark:text-gray-500 text-center">Belum ada pesanan baru 🛒</p>
                    ) : (
                      notifToko.pesanan_terbaru.map((p) => (
                        <Link
                          key={p.id}
                          onClick={() => setLoncengToko(false)}
                          to="/mitra/toko/pesanan"
                          className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <span className="truncate">
                            {p.tipe === 'status'
                              ? `${p.status === 'selesai' ? '✅ Selesai' : '❌ Dibatalkan'} - ${p.pembeli?.nama || p.guest_nama || 'Pembeli'}`
                              : `🛒 ${p.pembeli?.nama || p.guest_nama || 'Pembeli'}`}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                            {new Date(p.tipe === 'status' ? p.updated_at : p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </span>
                        </Link>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {isPembeliRole && (
            <div className="relative">
              <button
                onClick={() => {
                  const buka = !loncengPembeli
                  setLoncengPembeli(buka)
                  if (buka && notifPembeli.jumlah_baru > 0) notifPembeli.tandaiDilihat()
                }}
                aria-label="Notifikasi pesanan"
                className="relative w-9 h-9 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                🔔
                {notifPembeli.jumlah_baru > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 animate-pulse">
                    {notifPembeli.jumlah_baru}
                  </span>
                )}
              </button>

              {loncengPembeli && (
                <>
                  <div className="fixed inset-0 z-[1490]" onClick={() => setLoncengPembeli(false)} />
                  <div className="absolute right-0 mt-1 w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg py-2 z-[1500] overflow-hidden">
                    <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500">STATUS PESANAN KAMU</p>
                    {notifPembeli.pesanan_terbaru.length === 0 ? (
                      <p className="px-4 py-4 text-sm text-gray-400 dark:text-gray-500 text-center">Belum ada perubahan status 📦</p>
                    ) : (
                      notifPembeli.pesanan_terbaru.map((p) => {
                        const labelStatus = { diproses: 'Diproses', selesai: '✅ Selesai', dibatalkan: '❌ Dibatalkan' }[p.status] || p.status
                        return (
                          <Link
                            key={p.id}
                            onClick={() => setLoncengPembeli(false)}
                            to="/pesanan-saya"
                            className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <span className="truncate">{p.toko?.nama_toko || 'Pesananmu'} - {labelStatus}</span>
                          </Link>
                        )
                      })
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {user ? (
            <div className="relative group">
              <button className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 font-semibold text-sm flex items-center justify-center overflow-hidden">
                {profile?.foto && !avatarError ? (
                  <img
                    // Path foto dari backend bisa relatif ("/storage/...") -
                    // sama seperti SafeImage.jsx, ditempel ke API_URL yang
                    // sedang aktif dulu, bukan dipakai mentah - lihat
                    // komentar resolveUrl() di SafeImage.jsx untuk alasannya.
                    src={profile.foto.startsWith('/') ? `${API_URL}${profile.foto}` : profile.foto}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  (profile?.nama || user.email || '?').charAt(0).toUpperCase()
                )}
              </button>
              <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg py-1.5 hidden group-hover:block overflow-hidden">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-sm font-semibold truncate">{profile?.nama || 'Pengguna'}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
                </div>
                <Link to="/dashboard" className="block px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">📊 Dashboard</Link>
                <Link to="/profil" className="block px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">⚙️ Edit profil</Link>
                {profile?.role === 'mitra_toko' && (
                  <>
                    <Link to="/mitra/toko" className="block px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">🏪 Dashboard toko</Link>
                    <Link to="/mitra/toko/pesanan" className="block px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">🛒 Pesanan</Link>
                  </>
                )}
                {profile?.role === 'mitra_kurir' && (
                  <>
                    <Link to="/mitra/kurir" className="block px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">🛵 Dashboard kurir</Link>
                    <Link to="/mitra/kurir/pesanan" className="block px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">📦 Pesanan</Link>
                  </>
                )}
                {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
                  <Link to="/admin" className="block px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">🛡️ Dashboard admin</Link>
                )}
                {profile?.role === 'super_admin' && (
                  <Link to="/super-admin" className="block px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">👑 Dashboard super admin</Link>
                )}
                <button
                  onClick={async () => { await logout(); navigate('/') }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-800 border-t border-gray-100 dark:border-gray-800 mt-1"
                >
                  🚪 Keluar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="hidden sm:block text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-brand-500 transition">
                Masuk
              </Link>
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-semibold rounded-full bg-brand-500 text-white hover:bg-brand-600 shadow-sm hover:shadow-md transition"
              >
                Daftar
              </Link>
            </div>
          )}
        </div>
      </div>

      {menuMobileBuka && (
        <>
          {/* Backdrop terpisah - satu-satunya cara menu tertutup selain klik
              link atau klik hamburger lagi. Dengan backdrop eksplisit begini
              (bukan listener document global), tidak ada event propagation
              tak terduga yang bisa menutup menu secara tidak sengaja. */}
          <div
            className="fixed inset-0 bg-black/30 z-[65] md:hidden"
            onClick={() => setMenuMobileBuka(false)}
          />
          <nav
            onClick={(e) => e.stopPropagation()}
            className="fixed top-16 left-0 right-0 z-[70] md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 flex flex-col gap-1 text-sm font-medium text-gray-600 dark:text-gray-300 shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto"
          >
            <Link onClick={() => setMenuMobileBuka(false)} to="/" className="py-2 hover:text-brand-500">Beranda</Link>
            <Link onClick={() => setMenuMobileBuka(false)} to="/toko" className="py-2 hover:text-brand-500">Toko</Link>
            <Link onClick={() => setMenuMobileBuka(false)} to="/produk" className="py-2 hover:text-brand-500">Produk</Link>
            <Link onClick={() => setMenuMobileBuka(false)} to="/layanan-antar" className="py-2 hover:text-brand-500">Layanan Antar</Link>
            <Link onClick={() => setMenuMobileBuka(false)} to="/peta" className="py-2 hover:text-brand-500">Peta</Link>
            {user && <Link onClick={() => setMenuMobileBuka(false)} to="/dashboard" className="py-2 hover:text-brand-500">Dashboard</Link>}
            <Link onClick={() => setMenuMobileBuka(false)} to="/cara-kerja" className="py-2 hover:text-brand-500">Tentang</Link>
          </nav>
        </>
      )}
    </header>
  )
}
