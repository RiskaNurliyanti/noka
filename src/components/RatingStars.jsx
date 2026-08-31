// Tampilan bintang rating buat review.
export default function RatingStars({ rating = 0, jumlahReview = null, size = 14 }) {
  // Kolom rating dari API kadang balik sebagai string (tipe numeric/decimal
  // Postgres lewat PDO), bukan number - Math.round/toFixed bakal error kalau
  // dipanggil langsung ke string. Number(...) di sini menjaga biar aman
  // dipanggil dengan rating dari mana pun (angka asli, string, atau null).
  const angka = Number(rating) || 0
  const rounded = Math.round(angka)
  return (
    <span className="inline-flex items-center gap-1 text-amber-500" style={{ fontSize: size }}>
      {'★'.repeat(rounded)}
      <span className="text-gray-300">{'★'.repeat(5 - rounded)}</span>
      {angka > 0 && (
        <span className="text-gray-500 dark:text-gray-400 text-xs ml-0.5">
          {angka.toFixed(1)}{jumlahReview !== null ? ` (${jumlahReview})` : ''}
        </span>
      )}
    </span>
  )
}
