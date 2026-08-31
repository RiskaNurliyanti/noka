// Tampilan "belum ada data" standar (ikon + pesan), dipakai di banyak halaman.
export default function EmptyState({ icon = '📭', title, description }) {
  return (
    <div className="text-center py-16">
      <p className="text-4xl mb-3">{icon}</p>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</p>
      {description && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{description}</p>}
    </div>
  )
}
