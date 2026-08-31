// Halaman kirim laporan bug/pelanggaran ke admin.
import { useEffect, useState } from 'react'
import { api } from '../lib/apiClient'
import { useToast } from '../context/ToastContext'
import { uploadFoto } from '../lib/storage'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Badge from '../components/Badge'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import SafeImage from '../components/SafeImage'

const LABEL_JENIS = { bug: '🐞 Bug aplikasi', pelanggaran: '⚠️ Pelanggaran' }
const LABEL_STATUS = { pending: 'Menunggu', diproses: 'Diproses', selesai: 'Selesai', ditolak: 'Ditolak' }
const WARNA_STATUS = { pending: 'gray', diproses: 'brand', selesai: 'green', ditolak: 'red' }

export default function LaporMasalah() {
  const { showToast } = useToast()
  const [riwayat, setRiwayat] = useState([])
  const [loading, setLoading] = useState(true)

  const [jenis, setJenis] = useState('bug')
  const [judul, setJudul] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [lampiran, setLampiran] = useState(null)
  const [previewLampiran, setPreviewLampiran] = useState(null)
  const [mengirim, setMengirim] = useState(false)

  async function muat() {
    setLoading(true)
    try {
      const res = await api.get('/laporan-saya?per_page=20')
      setRiwayat(res.data?.data || [])
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { muat() }, [])

  function pilihLampiran(file) {
    if (previewLampiran) URL.revokeObjectURL(previewLampiran)
    setLampiran(file)
    setPreviewLampiran(file ? URL.createObjectURL(file) : null)
  }

  async function kirim(e) {
    e.preventDefault()
    if (!judul.trim() || !deskripsi.trim()) {
      showToast('Judul dan deskripsi wajib diisi', 'error')
      return
    }

    setMengirim(true)
    try {
      let lampiranUrl = null
      if (lampiran) lampiranUrl = await uploadFoto(lampiran, 'laporan')

      await api.post('/laporan', { jenis, judul, deskripsi, lampiran_url: lampiranUrl })
      showToast('Laporan terkirim, terima kasih sudah membantu NOKA jadi lebih baik 🙏')
      setJudul('')
      setDeskripsi('')
      pilihLampiran(null)
      muat()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setMengirim(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        badge="📮 Aduan"
        title="Lapor masalah"
        subtitle="Nemu bug di aplikasi NOKA, atau ada toko/kurir/pembeli yang berlaku curang di luar sistem? Laporkan di sini, laporan langsung masuk ke tim admin NOKA."
      />

      <Card className="mb-6">
        <form onSubmit={kirim} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Jenis laporan</label>
            <div className="flex gap-2">
              {Object.entries(LABEL_JENIS).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setJenis(key)}
                  className={`flex-1 text-sm font-medium rounded-xl px-3 py-2.5 border transition ${
                    jenis === key
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <Input label="Judul" value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Ringkas, misal: Tombol checkout tidak bisa diklik" maxLength={150} />

          <Input
            label="Deskripsi"
            textarea
            rows={5}
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            placeholder="Ceritakan detailnya - kapan terjadi, di halaman mana, atau siapa yang terlibat kalau ini laporan pelanggaran."
            maxLength={3000}
          />

          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Lampiran / screenshot (opsional)</label>
            <div className="flex items-center gap-3">
              {previewLampiran && (
                <SafeImage src={previewLampiran} alt="Lampiran" className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-gray-200 dark:border-gray-700" />
              )}
              <input type="file" accept="image/*" onChange={(e) => pilihLampiran(e.target.files?.[0] || null)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 flex-1" />
            </div>
          </div>

          <Button type="submit" full loading={mengirim}>
            {mengirim ? 'Mengirim...' : 'Kirim laporan'}
          </Button>
        </form>
      </Card>

      <h2 className="font-semibold mb-3">Riwayat laporanmu</h2>
      {loading ? (
        <Spinner label="Memuat riwayat laporan..." />
      ) : riwayat.length === 0 ? (
        <EmptyState icon="📮" title="Belum pernah lapor" description="Laporan yang kamu kirim akan muncul di sini." />
      ) : (
        <div className="space-y-2">
          {riwayat.map((l) => (
            <Card key={l.id}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{LABEL_JENIS[l.jenis]} — {l.judul}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-pre-line">{l.deskripsi}</p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                    {new Date(l.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  {l.catatan_admin && (
                    <p className="text-xs bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 rounded-lg px-3 py-2 mt-2">
                      💬 Balasan admin: {l.catatan_admin}
                    </p>
                  )}
                </div>
                <Badge color={WARNA_STATUS[l.status]}>{LABEL_STATUS[l.status]}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
