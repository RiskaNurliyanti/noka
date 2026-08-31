// Header section yang konsisten dipakai di berbagai halaman. Sebelumnya
// pakai background gradient besar (bg-gradient-to-br from-brand-600 to-
// brand-500) di semua 13 halaman yang memakainya - kesan "dashboard
// generik ber-gradient" yang justru diminta dihindari. Sekarang transparan,
// menyatu dengan latar halaman, dengan badge kecil dan border-bottom tipis
// sebagai pemisah section - lebih clean, tanpa mengurangi hierarki visual.
export default function PageHeader({ badge, title, subtitle, action }) {
  return (
    <div className="flex items-end justify-between flex-wrap gap-4 pb-5 mb-6 border-b border-gray-200 dark:border-gray-800">
      <div>
        {badge && (
          <p className="inline-flex items-center gap-1.5 bg-brand-50 dark:bg-brand-950/40 text-brand-600 rounded-full px-3 py-1 text-xs font-semibold mb-3">
            {badge}
          </p>
        )}
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">{title}</h1>
        {subtitle && <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
