<<<<<<< HEAD
// Halaman keranjang belanja sebelum checkout.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCart, updateQty, removeFromCart } from '../lib/cart'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import SafeImage from '../components/SafeImage'

export default function Keranjang() {
  const [items, setItems] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    setItems(getCart())
    const refresh = () => setItems(getCart())
    window.addEventListener('noka-cart-updated', refresh)
    return () => window.removeEventListener('noka-cart-updated', refresh)
  }, [])

  const total = items.reduce((sum, it) => sum + it.harga * it.qty, 0)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <PageHeader badge="🛒 Keranjang" title="Keranjang belanja" subtitle={`${items.length} item siap di-checkout`} />

      {items.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl">
          <EmptyState icon="🛒" title="Keranjang kamu masih kosong" description="Yuk cari produk yang kamu suka." />
          <div className="text-center pb-6">
            <Link to="/produk" className="text-brand-500 font-semibold text-sm bg-brand-50 dark:bg-brand-950/40 rounded-full px-4 py-2">Cari produk →</Link>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {items.map((it) => (
              <div key={it.produk_id} className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-3 hover:shadow-sm transition">
                <div className="w-16 h-16 rounded-xl bg-brand-50 dark:bg-gray-800 flex-shrink-0 overflow-hidden">
                  <SafeImage src={it.foto} className="w-full h-full object-cover" alt={it.nama} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{it.nama}</p>
                  {it.catatan && <p className="text-xs text-gray-500 dark:text-gray-400">📝 {it.catatan}</p>}
                  <p className="text-sm font-semibold text-brand-600 mt-0.5">Rp{it.harga.toLocaleString('id-ID')}</p>
                </div>
                <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-full">
                  <button onClick={() => setItems(updateQty(it.produk_id, it.qty - 1))} className="w-8 h-8 text-sm">-</button>
                  <span className="w-6 text-center text-sm font-medium">{it.qty}</span>
                  <button onClick={() => setItems(updateQty(it.produk_id, it.qty + 1))} className="w-8 h-8 text-sm">+</button>
                </div>
                <button onClick={() => setItems(removeFromCart(it.produk_id))} className="text-red-500 text-xs ml-1 font-medium">Hapus</button>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500">Total belanja</p>
              <p className="font-bold text-lg">Rp{total.toLocaleString('id-ID')}</p>
            </div>
            <button
              onClick={() => navigate('/checkout')}
              className="bg-brand-500 text-white font-semibold rounded-full px-6 py-3 text-sm hover:bg-brand-600 shadow-sm hover:shadow-md transition"
            >
              Checkout →
            </button>
          </div>
        </>
      )}
    </div>
  )
}
