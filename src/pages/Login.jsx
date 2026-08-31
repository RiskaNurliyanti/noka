import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from '../components/Button'
import Input from '../components/Input'
import Card from '../components/Card'

const PESAN_ERROR_URL = {
  verifikasi_kedaluwarsa: 'Link verifikasi sudah kedaluwarsa. Silakan kirim ulang.',
  verifikasi_gagal: 'Link verifikasi tidak valid.',
}

export default function Login() {
  const { login, resendVerification } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [belumVerifikasi, setBelumVerifikasi] = useState(false)
  const [kirimUlangStatus, setKirimUlangStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const infoVerified = params.get('verified') === '1'
  const infoErrorUrl = PESAN_ERROR_URL[params.get('error')]

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBelumVerifikasi(false)
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
      setBelumVerifikasi(err.code === 'email_belum_verifikasi')
    } finally {
      setLoading(false)
    }
  }

  async function kirimUlangVerifikasi() {
    setKirimUlangStatus('mengirim')
    try {
      await resendVerification(email)
      setKirimUlangStatus('terkirim')
    } catch {
      setKirimUlangStatus('gagal')
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <Card className="max-w-md w-full p-8 text-center" padded={false}>
        <div className="p-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-500 text-white text-2xl font-extrabold flex items-center justify-center mx-auto mb-5">
            N
          </div>
          <h1 className="text-2xl font-extrabold mb-2">Masuk ke NOKA</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Login cuma diperlukan buat simpan riwayat pesanan, favorit, dan kasih review.
            Kamu tetap bisa belanja tanpa login sebagai tamu.
          </p>

          {infoVerified && (
            <p className="text-xs text-left bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-lg px-3 py-2 mb-4">
              Email berhasil diverifikasi. Silakan login.
            </p>
          )}
          {infoErrorUrl && (
            <p className="text-xs text-left bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-lg px-3 py-2 mb-4">
              {infoErrorUrl}
            </p>
          )}

          <form onSubmit={handleSubmit} className="text-left space-y-3 mb-4">
            <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Password</label>
                <Link to="/lupa-password" className="text-xs text-brand-500 font-semibold">Lupa password?</Link>
              </div>
              <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            {error && (
              <div className="text-xs text-red-500">
                <p>{error}</p>
                {belumVerifikasi && (
                  <div className="mt-1">
                    {kirimUlangStatus === 'terkirim' ? (
                      <p className="text-green-600 dark:text-green-400">Link verifikasi baru sudah dikirim, cek email kamu.</p>
                    ) : (
                      <button type="button" onClick={kirimUlangVerifikasi} disabled={kirimUlangStatus === 'mengirim'} className="text-brand-500 font-semibold underline disabled:opacity-50">
                        {kirimUlangStatus === 'mengirim' ? 'Mengirim...' : 'Kirim ulang link verifikasi'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <Button type="submit" full loading={loading}>
              {loading ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">
            Belum punya akun? <Link to="/register" className="text-brand-500 font-semibold">Daftar</Link>
          </p>
        </div>
      </Card>
    </div>
  )
}
