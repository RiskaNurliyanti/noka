<<<<<<< HEAD
// Halaman set password baru pakai token dari email.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from '../components/Button'
import Input from '../components/Input'
import Card from '../components/Card'

export default function ResetPassword() {
  const { resetPassword } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const token = params.get('token') || ''
  const email = params.get('email') || ''

  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sukses, setSukses] = useState(false)

  if (!token || !email) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Link reset password tidak valid. Coba minta link baru.
          </p>
          <Link to="/lupa-password" className="text-brand-500 font-semibold text-sm">Minta link baru</Link>
        </div>
      </div>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await resetPassword({ token, email, password, password_confirmation: passwordConfirmation })
      setSukses(true)
      setTimeout(() => navigate('/login'), 2000)
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
          <h1 className="text-2xl font-extrabold mb-2">Buat Password Baru</h1>

          {sukses ? (
            <p className="text-sm text-green-600 dark:text-green-400 py-4">
              Password berhasil diperbarui. Mengarahkan ke halaman login...
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="text-left space-y-3 mt-4">
              <Input label="Password Baru" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
              <Input label="Konfirmasi Password" type="password" required value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <Button type="submit" full loading={loading}>
                {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
              </Button>
            </form>
          )}
        </div>
      </Card>
    </div>
  )
}
