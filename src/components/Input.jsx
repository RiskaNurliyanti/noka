// Input teks standar aplikasi dengan label & pesan error.
import { useState } from 'react'

export default function Input({ label, error, hint, textarea = false, type, className = '', ...props }) {
  const Comp = textarea ? 'textarea' : 'input'
  const isPassword = type === 'password'
  const [tampilkan, setTampilkan] = useState(false)

  const field = (
    <Comp
      type={isPassword ? (tampilkan ? 'text' : 'password') : type}
      className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none transition dark:bg-gray-900 dark:text-gray-100
        ${isPassword ? 'pr-10' : ''}
        ${error ? 'border-red-400 focus:ring-2 focus:ring-red-300' : 'border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-brand-400'}
        ${className}`}
      {...props}
    />
  )

  return (
    <div>
      {label && <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">{label}</label>}
      {isPassword ? (
        <div className="relative">
          {field}
          <button
            type="button"
            onClick={() => setTampilkan((v) => !v)}
            tabIndex={-1}
            aria-label={tampilkan ? 'Sembunyikan password' : 'Lihat password'}
            className="absolute inset-y-0 right-0 w-10 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            {tampilkan ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[18px] h-[18px]">
                <path d="M3 3l18 18" />
                <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                <path d="M9.3 5.3A9.9 9.9 0 0112 5c5 0 9 4 10 7-.5 1.4-1.4 2.9-2.6 4.1M6.6 6.6C4.5 8 3 10 2 12c1 3 5 7 10 7 1.4 0 2.7-.3 3.9-.8" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[18px] h-[18px]">
                <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      ) : field}
      {hint && !error && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
