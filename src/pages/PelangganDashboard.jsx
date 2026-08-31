<<<<<<< HEAD
// Dashboard ringkas buat pembeli.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/apiClient'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import Button from '../components/Button'

export default function PelangganDashboard() {
  const { user, profile } = useAuth()
  const [totalPesanan, setTotalPesanan] = useState(0)
  const [totalFavorit, setTotalFavorit] = useState(0)
  const [totalReview, setTotalReview] = useState(0)

  useEffect(() => {
    if (!user) return

    api.get('/pesanan-saya?per_page=1').then((res) => setTotalPesanan(res.data?.total ?? 0))
    api.get('/favorit').then((res) => setTotalFavorit((res.data || []).length))
    api.get('/review-saya').then((res) => {
      const r = res.data || { produk: [], toko: [], kurir: [] }
      setTotalReview(r.produk.length + r.toko.length + r.kurir.length)
    })
  }, [user])

  return (
    <div>
      <PageHeader
        badge="👋 Dashboard Pelanggan"
        title={`Halo, ${profile?.nama || 'Pelanggan'}!`}
        subtitle="Ringkasan aktivitas belanjamu di NOKA"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        <StatCard icon="🛍️" label="Total pesanan" value={totalPesanan} />
        <StatCard icon="❤️" label="Produk favorit" value={totalFavorit} accent="accent" />
        <StatCard icon="⭐" label="Review diberikan" value={totalReview} accent="green" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link to="/pesanan-saya"><Button>Lihat pesanan saya →</Button></Link>
        <Link to="/produk"><Button variant="secondary">Cari produk →</Button></Link>
        <Link to="/favorit"><Button variant="secondary">Lihat favorit →</Button></Link>
      </div>
    </div>
  )
}
