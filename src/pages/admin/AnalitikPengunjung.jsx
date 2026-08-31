import { useEffect, useState } from 'react'
import { api } from '../../lib/apiClient'
import { useToast } from '../../context/ToastContext'
import PageHeader from '../../components/PageHeader'
import Card from '../../components/Card'
import Spinner from '../../components/Spinner'
import StatCard from '../../components/StatCard'
import StatistikHarianChart from '../../components/StatistikHarianChart'

const LABEL_PERANGKAT = { mobile: '📱 Mobile', desktop: '🖥️ Desktop', tablet: '📟 Tablet' }
const OPSI_PERIODE = [
  { value: 7, label: '7 hari terakhir' },
  { value: 30, label: '30 hari terakhir' },
  { value: 90, label: '90 hari terakhir' },
]

export default function AnalitikPengunjung() {
  const { showToast } = useToast()
  const [hari, setHari] = useState(30)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get(`/admin/analitik?hari=${hari}`)
      .then((res) => setData(res.data))
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false))
  }, [hari])

  const totalPerangkat = data?.perangkat?.reduce((s, p) => s + p.jumlah, 0) || 0

  return (
    <div>
      <PageHeader
        badge="📈 Analitik"
        title="Analitik Pengunjung"
        subtitle="Sejauh mana website NOKA diakses - total kunjungan, pengunjung unik, dan halaman paling ramai."
        action={
          <select
            value={hari}
            onChange={(e) => setHari(Number(e.target.value))}
            className="border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-400"
          >
            {OPSI_PERIODE.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        }
      />

      {loading && !data ? (
        <Spinner label="Memuat analitik..." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <StatCard label="Total kunjungan" value={data?.total_kunjungan?.toLocaleString('id-ID') ?? 0} icon="👁️" />
            <StatCard label="Pengunjung unik" value={data?.pengunjung_unik?.toLocaleString('id-ID') ?? 0} icon="🧑‍🤝‍🧑" />
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <Card>
              <StatistikHarianChart data={data?.trend_harian || []} dataKey="jumlah" label="Total Kunjungan" />
            </Card>
            <Card>
              <StatistikHarianChart data={data?.trend_harian || []} dataKey="unik" label="Pengunjung Unik" warna="#16a34a" />
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <h2 className="font-semibold text-sm mb-3">🔥 Halaman terpopuler</h2>
              {(!data?.halaman_populer || data.halaman_populer.length === 0) ? (
                <p className="text-sm text-gray-400 dark:text-gray-500">Belum ada data.</p>
              ) : (
                <ul className="space-y-2">
                  {data.halaman_populer.map((h, i) => (
                    <li key={h.halaman} className="flex items-center justify-between text-sm">
                      <span className="truncate flex-1 mr-2">
                        <span className="text-gray-400 dark:text-gray-500 mr-1.5">{i + 1}.</span>
                        {h.halaman}
                      </span>
                      <span className="font-semibold text-brand-600 flex-shrink-0">{h.jumlah.toLocaleString('id-ID')}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <h2 className="font-semibold text-sm mb-3">📱 Perangkat pengunjung</h2>
              {(!data?.perangkat || data.perangkat.length === 0) ? (
                <p className="text-sm text-gray-400 dark:text-gray-500">Belum ada data.</p>
              ) : (
                <ul className="space-y-2">
                  {data.perangkat.map((p) => {
                    const persen = totalPerangkat > 0 ? Math.round((p.jumlah / totalPerangkat) * 100) : 0
                    return (
                      <li key={p.perangkat || 'lainnya'}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>{LABEL_PERANGKAT[p.perangkat] || '❓ Lainnya'}</span>
                          <span className="font-semibold">{persen}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-500" style={{ width: `${persen}%` }} />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
