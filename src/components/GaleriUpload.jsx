<<<<<<< HEAD
// Upload & preview beberapa foto sekaligus (mis. foto produk).
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
import { useState } from 'react'
import { uploadGaleri } from '../lib/storage'
import { useToast } from '../context/ToastContext'
import SafeImage from './SafeImage'

// Upload + preview + hapus galeri multi-foto. `value` = array URL yang sudah
// tersimpan, `onChange` dipanggil dengan array URL baru tiap kali berubah.
export default function GaleriUpload({ value = [], onChange, folder }) {
  const { showToast } = useToast()
  const [uploading, setUploading] = useState(false)
  // Preview LOKAL (blob URL dari browser, belum tersimpan di server) untuk
  // foto yang baru dipilih dan sedang di-upload - tanpa ini, pengguna cuma
  // lihat teks "Mengupload..." tanpa tahu foto mana yang sedang diproses,
  // apalagi kalau pilih banyak foto sekaligus dan uploadnya butuh beberapa
  // detik. Dihapus otomatis begitu upload beres (foto pindah ke `value`).
  const [previewPending, setPreviewPending] = useState([])

  async function handleFiles(e) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const pending = files.map((file) => ({ file, url: URL.createObjectURL(file) }))
    setPreviewPending(pending)
    setUploading(true)
    try {
      const urls = await uploadGaleri(files, folder)
      onChange([...(value || []), ...urls])
      showToast(`${urls.length} foto ditambahkan ke galeri`)
    } catch (err) {
      showToast('Gagal upload foto: ' + err.message, 'error')
    } finally {
      pending.forEach((p) => URL.revokeObjectURL(p.url))
      setPreviewPending([])
      setUploading(false)
      e.target.value = ''
    }
  }

  function hapusFoto(url) {
    onChange((value || []).filter((u) => u !== url))
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {(value || []).map((url) => (
          <div key={url} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group">
            <SafeImage src={url} alt="Galeri" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => hapusFoto(url)}
              className="absolute inset-0 bg-black/50 text-white text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center"
            >
              Hapus
            </button>
          </div>
        ))}
        {previewPending.map((p) => (
          <div key={p.url} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <img src={p.url} alt="Sedang diupload" className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        ))}
      </div>
      <label className="inline-block text-xs text-brand-500 font-medium cursor-pointer">
        {uploading ? 'Mengupload...' : '+ Tambah foto galeri'}
        <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} disabled={uploading} />
      </label>
    </div>
  )
}
