// Stage 18: daftar alasan pembatalan pesanan per role - HARUS sinkron
// dengan App\Support\AlasanPembatalan di backend (nilai key persis sama,
// backend yang jadi sumber kebenaran validasi - ini cuma buat label di UI).
export const LABEL_ALASAN_PEMBATALAN = {
  toko_tutup: 'Toko tutup',
  stok_tidak_tersedia: 'Stok pesanan tidak tersedia',
  kurir_libur: 'Kurir libur',
  ganti_toko_lain: 'Ganti pesanan di toko lain',
  tidak_jadi_beli: 'Tidak jadi membeli',
}

export const ALASAN_UNTUK_TOKO = ['toko_tutup', 'stok_tidak_tersedia']
export const ALASAN_UNTUK_KURIR = ['kurir_libur', 'toko_tutup', 'stok_tidak_tersedia']
export const ALASAN_UNTUK_PEMBELI = ['ganti_toko_lain', 'tidak_jadi_beli', 'toko_tutup']
export const ALASAN_UNTUK_ADMIN = ['toko_tutup', 'stok_tidak_tersedia', 'kurir_libur', 'ganti_toko_lain', 'tidak_jadi_beli']
