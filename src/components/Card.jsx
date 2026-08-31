// Kontainer kotak dengan border/shadow standar, dipakai di banyak halaman.
/**
 * Container dasar NOKA - satu border/radius/shadow konsisten dipakai di
 * mana pun butuh "kotak putih" (form, list item, panel). Menghindari
 * className border+rounded+shadow yang diulang manual di puluhan tempat.
 */
export default function Card({ children, className = '', padded = true, ...props }) {
  return (
    <div
      className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl ${padded ? 'p-5' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
