import { api } from './apiClient'

const KUNCI_SESI = 'noka_sesi_id'

function ambilSesiId() {
  let id = localStorage.getItem(KUNCI_SESI)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(KUNCI_SESI, id)
  }
  return id
}

function deteksiPerangkat() {
  const ua = navigator.userAgent || ''
  if (/tablet|ipad/i.test(ua)) return 'tablet'
  if (/mobile|android|iphone/i.test(ua)) return 'mobile'
  return 'desktop'
}

/**
 * Catat kunjungan 1 halaman - fire-and-forget, TIDAK PERNAH melempar error
 * ke pemanggil (tracking gagal tidak boleh mengganggu pengalaman pengguna
 * sama sekali). Panggil ini di App.jsx tiap kali route berubah.
 */
export function catatKunjungan(halaman) {
  try {
    api.post('/tracking', {
      halaman,
      sesi_id: ambilSesiId(),
      perangkat: deteksiPerangkat(),
      referrer: document.referrer || null,
    }).catch(() => {}) // diam-diam abaikan kalau gagal (offline, server down, dll)
  } catch {
    // localStorage/crypto tidak tersedia (mis. mode privat ketat) - abaikan saja.
  }
}
