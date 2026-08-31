import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/apiClient'
import { uploadFoto } from '../../lib/storage'
import SafeImage from '../../components/SafeImage'

import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../components/ConfirmDialog'

import Card from '../../components/Card'
import Button from '../../components/Button'
import Input from '../../components/Input'
import Pagination from '../../components/Pagination'
import EmptyState from '../../components/EmptyState'
import Spinner from '../../components/Spinner'
import SearchableSelect from '../../components/SearchableSelect'

const PER_HALAMAN = 6

export default function KelolaMenu() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const confirmAsync = useConfirm()

  const [toko, setToko] = useState(null)
  const [loading, setLoading] = useState(true)
  const [produk, setProduk] = useState([])
  const [kategori, setKategori] = useState([])

  const [formProduk, setFormProduk] = useState({ nama: '', harga: '', harga_diskon: '', deskripsi: '', kategori_id: '' })
  const [fotoProduk, setFotoProduk] = useState(null)
  const [previewFotoProduk, setPreviewFotoProduk] = useState(null)
  const [uploading, setUploading] = useState(false)

  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({ nama: '', harga: '', harga_diskon: '', kategori_id: '', foto: '' })
  const [editFotoBaru, setEditFotoBaru] = useState(null)
  const [previewEditFoto, setPreviewEditFoto] = useState(null)
  const [uploadingEdit, setUploadingEdit] = useState(false)

  const [cariProduk, setCariProduk] = useState('')
  const [page, setPage] = useState(1)

  async function muatData() {
    try {
      // Toko dasar cuma buat header kecil (nama & foto) - bukan duplikasi
      // data, tetap dari endpoint /mitra/toko yang sama seperti
      // PengaturanToko.jsx, cuma dipanggil dari halaman berbeda.
      const [t, produkRes] = await Promise.all([
        api.get('/mitra/toko'),
        api.get('/mitra/toko/produk'),
      ])
      setToko(t.data)
      setProduk(produkRes.data || [])
    } catch {
      setToko(null)
    } finally {
      setLoading(false)
    }

    const kategoriRes = await api.get('/kategori')
    setKategori(kategoriRes.data || [])
  }

  useEffect(() => { if (user) muatData() }, [user])

  async function tambahProduk(e) {
    e.preventDefault()
    if (!formProduk.nama || !formProduk.harga) return showToast('Nama dan harga wajib diisi', 'error')

    setUploading(true)
    try {
      const fotoUrl = fotoProduk ? await uploadFoto(fotoProduk, 'produk') : null

      await api.post('/mitra/toko/produk', {
        nama: formProduk.nama,
        harga: Number(formProduk.harga),
        harga_diskon: formProduk.harga_diskon ? Number(formProduk.harga_diskon) : null,
        deskripsi: formProduk.deskripsi,
        kategori_id: formProduk.kategori_id || null,
        foto: fotoUrl,
      })

      setFormProduk({ nama: '', harga: '', harga_diskon: '', deskripsi: '', kategori_id: '' })
      setFotoProduk(null)
      if (previewFotoProduk) URL.revokeObjectURL(previewFotoProduk)
      setPreviewFotoProduk(null)
      showToast('Menu berhasil ditambahkan')
      muatData()
    } catch (err) {
      showToast('Gagal menyimpan menu: ' + err.message, 'error')
    } finally {
      setUploading(false)
    }
  }

  function pilihFotoProduk(file) {
    if (previewFotoProduk) URL.revokeObjectURL(previewFotoProduk)
    setFotoProduk(file)
    setPreviewFotoProduk(file ? URL.createObjectURL(file) : null)
  }

  function mulaiEdit(p) {
    setEditId(p.id)
    setEditForm({ nama: p.nama, harga: p.harga, harga_diskon: p.harga_diskon || '', kategori_id: p.kategori_id || '', foto: p.foto || '' })
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
      // Ganti foto cuma kalau penjual pilih file baru - kalau tidak, foto
      // lama tetap dipakai (tidak dikirim field 'foto' sama sekali, jadi
      // backend tidak mengubahnya - validasi backend pakai 'sometimes').
      const fotoBaruUrl = editFotoBaru ? await uploadFoto(editFotoBaru, 'produk') : null

      await api.put(`/mitra/toko/produk/${id}`, {
        nama: editForm.nama,
        harga: Number(editForm.harga),
        harga_diskon: editForm.harga_diskon ? Number(editForm.harga_diskon) : null,
        kategori_id: editForm.kategori_id || null,
        ...(fotoBaruUrl ? { foto: fotoBaruUrl } : {}),
      })
      setEditId(null)
      setEditFotoBaru(null)
      if (previewEditFoto) URL.revokeObjectURL(previewEditFoto)
      setPreviewEditFoto(null)
      showToast('Menu diperbarui')
      muatData()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setUploadingEdit(false)
    }
  }

  async function toggleAktif(p) {
    await api.put(`/mitra/toko/produk/${p.id}`, { status_aktif: !p.status_aktif })
    showToast(p.status_aktif ? 'Menu dinonaktifkan' : 'Menu diaktifkan')
    muatData()
  }

  async function hapusProduk(id, nama) {
    const yakin = await confirmAsync(`Hapus menu "${nama}"?`)
    if (!yakin) return
    await api.delete(`/mitra/toko/produk/${id}`)
    showToast('Menu dihapus')
    muatData()
  }

  if (loading) {
    return <Spinner label="Memuat menu toko..." />
  }

  if (!toko) {
    return (
      <EmptyState
        icon="🏪"
        title="Toko belum ditemukan"
        description="Kamu belum punya toko terdaftar, atau masih menunggu verifikasi admin."
      />
    )
  }

  const produkFiltered = produk.filter((p) => p.nama.toLowerCase().includes(cariProduk.toLowerCase()))
  const totalPages = Math.max(1, Math.ceil(produkFiltered.length / PER_HALAMAN))
  const produkHalamanIni = produkFiltered.slice((page - 1) * PER_HALAMAN, page * PER_HALAMAN)

  return (
    <div className="space-y-8">

      {/* HEADER KECIL - konteks toko + link balik ke pengaturan */}
      <div className="flex items-center gap-3">
        <SafeImage
          src={toko.foto_logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(toko.nama_toko)}`}
          alt={toko.nama_toko}
          className="w-12 h-12 rounded-2xl object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 dark:text-gray-400">Kelola menu</p>
          <h1 className="text-lg font-bold truncate">{toko.nama_toko}</h1>
        </div>
        <Link to="/mitra/toko" className="text-xs font-semibold text-brand-600 whitespace-nowrap">
          ⚙️ Pengaturan Toko
        </Link>
      </div>

      {/* TAMBAH MENU */}
      <section>
        <h2 className="text-lg font-bold mb-4">Tambah menu</h2>

        <Card>
          <form onSubmit={tambahProduk} className="grid md:grid-cols-3 gap-3">
            <Input label="Nama menu" value={formProduk.nama} onChange={(e) => setFormProduk((f) => ({ ...f, nama: e.target.value }))} />
            <Input label="Harga" type="number" value={formProduk.harga} onChange={(e) => setFormProduk((f) => ({ ...f, harga: e.target.value }))} />
            <Input label="Harga diskon (opsional)" type="number" value={formProduk.harga_diskon} onChange={(e) => setFormProduk((f) => ({ ...f, harga_diskon: e.target.value }))} />

            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Kategori</label>
              <SearchableSelect
                value={formProduk.kategori_id}
                onChange={(v) => setFormProduk((f) => ({ ...f, kategori_id: v }))}
                placeholder="Pilih kategori"
                options={kategori.map((k) => ({ value: k.id, label: k.nama }))}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Foto menu</label>
              <div className="flex items-center gap-3">
                {previewFotoProduk && (
                  <img src={previewFotoProduk} alt="Preview" className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gray-200 dark:border-gray-700" />
                )}
                <input type="file" accept="image/*" onChange={(e) => pilihFotoProduk(e.target.files?.[0] || null)}
                  className="text-sm border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 w-full" />
              </div>
            </div>

            <Button type="submit" loading={uploading} className="self-end">
              {uploading ? 'Menyimpan...' : 'Tambah menu'}
            </Button>
          </form>
        </Card>
      </section>

      {/* KELOLA MENU */}
      <section>
        <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
          <h2 className="text-lg font-bold">Kelola menu ({produk.length})</h2>
          <input
            value={cariProduk}
            onChange={(e) => { setCariProduk(e.target.value); setPage(1) }}
            placeholder="Cari menu..."
            className="w-full md:w-72 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        {produkHalamanIni.length === 0 ? (
          <EmptyState icon="🍽️" title="Belum ada menu" description="Tambahkan menu pertama toko kamu." />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {produkHalamanIni.map((p) => (
              <Card key={p.id} padded={false} className="overflow-hidden">
                {editId === p.id ? (
                  <div className="p-4 grid grid-cols-2 gap-3">
                    <div className="col-span-2 flex items-center gap-3">
                      <SafeImage
                        src={previewEditFoto || editForm.foto}
                        alt="Foto menu"
                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-gray-200 dark:border-gray-700"
                      />
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Ganti foto (opsional)</label>
                        <input type="file" accept="image/*" onChange={(e) => pilihFotoEdit(e.target.files?.[0] || null)}
                          className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 w-full" />
                      </div>
                    </div>
                    <Input value={editForm.nama} onChange={(e) => setEditForm((f) => ({ ...f, nama: e.target.value }))} className="col-span-2" />
                    <Input type="number" value={editForm.harga} onChange={(e) => setEditForm((f) => ({ ...f, harga: e.target.value }))} />
                    <Input type="number" value={editForm.harga_diskon} onChange={(e) => setEditForm((f) => ({ ...f, harga_diskon: e.target.value }))} placeholder="Harga diskon" />
                    <div className="flex gap-2 items-center col-span-2">
                      <Button size="sm" onClick={() => simpanEdit(p.id)} loading={uploadingEdit}>{uploadingEdit ? 'Menyimpan...' : 'Simpan'}</Button>
                      <button onClick={() => { setEditId(null); setEditFotoBaru(null); setPreviewEditFoto(null) }} className="text-xs text-gray-500 dark:text-gray-400">Batal</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3 p-4">
                    <div className="w-28 h-28 rounded-xl bg-brand-50 dark:bg-gray-800 flex-shrink-0 overflow-hidden">
                      <SafeImage src={p.foto} className="w-full h-full object-cover" alt={p.nama} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{p.nama}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Harga <span className="font-medium text-gray-700 dark:text-gray-200">Rp{Number(p.harga).toLocaleString('id-ID')}</span>
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{p.status_aktif ? '🟢 Aktif' : '⚪ Nonaktif'}</p>

                      <div className="flex gap-1.5 mt-2.5 flex-wrap">
                        <button onClick={() => mulaiEdit(p)} className="text-xs font-medium border border-brand-200 dark:border-brand-800 text-brand-600 rounded-full px-3 py-1.5 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition">✏️ Edit</button>
                        <button onClick={() => toggleAktif(p)} className="text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-full px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                          {p.status_aktif ? '🚫 Nonaktifkan' : '✅ Aktifkan'}
                        </button>
                        <button onClick={() => hapusProduk(p.id, p.nama)} className="text-xs font-medium border border-red-200 dark:border-red-900 text-red-500 rounded-full px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 transition">🗑️ Hapus</button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </section>

    </div>
  )
}
