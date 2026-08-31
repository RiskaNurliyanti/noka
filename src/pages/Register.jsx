import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from '../components/Button'
import Input from '../components/Input'
import Card from '../components/Card'

export default function Register() {
  const { register } = useAuth()

  const [form, setForm] = useState({ nama: '', email: '', password: '', password_confirmation: '', no_whatsapp: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sukses, setSukses] = useState(false)

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      setSukses(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (sukses) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-500 text-white text-2xl font-extrabold flex items-center justify-center mx-auto mb-5">
            ✓
          </div>
          <h1 className="text-xl font-extrabold mb-2">Cek email kamu</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Kami sudah kirim link verifikasi ke <b>{form.email}</b>. Klik link itu (cek folder spam juga)
            sebelum login ke NOKA.
          </p>
          <Link to="/login" className="text-brand-500 font-semibold text-sm">Ke halaman login</Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <Card className="max-w-md w-full" padded={false}>
        <div className="p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-brand-500 text-white text-2xl font-extrabold flex items-center justify-center mx-auto mb-5">
              N
            </div>
            <h1 className="text-2xl font-extrabold mb-2">Daftar Akun NOKA</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Simpan riwayat pesanan, favorit, dan review kamu.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <Input label="Nama" required value={form.nama} onChange={set('nama')} />
            <Input label="Email" type="email" required value={form.email} onChange={set('email')} />
            <Input label="No. WhatsApp (opsional)" value={form.no_whatsapp} onChange={set('no_whatsapp')} />
            <Input
              label="Password" type="password" required minLength={8}
              value={form.password} onChange={set('password')}
              hint="Minimal 8 karakter, kombinasi huruf & angka."
            />
            <Input label="Konfirmasi Password" type="password" required value={form.password_confirmation} onChange={set('password_confirmation')} />

            {error && <p className="text-xs text-red-500">{error}</p>}

            <Button type="submit" full loading={loading}>
              {loading ? 'Memproses...' : 'Daftar'}
            </Button>
          </form>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-6 text-center">
            Sudah punya akun? <Link to="/login" className="text-brand-500 font-semibold">Masuk</Link>
          </p>
        </div>
      </Card>
    </div>
  )
}
