<<<<<<< HEAD
// Tombol standar aplikasi dengan beberapa varian warna/ukuran.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
const VARIAN = {
  primary: 'bg-brand-500 hover:bg-brand-600 text-white shadow-sm hover:shadow-md disabled:opacity-50',
  secondary: 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200',
  success: 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-950/60',
  danger: 'bg-red-50 dark:bg-red-950/30 text-red-600 hover:bg-red-100 dark:hover:bg-red-950/50',
  ghost: 'text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40',
}

const UKURAN = {
  sm: 'text-xs px-3 py-1.5',
  md: 'text-sm px-4 py-2.5',
  lg: 'text-sm px-6 py-3',
}

export default function Button({ variant = 'primary', size = 'md', full = false, loading = false, disabled, children, className = '', ...props }) {
  return (
    <button
      disabled={disabled || loading}
      className={`rounded-full font-semibold transition inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed ${VARIAN[variant]} ${UKURAN[size]} ${full ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading && <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  )
}
