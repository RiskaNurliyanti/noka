// Ganti dari supabase-js ke Laravel API biasa (Phase 5).
// Auth pakai Sanctum SPA (cookie session, bukan token Bearer) - lihat
// backend/SETUP_LARAVEL.md bagian Auth Strategy kenapa pendekatan ini dipilih
// (1 domain + subdomain, lebih aman dari token di localStorage).

const API_URL = import.meta.env.VITE_API_URL || 'http://api.noka.test'

let csrfReady = null

function bacaCookie(nama) {
  const match = document.cookie.match(new RegExp('(^| )' + nama + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

// Sanctum butuh cookie XSRF-TOKEN sebelum request POST/PUT/PATCH/DELETE
// pertama - endpoint ini yang men-set cookie tersebut. Normalnya cuma perlu
// dipanggil sekali per sesi browser (di-cache di variabel csrfReady), TAPI
// beberapa aksi di server (login, logout paksa karena email belum
// verifikasi, ganti password lewat reset) meregenerasi sesi - yang bikin
// token CSRF lama di cookie browser jadi basi. `paksaUlang=true` dipakai
// pastikanCsrfCookie() dipanggil ulang lewat request() saat itu terjadi
// (lihat penanganan status 419 di bawah).
function pastikanCsrfCookie(paksaUlang = false) {
  if (!csrfReady || paksaUlang) {
    csrfReady = fetch(`${API_URL}/sanctum/csrf-cookie`, { credentials: 'include' })
  }
  return csrfReady
}

async function request(method, path, body, sudahCobaUlang = false) {
  const butuhCsrf = method !== 'GET'
  if (butuhCsrf) await pastikanCsrfCookie()

  const headers = {
    Accept: 'application/json',
  }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (butuhCsrf) {
    const token = bacaCookie('XSRF-TOKEN')
    if (token) headers['X-XSRF-TOKEN'] = token
  }

  const res = await fetch(`${API_URL}/api${path}`, {
    method,
    credentials: 'include', // kirim cookie sesi Sanctum
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  // 419 = "Page Expired" versi Laravel buat CSRF token basi/tidak cocok.
  // Ini SERING terjadi bukan karena bug pengguna, tapi karena sesi baru
  // saja diregenerasi server (mis. baru login, baru selesai reset
  // password) - cookie XSRF-TOKEN lama otomatis jadi tidak valid lagi.
  // Alih-alih melempar error membingungkan ke pengguna, di sini token
  // disegarkan sekali lalu request yang SAMA dicoba ulang OTOMATIS - kalau
  // tetap gagal setelah itu (guard sudahCobaUlang), baru dianggap error
  // sungguhan dan dilempar seperti biasa (mencegah retry tanpa akhir).
  if (res.status === 419 && !sudahCobaUlang) {
    await pastikanCsrfCookie(true)
    return request(method, path, body, true)
  }

  let json = null
  try {
    json = await res.json()
  } catch {
    // response kosong (mis. 204) - biarkan json null
  }

  if (!res.ok || (json && json.success === false)) {
    const error = new Error(json?.message || 'Terjadi kesalahan, coba lagi')
    error.status = res.status
    error.code = json?.code // kode error spesifik, mis. 'email_belum_verifikasi'
    error.errors = json?.errors // validation errors per-field dari Laravel (422)
    error.data = json?.data // payload data tambahan di response error (mis. detail teknis buat admin)
    throw error
  }

  return json
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body ?? {}),
  put: (path, body) => request('PUT', path, body ?? {}),
  patch: (path, body) => request('PATCH', path, body ?? {}),
  delete: (path) => request('DELETE', path),
}

// Dipakai buat endpoint yang balikin file (mis. export Excel laporan,
// Stage 17) - beda dari request() biasa yang selalu parse response sebagai
// JSON. Trigger download otomatis lewat elemen <a> sementara.
export async function unduhFile(path, namaFileFallback = 'unduhan.xlsx') {
  const res = await fetch(`${API_URL}/api${path}`, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })

  if (!res.ok) {
    let pesan = 'Gagal mengunduh file'
    try {
      const json = await res.json()
      pesan = json?.message || pesan
    } catch {
      // response bukan JSON (mis. file berhasil tapi error lain) - pakai pesan default
    }
    throw new Error(pesan)
  }

  const blob = await res.blob()
  const cd = res.headers.get('Content-Disposition') || ''
  const match = cd.match(/filename="?([^"]+)"?/)
  const namaFile = match ? match[1] : namaFileFallback

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = namaFile
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export { API_URL }
