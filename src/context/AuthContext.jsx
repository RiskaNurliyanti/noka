import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../lib/apiClient'
import { setCartUserId } from '../lib/cart'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // `user` dan `profile` sengaja menunjuk ke objek yang SAMA - dulu di
  // Supabase itu dua sumber terpisah (auth.users vs tabel profiles), di
  // Laravel sudah digabung jadi satu tabel `users`. Dipertahankan sebagai
  // dua field terpisah di context ini supaya 20+ file yang sudah pakai
  // `useAuth()` (ProtectedRoute, Navbar, dst) tidak perlu diubah semua.
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  async function muatUser() {
    try {
      const res = await api.get('/auth/me')
      setUser(res.data)
    } catch {
      setUser(null)
    }
  }

  useEffect(() => {
    let mounted = true

    async function init() {
      await muatUser()
      if (mounted) setLoading(false)
    }
    init()

    return () => {
      mounted = false
    }
  }, [])

  // Keranjang di-scope per akun (lihat lib/cart.js) - setiap kali status
  // login berubah (baru login, baru logout, atau sesi dipulihkan saat app
  // dibuka), keranjang yang dibaca ikut disesuaikan ke akun yang aktif
  // SEKARANG, supaya tidak ada isi keranjang akun lama yang "nyangkut" ke
  // akun baru setelah logout-login.
  useEffect(() => {
    setCartUserId(user?.id)
  }, [user])

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password })
    setUser(res.data)
    return res.data
  }

  async function register({ nama, email, password, password_confirmation, no_whatsapp }) {
    return api.post('/auth/register', { nama, email, password, password_confirmation, no_whatsapp })
  }

  async function resendVerification(email) {
    return api.post('/auth/verify-email/resend', { email })
  }

  async function forgotPassword(email) {
    return api.post('/auth/forgot-password', { email })
  }

  async function resetPassword({ token, email, password, password_confirmation }) {
    return api.post('/auth/reset-password', { token, email, password, password_confirmation })
  }

  async function updateProfile(data) {
    const res = await api.put('/auth/me', data)
    setUser(res.data)
    return res.data
  }

  async function logout() {
    try {
      await api.post('/auth/logout')
    } finally {
      setUser(null)
    }
  }

  const value = {
    user,
    profile: user, // alias - lihat catatan di atas
    role: user?.role ?? null,
    loading,
    login,
    register,
    updateProfile,
    resendVerification,
    logout,
    forgotPassword,
    resetPassword,
    refetchUser: muatUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>')
  return ctx
}
