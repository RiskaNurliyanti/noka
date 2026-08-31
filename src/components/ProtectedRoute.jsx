// Pembungkus rute yang butuh login/role tertentu.
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Bungkus route yang butuh login. Kalau `role` diisi, cuma role itu (atau super_admin
// buat route "admin") yang boleh masuk. Akun yang dinonaktifkan admin juga diblokir di sini.
export default function ProtectedRoute({ children, role }) {
  const { user, profile, role: userRole, loading, logout } = useAuth()

  if (loading) return <div className="py-20 text-center text-gray-400 dark:text-gray-500">Memuat...</div>
  if (!user) return <Navigate to="/login" replace />

  if (profile && profile.status_aktif === false) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-3xl mb-3">🚫</p>
        <h1 className="text-lg font-bold mb-2">Akun kamu dinonaktifkan</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Hubungi admin NOKA kalau menurutmu ini keliru.
        </p>
        <button onClick={logout} className="text-sm text-brand-500 font-semibold">Keluar</button>
      </div>
    )
  }

  const bolehMasuk =
    !role ||
    userRole === role ||
    userRole === 'super_admin' // super_admin selalu boleh akses route admin

  if (!bolehMasuk) return <Navigate to="/" replace />

  return children
}
