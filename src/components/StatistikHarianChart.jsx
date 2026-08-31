<<<<<<< HEAD
// Grafik statistik harian, dipakai halaman toko & kurir.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useTheme } from '../context/ThemeContext'

// Diagram batang 14 hari terakhir - dipakai untuk statistik pesanan
// (penjual) dan pengantaran (kurir). Data selalu dari backend (data aktual,
// bukan dummy) - lihat Mitra\TokoController::statsHarian() dan
// Mitra\KurirController::statsHarian().
export default function StatistikHarianChart({ data, dataKey, label, warna }) {
  const { dark } = useTheme()

  const warnaGrid = dark ? '#374151' : '#e5e7eb'
  const warnaTeks = dark ? '#9ca3af' : '#6b7280'
  const warnaBar = warna || '#1d5c99' // brand-500 NOKA

  const dataFormatted = data.map((d) => ({
    ...d,
    labelTanggal: new Date(d.tanggal + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
  }))

  const totalPeriode = data.reduce((sum, d) => sum + (d[dataKey] || 0), 0)

  if (totalPeriode === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
        Belum ada data {label.toLowerCase()} dalam 14 hari terakhir.
      </div>
    )
  }

  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{label} - 14 hari terakhir</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={dataFormatted} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={warnaGrid} vertical={false} />
          <XAxis
            dataKey="labelTanggal"
            tick={{ fontSize: 11, fill: warnaTeks }}
            axisLine={{ stroke: warnaGrid }}
            tickLine={false}
            interval={1}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: warnaTeks }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip
            cursor={{ fill: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
            contentStyle={{
              backgroundColor: dark ? '#1f2937' : '#ffffff',
              border: `1px solid ${warnaGrid}`,
              borderRadius: '0.75rem',
              fontSize: '12px',
            }}
            labelStyle={{ color: dark ? '#f3f4f6' : '#111827', fontWeight: 600 }}
            formatter={(value) => [value, label]}
          />
          <Bar dataKey={dataKey} fill={warnaBar} radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
