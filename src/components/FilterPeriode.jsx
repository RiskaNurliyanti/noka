import { useState } from 'react'

function bulanIni() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function hariIni() {
  return new Date().toISOString().slice(0, 10)
}
function seninMingguIni() {
  const d = new Date()
  const hari = d.getDay() || 7
  d.setDate(d.getDate() - (hari - 1))
  return d.toISOString().slice(0, 10)
}
// Konversi tanggal Senin (YYYY-MM-DD) -> value buat <input type="week"> (YYYY-Www)
function mondayToWeekInputValue(mondayStr) {
  const d = new Date(mondayStr + 'T00:00:00Z')
  const target = new Date(d.valueOf())
  const dayNr = (d.getUTCDay() + 6) % 7
  target.setUTCDate(target.getUTCDate() - dayNr + 3)
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4))
  const week = 1 + Math.round(((target - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7)
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}
// Kebalikannya: value <input type="week"> -> tanggal Senin awal minggu itu
function weekInputValueToMonday(weekStr) {
  if (!weekStr) return seninMingguIni()
  const [yearStr, weekPart] = weekStr.split('-W')
  const year = Number(yearStr)
  const week = Number(weekPart)
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const jan4Day = jan4.getUTCDay() || 7
  const week1Monday = new Date(jan4)
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1)
  const monday = new Date(week1Monday)
  monday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7)
  return monday.toISOString().slice(0, 10)
}

const OPSI = [
  { value: 'bulan', label: 'Per bulan' },
  { value: 'minggu', label: 'Per minggu' },
  { value: 'hari', label: 'Per hari' },
]

const KELAS_INPUT = 'border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-400'

export default function FilterPeriode({ onChange, className = '' }) {
  const [granularitas, setGranularitas] = useState('bulan')
  const [bulan, setBulan] = useState(bulanIni())
  const [minggu, setMinggu] = useState(seninMingguIni())
  const [hari, setHari] = useState(hariIni())

  function gantiGranularitas(g) {
    setGranularitas(g)
    if (g === 'bulan') onChange({ bulan })
    else if (g === 'minggu') onChange({ minggu })
    else onChange({ hari })
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <select value={granularitas} onChange={(e) => gantiGranularitas(e.target.value)} className={KELAS_INPUT}>
        {OPSI.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {granularitas === 'bulan' && (
        <input
          type="month"
          value={bulan}
          onChange={(e) => { setBulan(e.target.value); onChange({ bulan: e.target.value }) }}
          className={KELAS_INPUT}
        />
      )}
      {granularitas === 'minggu' && (
        <input
          type="week"
          value={mondayToWeekInputValue(minggu)}
          onChange={(e) => { const m = weekInputValueToMonday(e.target.value); setMinggu(m); onChange({ minggu: m }) }}
          className={KELAS_INPUT}
        />
      )}
      {granularitas === 'hari' && (
        <input
          type="date"
          value={hari}
          onChange={(e) => { setHari(e.target.value); onChange({ hari: e.target.value }) }}
          className={KELAS_INPUT}
        />
      )}
    </div>
  )
}
