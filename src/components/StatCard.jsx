import Card from './Card'

/**
 * Kartu statistik (icon + label + angka) - dipakai di SEMUA dashboard
 * (pelanggan, toko, kurir, admin, super admin). Pola ini persis sama di
 * referensi desain Stitch untuk seller/courier dashboard, jadi jelas
 * reusable, bukan dibuat-buat.
 */
export default function StatCard({ icon, label, value, accent = 'brand' }) {
  const warnaIkon = {
    brand: 'bg-brand-50 dark:bg-brand-950/40 text-brand-600',
    accent: 'bg-accent-50 dark:bg-accent-950/30 text-accent-600',
    green: 'bg-green-50 dark:bg-green-950/30 text-green-600',
    gray: 'bg-gray-100 dark:bg-gray-800 text-gray-500',
  }[accent]

  return (
    <Card className="flex items-center gap-3.5 min-w-0">
      {icon && <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${warnaIkon}`}>{icon}</div>}
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</p>
        {/* Nilai (mis. "Rp1.500.000") sengaja BOLEH ganti baris (break-words),
            bukan dipotong pakai ellipsis (truncate) - angka yang kepotong
            gampang disalahartikan sebagai angka yang lebih kecil dari
            aslinya, beda dengan label yang aman dipotong karena cuma teks. */}
        <p className="text-lg sm:text-xl font-bold mt-0.5 break-words leading-tight">{value}</p>
      </div>
    </Card>
  )
}
