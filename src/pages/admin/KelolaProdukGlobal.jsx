import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/apiClient'
import { uploadFoto } from '../../lib/storage'
import { useToast } from '../../context/ToastContext'
import SafeImage from '../../components/SafeImage'
import { useConfirm } from '../../components/ConfirmDialog'
import PageHeader from '../../components/PageHeader'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Input from '../../components/Input'
import Badge from '../../components/Badge'
import Pagination from '../../components/Pagination'
import EmptyState from '../../components/EmptyState'
import Spinner from '../../components/Spinner'
import SearchableSelect from '../../components/SearchableSelect'

const PER_HALAMAN = 6
const FORM_KOSONG = { toko_id: '', nama: '', harga: '', harga_diskon: '', kategori_id: '' }

export default function KelolaProdukGlobal() {
  const { showToast } = useToast()
  const confirmAsync = useConfirm()

  const [produk, setProduk] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [toko, setToko] = useState([])
  const [kategori, setKategori] = useState([])
  const [loading, setLoading] = useState(true)
  const [cari, setCari] = useState('')
  const [page, setPage] = useState(1)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState(FORM_KOSONG)
  const [foto, setFoto] = useState(null)
  const [previewFoto, setPreviewFoto] = useState(null)
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [editFotoBaru, setEditFotoBaru] = useState(null)
  const [previewEditFoto, setPreviewEditFoto] = useState(null)
  const [uploadingEdit, setUploadingEdit] = useState(false)
  const requestId = useRef(0)

  // Dropdown toko & kategori buat form tambah produk - ini memang perlu
  // daftar lengkap (bukan "list yang di-browse"), jadi tetap fetch sekali
  // di awal, terpisah dari daftar produk yang sekarang dipaginasi server.
  async function muatOpsiForm() {
    const [t, k] = await Promise.all([
      api.get('/admin/toko?per_page=500'),
      api.get('/kategori'),
    ])
    setToko((t.data?.data || []).map((x) => ({ id: x.id, nama_toko: x.nama_toko })))
    setKategori(k.data || [])
  }
  useEffect(() => { muatOpsiForm() }, [])

  async function muatProduk(pageNum) {
    const params = new URLSearchParams({ per_page: String(PER_HALAMAN), page: String(pageNum) })
    if (cari) params.set('q', cari)
    const res = await api.get(`/admin/produk?${params.toString()}`)
    setProduk(res.data?.data || [])
    setTotalPages(Math.max(1, res.data?.last_page || 1))
  }

  useEffect(() => {
    const id = requestId.current + 1
    requestId.current = id
    setLoading(true)

    const timer = setTimeout(async () => {
      await muatProduk(page)
      if (requestId.current === id) setLoading(false)
    }, 400)

    return () => clearTimeout(timer)
  }, [cari, page])

  function pilihFoto(file) {
    if (previewFoto) URL.revokeObjectURL(previewFoto)
    setFoto(file)
    setPreviewFoto(file ? URL.createObjectURL(file) : null)
  }

  async function tambah(e) {
    e.preventDefault()
    if (!form.toko_id) return showToast('Pilih toko dulu', 'error')
    if (!form.nama || !form.harga) return showToast('Nama & harga wajib diisi', 'error')
    setUploading(true)
    try {
      const fotoUrl = foto ? await uploadFoto(foto, 'produk') : null
      await api.post('/admin/produk', {
        toko_id: form.toko_id,
        nama: form.nama,
        harga: Number(form.harga),
        harga_diskon: form.harga_diskon ? Number(form.harga_diskon) : null,
        kategori_id: form.kategori_id || null,
        foto: fotoUrl,
      })
      setForm({ ...FORM_KOSONG, toko_id: form.toko_id })
      pilihFoto(null)
      showToast('Produk berhasil ditambahkan')
      setPage(1)
      muatProduk(1)
    } catch (err) {
      showToast('Gagal menambah produk: ' + err.message, 'error')
    } finally {
      setUploading(false)
    }
  }

  function mulaiEdit(p) {
    setEditId(p.id)
    setEditForm({ nama: p.nama, harga: p.harga, harga_diskon: p.harga_diskon || '', foto: p.foto || '' })
    setEditFotoBaru(null)
    setPreviewEditFoto(null)
  }

  function pilihFotoEdit(file) {
    if (previewEditFoto) URL.revokeObjectURL(previewEditFoto)
    setEditFotoBaru(file)
    setPreviewEditFoto(file ? URL.createObjectURL(file) : null)
  }

  async function simpanEdit(id) {
    setUploadingEdit(true)
    try {
      const fotoBaruUrl = editFotoBaru ? await uploadFoto(editFotoBaru, 'produk') : null
      await api.put(`/admin/produk/${id}`, {
        nama: editForm.nama,
        harga: Number(editForm.harga),
        harga_diskon: editForm.harga_diskon ? Number(editForm.harga_diskon) : null,
        ...(fotoBaruUrl ? { foto: fotoBaruUrl } : {}),
      })
      setEditId(null)
      pilihFotoEdit(null)
      showToast('Produk diperbarui')
      muatProduk(page)
    } catch (err) {
      showToast('Gagal menyimpan: ' + err.message, 'error')
    } finally {
      setUploadingEdit(false)
    }
  }

  async function toggleAktif(p) {
    await api.put(`/admin/produk/${p.id}`, { status_aktif: !p.status_aktif })
    muatProduk(page)
  }

  async function hapus(id, nama) {
    const yakin = await confirmAsync(`Hapus produk "${nama}" permanen?`)
    if (!yakin) return
    await api.delete(`/admin/produk/${id}`)
    showToast('Produk dihapus')
    muatProduk(page)
  }

  const halamanIni = produk

  return (
    <div>
      <PageHeader
        badge="📦 Produk"
        title="Kelola produk"
        subtitle="Semua produk dari seluruh toko di NOKA. Admin & super admin bisa menambahkan produk buat toko mana pun - berguna terutama buat toko yang belum diklaim pemiliknya."
      />

      {toko.length === 0 ? (
        <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 mb-6">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Belum ada toko sama sekali. Tambahkan toko dulu lewat <Link to="/admin/toko" className="underline font-medium">Kelola Toko</Link> sebelum bisa nambah produk.
          </p>
        </Card>
      ) : (
        <Card className="mb-6">
          <h2 className="font-semibold mb-3 text-sm">Tambah produk baru</h2>
          <form onSubmit={tambah} className="grid md:grid-cols-3 gap-3">
            <div className="md:col-span-3">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Toko</label>
              <SearchableSelect value={form.toko_id} onChange={(v) => setForm((f) => ({ ...f, toko_id: v }))}
                placeholder="Pilih toko *" options={toko.map((t) => ({ value: t.id, label: t.nama_toko }))} />
            </div>
            <Input placeholder="Nama produk" value={form.nama} onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))} />
            <Input placeholder="Harga" type="number" value={form.harga} onChange={(e) => setForm((f) => ({ ...f, harga: e.target.value }))} />
            <Input placeholder="Harga diskon (opsional)" type="number" value={form.harga_diskon} onChange={(e) => setForm((f) => ({ ...f, harga_diskon: e.target.value }))} />
            <SearchableSelect value={form.kategori_id} onChange={(v) => setForm((f) => ({ ...f, kategori_id: v }))}
              placeholder="Kategori produk" options={kategori.map((k) => ({ value: k.id, label: k.nama }))} />
            <div className="flex items-center gap-2">
              {previewFoto && (
                <img src={previewFoto} alt="Preview" className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-gray-200 dark:border-gray-700" />
              )}
              <input type="file" accept="image/*" onChange={(e) => pilihFoto(e.target.files?.[0] || null)}
                className="text-xs border border-gray-300 dark:border-gray-600 rounded-xl px-2 py-2 w-full" />
            </div>
            <Button type="submit" loading={uploading}>{uploading ? 'Menyimpan...' : 'Tambah produk'}</Button>
          </form>
        </Card>
      )}

      <Input value={cari} onChange={(e) => { setCari(e.target.value); setPage(1) }} placeholder="Cari nama produk..." className="w-full md:w-80 mb-4" />

      {loading ? <Spinner /> : halamanIni.length === 0 ? (
        <EmptyState
          icon="📦"
          title={cari ? 'Tidak ada produk yang cocok' : 'Belum ada produk'}
          description={cari ? 'Coba ubah kata kunci pencarian.' : 'Tambahkan produk pertama lewat form di atas.'}
        />
      ) : (
        <div className="space-y-2">
          {halamanIni.map((p) => (
            <Card key={p.id}>
              {editId === p.id ? (
                <div className="grid md:grid-cols-4 gap-2">
                  <div className="md:col-span-4 flex items-center gap-3">
                    <SafeImage
                      src={previewEditFoto || editForm.foto}
                      alt="Foto produk"
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-gray-200 dark:border-gray-700"
                    />
                    <input type="file" accept="image/*" onChange={(e) => pilihFotoEdit(e.target.files?.[0] || null)}
                      className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 flex-1" />
                  </div>
                  <Input value={editForm.nama} onChange={(e) => setEditForm((f) => ({ ...f, nama: e.target.value }))} />
                  <Input value={editForm.harga} type="number" onChange={(e) => setEditForm((f) => ({ ...f, harga: e.target.value }))} />
                  <Input value={editForm.harga_diskon} type="number" onChange={(e) => setEditForm((f) => ({ ...f, harga_diskon: e.target.value }))} placeholder="Harga diskon" />
                  <div className="flex gap-2 items-center">
                    <Button size="sm" onClick={() => simpanEdit(p.id)} loading={uploadingEdit}>{uploadingEdit ? 'Menyimpan...' : 'Simpan'}</Button>
                    <button onClick={() => { setEditId(null); pilihFotoEdit(null) }} className="text-xs text-gray-500 dark:text-gray-400">Batal</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <SafeImage src={p.foto} alt={p.nama} className="w-12 h-12 rounded-xl object-cover" />
                    <div>
                      <p className="text-sm font-medium">{p.nama}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{p.toko?.nama_toko} &middot; Rp{Number(p.harga).toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Badge color={p.status_aktif ? 'green' : 'gray'}>{p.status_aktif ? 'Aktif' : 'Nonaktif'}</Badge>
                    <button onClick={() => toggleAktif(p)} className="text-xs text-gray-500 dark:text-gray-400 font-medium px-2 py-1">Ubah</button>
                    <button onClick={() => mulaiEdit(p)} className="text-xs text-brand-600 font-medium px-2 py-1">Edit</button>
                    <button onClick={() => hapus(p.id, p.nama)} className="text-xs text-red-500 font-medium px-2 py-1">Hapus</button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  )
}
