<<<<<<< HEAD
// Label kecil berwarna (mis. status pesanan), dipakai berulang di banyak halaman.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
const WARNA = {
  gray: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300',
  brand: 'bg-brand-50 dark:bg-brand-950/40 text-brand-600',
  green: 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400',
  red: 'bg-red-50 dark:bg-red-950/30 text-red-600',
  amber: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600',
}

/**
 * Badge/pill kecil buat status & role - dipakai di KelolaPengguna, KelolaToko,
 * KelolaKurir, ModerasiReview, dst. Pola sama persis diulang di banyak
 * halaman admin, jadi wajar dijadikan komponen bersama.
 */
export default function Badge({ color = 'gray', children }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${WARNA[color]}`}>
      {children}
    </span>
  )
}
