// Wrapper localStorage/sessionStorage aplikasi.
import { API_URL } from './apiClient'

// Upload foto lewat Laravel API (POST /upload) - menggantikan upload
// langsung ke Supabase Storage. Pakai FormData biasa (bukan JSON) karena
// ini upload file, bukan endpoint api client biasa - makanya fetch manual
// di sini, bukan lewat helper `api` di apiClient.js.
function bacaCookie(nama) {
  const match = document.cookie.match(new RegExp('(^| )' + nama + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

export async function uploadFoto(file, folder) {
  if (!file) return null

  // Sanctum butuh cookie CSRF - pastikan sudah ada (biasanya sudah dari
  // login/register/muatUser, tapi jaga-jaga kalau belum).
  await fetch(`${API_URL}/sanctum/csrf-cookie`, { credentials: 'include' })

  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder)

  const res = await fetch(`${API_URL}/api/upload`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'X-XSRF-TOKEN': bacaCookie('XSRF-TOKEN') || '',
    },
    body: formData,
  })

  const json = await res.json()
  if (!res.ok || json.success === false) {
    throw new Error(json.message || 'Gagal upload foto')
  }

  return json.data.url
}

// Upload beberapa foto sekaligus buat galeri, return array URL
export async function uploadGaleri(files, folder) {
  const urls = []
  for (const file of files) {
    const url = await uploadFoto(file, folder)
    if (url) urls.push(url)
  }
  return urls
}
