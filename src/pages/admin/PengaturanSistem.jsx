// Pengaturan global aplikasi (super admin).
import { useEffect, useState } from 'react'
import { api } from '../../lib/apiClient'
import { useToast } from '../../context/ToastContext'
import Spinner from '../../components/Spinner'

export default function PengaturanSistem() {
  const { showToast } = useToast()
  const [form, setForm] = useState(null)
  const [simpan, setSimpan] = useState(false)

  // Tes kirim email - lihat App\Http\Controllers\Admin\PengaturanController::testEmail.
  const [emailTes, setEmailTes] = useState('')
  const [mengirimTes, setMengirimTes] = useState(false)
  const [hasilTes, setHasilTes] = useState(null) // { sukses: bool, pesan: string }

  async function muat() {
    const res = await api.get('/admin/pengaturan')
    setForm(res.data)
  }
  useEffect(() => { muat() }, [])

  async function simpanPengaturan(e) {
    e.preventDefault()
    setSimpan(true)
    try {
      await api.put('/admin/pengaturan', {
        nama_web: form.nama_web,
        logo: form.logo,
        admin_whatsapp: form.admin_whatsapp,
        maintenance_mode: form.maintenance_mode,
      })
      showToast('Pengaturan disimpan')
    } catch (err) {
      showToast('Gagal menyimpan: ' + err.message, 'error')
    } finally {
      setSimpan(false)
    }
  }

  async function kirimTesEmail(e) {
    e.preventDefault()
    if (!emailTes) return
    setMengirimTes(true)
    setHasilTes(null)
    try {
      const res = await api.post('/admin/pengaturan/tes-email', { email: emailTes })
      setHasilTes({ sukses: true, pesan: res.message })
    } catch (err) {
      // err.data?.error_asli = pesan error SMTP mentah dari server (lihat
      // testEmail() di backend) - sengaja ditampilkan apa adanya di sini
      // karena yang lihat memang admin yang perlu detail teknisnya buat
      // debug konfigurasi .env, beda dari alur reset password publik yang
      // sengaja menyembunyikan detail ini dari pengguna biasa.
      setHasilTes({ sukses: false, pesan: err.data?.error_asli || err.message })
    } finally {
      setMengirimTes(false)
    }
  }

  if (!form) return <Spinner label="Memuat pengaturan..." />

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold mb-1">⚙️ Pengaturan sistem</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Konfigurasi umum website NOKA.</p>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
        <form onSubmit={simpanPengaturan} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Nama website</label>
            <input value={form.nama_web} onChange={(e) => setForm((f) => ({ ...f, nama_web: e.target.value }))}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">URL logo</label>
            <input value={form.logo || ''} onChange={(e) => setForm((f) => ({ ...f, logo: e.target.value }))}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Nomor WhatsApp admin</label>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Dipakai di halaman klaim mitra dan kontak lain di seluruh situs.</p>
            <input value={form.admin_whatsapp || ''} onChange={(e) => setForm((f) => ({ ...f, admin_whatsapp: e.target.value }))}
              placeholder="Contoh: 081234567890" className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <label className="flex items-center gap-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 cursor-pointer">
            <input type="checkbox" checked={form.maintenance_mode} onChange={(e) => setForm((f) => ({ ...f, maintenance_mode: e.target.checked }))} className="w-4 h-4" />
            <span className="text-sm text-amber-700 dark:text-amber-400">🚧 Aktifkan mode maintenance (situs ditutup sementara untuk pengunjung biasa)</span>
          </label>
          <button disabled={simpan} className="bg-brand-500 text-white font-semibold rounded-full px-6 py-2.5 text-sm disabled:opacity-50 shadow-sm hover:shadow-md transition">
            {simpan ? 'Menyimpan...' : 'Simpan pengaturan'}
          </button>
        </form>
      </div>

      {/* TES EMAIL - lihat Admin\PengaturanController::testEmail */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 mt-6">
        <h2 className="font-semibold mb-1">📧 Tes konfigurasi email</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Kirim email percobaan buat memastikan pengaturan SMTP di file <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">.env</code> sudah
          benar - tanpa perlu buka terminal atau file log server. Kalau gagal, pesan error asli dari server email akan ditampilkan di sini.
        </p>
        <form onSubmit={kirimTesEmail} className="flex flex-wrap gap-2">
          <input
            type="email"
            required
            value={emailTes}
            onChange={(e) => setEmailTes(e.target.value)}
            placeholder="alamat@email-tujuan-tes.com"
            className="flex-1 min-w-[220px] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="submit"
            disabled={mengirimTes}
            className="bg-gray-800 dark:bg-gray-700 text-white font-semibold rounded-full px-5 py-2.5 text-sm disabled:opacity-50 hover:opacity-90 transition"
          >
            {mengirimTes ? 'Mengirim...' : 'Kirim tes'}
          </button>
        </form>

        {hasilTes && (
          <div className={`mt-4 rounded-xl px-4 py-3 text-sm ${
            hasilTes.sukses
              ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
          }`}>
            <p className="font-semibold mb-1">{hasilTes.sukses ? '✅ Berhasil' : '❌ Gagal'}</p>
            <p className="break-words">{hasilTes.pesan}</p>
          </div>
        )}
      </div>
    </div>
  )
}
