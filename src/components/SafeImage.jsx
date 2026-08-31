import { useState, useEffect } from 'react'
import { API_URL } from '../lib/apiClient'

/**
 * Gabungkan path foto jadi URL yang benar-benar bisa dimuat browser:
 * - path RELATIF ("/storage/produk/xxx.jpg", dari upload lewat backend
 *   NOKA sendiri - lihat UploadController::store) -> ditempel ke API_URL
 *   yang SEDANG AKTIF dipakai frontend ini (VITE_API_URL), BUKAN memakai
 *   domain yang kebetulan ke-bake di database. Ini kuncinya kenapa foto
 *   tetap tampil benar walau backend pindah alamat (ganti domain
 *   production, atau beda port pas development lokal) - selama
 *   VITE_API_URL di frontend diisi benar, foto ikut benar juga, tidak
 *   tergantung APP_URL di backend.
 * - URL ABSOLUT (diawali http/https - foto lama dari Supabase Storage,
 *   atau sumber eksternal lain) -> dipakai apa adanya, tidak diutak-atik.
 * - blob:/data: (preview lokal sebelum upload selesai) -> dipakai apa adanya juga.
 */
function resolveUrl(src) {
  if (!src) return src
  if (src.startsWith('/')) return `${API_URL}${src}`
  return src
}

// Dipakai menggantikan <img> biasa di semua tempat yang menampilkan foto
// upload (produk, toko, kurir, avatar, banner, dll). Kalau src kosong atau
// gagal dimuat (404/broken), tampilkan placeholder icon alih-alih broken
// image icon bawaan browser.
export default function SafeImage({ src, alt = '', className = '', iconClassName = '', ...props }) {
  const [error, setError] = useState(false)
  const urlAsli = resolveUrl(src)

  // Reset status error setiap kali src berubah (mis. produk lain dipilih)
  // supaya tidak "nyangkut" nampilin placeholder untuk foto yang sebenarnya valid.
  useEffect(() => {
    setError(false)
  }, [src])

  if (!urlAsli || error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 ${className}`}
        role="img"
        aria-label={alt || 'Gambar tidak tersedia'}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className={iconClassName || 'w-1/3 h-1/3'}
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      </div>
    )
  }

  return (
    <img
      decoding="async"
      loading="lazy"
      style={{ imageRendering: 'auto' }}
      {...props}
      src={urlAsli}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  )
}
