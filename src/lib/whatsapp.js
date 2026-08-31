// Helper generate link WhatsApp click-to-chat (wa.me).
// NOKA tidak memproses pembayaran/pengiriman - link ini yang jadi jembatan
// ke koordinasi manual antara pembeli, toko, dan kurir.

export function formatNomor(nomor) {
  // Ubah 08xxx atau +62xxx jadi format 62xxx yang dipakai wa.me
  const digits = nomor.replace(/\D/g, '')
  if (digits.startsWith('0')) return '62' + digits.slice(1)
  if (digits.startsWith('62')) return digits
  return digits
}

export function formatDaftarProduk(items, { withSubtotal = false } = {}) {
  return (items || [])
    .map((it) => {
      const nama = it.produk?.nama ?? it.nama ?? 'Produk'
      const hargaText = withSubtotal && it.subtotal != null
        ? ` = Rp ${Number(it.subtotal).toLocaleString('id-ID')}`
        : ''
      const baris = `• ${nama} x${it.qty}${hargaText}`
      // catatan PER PRODUK (mis. "sausnya manis mayo") - beda dari
      // pesanan.catatan yang catatan umum satu pesanan.
      return it.catatan ? `${baris}\n   ↳ Catatan: ${it.catatan}` : baris
    })
    .join('\n')
}

export function buatPesanCheckout({ namaToko, items, alamatAntar, catatan, namaPembeli }) {
  return [
    `Halo ${namaToko}, saya mau pesan dari NOKA:`,
    '',
    formatDaftarProduk(items),
    '',
    alamatAntar ? `Alamat antar: ${alamatAntar}` : 'Ambil sendiri ke toko',
    catatan ? `Catatan: ${catatan}` : null,
    namaPembeli ? `Atas nama: ${namaPembeli}` : null,
    '',
    'Mohon info harga & totalnya ya, makasih!',
  ]
    .filter(Boolean)
    .join('\n')
}

export function linkWhatsApp(nomorWhatsApp, pesan) {
  const nomor = formatNomor(nomorWhatsApp)
  return `https://wa.me/${nomor}?text=${encodeURIComponent(pesan)}`
}

function namaPembeli(pesanan) {
  return pesanan.pembeli?.nama || pesanan.guest_nama || 'Pembeli'
}

function ringkasanPesanan(pesanan) {
  return [
    formatDaftarProduk(pesanan.item),
    '',
    pesanan.total_harga ? `Total: Rp ${Number(pesanan.total_harga).toLocaleString('id-ID')}` : null,
    pesanan.kurir ? `Diantar kurir: ${pesanan.kurir.nama_layanan}` : 'Diambil sendiri ke toko',
    pesanan.alamat_antar ? `Alamat antar: ${pesanan.alamat_antar}` : null,
    pesanan.catatan ? `Catatan: ${pesanan.catatan}` : null,
  ]
    .filter((v) => v !== null && v !== '')
    .join('\n')
}

// Dipakai PEMBELI, dari halaman Pesanan Saya - jaga-jaga kalau tab WA ke
// toko dulu ke-blokir/ke-skip pas checkout.
export function pesanUlangKeToko(pesanan) {
  return [
    `Halo, saya mau lanjutkan pesanan saya di NOKA (atas nama ${namaPembeli(pesanan)}):`,
    '',
    ringkasanPesanan(pesanan),
  ].join('\n')
}

// Dipakai PEMBELI, dari halaman Pesanan Saya - buat pesanan yang diantar
// kurir, jaga-jaga kalau tab WA ke kurir ke-blokir/ke-skip pas checkout.
export function pesanUlangKeKurir(pesanan) {
  return [
    `Halo, saya pembeli dari toko ${pesanan.toko?.nama_toko || '-'} di NOKA (atas nama ${namaPembeli(pesanan)}), mau konfirmasi pengantaran:`,
    '',
    ringkasanPesanan(pesanan),
  ].join('\n')
}

// Dipakai TOKO, dari halaman Pesanan Masuk - inisiatif hubungi pembeli
// duluan kalau pembelinya belum/lupa chat sama sekali.
export function pesanTokoKePembeli(pesanan) {
  return [
    `Halo ${namaPembeli(pesanan)}, ini dari toko soal pesananmu di NOKA:`,
    '',
    ringkasanPesanan(pesanan),
    '',
    'Mohon konfirmasinya ya, makasih!',
  ].join('\n')
}

// Dipakai KURIR, dari halaman Pesanan Pengantaran - inisiatif hubungi
// pembeli duluan kalau pembelinya belum/lupa chat sama sekali.
export function pesanKurirKePembeli(pesanan) {
  return [
    `Halo ${namaPembeli(pesanan)}, saya kurir yang kebagian antar pesananmu dari ${pesanan.toko?.nama_toko || 'toko'} lewat NOKA:`,
    '',
    ringkasanPesanan(pesanan),
    '',
    'Mohon konfirmasinya ya, biar segera saya antar.',
  ].join('\n')
}

// Dipakai TOKO, dari halaman Pesanan Masuk - koordinasi langsung ke kurir
// yang kebagian pesanan ini (mis. tanya jam ambil, dll) - dulu toko cuma
// bisa lihat nama kurirnya tanpa cara chat langsung dari NOKA.
export function pesanTokoKeKurir(pesanan) {
  return [
    `Halo ${pesanan.kurir?.nama_layanan || 'kak'}, ini dari toko ${pesanan.toko?.nama_toko || '-'} soal pesanan yang kamu antar lewat NOKA:`,
    '',
    ringkasanPesanan(pesanan),
    '',
    `Pembeli: ${namaPembeli(pesanan)}`,
  ].join('\n')
}

// Dipakai KURIR, dari halaman Pesanan Pengantaran - koordinasi langsung ke
// toko (mis. tanya pesanan sudah siap belum) - dulu kurir cuma bisa lihat
// nama toko tanpa cara chat langsung dari NOKA.
export function pesanKurirKeToko(pesanan) {
  return [
    `Halo ${pesanan.toko?.nama_toko || '-'}, saya kurir yang kebagian antar pesanan ini lewat NOKA:`,
    '',
    ringkasanPesanan(pesanan),
    '',
    `Pembeli: ${namaPembeli(pesanan)}`,
  ].join('\n')
}