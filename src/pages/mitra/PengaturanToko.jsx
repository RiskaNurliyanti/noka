import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/apiClient'
import { uploadFoto } from '../../lib/storage'
import { useNotifikasiToko } from '../../lib/useNotifikasiToko'
import SafeImage from '../../components/SafeImage'

import { useToast } from '../../context/ToastContext'

import Card from '../../components/Card'
import Button from '../../components/Button'
import Input from '../../components/Input'
import StatCard from '../../components/StatCard'
import GaleriUpload from '../../components/GaleriUpload'
import EmptyState from '../../components/EmptyState'
import Spinner from '../../components/Spinner'
import SearchableSelect from '../../components/SearchableSelect'
import LocationPicker from '../../components/LocationPicker'
import StatistikHarianChart from '../../components/StatistikHarianChart'

export default function PengaturanToko() {
  const { user } = useAuth()
  const { showToast } = useToast()
  // Badge "Pesanan baru" di tombol shortcut bawah - pakai jumlah_baru
  // (belum dilihat), BUKAN total seluruh pesanan seperti sebelumnya, jadi
  // begitu dilihat (lonceng notifikasi di navbar diklik, atau halaman
  // Pesanan dibuka) angkanya beneran hilang - bukan angka statis yang
  // nempel terus walau pesanan lama sudah lama ditindaklanjuti.
  const notifToko = useNotifikasiToko(true)

  const [toko, setToko] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [statsHarian, setStatsHarian] = useState([])

  const [profilForm, setProfilForm] = useState(null)
  const [kategoriToko, setKategoriToko] = useState([])
  const [simpanProfil, setSimpanProfil] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [previewLogo, setPreviewLogo] = useState(null)
  const [previewBanner, setPreviewBanner] = useState(null)

  async function muatData() {
    try {
      const t = await api.get('/mitra/toko')
      const tokoData = t.data
      setToko(tokoData)

      setProfilForm({
        nama_toko: tokoData.nama_toko || '',
        kategori_toko_id: tokoData.kategori_toko_id || '',
        no_whatsapp: tokoData.no_whatsapp || '',
        deskripsi: tokoData.deskripsi || '',
        alamat: tokoData.alamat || '',
        kecamatan: tokoData.kecamatan || '',
        desa: tokoData.desa || '',
        lokasi_lat: tokoData.lokasi_lat || null,
        lokasi_lng: tokoData.lokasi_lng || null,
        jam_buka: (tokoData.jam_buka || '').slice(0, 5),
        jam_tutup: (tokoData.jam_tutup || '').slice(0, 5),
        galeri: tokoData.galeri || [],
      })

      const statsRes = await api.get('/mitra/toko/stats')
      setStats(statsRes.data)

      const statsHarianRes = await api.get('/mitra/toko/stats-harian')
      setStatsHarian(statsHarianRes.data || [])
    } catch {
      setToko(null)
    } finally {
      setLoading(false)
    }

    const kategoriTokoRes = await api.get('/kategori-toko')
    setKategoriToko(kategoriTokoRes.data || [])
  }

  useEffect(() => { if (user) muatData() }, [user])

  async function simpanProfilToko(e) {
    e.preventDefault()
    if (!profilForm.no_whatsapp) return showToast('Nomor WhatsApp wajib diisi', 'error')

    setSimpanProfil(true)
    try {
      await api.put('/mitra/toko', profilForm)
      showToast('Profil toko berhasil disimpan')
      muatData()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSimpanProfil(false)
    }
  }

  async function gantiFotoBanner(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const previewUrl = URL.createObjectURL(file)
    setPreviewBanner(previewUrl)
    setUploadingBanner(true)
    try {
      const url = await uploadFoto(file, 'toko')
      await api.put('/mitra/toko', { foto_banner: url })
      showToast('Foto cover diperbarui')
      await muatData()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setUploadingBanner(false)
      URL.revokeObjectURL(previewUrl)
      setPreviewBanner(null)
    }
  }

  async function gantiFotoLogo(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const previewUrl = URL.createObjectURL(file)
    setPreviewLogo(previewUrl)
    setUploadingLogo(true)
    try {
      const url = await uploadFoto(file, 'toko')
      await api.put('/mitra/toko', { foto_logo: url })
      showToast('Logo toko diperbarui')
      await muatData()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setUploadingLogo(false)
      URL.revokeObjectURL(previewUrl)
      setPreviewLogo(null)
    }
  }

  async function toggleBuka() {
    await api.put('/mitra/toko/status-buka', { status_buka: !toko.status_buka })
    muatData()
  }

  if (loading) {
    return <Spinner label="Memuat data toko..." />
  }

  if (!toko) {
    return (
      <EmptyState
        icon="🏪"
        title="Toko belum ditemukan"
        description="Kamu belum punya toko terdaftar, atau masih menunggu verifikasi admin."
      />
    )
  }

  return (
    <div className="space-y-8">

      {/* HEADER TOKO */}
      <Card padded={false} className="overflow-hidden">
        <div className="h-40 bg-gray-100 dark:bg-gray-800 relative">
          {previewBanner || toko.foto_banner ? (
            <SafeImage src={previewBanner || toko.foto_banner} alt={toko.nama_toko} className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">Belum ada cover toko</div>
          )}
          {uploadingBanner && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-sm font-medium">
              Mengupload cover...
            </div>
          )}
        </div>

        <div className="px-6 pb-6 flex flex-wrap gap-5 items-end">
          <div className="-mt-14 relative">
            <SafeImage
              src={previewLogo || toko.foto_logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(toko.nama_toko)}`}
              alt={toko.nama_toko}
              className="w-28 h-28 rounded-3xl object-cover border-4 border-white dark:border-gray-900 shadow-lg"
            />
            {uploadingLogo && (
              <div className="absolute inset-0 rounded-3xl bg-black/40 flex items-center justify-center text-white text-xs font-medium text-center px-2">
                Mengupload...
              </div>
            )}
          </div>

          <div className="flex-1 pt-3">
            <h1 className="text-2xl font-bold">{toko.nama_toko}</h1>
            <div className="flex gap-2 flex-wrap mt-3">
              <button
                onClick={toggleBuka}
                className={`px-4 py-2 rounded-full text-xs font-semibold ${toko.status_buka ? 'bg-green-100 text-green-700' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}
              >
                {toko.status_buka ? '🟢 Toko buka' : '⚫ Toko tutup'}
              </button>

              {toko.status_buka && !toko.sedang_buka && (
                <span
                  className="px-3 py-2 rounded-full text-xs font-medium text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400"
                  title="Toko kamu di luar jam operasional yang diatur, jadi otomatis tampil tutup ke pembeli meski toggle di sini masih 'buka'."
                >
                  ⏰ Di luar jam operasional - tampil tutup ke pembeli
                </span>
              )}

              <label className="cursor-pointer px-4 py-2 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-600 text-xs font-semibold">
                {uploadingLogo ? 'Uploading...' : '📷 Ganti logo'}
                <input type="file" accept="image/*" className="hidden" onChange={gantiFotoLogo} />
              </label>

              <label className="cursor-pointer px-4 py-2 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-600 text-xs font-semibold">
                {uploadingBanner ? 'Uploading...' : '📷 Ganti cover'}
                <input type="file" accept="image/*" className="hidden" onChange={gantiFotoBanner} />
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <Link to="/mitra/toko/menu">
              <Button size="lg" variant="secondary">🍽️ Kelola Menu</Button>
            </Link>
            <Link to="/mitra/toko/pesanan" onClick={() => notifToko.jumlah_baru > 0 && notifToko.tandaiDilihat()}>
              <Button size="lg">
                🛒 Pesanan{notifToko.jumlah_baru > 0 ? ` (${notifToko.jumlah_baru} baru)` : ''}
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* WARNING WHATSAPP */}
      {!toko.no_whatsapp && (
        <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">⚠️ Nomor WhatsApp toko belum diisi</p>
          <p className="text-xs mt-1 text-red-600 dark:text-red-400">Pembeli tidak bisa checkout melalui WhatsApp sebelum nomor toko ditambahkan.</p>
        </Card>
      )}

      {/* STATISTIK */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard icon="👀" label="Kunjungan" value={stats?.jumlah_kunjungan ?? 0} />
        <StatCard icon="🛒" label="Pesanan" value={stats?.jumlah_pesanan ?? 0} />
        <StatCard icon="💰" label="Pendapatan" value={`Rp${Number(stats?.pendapatan ?? 0).toLocaleString('id-ID')}`} accent="green" />
        <StatCard icon="⭐" label="Rating" value={stats?.rating_rata ?? '-'} accent="accent" />
        <StatCard icon="❤️" label="Favorit" value={stats?.jumlah_favorit ?? 0} accent="accent" />
      </div>

      {/* DIAGRAM STATISTIK PESANAN */}
      <Card>
        <h2 className="text-lg font-bold mb-1">📊 Statistik pesanan</h2>
        <StatistikHarianChart data={statsHarian} dataKey="jumlah_pesanan" label="Jumlah Pesanan" />
      </Card>

      {/* PROFIL TOKO */}
      <section>
        <h2 className="text-lg font-bold mb-4">Profil toko</h2>

        {profilForm && (
          <Card>
            <form onSubmit={simpanProfilToko} className="grid md:grid-cols-2 gap-3">
              <Input label="Nama toko" value={profilForm.nama_toko} onChange={(e) => setProfilForm((f) => ({ ...f, nama_toko: e.target.value }))} />

              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Kategori toko</label>
                <SearchableSelect
                  value={profilForm.kategori_toko_id || ''}
                  onChange={(v) => setProfilForm((f) => ({ ...f, kategori_toko_id: v }))}
                  placeholder="Pilih kategori toko"
                  options={kategoriToko.map((k) => ({ value: k.id, label: k.nama }))}
                />
              </div>

              <Input label="Nomor WhatsApp" value={profilForm.no_whatsapp} onChange={(e) => setProfilForm((f) => ({ ...f, no_whatsapp: e.target.value }))} />
              <Input label="Alamat toko" value={profilForm.alamat} onChange={(e) => setProfilForm((f) => ({ ...f, alamat: e.target.value }))} />

              <div className="flex gap-3">
                <Input label="Kecamatan" className="flex-1" value={profilForm.kecamatan} onChange={(e) => setProfilForm((f) => ({ ...f, kecamatan: e.target.value }))} />
                <Input label="Desa" className="flex-1" value={profilForm.desa} onChange={(e) => setProfilForm((f) => ({ ...f, desa: e.target.value }))} />
              </div>

              <div className="flex gap-3">
                <Input label="Jam buka" type="time" className="flex-1" value={profilForm.jam_buka} onChange={(e) => setProfilForm((f) => ({ ...f, jam_buka: e.target.value }))} />
                <Input label="Jam tutup" type="time" className="flex-1" value={profilForm.jam_tutup} onChange={(e) => setProfilForm((f) => ({ ...f, jam_tutup: e.target.value }))} />
              </div>

              <div className="md:col-span-2">
                <Input label="Deskripsi toko" textarea rows={4} value={profilForm.deskripsi} onChange={(e) => setProfilForm((f) => ({ ...f, deskripsi: e.target.value }))} />
              </div>

              <div className="md:col-span-2">
                <p className="text-sm font-medium mb-2">Lokasi di peta</p>
                <LocationPicker
                  lat={profilForm.lokasi_lat}
                  lng={profilForm.lokasi_lng}
                  onChange={(lat, lng) => setProfilForm((f) => ({ ...f, lokasi_lat: lat, lokasi_lng: lng }))}
                />
              </div>

              <div className="md:col-span-2">
                <p className="text-sm font-medium mb-2">Galeri foto toko</p>
                <GaleriUpload value={profilForm.galeri} onChange={(galeri) => setProfilForm((f) => ({ ...f, galeri }))} folder="toko" />
              </div>

              <Button type="submit" full loading={simpanProfil} className="md:col-span-2">
                {simpanProfil ? 'Menyimpan...' : 'Simpan profil toko'}
              </Button>
            </form>
          </Card>
        )}
      </section>

    </div>
  )
}
