import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'

const PUSAT_DEFAULT = [-0.5021, 117.1536] // default Samarinda, sesuaikan ke kecamatan kamu

function KlikUntukPilih({ onPilih }) {
  useMapEvents({
    click(e) {
      onPilih(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

// Geser peta otomatis ke titik yang baru diketik manual di input lat/lng
function GeserKeTitik({ lat, lng }) {
  const map = useMap()
  const pernahDiklik = useRef(false)

  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], map.getZoom() < 14 ? 15 : map.getZoom())
    }
  }, [lat, lng])

  return null
}

// Pilih lokasi dengan 2 cara: ketik langsung Latitude/Longitude (misal hasil
// copy-paste dari Google Maps), ATAU klik di peta (map yang sama, Leaflet +
// OpenStreetMap). Dua-duanya saling sinkron.
export default function LocationPicker({ lat, lng, onChange }) {
  const posisi = lat && lng ? [lat, lng] : null

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Latitude</label>
          <input
            type="number"
            step="any"
            value={lat ?? ''}
            onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null, lng)}
            placeholder="Contoh: -0.502106"
            className="input-style"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Longitude</label>
          <input
            type="number"
            step="any"
            value={lng ?? ''}
            onChange={(e) => onChange(lat, e.target.value ? parseFloat(e.target.value) : null)}
            placeholder="Contoh: 117.153709"
            className="input-style"
          />
        </div>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
        Tips: buka Google Maps di HP/laptop → tekan lama titik lokasimu → copy koordinat yang muncul (contoh "-0.502106, 117.153709") →
        tempel angka pertama ke Latitude, angka kedua ke Longitude. Atau klik langsung di peta di bawah.
      </p>

      <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700" style={{ height: 220 }}>
        <MapContainer center={posisi || PUSAT_DEFAULT} zoom={posisi ? 15 : 12} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <KlikUntukPilih onPilih={onChange} />
          <GeserKeTitik lat={lat} lng={lng} />
          {posisi && <Marker position={posisi} />}
        </MapContainer>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
        {posisi ? `Titik dipilih: ${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}` : 'Belum ada titik dipilih.'}
      </p>
    </div>
  )
}
