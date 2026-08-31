// Halaman "Cara Kerja NOKA" - panduan alur buat pembeli/toko/kurir.
import { useState } from 'react'

const TABS = {
  pembeli: {
    label: 'Saya pembeli',
    langkah: [
      ['Cari produk atau toko', 'Buka NOKA, cari lewat search atau jelajahi kategori. Nggak perlu login buat lihat-lihat.'],
      ['Tambah ke keranjang & checkout', 'Pilih produk, kasih catatan kalau ada permintaan khusus, lalu checkout.'],
      ['Isi data pesanan', 'Sudah login? Data kamu otomatis kepakai. Belum login? Cukup isi nama dan nomor WhatsApp aktif.'],
      ['Pilih cara pesanan sampai', 'Ambil sendiri ke toko, atau pilih mitra kurir yang area layanannya mencakup lokasi kamu.'],
      ['Lanjut di WhatsApp', 'NOKA otomatis menyiapkan pesan ringkasan pesananmu ke toko - dan kalau diantar kurir, ke kurirnya juga sekaligus - tinggal kirim buat konfirmasi harga & cara bayar. Kalau salah satu chat kelewat/ke-blokir, ada tombol chat manual di menu "Pesanan Saya".'],
      ['Pantau & kelola pesanan', 'Cek status pesanan di menu "Pesanan Saya" - bisa difilter per bulan/minggu/hari dan dicari. Kamu juga bisa menandai pesanan selesai begitu barang diterima, atau membatalkan pesanan kalau memang perlu (maksimal 2x per hari, dengan memilih alasan: ganti toko lain, tidak jadi beli, atau toko tutup).'],
      ['Beri review (kalau sudah login)', 'Setelah pesananmu sampai, kasih rating dan ulasan buat bantu pembeli lain. Pesanan yang dibatalkan tidak bisa direview.'],
      ['Lapor kalau ada masalah', 'Nemu bug di aplikasi, atau ada toko/kurir yang berlaku curang? Laporkan lewat menu "Lapor Masalah", langsung masuk ke tim admin NOKA.'],
    ],
    catatan: 'NOKA tidak menangani pembayaran maupun pengiriman secara langsung. Semua kesepakatan harga, cara bayar, dan jadwal antar ditentukan langsung antara kamu dan toko/kurir lewat WhatsApp.',
  },
  toko: {
    label: 'Saya mau jadi mitra toko',
    langkah: [
      ['Daftar sebagai mitra toko', 'Login pakai akun NOKA, lalu isi data toko: nama, WhatsApp, deskripsi, lokasi.'],
      ['Tunggu verifikasi admin', 'Tim admin NOKA mengecek pengajuanmu sebelum toko kamu tampil ke publik.'],
      ['Tambahkan menu', 'Upload foto, atur harga, dan kelompokkan produk ke kategori yang sesuai.'],
      ['Terima pesanan masuk', 'Pembeli akan menghubungimu langsung lewat WhatsApp begitu checkout - kalau pembelinya belum/lupa chat, kamu juga bisa chat duluan lewat tombol "Chat pembeli" di menu Pesanan Masuk.'],
      ['Kelola status pesanan', 'Kalau pesanan diambil sendiri ke toko, kamu bisa langsung tandai "selesai" begitu tuntas. Kalau diantar kurir, kamu tandai "sudah diserahkan ke kurir" (status jadi Diproses) - penyelesaian akhirnya ("selesai") jadi wewenang kurir/pembeli/admin, karena cuma mereka yang tahu barang sudah benar-benar sampai. Bisa juga tandai "dibatalkan" kalau toko sedang tutup atau stok pesanan itu tidak tersedia - selalu sertakan alasannya biar tercatat rapi di riwayat.'],
      ['Koordinasi dengan kurir', 'Kalau pesanan diantar kurir, kamu bisa chat langsung ke kurirnya (mis. soal jam ambil) lewat tombol "Chat kurir" di kartu pesanan.'],
      ['Pantau performa toko', 'Lihat kunjungan, pesanan, pendapatan, dan rating dari dashboard toko - laporan bisa difilter per bulan/minggu/hari dan diunduh ke Excel.'],
      ['Lapor kalau ada masalah', 'Nemu bug di aplikasi, atau ada pembeli/kurir yang bermasalah? Laporkan lewat menu "Lapor Masalah".'],
    ],
    catatan: 'Konfirmasi pesanan, kesepakatan harga akhir, dan koordinasi dengan kurir sepenuhnya lewat chat WhatsApp - NOKA hanya menghubungkan di awal.',
  },
  kurir: {
    label: 'Saya mau jadi mitra kurir',
    langkah: [
      ['Daftar sebagai mitra kurir', 'Login pakai akun NOKA, isi nama layanan, WhatsApp, area, dan jam operasional.'],
      ['Tunggu verifikasi admin', 'Setelah disetujui, profilmu tampil di direktori kurir dan bisa dipilih pembeli.'],
      ['Update status ketersediaan', 'Tandai "tersedia" atau "tidak tersedia" kapan pun sesuai kondisimu.'],
      ['Dihubungi lewat WhatsApp', 'Kalau kamu dipilih pembeli, pembeli akan menghubungimu langsung lewat WhatsApp begitu checkout buat atur pengantaran. Kalau pembelinya belum/lupa chat, kamu bisa chat duluan lewat tombol "Chat pembeli" - begitu juga ke toko lewat tombol "Chat toko" kalau perlu koordinasi soal pesanannya.'],
      ['Kelola status pengantaran', 'Tandai "selesai" begitu barang sampai ke tangan pembeli, atau "dibatalkan" kalau kamu sedang libur, toko tutup, atau stok pesanan tidak tersedia - sertakan alasannya. Riwayat pengantaranmu bisa dicek dan difilter per bulan/minggu/hari di dashboard.'],
      ['Lapor kalau ada masalah', 'Nemu bug di aplikasi, atau ada masalah dengan toko/pembeli? Laporkan lewat menu "Lapor Masalah".'],
    ],
    catatan: 'NOKA tidak melakukan pelacakan lokasi secara langsung. Ongkos kirim dan jadwal antar ditentukan sendiri antara kamu, toko, dan pembeli.',
  },
}

export default function CaraKerja() {
  const [tab, setTab] = useState('pembeli')
  const data = TABS[tab]

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-center mb-2">Cara kerja NOKA</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8">
        NOKA menghubungkan kamu dengan toko UMKM dan kurir lokal di sekitar. Pilih peran kamu buat lihat alurnya.
      </p>

      <div className="flex justify-center gap-2 flex-wrap mb-8">
        {Object.entries(TABS).map(([key, val]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-full text-sm font-medium ${tab === key ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
          >
            {val.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {data.langkah.map(([judul, deskripsi], i) => (
          <div key={i} className="flex gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-600 font-bold text-sm flex items-center justify-center flex-shrink-0">{i + 1}</div>
            <div>
              <p className="text-sm font-semibold">{judul}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{deskripsi}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
        {data.catatan}
      </div>
    </div>
  )
}
