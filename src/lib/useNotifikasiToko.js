// Hook polling notifikasi buat toko (pesanan baru, status berubah).
import { useEffect, useState } from 'react'
import { api } from './apiClient'

// Hitung jumlah pesanan baru yang belum dilihat penjual, buat badge lonceng
// notifikasi. Dicek ulang tiap 30 detik dan tiap kali tab difokusin lagi -
// pola sama persis seperti useNotifikasiKurir.js.
export function useNotifikasiToko(aktif) {
  const [data, setData] = useState({ jumlah_baru: 0, pesanan_terbaru: [] })

  async function muat() {
    try {
      const res = await api.get('/mitra/toko/notifikasi')
      setData(res.data || { jumlah_baru: 0, pesanan_terbaru: [] })
    } catch {
      // Diam saja kalau gagal (mis. mitra belum py toko) - jangan ganggu
      // UI cuma gara-gara badge notifikasi gagal dimuat.
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
    await api.post('/mitra/toko/notifikasi/tandai-dilihat')
    setData((d) => ({ ...d, jumlah_baru: 0 }))
  }

  return { ...data, tandaiDilihat }
}
