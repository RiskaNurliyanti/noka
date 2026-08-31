<<<<<<< HEAD
// Halaman lupa password (kirim link reset).
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from '../components/Button'
import Input from '../components/Input'
import Card from '../components/Card'

export default function LupaPassword() {
  const { forgotPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [terkirim, setTerkirim] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await forgotPassword(email)
      // Pesan SELALU sama baik email terdaftar atau tidak - backend sudah
      // generalisir responsnya, jangan diubah jadi spesifik di sini.
      setTerkirim(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <Card className="max-w-md w-full text-center" padded={false}>
        <div className="p-8">
          <h1 className="text-2xl font-extrabold mb-2">Lupa Password</h1>

          {terkirim ? (
            <p className="text-sm text-gray-600 dark:text-gray-300 py-4">
              Kalau email <strong>{email}</strong> terdaftar di NOKA, kami sudah kirim link reset
              password ke sana. Cek inbox (dan folder spam) kamu.
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Masukkan email akun kamu, kami kirim link untuk bikin password baru.
              </p>
              <form onSubmit={handleSubmit} className="text-left space-y-3">
                <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                {error && <p className="text-xs text-red-500">{error}</p>}
                <Button type="submit" full loading={loading}>
                  {loading ? 'Mengirim...' : 'Kirim Link Reset'}
                </Button>
              </form>
            </>
          )}

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">
            <Link to="/login" className="text-brand-500 font-semibold">Kembali ke login</Link>
          </p>
        </div>
      </Card>
    </div>
  )
}
