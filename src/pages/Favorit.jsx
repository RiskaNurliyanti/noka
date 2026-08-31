import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/apiClient'
import ProductCard from '../components/ProductCard'
import PageHeader from '../components/PageHeader'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'

export default function Favorit() {
  const { user } = useAuth()
  const [produk, setProduk] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    api.get('/favorit')
      .then((res) => setProduk((res.data || []).map((f) => f.produk).filter(Boolean)))
      .finally(() => setLoading(false))
  }, [user])

  return (
    <div>
      <PageHeader badge="❤️ Favorit" title="Produk favorit" subtitle="Produk yang kamu simpan buat dilihat lagi nanti." />

      {loading ? (
        <Spinner label="Memuat favorit..." />
      ) : produk.length === 0 ? (
        <EmptyState icon="❤️" title="Belum ada produk favorit" description="Klik ikon hati di halaman produk buat menyimpannya di sini." />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {produk.map((p) => <ProductCard key={p.id} produk={p} />)}
        </div>
      )}
    </div>
  )
}
