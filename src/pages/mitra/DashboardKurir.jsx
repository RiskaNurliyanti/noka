import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/apiClient'
import { uploadFoto } from '../../lib/storage'
import SafeImage from '../../components/SafeImage'
import { useToast } from '../../context/ToastContext'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Input from '../../components/Input'
import StatCard from '../../components/StatCard'
import StatistikHarianChart from '../../components/StatistikHarianChart'
import EmptyState from '../../components/EmptyState'

/**
 * Dashboard kurir - profil, status "menerima order", statistik pengantaran,
 * dan edit info layanan. Daftar pesanan sendiri ada di halaman terpisah
 * (PesananKurir.jsx, menu "Pesanan") - dulu digabung di sini, dipisah biar
 * jelas mana halaman "kelola profil" dan mana "kelola pesanan", sama seperti
 * mitra_toko (Pengaturan Toko terpisah dari Pesanan).
 */
export default function DashboardKurir() {
  const { user } = useAuth()
  const { showToast } = useToast()

  const [kurir, setKurir] = useState(null)
  const [totalPesanan, setTotalPesanan] = useState(0)
  const [statsHarian, setStatsHarian] = useState([])
  const [loading, setLoading] = useState(true)

  const [editForm, setEditForm] = useState(null)
  const [fotoBaru, setFotoBaru] = useState(null)
  const [previewFotoBaru, setPreviewFotoBaru] = useState(null)
  const [simpanLoading, setSimpanLoading] = useState(false)

  async function muatData() {
    if (!user) return

    try {
      const k = await api.get('/mitra/kurir')
      const kurirData = k.data
      setKurir(kurirData)

      setEditForm({
        nama_layanan: kurirData.nama_layanan || '',
        no_whatsapp: kurirData.no_whatsapp || '',
        area_layanan: kurirData.area_layanan || '',
        jam_operasional: kurirData.jam_operasional || '',
        kendaraan: kurirData.kendaraan || '',
      })

      // Cuma butuh field 'total' dari respons ini buat kartu statistik -
      // per_page=1 supaya tidak ikut narik daftar pesanan yang tidak
      // dipakai di halaman ini (daftarnya ada di PesananKurir.jsx).
      const p = await api.get('/mitra/kurir/pesanan?per_page=1')
      setTotalPesanan(p.data?.total || 0)

      const statsHarianRes = await api.get('/mitra/kurir/stats-harian')
      setStatsHarian(statsHarianRes.data || [])
    } catch {
      setKurir(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { muatData() }, [user])

  async function ubahStatus() {
    await api.put('/mitra/kurir/ketersediaan', { status_ketersediaan: !kurir.status_ketersediaan })
    muatData()
  }

  function pilihFotoBaru(file) {
    if (previewFotoBaru) URL.revokeObjectURL(previewFotoBaru)
    setFotoBaru(file)
    setPreviewFotoBaru(file ? URL.createObjectURL(file) : null)
  }

  async function simpanEditKurir(e) {
    e.preventDefault()
    if (!editForm.nama_layanan || !editForm.no_whatsapp) {
      showToast('Nama layanan dan nomor WhatsApp wajib diisi', 'error')
      return
    }

    setSimpanLoading(true)
    try {
      let fotoUrl = kurir.foto_logo
      if (fotoBaru) fotoUrl = await uploadFoto(fotoBaru, 'kurir')

      await api.put('/mitra/kurir', {
        nama_layanan: editForm.nama_layanan,
        no_whatsapp: editForm.no_whatsapp,
        area_layanan: editForm.area_layanan,
        jam_operasional: editForm.jam_operasional,
        kendaraan: editForm.kendaraan,
        foto_logo: fotoUrl,
      })

      showToast('Informasi kurir berhasil disimpan')
      pilihFotoBaru(null)
      muatData()
    } catch (err) {
      showToast('Gagal menyimpan: ' + err.message, 'error')
    } finally {
      setSimpanLoading(false)
    }
  }

  if (loading) return <p className="text-center py-10 text-gray-500 dark:text-gray-400">Memuat dashboard...</p>

  if (!kurir) {
    return <EmptyState icon="🛵" title="Belum terdaftar sebagai mitra kurir" description="Kamu belum terdaftar sebagai mitra kurir, atau masih menunggu verifikasi admin." />
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <Card className="flex items-center gap-5">
        <SafeImage src={kurir.foto_logo || 'https://ui-avatars.com/api/?name=Kurir'} className="w-20 h-20 rounded-2xl object-cover" />
        <div>
          <h1 className="text-2xl font-bold">{kurir.nama_layanan}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">🛵 Mitra Kurir NOKA</p>
        </div>
      </Card>

      {/* STATUS */}
      <Card className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Status layanan</p>
          <p className="font-semibold mt-1">{kurir.status_ketersediaan ? '🟢 Sedang menerima order' : '⚪ Tidak menerima order'}</p>
        </div>
        <Button variant={kurir.status_ketersediaan ? 'danger' : 'primary'} onClick={ubahStatus}>
          {kurir.status_ketersediaan ? 'Nonaktifkan' : 'Aktifkan'}
        </Button>
      </Card>

      {/* STATISTIK */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard icon="📦" label="Total pengantaran" value={totalPesanan} />
        <StatCard icon="📍" label="Area layanan" value={kurir.area_layanan || '-'} />
      </div>

      {/* DIAGRAM STATISTIK PENGANTARAN */}
      <Card>
        <h2 className="font-semibold mb-1">📊 Statistik pengantaran</h2>
        <StatistikHarianChart data={statsHarian} dataKey="jumlah_pengantaran" label="Jumlah Pengantaran" warna="#1d5c99" />
      </Card>

      {/* EDIT INFORMASI KURIR */}
      <Card>
        <h2 className="font-semibold mb-4">Edit informasi kurir</h2>

        {editForm && (
          <form onSubmit={simpanEditKurir} className="grid md:grid-cols-2 gap-3">
            <Input label="Nama layanan" value={editForm.nama_layanan} onChange={(e) => setEditForm((f) => ({ ...f, nama_layanan: e.target.value }))} />
            <Input label="Nomor WhatsApp" value={editForm.no_whatsapp} onChange={(e) => setEditForm((f) => ({ ...f, no_whatsapp: e.target.value }))} />

            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Kendaraan</label>
              <select value={editForm.kendaraan} onChange={(e) => setEditForm((f) => ({ ...f, kendaraan: e.target.value }))}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-400">
                <option value="">Pilih kendaraan</option>
                <option value="Motor">Motor</option>
                <option value="Mobil">Mobil</option>
                <option value="Sepeda">Sepeda</option>
                <option value="Jalan kaki">Jalan kaki</option>
              </select>
            </div>

            <Input label="Area layanan" value={editForm.area_layanan} onChange={(e) => setEditForm((f) => ({ ...f, area_layanan: e.target.value }))} />
            <Input label="Jam operasional" placeholder="Contoh: 08.00 - 20.00" value={editForm.jam_operasional} onChange={(e) => setEditForm((f) => ({ ...f, jam_operasional: e.target.value }))} />

            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Foto/logo layanan</label>
              <div className="flex items-center gap-3">
                <SafeImage
                  src={previewFotoBaru || kurir.foto_logo}
                  alt="Foto kurir"
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gray-200 dark:border-gray-700"
                />
                <input type="file" accept="image/*" onChange={(e) => pilihFotoBaru(e.target.files?.[0] || null)}
                  className="text-sm border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 flex-1" />
              </div>
            </div>

            <Button type="submit" full loading={simpanLoading} className="md:col-span-2">
              {simpanLoading ? 'Menyimpan...' : 'Simpan perubahan'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  )
}
