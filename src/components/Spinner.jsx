export default function Spinner({ label = 'Memuat...' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-gray-400 dark:text-gray-500">
      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  )
}
