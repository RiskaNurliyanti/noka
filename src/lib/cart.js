// Keranjang untuk GUEST disimpan di localStorage, bukan di database
// (sesuai keputusan project: tabel `keranjang` cuma untuk user yang login).
// Untuk versi awal ini, perilaku disamakan (localStorage) untuk guest maupun
// user login demi kesederhanaan - bisa disambungkan ke tabel `keranjang`
// belakangan kalau mau sinkron lintas perangkat buat user yang login.
//
// PENTING: kunci localStorage-nya di-scope PER AKUN (lihat setCartUserId),
// bukan 1 kunci global untuk semua orang. Sebelumnya semua akun (termasuk
// guest) berbagi 1 kunci yang sama - akibatnya keranjang "nyangkut": logout
// lalu login akun lain, isi keranjang akun sebelumnya masih ke-bawa.

const KEY_PREFIX = 'noka_keranjang'

let currentUserId = null // null = belum diketahui/belum login (guest)

function currentKey() {
  return currentUserId ? `${KEY_PREFIX}_${currentUserId}` : `${KEY_PREFIX}_guest`
}

function bacaKey(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function tulisKey(key, items) {
  localStorage.setItem(key, JSON.stringify(items))
}

/**
 * Dipanggil AuthContext setiap kali status login berubah (login, logout,
 * atau pemulihan sesi saat aplikasi dibuka) - supaya keranjang yang dibaca
 * SELALU mengikuti akun yang sedang aktif saat itu, bukan sisa dari akun
 * lain yang login sebelumnya di browser yang sama.
 *
 * Kalau pengguna sempat isi keranjang sebagai guest (belum login) lalu
 * login, dan keranjang akun barunya masih kosong, isi keranjang guest itu
 * "diwariskan" ke akunnya - supaya barang yang sudah dipilih tidak hilang
 * percuma cuma gara-gara baru login.
 */
export function setCartUserId(userId) {
  const userIdBaru = userId || null
  if (userIdBaru === currentUserId) return // tidak ada perubahan akun, tidak perlu apa-apa

  const sebelumnyaGuest = currentUserId === null
  currentUserId = userIdBaru

  if (sebelumnyaGuest && userIdBaru) {
    const keranjangGuest = bacaKey(`${KEY_PREFIX}_guest`)
    const keranjangUserBaru = bacaKey(currentKey())
    if (keranjangGuest.length > 0 && keranjangUserBaru.length === 0) {
      tulisKey(currentKey(), keranjangGuest)
      tulisKey(`${KEY_PREFIX}_guest`, [])
    }
  }

  window.dispatchEvent(new Event('noka-cart-updated'))
}

export function getCart() {
  return bacaKey(currentKey())
}

function saveCart(items) {
  tulisKey(currentKey(), items)
  window.dispatchEvent(new Event('noka-cart-updated'))
}

export function addToCart(produk, qty = 1, catatan = '') {
  const items = getCart()
  const existing = items.find((it) => it.produk_id === produk.id && it.catatan === catatan)
  if (existing) {
    existing.qty += qty
  } else {
    items.push({
      produk_id: produk.id,
      toko_id: produk.toko_id,
      nama: produk.nama,
      harga: produk.harga,
      foto: produk.foto,
      qty,
      catatan,
    })
  }
  saveCart(items)
  return items
}

export function updateQty(produk_id, qty) {
  let items = getCart()
  if (qty <= 0) {
    items = items.filter((it) => it.produk_id !== produk_id)
  } else {
    items = items.map((it) => (it.produk_id === produk_id ? { ...it, qty } : it))
  }
  saveCart(items)
  return items
}

export function removeFromCart(produk_id) {
  const items = getCart().filter((it) => it.produk_id !== produk_id)
  saveCart(items)
  return items
}

export function clearCart() {
  saveCart([])
}

// Keranjang cuma boleh isi produk dari 1 toko yang sama dalam satu waktu
// (biar 1 pesanan = 1 link WhatsApp ke 1 toko, sesuai desain sistem).
export function tokoIdDiKeranjang() {
  const items = getCart()
  return items.length > 0 ? items[0].toko_id : null
}
