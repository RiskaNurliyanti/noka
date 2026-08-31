import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/apiClient'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../components/ConfirmDialog'
import ReviewForm from '../components/ReviewForm'
import RatingStars from '../components/RatingStars'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import Button from '../components/Button'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'

export default function ReviewSaya() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const confirmAsync = useConfirm()
  const [reviews, setReviews] = useState({ produk: [], toko: [], kurir: [] })
  const [loading, setLoading] = useState(true)
  const [edit, setEdit] = useState(null)

  async function muat() {
    const res = await api.get('/review-saya')
    setReviews(res.data || { produk: [], toko: [], kurir: [] })
    setLoading(false)
  }

  useEffect(() => { if (user) muat() }, [user])

  async function hapus(jenis, id) {
    const yakin = await confirmAsync('Hapus review ini?')
    if (!yakin) return
    await api.delete(`/review/${jenis}/${id}`)
    showToast('Review dihapus')
    muat()
  }

  function Baris({ jenis, nama, item }) {
    const sedangEdit = edit?.item?.id === item.id
    const updateHabis = (item.update_count || 0) >= 1
    return (
      <Card>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{nama}</p>
          <RatingStars rating={item.rating} />
        </div>
        {item.komentar && <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{item.komentar}</p>}
        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            variant="ghost"
            disabled={updateHabis && !sedangEdit}
            onClick={() => setEdit(sedangEdit ? null : { jenis, item })}
            title={updateHabis ? 'Review ini sudah pernah diupdate 1x' : undefined}
          >
            {sedangEdit ? 'Batal' : updateHabis ? 'Sudah diupdate' : 'Edit'}
          </Button>
          <Button size="sm" variant="danger" onClick={() => hapus(jenis, item.id)}>Hapus</Button>
        </div>
        {sedangEdit && (
          <ReviewForm
            tabel={`review_${jenis}`}
            existing={item}
            onCancel={() => setEdit(null)}
            onSaved={() => { setEdit(null); showToast('Review diperbarui'); muat() }}
          />
        )}
      </Card>
    )
  }

  const total = reviews.produk.length + reviews.toko.length + reviews.kurir.length

  return (
    <div className="max-w-2xl">
      <PageHeader badge="⭐ Review" title="Review saya" subtitle="Semua review yang pernah kamu kasih, bisa diedit atau dihapus." />

      {loading ? (
        <Spinner label="Memuat review..." />
      ) : total === 0 ? (
        <EmptyState icon="⭐" title="Belum pernah kasih review" description='Beri review lewat halaman "Pesanan Saya" setelah pesananmu sampai.' />
      ) : (
        <div className="space-y-3">
          {reviews.toko.map((r) => <Baris key={r.id} jenis="toko" nama={r.toko?.nama_toko} item={r} />)}
          {reviews.produk.map((r) => <Baris key={r.id} jenis="produk" nama={r.produk?.nama} item={r} />)}
          {reviews.kurir.map((r) => <Baris key={r.id} jenis="kurir" nama={r.kurir?.nama_layanan} item={r} />)}
        </div>
      )}
    </div>
  )
}
