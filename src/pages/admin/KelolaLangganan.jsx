// Kelola langganan bulanan toko (admin).
import { useEffect, useState } from 'react'
import { api } from '../../lib/apiClient'
import { useToast } from '../../context/ToastContext'
import PageHeader from '../../components/PageHeader'
import Card from '../../components/Card'
import Badge from '../../components/Badge'
import Spinner from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import Pagination from '../../components/Pagination'

const LABEL_STATUS_BAYAR = { belum_dibayar: 'Belum dibayar', lunas: 'Lunas' }
const WARNA_STATUS_BAYAR = { belum_dibayar: 'red', lunas: 'green' }

function bulanIni() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function formatRupiah(n) {
  return `Rp${Number(n || 0).toLocaleString('id-ID')}`
}
function formatTanggal(t) {
  if (!t) return '-'
  return new Date(t).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function KelolaLangganan() {
  const { showToast } = useToast()
  const [bulan, setBulan] = useState(bulanIni())
  const [cari, setCari] = useState('')
  const [toko, setToko] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [prosesId, setProsesId] = useState(null)

  async function muat(pageNum = page) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ per_page: '10', page: String(pageNum), bulan })
      if (cari) params.set('q', cari)
      const res = await api.get(`/admin/langganan?${params.toString()}`)
      setToko(res.data?.data || [])
      setTotalPages(Math.max(1, res.data?.last_page || 1))
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => { muat(1); setPage(1) }, 400)
    return () => clearTimeout(timer)
  }, [bulan, cari])
  useEffect(() => { muat(page) }, [page])

  async function perpanjang(tokoId, hari = 30) {
    setProsesId(tokoId)
    try {
      await api.post(`/admin/langganan/${tokoId}/perpanjang`, { hari })
      showToast(`Langganan diperpanjang ${hari} hari`)
      muat(page)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setProsesId(null)
    }
  }

  async function hitungUlang(tokoId) {
    setProsesId(tokoId)
    try {
      await api.post(`/admin/langganan/${tokoId}/hitung-tagihan`, { bulan })
      showToast('Tagihan dihitung ulang')
      muat(page)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setProsesId(null)
    }
  }

  async function tandaiLunas(tagihanId) {
    setProsesId(tagihanId)
    try {
      await api.patch(`/admin/tagihan/${tagihanId}/lunas`)
      showToast('Tagihan ditandai lunas')
      muat(page)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setProsesId(null)
    }
  }

  return (
    <div>
      <PageHeader
        badge="💳 Langganan"
        title="Langganan & Tagihan Toko"
        subtitle="Kelola langganan bulanan dan tagihan seluruh toko NOKA. Pembayaran masih manual lewat WhatsApp - tandai lunas di sini setelah toko konfirmasi transfer."
      />

      <Card className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Bulan</label>
          <input
            type="month"
            value={bulan}
            onChange={(e) => setBulan(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Cari toko</label>
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="🔍 Nama toko..."
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
      </Card>

      {loading ? (
        <Spinner label="Memuat data langganan..." />
      ) : toko.length === 0 ? (
        <EmptyState icon="💳" title="Tidak ada toko" description="Coba ubah kata kunci pencarian." />
      ) : (
        <div className="space-y-2">
          {toko.map((t) => {
            const l = t.langganan
            const tg = t.tagihan?.[0]
            const sisaHari = l ? Math.max(0, Math.ceil((new Date(l.berakhir_tanggal) - new Date()) / 86400000)) : null
            return (
              <Card key={t.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{t.nama_toko}</p>
                    {l ? (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {l.status === 'aktif' ? `Aktif, sisa ${sisaHari} hari (s/d ${formatTanggal(l.berakhir_tanggal)})` : 'Kadaluarsa'}
                      </p>
                    ) : (
                      <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">Belum punya langganan</p>
                    )}
                  </div>
                  <div className="text-right">
                    {tg ? (
                      <>
                        <p className="text-sm font-bold text-brand-600">{formatRupiah(tg.total)}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{tg.jumlah_transaksi} transaksi</p>
                        <Badge color={WARNA_STATUS_BAYAR[tg.status_bayar]}>{LABEL_STATUS_BAYAR[tg.status_bayar]}</Badge>
                      </>
                    ) : (
                      <p className="text-xs text-gray-400 dark:text-gray-500">Belum ada tagihan bulan ini</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => perpanjang(t.id, 30)}
                    disabled={prosesId === t.id}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-50"
                  >
                    ➕ Perpanjang 30 hari
                  </button>
                  <button
                    onClick={() => hitungUlang(t.id)}
                    disabled={prosesId === t.id}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 disabled:opacity-50"
                  >
                    🔄 Hitung ulang tagihan
                  </button>
                  {tg && tg.status_bayar === 'belum_dibayar' && (
                    <button
                      onClick={() => tandaiLunas(tg.id)}
                      disabled={prosesId === tg.id}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
                    >
                      ✅ Tandai lunas
                    </button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  )
}
