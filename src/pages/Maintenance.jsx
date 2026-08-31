// Halaman yang tampil kalau aplikasi lagi mode maintenance.
export default function Maintenance() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-center">
      <div>
        <p className="text-4xl mb-3">🛠️</p>
        <h1 className="text-xl font-bold mb-2">NOKA sedang dalam perbaikan</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
          Kami sedang melakukan pemeliharaan sebentar. Coba buka lagi beberapa saat lagi ya.
        </p>
      </div>
    </div>
  )
}
