<<<<<<< HEAD
// Dropdown pilihan yang bisa dicari (mis. pilih toko/kategori).
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
import { useEffect, useRef, useState } from 'react'

// Dropdown dengan fitur cari - dipakai buat list yang panjang (kategori,
// pilih toko, pilih kurir, dll) biar nggak perlu scroll manual.
// options: [{ value, label }]
export default function SearchableSelect({ options, value, onChange, placeholder = 'Pilih...', className = '', allowClear = true }) {
  const [buka, setBuka] = useState(false)
  const [cari, setCari] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    function handleClickLuar(e) {
      if (ref.current && !ref.current.contains(e.target)) setBuka(false)
    }
    document.addEventListener('mousedown', handleClickLuar)
    return () => document.removeEventListener('mousedown', handleClickLuar)
  }, [])

  const dipilih = options.find((o) => String(o.value) === String(value))
  const filtered = options.filter((o) => o.label.toLowerCase().includes(cari.toLowerCase()))

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setBuka((b) => !b)}
        className="input-style w-full text-left flex items-center justify-between"
      >
        <span className={dipilih ? '' : 'text-gray-400 dark:text-gray-500'}>
          {dipilih ? dipilih.label : placeholder}
        </span>
        <span className="text-gray-400 text-xs ml-2">▾</span>
      </button>

      {buka && (
        <div className="absolute z-[1500] mt-1 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-hidden flex flex-col">
          <input
            autoFocus
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari..."
            className="px-3 py-2 text-sm border-b border-gray-100 dark:border-gray-800 outline-none bg-transparent"
          />
          <div className="overflow-y-auto">
            {allowClear && (
              <button
                type="button"
                onClick={() => { onChange(''); setBuka(false); setCari('') }}
                className="w-full text-left px-3 py-2 text-sm text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {placeholder}
              </button>
            )}
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500">Tidak ketemu.</p>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => { onChange(o.value); setBuka(false); setCari('') }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${String(o.value) === String(value) ? 'bg-brand-50 dark:bg-brand-950/30 font-medium' : ''}`}
                >
                  {o.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
