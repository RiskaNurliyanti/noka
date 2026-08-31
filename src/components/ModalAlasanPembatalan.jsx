<<<<<<< HEAD
// Popup pilih alasan saat membatalkan pesanan.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
import { useState } from 'react'
import { LABEL_ALASAN_PEMBATALAN } from '../lib/alasanPembatalan'

export default function ModalAlasanPembatalan({ opsiAlasan, onKonfirmasi, onBatal, loading }) {
  const [alasan, setAlasan] = useState('')

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onBatal} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-5 max-w-sm w-full">
        <p className="font-semibold text-sm mb-1">❌ Batalkan pesanan</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Pilih alasan pembatalan supaya tercatat dengan jelas.</p>

        <div className="space-y-2 mb-5">
          {opsiAlasan.map((key) => (
            <label
              key={key}
              className={`flex items-center gap-2.5 border rounded-xl px-3 py-2.5 text-sm cursor-pointer transition ${
                alasan === key
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <input type="radio" name="alasan_pembatalan" value={key} checked={alasan === key} onChange={() => setAlasan(key)} className="accent-brand-500" />
              {LABEL_ALASAN_PEMBATALAN[key] || key}
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onBatal} className="text-sm px-4 py-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            Batal
          </button>
          <button
            onClick={() => alasan && onKonfirmasi(alasan)}
            disabled={!alasan || loading}
            className="text-sm px-4 py-2 rounded-full bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Batalkan pesanan'}
          </button>
        </div>
      </div>
    </div>
  )
}
