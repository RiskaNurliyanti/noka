<<<<<<< HEAD
// Form isi rating & komentar review.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
import { useState } from 'react'
import { api } from '../lib/apiClient'

// Form CRUD review yang bisa dipakai ulang buat produk, toko, atau kurir.
// tabel: 'review_produk' | 'review_toko' | 'review_kurir' (nama lama dipertahankan
// sebagai prop interface supaya caller - ReviewSaya.jsx, PesananSaya.jsx - tidak
// perlu diubah; di dalam sini dipetakan ke 'jenis' yang dipakai endpoint Laravel.
//
// pesananId WAJIB diisi untuk review baru (bukan update) - backend memvalidasi
// review harus berasal dari pesanan yang memang mengandung produk/toko/kurir
// tsb, dan menolak review kedua untuk pesanan yang sama.
const LABEL_JENIS = { produk: 'Review Produk', toko: 'Review Toko', kurir: 'Review Kurir' }

export default function ReviewForm({ tabel, targetId, pesananId, existing, onSaved, onCancel }) {
  const jenis = tabel.replace('review_', '') // 'review_produk' -> 'produk'
  const [rating, setRating] = useState(existing?.rating || 5)
  const [komentar, setKomentar] = useState(existing?.komentar || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Backend membatasi update maksimal 1x per review - kalau sudah kepakai,
  // jangan biarkan user coba submit lagi (bakal ditolak backend juga, tapi
  // lebih jelas kalau UI langsung kasih tahu).
  const updateSudahHabis = !!existing && (existing.update_count || 0) >= 1

  async function simpan(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (existing) {
        await api.put(`/review/${jenis}/${existing.id}`, { rating, komentar })
      } else {
        await api.post(`/${jenis}/${targetId}/review`, { rating, komentar, pesanan_id: pesananId })
      }
      onSaved?.()
    } catch (err) {
      setError(err.message || 'Gagal menyimpan review')
    } finally {
      setLoading(false)
    }
  }

  if (updateSudahHabis) {
    return (
      <div className="bg-brand-50 dark:bg-gray-800 rounded-lg p-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
        <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">{LABEL_JENIS[jenis]}</p>
        <p>Rating kamu: {'★'.repeat(existing.rating)}{'☆'.repeat(5 - existing.rating)}</p>
        {existing.komentar && <p className="mt-1">"{existing.komentar}"</p>}
        <p className="mt-2 italic">Review ini sudah pernah diupdate 1x, jadi tidak bisa diedit lagi.</p>
        {onCancel && <button type="button" onClick={onCancel} className="mt-2 text-brand-600 font-medium">Tutup</button>}
      </div>
    )
  }

  return (
    <form onSubmit={simpan} className="bg-brand-50 dark:bg-gray-800 rounded-lg p-3 mt-2 space-y-2">
      <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{LABEL_JENIS[jenis]}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} onClick={() => setRating(n)} className={`text-lg ${n <= rating ? 'text-amber-500' : 'text-gray-300 dark:text-gray-600'}`}>★</button>
        ))}
      </div>
      <textarea
        value={komentar}
        onChange={(e) => setKomentar(e.target.value)}
        placeholder="Ceritakan pengalamanmu (opsional)"
        rows={2}
        className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button disabled={loading} className="text-xs font-semibold bg-brand-500 text-white rounded-full px-4 py-1.5 disabled:opacity-50">
          {loading ? 'Menyimpan...' : existing ? 'Update review (1x kesempatan)' : 'Kirim review'}
        </button>
        {onCancel && <button type="button" onClick={onCancel} className="text-xs text-gray-500 dark:text-gray-400">Batal</button>}
      </div>
    </form>
  )
}
