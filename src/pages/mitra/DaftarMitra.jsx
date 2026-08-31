import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/apiClient'
import { useToast } from '../../context/ToastContext'
import SearchableSelect from '../../components/SearchableSelect'

export default function DaftarMitra() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [jenis, setJenis] = useState('toko')
  const [form, setForm] = useState({})
  const [kategoriToko, setKategoriToko] = useState([])
  const [loading, setLoading] = useState(false)
  const [sukses, setSukses] = useState(false)

  useEffect(() => {
    api.get('/kategori-toko').then((res) => setKategoriToko(res.data || []))
  }, [])

  function updateForm(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!user) return navigate('/login')
    setLoading(true)
    try {
      if (jenis === 'toko') {
        await api.post('/daftar-mitra/toko', {
          nama_toko: form.nama,
          kategori_toko_id: form.kategori_toko_id || null,
          deskripsi: form.deskripsi,
          alamat: form.alamat,
          no_whatsapp: form.whatsapp,
        })
      } else {
        await api.post('/daftar-mitra/kurir', {
          nama_layanan: form.nama,
          no_whatsapp: form.whatsapp,
          kendaraan: form.kendaraan,
          area_layanan: form.area,
        })
      }
      setSukses(true)
    } catch (err) {
      showToast('Gagal mengirim pengajuan: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  if (sukses) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 text-center shadow-lg">
          <p className="text-4xl mb-3">✅</p>
          <h1 className="text-xl font-bold mb-2">Pengajuan terkirim</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Tim admin NOKA akan meninjau pengajuanmu. Kamu akan bisa mulai kelola profil setelah disetujui.</p>
          <button onClick={() => navigate('/')} className="text-brand-500 font-semibold text-sm bg-brand-50 dark:bg-brand-950/40 rounded-full px-4 py-2">Kembali ke beranda</button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="text-center mb-6">
        <p className="text-3xl mb-2">🤝</p>
        <h1 className="text-2xl font-extrabold mb-1">Daftar jadi mitra</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Pilih jenis mitra yang mau kamu daftarkan</p>
      </div>

      <div className="flex gap-2 mb-6 bg-gray-100 dark:bg-gray-800 rounded-full p-1">
        <button onClick={() => setJenis('toko')} className={`flex-1 rounded-full py-2 text-sm font-medium transition ${jenis === 'toko' ? 'bg-brand-500 text-white shadow-sm' : 'text-gray-500'}`}>🏪 Mitra toko</button>
        <button onClick={() => setJenis('kurir')} className={`flex-1 rounded-full py-2 text-sm font-medium transition ${jenis === 'kurir' ? 'bg-brand-500 text-white shadow-sm' : 'text-gray-500'}`}>🛵 Mitra kurir</button>
      </div>

      <div className="bg-brand-50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900 rounded-2xl p-4 mb-6">
        <p className="text-xs font-semibold text-brand-700 dark:text-brand-400 mb-2">📋 Yang perlu kamu siapkan:</p>
        <ul className="text-xs text-brand-700 dark:text-brand-400 list-disc list-inside space-y-1">
          {jenis === 'toko' ? (
            <>
              <li>Nama & alamat usaha yang jelas</li>
              <li>Nomor WhatsApp aktif buat dihubungi pembeli</li>
              <li>Foto produk/toko (bisa ditambah setelah disetujui)</li>
            </>
          ) : (
            <>
              <li>Nomor WhatsApp aktif</li>
              <li>Area layanan yang jelas (nama desa/kecamatan)</li>
              <li>Kendaraan pribadi buat mengantar</li>
            </>
          )}
          <li>Pengajuan akan ditinjau admin dalam 1-3 hari via WhatsApp</li>
        </ul>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
        {!user ? (
          <button onClick={() => navigate('/login')} className="w-full border border-gray-300 dark:border-gray-600 rounded-full py-3 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            Login akun NOKA dulu buat daftar
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input required onChange={(e) => updateForm('nama', e.target.value)} placeholder={jenis === 'toko' ? 'Nama toko' : 'Nama layanan antar'}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
            {jenis === 'toko' ? (
              <>
                <input required onChange={(e) => updateForm('whatsapp', e.target.value)} placeholder="Nomor WhatsApp toko (wajib)"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
                <SearchableSelect
                  value={form.kategori_toko_id || ''}
                  onChange={(v) => updateForm('kategori_toko_id', v)}
                  placeholder="Pilih kategori toko (opsional)"
                  options={kategoriToko.map((k) => ({ value: k.id, label: k.nama }))}
                />
                <textarea onChange={(e) => updateForm('deskripsi', e.target.value)} placeholder="Deskripsi singkat toko" rows={3}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
                <input onChange={(e) => updateForm('alamat', e.target.value)} placeholder="Alamat toko"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
              </>
            ) : (
              <>
                <input required onChange={(e) => updateForm('whatsapp', e.target.value)} placeholder="Nomor WhatsApp"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
                <select onChange={(e) => updateForm('kendaraan', e.target.value)} defaultValue=""
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="" disabled>Pilih kendaraan</option>
                  <option value="Motor">Motor</option>
                  <option value="Mobil">Mobil</option>
                  <option value="Sepeda">Sepeda</option>
                  <option value="Jalan kaki">Jalan kaki</option>
                </select>
                <input onChange={(e) => updateForm('area', e.target.value)} placeholder="Area layanan"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
              </>
            )}
            <button disabled={loading} className="w-full bg-brand-500 text-white font-semibold rounded-full py-2.5 text-sm disabled:opacity-50 shadow-sm hover:shadow-md transition">
              {loading ? 'Mengirim...' : 'Kirim pengajuan'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
