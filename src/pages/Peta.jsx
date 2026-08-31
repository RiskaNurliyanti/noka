// Halaman peta lokasi toko-toko.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import { api } from '../lib/apiClient'
import { hitungJarakKm } from '../lib/geo'
import { useToast } from '../context/ToastContext'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import SafeImage from '../components/SafeImage'
import PageHeader from '../components/PageHeader'

const PUSAT_DEFAULT = [-0.5021, 117.1536]
const RADIUS_KM = 20

const ikonSaya = new L.DivIcon({
  html: '<div style="background:#1d5c99;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>',
  className: '',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

function GeserKeLokasi({ posisi }) {
  const map = useMap()
  useEffect(() => {
    if (posisi) map.setView(posisi, 13)
  }, [posisi])
  return null
}

export default function Peta() {
  const { showToast } = useToast()
  const [toko, setToko] = useState([])
  const [loading, setLoading] = useState(true)
  const [lokasiSaya, setLokasiSaya] = useState(null)
  const [mencari, setMencari] = useState(false)

  useEffect(() => {
    async function muat() {
      const tokoRes = await api.get('/toko?punya_lokasi=1&per_page=200')
      const daftarToko = tokoRes.data?.data || []

      const idToko = daftarToko.map((t) => t.id)
      if (idToko.length > 0) {
        const produkRes = await api.get(`/produk?toko_ids=${idToko.join(',')}&per_page=500`)
        const produkData = produkRes.data?.data || []

        const produkPerToko = {}
        produkData.forEach((p) => {
          if (!produkPerToko[p.toko_id]) produkPerToko[p.toko_id] = p
        })
        daftarToko.forEach((t) => { t.produk_unggulan = produkPerToko[t.id] || null })
      }

      setToko(daftarToko)
      setLoading(false)
    }
    muat()
  }, [])

  function cariTokoTerdekat() {
    if (!navigator.geolocation) {
      showToast('Browser kamu nggak mendukung deteksi lokasi.', 'error')
      return
    }
    setMencari(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLokasiSaya([pos.coords.latitude, pos.coords.longitude])
        setMencari(false)
        showToast('Lokasi ketemu! Toko terdekat udah diurutin.')
      },
      () => {
        setMencari(false)
        showToast('Nggak bisa ambil lokasi kamu - pastikan izin lokasi diaktifkan di browser.', 'error')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const tokoDenganJarak = lokasiSaya
    ? toko
        .map((t) => ({ ...t, jarak: hitungJarakKm(lokasiSaya[0], lokasiSaya[1], t.lokasi_lat, t.lokasi_lng) }))
        .filter((t) => t.jarak <= RADIUS_KM)
        .sort((a, b) => a.jarak - b.jarak)
    : null

  const tokoDitampilkan = tokoDenganJarak || toko

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">

      {/* HEADER */}
      <PageHeader
        badge="🗺️ Peta Lokasi"
        title="Temukan toko di sekitarmu"
        subtitle={
          lokasiSaya
            ? `Menampilkan toko dalam radius ${RADIUS_KM}km dari lokasimu`
            : 'Jelajahi semua toko, atau cari yang paling dekat denganmu'
        }
        action={
          <button
            onClick={cariTokoTerdekat}
            disabled={mencari}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-full px-5 py-3 text-sm shadow-sm hover:shadow-md transition disabled:opacity-60 whitespace-nowrap"
          >
            {mencari ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Mencari lokasimu...
              </>
            ) : (
              <>📍 {lokasiSaya ? 'Cari ulang' : `Cari toko terdekat (${RADIUS_KM}km)`}</>
            )}
          </button>
        }
      />

      {/* RINGKASAN */}
      {tokoDenganJarak && (
        <div className="flex items-center gap-2 mb-4 text-sm">
          <span className="bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400 font-semibold rounded-full px-3 py-1">
            {tokoDenganJarak.length} toko ditemukan
          </span>
          <span className="text-gray-400 dark:text-gray-500">dalam radius {RADIUS_KM}km</span>
        </div>
      )}

      {loading ? (
        <Spinner label="Memuat peta..." />
      ) : (
        <div className="grid md:grid-cols-3 gap-4">

          {/* PETA */}
          <div className="md:col-span-2 rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm" style={{ height: 500 }}>
            <MapContainer center={PUSAT_DEFAULT} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {lokasiSaya && (
                <>
                  <GeserKeLokasi posisi={lokasiSaya} />
                  <Marker position={lokasiSaya} icon={ikonSaya}>
                    <Popup>📍 Lokasi kamu</Popup>
                  </Marker>
                  <Circle center={lokasiSaya} radius={RADIUS_KM * 1000} pathOptions={{ color: '#1d5c99', weight: 1.5, fillOpacity: 0.06 }} />
                </>
              )}

              {tokoDitampilkan.map((t) => (
                <Marker key={t.id} position={[t.lokasi_lat, t.lokasi_lng]}>
                  <Popup minWidth={210}>
                    <div style={{ minWidth: 190 }}>
                      {t.foto_banner && (
                        <SafeImage src={t.foto_banner} alt={t.nama_toko} className="w-full h-24 object-cover rounded-lg mb-2" />
                      )}
                      <p className="font-semibold text-sm">{t.nama_toko}</p>
                      {t.kategoriToko?.nama && (
                        <span className="inline-block text-xs bg-brand-50 text-brand-600 rounded-full px-2 py-0.5 mt-1">
                          {t.kategoriToko.nama}
                        </span>
                      )}
                      {t.alamat && <p className="text-xs text-gray-500 mt-1.5">{t.alamat}</p>}
                      {typeof t.jarak === 'number' && (
                        <p className="text-xs font-semibold text-brand-600 mt-1">📍 {t.jarak.toFixed(1)} km dari kamu</p>
                      )}
                      {t.produk_unggulan && (
                        <p className="text-xs text-gray-600 mt-1">
                          🔥 {t.produk_unggulan.nama} - Rp{Number(t.produk_unggulan.harga).toLocaleString('id-ID')}
                        </p>
                      )}
                      <Link to={`/toko/${t.id}`} className="block mt-2 text-xs font-semibold text-white bg-brand-500 rounded-lg px-3 py-1.5 text-center">
                        Lihat toko →
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* LIST SAMPING */}
          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {!lokasiSaya ? (
              <div className="bg-white dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-6 text-center">
                <p className="text-3xl mb-2">📍</p>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Belum tau toko terdekat?</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Klik tombol "Cari toko terdekat" buat lihat yang paling dekat denganmu.</p>
              </div>
            ) : tokoDenganJarak.length === 0 ? (
              <EmptyState icon="🔍" title="Nggak ada toko di dekatmu" description={`Belum ada toko dalam radius ${RADIUS_KM}km dari lokasimu.`} />
            ) : (
              tokoDenganJarak.map((t, i) => (
                <Link
                  key={t.id}
                  to={`/toko/${t.id}`}
                  className="flex gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-3 hover:border-brand-400 hover:shadow-md transition"
                >
                  <div className="w-14 h-14 rounded-xl bg-brand-50 dark:bg-gray-800 overflow-hidden flex-shrink-0 relative">
                    <SafeImage src={t.foto_banner} className="w-full h-full object-cover" alt={t.nama_toko} />
                    <span className="absolute top-0.5 left-0.5 bg-brand-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {i + 1}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{t.nama_toko}</p>
                    {t.kategoriToko?.nama && <p className="text-xs text-gray-400 dark:text-gray-500">{t.kategoriToko.nama}</p>}
                    <span className="inline-block text-xs font-semibold text-brand-600 bg-brand-50 dark:bg-brand-950/40 rounded-full px-2 py-0.5 mt-1">
                      {t.jarak.toFixed(1)} km
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
