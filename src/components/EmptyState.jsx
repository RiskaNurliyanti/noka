<<<<<<< HEAD
// Tampilan "belum ada data" standar (ikon + pesan), dipakai di banyak halaman.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
export default function EmptyState({ icon = '📭', title, description }) {
  return (
    <div className="text-center py-16">
      <p className="text-4xl mb-3">{icon}</p>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</p>
      {description && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{description}</p>}
    </div>
  )
}
