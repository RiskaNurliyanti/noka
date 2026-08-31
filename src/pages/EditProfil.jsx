import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { uploadFoto } from '../lib/storage'
import { useToast } from '../context/ToastContext'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import SafeImage from '../components/SafeImage'

export default function EditProfil() {
  const { user, profile, role, updateProfile } = useAuth()
  const { showToast } = useToast()
  const [nama, setNama] = useState('')
  const [noWhatsapp, setNoWhatsapp] = useState('')
  const [foto, setFoto] = useState('')
  const [fileFoto, setFileFoto] = useState(null)
  const [previewFoto, setPreviewFoto] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (profile) {
      setNama(profile.nama || '')
      setFoto(profile.foto || '')
      setNoWhatsapp(profile.no_whatsapp || '')
    }
  }, [profile])

  function pilihFoto(file) {
    if (previewFoto) URL.revokeObjectURL(previewFoto)
    setFileFoto(file)
    setPreviewFoto(file ? URL.createObjectURL(file) : null)
  }

  async function simpan(e) {
    e.preventDefault()
    setLoading(true)
    try {
      let fotoUrl = foto
      if (fileFoto) fotoUrl = await uploadFoto(fileFoto, 'profil')
      await updateProfile({ nama, foto: fotoUrl, no_whatsapp: noWhatsapp })
      pilihFoto(null)
      showToast('Profil berhasil disimpan')
    } catch (err) {
      showToast('Gagal menyimpan: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!profile) return <p className="text-gray-400 dark:text-gray-500">Memuat...</p>

  const isAdminRole = role === 'admin' || role === 'super_admin'

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-bold mb-1">⚙️ Edit profil</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Update informasi akunmu.</p>

      {isAdminRole && (
        <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 mb-4">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Kamu {role === 'super_admin' ? 'Super Admin' : 'Admin Website'} - isi nomor WhatsApp di bawah biar bisa dihubungi lewat halaman Kelola Pengguna.
          </p>
        </Card>
      )}

      <Card>
        <form onSubmit={simpan} className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-950/40 overflow-hidden flex items-center justify-center text-brand-600 font-bold text-xl flex-shrink-0">
              {previewFoto || foto ? <SafeImage src={previewFoto || foto} alt="Foto profil" className="w-full h-full object-cover" /> : (nama || user.email || '?').charAt(0).toUpperCase()}
            </div>
            <label className="text-sm text-brand-600 font-medium cursor-pointer bg-brand-50 dark:bg-brand-950/40 rounded-full px-3 py-1.5">
              Ganti foto
              <input type="file" accept="image/*" className="hidden" onChange={(e) => pilihFoto(e.target.files?.[0] || null)} />
            </label>
          </div>

          <Input label="Nama" value={nama} onChange={(e) => setNama(e.target.value)} />
          <Input label="Nomor WhatsApp" placeholder="Contoh: 081234567890" value={noWhatsapp} onChange={(e) => setNoWhatsapp(e.target.value)} />
          <Input label="Email" value={user?.email || ''} disabled className="text-gray-400 dark:text-gray-500" />

          <Button type="submit" full loading={loading}>
            {loading ? 'Menyimpan...' : 'Simpan perubahan'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
