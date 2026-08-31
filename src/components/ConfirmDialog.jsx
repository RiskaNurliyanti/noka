import { createContext, useCallback, useContext, useState } from 'react'

const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null) // { message, resolve }

  const confirmAsync = useCallback((message) => {
    return new Promise((resolve) => {
      setDialog({ message, resolve })
    })
  }, [])

  function selesai(hasil) {
    dialog?.resolve(hasil)
    setDialog(null)
  }

  return (
    <ConfirmContext.Provider value={confirmAsync}>
      {children}
      {dialog && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => selesai(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl p-5 max-w-sm w-full">
            <p className="text-sm text-gray-700 dark:text-gray-200 mb-4">{dialog.message}</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => selesai(false)} className="text-sm px-4 py-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                Batal
              </button>
              <button onClick={() => selesai(true)} className="text-sm px-4 py-2 rounded-full bg-red-500 text-white font-medium hover:bg-red-600">
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm harus dipakai di dalam <ConfirmProvider>')
  return ctx
}
