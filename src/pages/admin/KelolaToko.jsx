import { useEffect, useRef, useState } from 'react'
import { api } from '../../lib/apiClient'
import { uploadFoto } from '../../lib/storage'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../components/ConfirmDialog'
import SafeImage from '../../components/SafeImage'
import PageHeader from '../../components/PageHeader'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Input from '../../components/Input'
import Badge from '../../components/Badge'
import Pagination from '../../components/Pagination'
import EmptyState from '../../components/EmptyState'
import Spinner from '../../components/Spinner'
import SearchableSelect from '../../components/SearchableSelect'
import LocationPicker from '../../components/LocationPicker'

const PER_HALAMAN = 6

const STATUS_WARNA = { pending: 'amber', approved: 'green', rejected: 'red' }
const STATUS_LABEL = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' }

const FORM_KOSONG = {
  nama_toko: '', kategori_toko_id: '', no_whatsapp: '', deskripsi: '', alamat: '',
  jam_buka: '', jam_tutup: '',
  lokasi_lat: null, lokasi_lng: null,
}

export default function KelolaToko() {
  const { showToast } = useToast()
  const confirmAsync = useConfirm()

  const [toko, setToko] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [kategoriToko, setKategoriToko] = useState([])
  const [loading, setLoading] = useState(true)

  const [cari, setCari] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)

  const [form, setForm] = useState(FORM_KOSONG)
  const [fotoBanner, setFotoBanner] = useState(null)
  const [previewFotoBanner, setPreviewFotoBanner] = useState(null)
  const [menyimpan, setMenyimpan] = useState(false)

  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [editFotoBanner, setEditFotoBanner] = useState(null)
  const [previewEditFotoBanner, setPreviewEditFotoBanner] = useState(null)
  const requestId = useRef(0)

  // Dropdown kategori tetap butuh daftar penuh (bukan "list yang di-browse").
  useEffect(() => {
    api.get('/kategori-toko').then((k) => setKategoriToko(k.data || [])).catch(() => {})
  }, [])

  async function muatToko(pageNum) {
    const params = new URLSearchParams({ per_page: String(PER_HALAMAN), page: String(pageNum) })
    if (cari) params.set('q', cari)
    if (filterStatus) params.set('status_verifikasi', filterStatus)
    const t = await api.get(`/admin/toko?${params.toString()}`)
    setToko(t.data?.data || [])
    setTotalPages(Math.max(1, t.data?.last_page || 1))
  }

  useEffect(() => {
    const id = requestId.current + 1
    requestId.current = id
    setLoading(true)

    const timer = setTimeout(async () => {
      try {
        await muatToko(page)
      } catch (err) {
        if (requestId.current === id) showToast(err.message, 'error')
      } finally {
        if (requestId.current === id) setLoading(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [cari, filterStatus, page])

  function pilihFotoBanner(file) {
    if (previewFotoBanner) URL.revokeObjectURL(previewFotoBanner)
    setFotoBanner(file)
    setPreviewFotoBanner(file ? URL.createObjectURL(file) : null)
  }

  async function tambah(e) {
    e.preventDefault()
    if (!form.nama_toko || !form.no_whatsapp) {
      return showToast('Nama toko dan WhatsApp wajib diisi', 'error')
    }

    setMenyimpan(true)
    try {
      const banner = fotoBanner ? await uploadFoto(fotoBanner, 'toko/banner') : null
      await api.post('/admin/toko', { ...form, foto_banner: banner })
      setForm(FORM_KOSONG)
      pilihFotoBanner(null)
      showToast('Toko berhasil ditambahkan')
      setPage(1)
      muatToko(1)
    } catch (err) {
      showToast('Gagal tambah toko: ' + err.message, 'error')
    } finally {
      setMenyimpan(false)
    }
  }

  function mulaiEdit(t) {
    setEditId(t.id)
    setEditForm({
      nama_toko: t.nama_toko, kategori_toko_id: t.kategori_toko_id || '', no_whatsapp: t.no_whatsapp,
      alamat: t.alamat || '', deskripsi: t.deskripsi || '', foto_banner: t.foto_banner || '',
      jam_buka: (t.jam_buka || '').slice(0, 5), jam_tutup: (t.jam_tutup || '').slice(0, 5),
      lokasi_lat: t.lokasi_lat, lokasi_lng: t.lokasi_lng,
    })
    setEditFotoBanner(null)
    setPreviewEditFotoBanner(null)
  }

  function pilihFotoEditBanner(file) {
    if (previewEditFotoBanner) URL.revokeObjectURL(previewEditFotoBanner)
    setEditFotoBanner(file)
    setPreviewEditFotoBanner(file ? URL.createObjectURL(file) : null)
  }

  async function simpanEdit(id) {
    try {
      let banner
      if (editFotoBanner) banner = await uploadFoto(editFotoBanner, 'toko/banner')

      await api.put(`/admin/toko/${id}`, { ...editForm, ...(banner ? { foto_banner: banner } : {}) })
      setEditId(null)
      pilihFotoEditBanner(null)
      showToast('Perubahan disimpan')
      muatToko(page)
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  async function hapus(id, nama) {
    const yakin = await confirmAsync(`Hapus toko "${nama}"?`)
    if (!yakin) return
    try {
      await api.delete(`/admin/toko/${id}`)
      showToast('Toko berhasil dihapus')
      muatToko(page)
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  async function ubahStatus(id, status) {
    try {
      await api.patch(`/admin/toko/${id}/verifikasi`, { status_verifikasi: status })
      showToast(status === 'approved' ? 'Toko disetujui' : 'Toko ditolak')
      muatToko(page)
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  async function toggleAktif(t) {
    try {
      await api.patch(`/admin/toko/${t.id}/status-aktif`, { status_aktif: !t.status_aktif })
      showToast(t.status_aktif ? 'Toko dinonaktifkan' : 'Toko diaktifkan')
      muatToko(page)
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const halamanIni = toko

  return (
    <div>
      <PageHeader badge="🏪 Toko" title="Kelola toko" subtitle="Kelola data toko mitra, kategori, foto, dan status verifikasi." />

      {/* TAMBAH TOKO */}
      <Card className="mb-6">
        <h2 className="font-semibold mb-3 text-sm">Tambah toko baru</h2>
        <form onSubmit={tambah} className="grid md:grid-cols-2 gap-3">
          <Input label="Nama toko" value={form.nama_toko} onChange={(e) => setForm((f) => ({ ...f, nama_toko: e.target.value }))} />
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Kategori toko</label>
            <SearchableSelect value={form.kategori_toko_id} onChange={(v) => setForm((f) => ({ ...f, kategori_toko_id: v }))}
              placeholder="Pilih kategori" options={kategoriToko.map((k) => ({ value: k.id, label: k.nama }))} />
          </div>
          <Input label="Nomor WhatsApp" value={form.no_whatsapp} onChange={(e) => setForm((f) => ({ ...f, no_whatsapp: e.target.value }))} />
          <Input label="Alamat" value={form.alamat} onChange={(e) => setForm((f) => ({ ...f, alamat: e.target.value }))} />

          <div className="flex gap-3">
            <Input label="Jam buka (opsional)" type="time" className="flex-1" value={form.jam_buka} onChange={(e) => setForm((f) => ({ ...f, jam_buka: e.target.value }))} />
            <Input label="Jam tutup (opsional)" type="time" className="flex-1" value={form.jam_tutup} onChange={(e) => setForm((f) => ({ ...f, jam_tutup: e.target.value }))} />
          </div>

          <div className="md:col-span-2">
            <Input label="Deskripsi toko (opsional)" textarea rows={3} value={form.deskripsi} onChange={(e) => setForm((f) => ({ ...f, deskripsi: e.target.value }))} />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Foto cover</label>
            <div className="flex items-center gap-2">
              {previewFotoBanner && (
                <img src={previewFotoBanner} alt="Preview" className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-gray-200 dark:border-gray-700" />
              )}
              <input type="file" accept="image/*" onChange={(e) => pilihFotoBanner(e.target.files?.[0] || null)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 w-full" />
            </div>
          </div>

          <div className="md:col-span-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Lokasi di peta (opsional, bisa diisi mitra sendiri nanti juga)</p>
            <LocationPicker lat={form.lokasi_lat} lng={form.lokasi_lng} onChange={(lat, lng) => setForm((f) => ({ ...f, lokasi_lat: lat, lokasi_lng: lng }))} />
          </div>

          <Button type="submit" loading={menyimpan} className="md:col-span-2">
            {menyimpan ? 'Menyimpan...' : 'Tambah toko'}
          </Button>
        </form>
      </Card>

      {/* FILTER */}
      <div className="flex gap-2 flex-wrap mb-4">
        <Input value={cari} onChange={(e) => { setCari(e.target.value); setPage(1) }} placeholder="Cari nama toko..." className="flex-1 min-w-[200px]" />
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
          className="border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-400">
          <option value="">Semua status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? <Spinner /> : halamanIni.length === 0 ? (
        <EmptyState
          icon="🏪"
          title={cari || filterStatus ? 'Tidak ada toko yang cocok' : 'Belum ada toko'}
          description={cari || filterStatus ? 'Coba ubah kata kunci atau filter status.' : 'Tambahkan toko pertama lewat form di atas.'}
        />
      ) : (
        <div className="space-y-3">
          {halamanIni.map((t) => (
            <Card key={t.id}>
              <div className="flex gap-3">
                <SafeImage src={t.foto_banner} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />

                <div className="flex-1 min-w-0">
                  {editId === t.id ? (
                    <div className="space-y-2">
                      <Input value={editForm.nama_toko} onChange={(e) => setEditForm((f) => ({ ...f, nama_toko: e.target.value }))} />
                      <SearchableSelect value={editForm.kategori_toko_id} onChange={(v) => setEditForm((f) => ({ ...f, kategori_toko_id: v }))}
                        placeholder="Pilih kategori" options={kategoriToko.map((k) => ({ value: k.id, label: k.nama }))} />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Lokasi di peta</p>
                        <LocationPicker lat={editForm.lokasi_lat} lng={editForm.lokasi_lng}
                          onChange={(lat, lng) => setEditForm((f) => ({ ...f, lokasi_lat: lat, lokasi_lng: lng }))} />
                      </div>
                      <Input value={editForm.no_whatsapp} onChange={(e) => setEditForm((f) => ({ ...f, no_whatsapp: e.target.value }))} placeholder="WhatsApp" />
                      <Input value={editForm.alamat} onChange={(e) => setEditForm((f) => ({ ...f, alamat: e.target.value }))} placeholder="Alamat" />
                      <div className="flex gap-2">
                        <Input type="time" className="flex-1" value={editForm.jam_buka} onChange={(e) => setEditForm((f) => ({ ...f, jam_buka: e.target.value }))} placeholder="Jam buka" />
                        <Input type="time" className="flex-1" value={editForm.jam_tutup} onChange={(e) => setEditForm((f) => ({ ...f, jam_tutup: e.target.value }))} placeholder="Jam tutup" />
                      </div>
                      <Input textarea rows={2} value={editForm.deskripsi} onChange={(e) => setEditForm((f) => ({ ...f, deskripsi: e.target.value }))} placeholder="Deskripsi toko (opsional)" />
                      <div className="flex items-center gap-2">
                        <SafeImage
                          src={previewEditFotoBanner || editForm.foto_banner}
                          alt="Foto cover"
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gray-200 dark:border-gray-700"
                        />
                        <input type="file" accept="image/*" onChange={(e) => pilihFotoEditBanner(e.target.files?.[0] || null)} className="text-xs flex-1" />
                      </div>

                      <div className="flex gap-2 pt-1">
                        <Button size="sm" onClick={() => simpanEdit(t.id)}>Simpan</Button>
                        <button onClick={() => { setEditId(null); pilihFotoEditBanner(null) }} className="text-xs text-gray-500 dark:text-gray-400">Batal</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{t.nama_toko}</p>
                        <Badge color={STATUS_WARNA[t.status_verifikasi]}>{STATUS_LABEL[t.status_verifikasi]}</Badge>
                        {!t.user_id && <Badge color="amber">Belum diklaim</Badge>}
                        {!t.status_aktif && <Badge color="red">Nonaktif</Badge>}
                      </div>

                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Kategori: {kategoriToko.find((k) => k.id === t.kategori_toko_id)?.nama || '-'}<br />
                        {t.alamat || '-'}<br />
                        WA: {t.no_whatsapp || '-'}
                      </p>

                      <div className="flex gap-2 flex-wrap mt-3">
                        {t.status_verifikasi !== 'approved' && (
                          <Button size="sm" variant="success" onClick={() => ubahStatus(t.id, 'approved')}>Setujui</Button>
                        )}
                        {t.status_verifikasi !== 'rejected' && (
                          <Button size="sm" variant="danger" onClick={() => ubahStatus(t.id, 'rejected')}>Tolak</Button>
                        )}
                        <button onClick={() => toggleAktif(t)} className="text-xs text-gray-500 dark:text-gray-400 font-medium px-3 py-1.5">
                          {t.status_aktif ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                        <button onClick={() => mulaiEdit(t)} className="text-xs text-brand-600 font-medium px-3 py-1.5">Edit</button>
                        <button onClick={() => hapus(t.id, t.nama_toko)} className="text-xs text-red-500 font-medium px-3 py-1.5">Hapus</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  )
}
