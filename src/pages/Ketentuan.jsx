export default function Ketentuan() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-extrabold mb-2">Syarat & Ketentuan</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Terakhir diperbarui: 2026</p>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl px-5 py-4 mb-6">
        <p className="text-sm text-amber-700 dark:text-amber-400">
          <strong>NOKA adalah platform perantara</strong>, bukan penjual, bukan kurir, dan bukan pihak yang memproses pembayaran.
          NOKA cuma bantu mempertemukan pembeli dengan toko UMKM dan mitra kurir di sekitar wilayah layanan.
        </p>
      </div>

      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 mb-4">
        <h2 className="font-bold mb-3">🛣️ Bagaimana alurnya</h2>
        <ol className="text-sm text-gray-600 dark:text-gray-300 space-y-2 list-decimal list-inside">
          <li>Pembeli browse toko dan produk di NOKA, bisa tanpa login.</li>
          <li>Checkout - isi data pesanan (login otomatis pakai profil, guest isi nama & WhatsApp).</li>
          <li>NOKA menyiapkan link WhatsApp ke toko atau kurir yang dipilih.</li>
          <li>Konfirmasi harga, cara bayar, dan jadwal antar dilakukan langsung lewat WhatsApp.</li>
          <li>Pesanan diselesaikan atau dibatalkan (lihat aturannya di bawah) oleh pembeli, toko, atau kurir.</li>
          <li>Setelah login, pembeli bisa memberi rating & review.</li>
        </ol>
      </section>

      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 mb-4">
        <h2 className="font-bold mb-3">❌ Pembatalan & penyelesaian pesanan</h2>
        <div className="text-sm text-gray-600 dark:text-gray-300 space-y-3">
          <p>
            Semua pesanan bisa dibatalkan oleh pembeli, toko (penjual), kurir, admin, maupun super admin -
            tapi alasan yang boleh dipilih beda-beda sesuai siapa yang membatalkan:
          </p>
          <ul className="space-y-1.5 list-disc list-inside">
            <li><strong>Pembeli</strong>: ganti pesanan di toko lain, tidak jadi membeli, atau toko tutup. <em>Dibatasi maksimal 2x pembatalan per hari per akun</em>, supaya tidak disalahgunakan buat spam-batal pesanan toko.</li>
            <li><strong>Toko (penjual)</strong>: toko tutup, atau stok pesanan tidak tersedia.</li>
            <li><strong>Kurir</strong>: kurir libur, toko tutup, atau stok pesanan tidak tersedia.</li>
            <li><strong>Admin & super admin</strong>: semua alasan di atas tersedia, tanpa batas jumlah pembatalan per hari - dipakai untuk menengahi sengketa atau mencatat pembatalan yang disepakati lewat WhatsApp.</li>
          </ul>
          <p>
            Pembeli, kurir, dan toko masing-masing juga bisa menandai pesanan mereka sendiri sebagai <strong>selesai</strong>
            begitu transaksi tuntas - admin dan super admin bisa melakukan keduanya (membatalkan maupun menyelesaikan)
            untuk pesanan siapa pun kalau diperlukan.
          </p>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-2xl p-5">
          <h3 className="font-bold text-green-700 dark:text-green-400 mb-2 text-sm">✅ Yang disediakan NOKA</h3>
          <ul className="text-xs text-green-700 dark:text-green-400 space-y-1 list-disc list-inside">
            <li>Direktori toko, produk, dan kurir</li>
            <li>Fasilitas pencarian dan checkout</li>
            <li>Link WhatsApp otomatis</li>
            <li>Ruang rating & review</li>
            <li>Riwayat & pembatalan/penyelesaian pesanan</li>
            <li>Saluran lapor bug & pelanggaran ke admin</li>
          </ul>
        </div>
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-2xl p-5">
          <h3 className="font-bold text-red-700 dark:text-red-400 mb-2 text-sm">❌ Bukan tanggung jawab NOKA</h3>
          <ul className="text-xs text-red-700 dark:text-red-400 space-y-1 list-disc list-inside">
            <li>Pemrosesan atau penyimpanan pembayaran</li>
            <li>Kualitas atau kesesuaian produk</li>
            <li>Ketepatan waktu pengiriman</li>
            <li>Sengketa antar pengguna yang tidak dilaporkan lewat fitur aduan</li>
          </ul>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
        <h2 className="font-bold mb-3">❓ Pertanyaan umum</h2>
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-medium">Apakah saya bisa bayar langsung di NOKA?</p>
            <p className="text-gray-500 dark:text-gray-400 mt-0.5">Tidak. Metode bayar disepakati langsung dengan toko lewat WhatsApp.</p>
          </div>
          <div>
            <p className="font-medium">Apakah saya harus login untuk pesan?</p>
            <p className="text-gray-500 dark:text-gray-400 mt-0.5">Tidak wajib. Login cuma diperlukan buat riwayat pesanan, favorit, dan review.</p>
          </div>
          <div>
            <p className="font-medium">Bagaimana kalau pesanan tidak sesuai?</p>
            <p className="text-gray-500 dark:text-gray-400 mt-0.5">Komplain disampaikan langsung ke toko/kurir lewat WhatsApp yang sama. Kalau tidak selesai, laporkan lewat menu "Lapor Masalah" supaya admin bisa menengahi.</p>
          </div>
          <div>
            <p className="font-medium">Berapa kali saya boleh membatalkan pesanan?</p>
            <p className="text-gray-500 dark:text-gray-400 mt-0.5">Sebagai pembeli, kamu bisa membatalkan pesananmu sendiri maksimal 2x per hari. Pembatalan oleh toko, kurir, admin, atau super admin tidak mengurangi jatahmu.</p>
          </div>
          <div>
            <p className="font-medium">Ke mana saya lapor kalau nemu bug atau kecurangan?</p>
            <p className="text-gray-500 dark:text-gray-400 mt-0.5">Pakai menu "Lapor Masalah" (tersedia buat semua akun yang login) - laporan langsung masuk ke admin dan super admin NOKA.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
