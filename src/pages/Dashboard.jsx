import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PelangganDashboard from './PelangganDashboard'

// Dispatcher: /dashboard nampilin dashboard yang sesuai sama role user.
export default function Dashboard() {
  const { role, loading } = useAuth()

  if (loading) return <p className="text-sm text-gray-400 dark:text-gray-500">Memuat...</p>

  if (role === 'mitra_toko') return <Navigate to="/mitra/toko" replace />
  if (role === 'mitra_kurir') return <Navigate to="/mitra/kurir" replace />
  if (role === 'admin') return <Navigate to="/admin" replace />
  if (role === 'super_admin') return <Navigate to="/super-admin" replace />

  return <PelangganDashboard />
}
