import { useEffect, useState } from 'react'
import { api } from '../../lib/apiClient'
import { useToast } from '../../context/ToastContext'
import PageHeader from '../../components/PageHeader'
import Card from '../../components/Card'
import Badge from '../../components/Badge'
import Spinner from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'

const LABEL_STATUS_BAYAR = { belum_dibayar: 'Belum dibayar', lunas: 'Lunas' }
const WARNA_STATUS_BAYAR = { belum_dibayar: 'red', lunas: 'green' }

function formatTanggal(t) {
  if (!t) return '-'
  return new Date(t).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}
function formatRupiah(n) {
  return `Rp${Number(n || 0).toLocaleString('id-ID')}`
}
function formatPeriode(p) {
  if (!p) return '-'
  const [tahun, bulan] = p.split('-')
  return new Date(`${tahun}-${bulan}-01`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
}

export default function Langganan() {
  const { showToast } = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/mitra/langganan')
      .then((res) => setData(res.data))
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner label="Memuat data langganan..." />

  const { langganan, tagihan, akan_habis: akanHabis, sisa_hari: sisaHari } = data || {}

  return (
    <div className="max-w-2xl">
      <PageHeader
        badge="💳 Langganan"
        title="Langganan & Tagihan"
        subtitle="Biaya langganan bulanan NOKA - flat murah ala UMKM, mencakup 5 transaksi selesai pertama tiap bulan."
      />

      {!langganan ? (
        <Card className="mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tokomu belum punya langganan aktif. Hubungi admin NOKA lewat WhatsApp untuk mengaktifkan langganan pertamamu.
          </p>
        </Card>
      ) : (
        <>
          {akanHabis && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-2xl p-4 mb-4 flex items-start gap-3">
              <span className="text-xl">⏰</span>
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  Langganan akan habis {sisaHari <= 0 ? 'hari ini' : `dalam ${sisaHari} hari`}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                  Segera hubungi admin NOKA lewat WhatsApp untuk perpanjang, supaya tokomu tetap tampil ke pembeli.
                </p>
              </div>
            </div>
          )}
          {langganan.status === 'kadaluarsa' && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-2xl p-4 mb-4">
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">❌ Langganan sudah kadaluarsa</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">Hubungi admin NOKA lewat WhatsApp untuk mengaktifkan kembali.</p>
            </div>
          )}

          <Card className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm">Status langganan</h2>
              <Badge color={langganan.status === 'aktif' ? 'green' : 'red'}>{langganan.status === 'aktif' ? 'Aktif' : 'Kadaluarsa'}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">Mulai</p>
                <p className="font-medium">{formatTanggal(langganan.mulai_tanggal)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">Berakhir</p>
                <p className="font-medium">{formatTanggal(langganan.berakhir_tanggal)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">Biaya bulanan</p>
                <p className="font-medium">{formatRupiah(langganan.harga_bulanan)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">Sisa hari</p>
                <p className="font-medium">{Math.max(0, sisaHari ?? 0)} hari</p>
              </div>
            </div>
          </Card>
        </>
      )}

      <Card className="mb-6 bg-gray-50 dark:bg-gray-800/50">
        <h2 className="font-semibold text-sm mb-2">📋 Skema biaya</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Rp5.000/bulan sudah mencakup 5 transaksi <em>selesai</em> pertama. Transaksi ke-6 dan seterusnya kena tambahan Rp500/transaksi.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 dark:text-gray-500 text-left">
                <th className="pb-1 pr-3">Transaksi</th>
                <th className="pb-1 pr-3">Langganan</th>
                <th className="pb-1 pr-3">Tambahan</th>
                <th className="pb-1">Total</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 dark:text-gray-300">
              {[[3, 0], [5, 0], [10, 5], [20, 15], [50, 45], [100, 95]].map(([trx, kelebihan]) => (
                <tr key={trx} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="py-1.5 pr-3">{trx}</td>
                  <td className="py-1.5 pr-3">Rp5.000</td>
                  <td className="py-1.5 pr-3">{kelebihan === 0 ? 'Rp0' : `${kelebihan} × Rp500`}</td>
                  <td className="py-1.5 font-semibold">{formatRupiah(5000 + kelebihan * 500)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <h2 className="font-semibold mb-3">Histori tagihan</h2>
      {!tagihan || tagihan.length === 0 ? (
        <EmptyState icon="🧾" title="Belum ada tagihan" description="Tagihan bulanan akan muncul di sini setiap awal bulan berjalan." />
      ) : (
        <div className="space-y-2">
          {tagihan.map((t) => (
            <Card key={t.id}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-sm font-semibold">{formatPeriode(t.periode)}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {t.jumlah_transaksi} transaksi · jatuh tempo {formatTanggal(t.jatuh_tempo)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-brand-600">{formatRupiah(t.total)}</p>
                  <Badge color={WARNA_STATUS_BAYAR[t.status_bayar]}>{LABEL_STATUS_BAYAR[t.status_bayar]}</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
