// Routing utama aplikasi - daftar semua halaman & proteksi role per rute.
import { useEffect, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './components/DashboardLayout'
import { api } from './lib/apiClient'
import { catatKunjungan } from './lib/tracking'

import Home from './pages/Home'
import TokoList from './pages/TokoList'
import TokoDetail from './pages/TokoDetail'
import ProdukList from './pages/ProdukList'
import ProdukDetail from './pages/ProdukDetail'
import LayananAntar from './pages/LayananAntar'
import Peta from './pages/Peta'
import Login from './pages/Login'
import Register from './pages/Register'
import LupaPassword from './pages/LupaPassword'
import ResetPassword from './pages/ResetPassword'
import Keranjang from './pages/Keranjang'
import Checkout from './pages/Checkout'
import Dashboard from './pages/Dashboard'
import PesananSaya from './pages/PesananSaya'
import ReviewSaya from './pages/ReviewSaya'
import EditProfil from './pages/EditProfil'
import Favorit from './pages/Favorit'
import KlaimMitra from './pages/KlaimMitra'
import Maintenance from './pages/Maintenance'
import CaraKerja from './pages/CaraKerja'
import Ketentuan from './pages/Ketentuan'
import LaporMasalah from './pages/LaporMasalah'
import DaftarMitra from './pages/mitra/DaftarMitra'
import PengaturanToko from './pages/mitra/PengaturanToko'
import LaporanToko from './pages/mitra/LaporanToko'
import Langganan from './pages/mitra/Langganan'
import KelolaMenu from './pages/mitra/KelolaMenu'
import PesananMasuk from './pages/mitra/PesananMasuk'
import DashboardKurir from './pages/mitra/DashboardKurir'
import PesananKurir from './pages/mitra/PesananKurir'
import DashboardAdmin from './pages/admin/DashboardAdmin'
import SuperAdminDashboard from './pages/admin/SuperAdminDashboard'
import KelolaToko from './pages/admin/KelolaToko'
import KelolaKurir from './pages/admin/KelolaKurir'
import KelolaKategori from './pages/admin/KelolaKategori'
import KelolaKategoriToko from './pages/admin/KelolaKategoriToko'
import LaporanAdmin from './pages/admin/LaporanAdmin'
import KelolaProdukGlobal from './pages/admin/KelolaProdukGlobal'
import KelolaPengguna from './pages/admin/KelolaPengguna'
import PengaturanSistem from './pages/admin/PengaturanSistem'
import ModerasiReview from './pages/admin/ModerasiReview'
import KelolaLaporan from './pages/admin/KelolaLaporan'
import KelolaLangganan from './pages/admin/KelolaLangganan'
import AuditLogSuperAdmin from './pages/admin/AuditLogSuperAdmin'
import StatusDatabaseSuperAdmin from './pages/admin/StatusDatabaseSuperAdmin'
import AnalitikPengunjung from './pages/admin/AnalitikPengunjung'

// Bungkus halaman dashboard dengan sidebar/drawer + proteksi login (dan role kalau diisi)
function D({ children, role }) {
  return (
    <ProtectedRoute role={role}>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  )
}

export default function App() {
  const [maintenance, setMaintenance] = useState(false)
  const [cekSelesai, setCekSelesai] = useState(false)
  const lokasi = useLocation()

  useEffect(() => {
    api
      .get('/pengaturan')
      .then((res) => {
        setMaintenance(!!res.data?.maintenance_mode)
        setCekSelesai(true)
      })
      .catch(() => setCekSelesai(true)) // gagal cek -> anggap bukan maintenance, jangan blokir situs
  }, [])

  useEffect(() => {
    catatKunjungan(lokasi.pathname)
  }, [lokasi.pathname])

  // Scroll otomatis ke elemen dengan id yang cocok kalau URL punya hash -
  // React Router (beda dari link <a> HTML biasa) TIDAK melakukan ini
  // sendiri secara default di SPA, jadi harus ditangani manual di sini.
  // Fitur generik ini dulu dipakai buat "/mitra/kurir#pesanan", sekarang
  // menu Pesanan kurir sudah jadi rute halaman sendiri jadi tidak dipakai
  // lagi buat itu - dibiarkan tetap ada kalau ada kebutuhan anchor serupa
  // di kemudian hari. setTimeout kecil dipakai supaya konten halaman
  // tujuan (yang biasanya baru selesai fetch data & render) sempat
  // ke-mount dulu sebelum dicari.
  useEffect(() => {
    if (!lokasi.hash) return
    const timer = setTimeout(() => {
      const elemen = document.getElementById(lokasi.hash.slice(1))
      elemen?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 300)
    return () => clearTimeout(timer)
  }, [lokasi.pathname, lokasi.hash])

  const isRuteAdmin = window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/super-admin')

  if (cekSelesai && maintenance && !isRuteAdmin) {
    return <Maintenance />
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Publik */}
          <Route path="/" element={<Home />} />
          <Route path="/toko" element={<TokoList />} />
          <Route path="/toko/:id" element={<TokoDetail />} />
          <Route path="/produk" element={<ProdukList />} />
          <Route path="/produk/:id" element={<ProdukDetail />} />
          <Route path="/layanan-antar" element={<LayananAntar />} />
          <Route path="/peta" element={<Peta />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/lupa-password" element={<LupaPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/keranjang" element={<Keranjang />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/daftar-mitra" element={<DaftarMitra />} />
          <Route path="/klaim/:jenis" element={<KlaimMitra />} />
          <Route path="/cara-kerja" element={<CaraKerja />} />
          <Route path="/ketentuan" element={<Ketentuan />} />

          {/* Pelanggan (login) */}
          <Route path="/dashboard" element={<D><Dashboard /></D>} />
          <Route path="/profil" element={<D><EditProfil /></D>} />
          <Route path="/pesanan-saya" element={<D><PesananSaya /></D>} />
          <Route path="/review-saya" element={<D><ReviewSaya /></D>} />
          <Route path="/favorit" element={<D><Favorit /></D>} />

          <Route path="/lapor-masalah" element={<D><LaporMasalah /></D>} />

          {/* Mitra toko (Penjual) */}
          <Route path="/mitra/toko" element={<D role="mitra_toko"><PengaturanToko /></D>} />
          <Route path="/mitra/toko/menu" element={<D role="mitra_toko"><KelolaMenu /></D>} />
          <Route path="/mitra/toko/pesanan" element={<D role="mitra_toko"><PesananMasuk /></D>} />
          <Route path="/mitra/toko/laporan" element={<D role="mitra_toko"><LaporanToko /></D>} />

          <Route path="/mitra/toko/langganan" element={<D role="mitra_toko"><Langganan /></D>} />

          {/* Mitra kurir */}
          <Route path="/mitra/kurir" element={<D role="mitra_kurir"><DashboardKurir /></D>} />
          <Route path="/mitra/kurir/pesanan" element={<D role="mitra_kurir"><PesananKurir /></D>} />

          {/* Admin Website (super_admin juga boleh akses) */}
          <Route path="/admin" element={<D role="admin"><DashboardAdmin /></D>} />
          <Route path="/admin/toko" element={<D role="admin"><KelolaToko /></D>} />
          <Route path="/admin/kurir" element={<D role="admin"><KelolaKurir /></D>} />
          <Route path="/admin/kategori" element={<D role="admin"><KelolaKategori /></D>} />
          <Route path="/admin/kategori-toko" element={<D role="admin"><KelolaKategoriToko /></D>} />
          <Route path="/admin/pesanan" element={<D role="admin"><LaporanAdmin /></D>} />
          <Route path="/admin/produk" element={<D role="admin"><KelolaProdukGlobal /></D>} />
          <Route path="/admin/review" element={<D role="admin"><ModerasiReview /></D>} />

          <Route path="/admin/laporan" element={<D role="admin"><KelolaLaporan /></D>} />

          <Route path="/admin/langganan" element={<D role="admin"><KelolaLangganan /></D>} />
          <Route path="/super-admin/audit-log" element={<D role="super_admin"><AuditLogSuperAdmin /></D>} />

          <Route path="/super-admin/status-database" element={<D role="super_admin"><StatusDatabaseSuperAdmin /></D>} />

          <Route path="/admin/analitik" element={<D role="admin"><AnalitikPengunjung /></D>} />

          {/* Super Admin - eksklusif */}
          <Route path="/super-admin" element={<D role="super_admin"><SuperAdminDashboard /></D>} />
          <Route path="/admin/pengguna" element={<D role="admin"><KelolaPengguna /></D>} />
          <Route path="/super-admin/pengaturan" element={<D role="super_admin"><PengaturanSistem /></D>} />

          <Route path="*" element={<div className="max-w-xl mx-auto px-4 py-24 text-center text-gray-400 dark:text-gray-500">Halaman tidak ditemukan.</div>} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
