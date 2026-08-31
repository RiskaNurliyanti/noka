import { useEffect, useState } from 'react'
import { api } from './apiClient'

// Hitung jumlah pesanan yang statusnya berubah (terutama dibatalkan/
// selesai) yang belum dilihat pembeli, buat badge lonceng notifikasi.
// Pola sama seperti useNotifikasiKurir.js (Stage 16).
export function useNotifikasiPembeli(aktif) {
  const [data, setData] = useState({ jumlah_baru: 0, pesanan_terbaru: [] })

  async function muat() {
    try {
      const res = await api.get('/pesanan-notifikasi')
      setData(res.data || { jumlah_baru: 0, pesanan_terbaru: [] })
    } catch {
      // Diam saja kalau gagal - jangan ganggu UI cuma gara-gara badge
      // notifikasi gagal dimuat.
    }
  }

  useEffect(() => {
    if (!aktif) return

    muat()
    const interval = setInterval(muat, 30000)
    window.addEventListener('focus', muat)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', muat)
    }
  }, [aktif])

  async function tandaiDilihat() {
    await api.post('/pesanan-notifikasi/tandai-dilihat')
    setData((d) => ({ ...d, jumlah_baru: 0 }))
  }

  return { ...data, tandaiDilihat }
}
