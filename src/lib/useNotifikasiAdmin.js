import { useEffect, useState } from 'react'
import { api } from './apiClient'

// Hitung jumlah item BARU (bukan sekadar total pending) buat badge lonceng
// admin/super admin - toko/kurir baru daftar, klaim baru, aduan baru
// dihitung sejak admin ini TERAKHIR membuka lonceng (lihat
// Admin\NotifikasiController buat detail, termasuk kenapa langganan/tagihan
// SENGAJA tidak ikut mekanisme ini). Dicek ulang tiap 30 detik dan tiap
// kali tab browser difokusin lagi.
export function useNotifikasiAdmin(aktif) {
  const [jumlah, setJumlah] = useState({ toko: 0, kurir: 0, klaim: 0, laporan: 0, langganan: 0, total: 0 })

  async function muat() {
    try {
      const res = await api.get('/admin/notifikasi')
      setJumlah(res.data || { toko: 0, kurir: 0, klaim: 0, laporan: 0, langganan: 0, total: 0 })
    } catch {
      // Diam saja kalau gagal - jangan ganggu UI cuma gara-gara badge notifikasi gagal dimuat.
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

  /**
   * Tandai toko/kurir/klaim/laporan sebagai "sudah dilihat" - badge-nya
   * reset ke 0 untuk 4 kategori itu. `langganan` SENGAJA tidak ikut
   * di-reset di sini (dibiarkan apa adanya dari respons server berikutnya)
   * karena memang tidak dipengaruhi notifikasi_dilihat_at sama sekali -
   * lihat Admin\NotifikasiController.
   */
  async function tandaiDilihat() {
    await api.post('/admin/notifikasi/tandai-dilihat')
    setJumlah((j) => ({ ...j, toko: 0, kurir: 0, klaim: 0, laporan: 0, total: j.langganan }))
  }

  return { ...jumlah, tandaiDilihat }
}
