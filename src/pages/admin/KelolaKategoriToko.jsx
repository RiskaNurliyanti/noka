// Kelola kategori toko (admin).
import { useEffect, useState } from 'react'
import { api } from '../../lib/apiClient'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../components/ConfirmDialog'
import EmptyState from '../../components/EmptyState'
import Spinner from '../../components/Spinner'

export default function KelolaKategoriToko() {
  const { showToast } = useToast()
  const confirmAsync = useConfirm()
  const [kategori, setKategori] = useState([])
  const [loading, setLoading] = useState(true)
  const [nama, setNama] = useState('')
  const [cari, setCari] = useState('')
  const [editId, setEditId] = useState(null)
  const [editNama, setEditNama] = useState('')

  async function muat() {
    try {
      const res = await api.get('/kategori-toko')
      setKategori(res.data || [])
    } catch (err) {
      showToast('Gagal memuat kategori: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { muat() }, [])

  async function tambah(e) {
    e.preventDefault()
    if (!nama.trim()) return
    try {
      await api.post('/admin/kategori-toko', { nama })
      setNama('')
      showToast('Kategori toko ditambahkan')
      muat()
    } catch (err) {
      showToast('Gagal menambah: ' + err.message, 'error')
    }
  }

  async function simpanEdit(id) {
    try {
      await api.put(`/admin/kategori-toko/${id}`, { nama: editNama })
      setEditId(null)
      showToast('Kategori diperbarui')
      muat()
    } catch (err) {
      showToast('Gagal menyimpan: ' + err.message, 'error')
    }
  }

  async function hapus(id, nama) {
    const yakin = await confirmAsync(`Hapus kategori toko "${nama}"?`)
    if (!yakin) return
    await api.delete(`/admin/kategori-toko/${id}`)
    showToast('Kategori dihapus')
    muat()
  }

  const kategoriTersaring = cari
    ? kategori.filter((k) => k.nama.toLowerCase().includes(cari.toLowerCase()))
    : kategori

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold mb-1">🏷️ Kelola kategori toko</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Contoh: Warung, Restoran, Cafe, Seafood, Frozen Food.</p>

      <form onSubmit={tambah} className="flex gap-2 mb-4">
        <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama kategori toko"
          className="flex-1 border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
        <button className="bg-brand-500 text-white rounded-xl text-sm font-semibold px-5 shadow-sm hover:shadow-md transition">Tambah</button>
      </form>

      <input
        value={cari}
        onChange={(e) => setCari(e.target.value)}
        placeholder="🔍 Cari kategori toko..."
        className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 mb-6"
      />

      {loading ? (
        <Spinner label="Memuat kategori..." />
      ) : kategoriTersaring.length === 0 ? (
        <EmptyState
          icon="🏷️"
          title={cari ? 'Tidak ada kategori yang cocok' : 'Belum ada kategori toko'}
          description={cari ? 'Coba ubah kata kunci pencarian.' : 'Tambahkan kategori pertama lewat form di atas.'}
        />
      ) : (
      <div className="space-y-2">
        {kategoriTersaring.map((k) => (
          <div key={k.id} className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 hover:shadow-sm transition">
            {editId === k.id ? (
              <>
                <input value={editNama} onChange={(e) => setEditNama(e.target.value)}
                  className="flex-1 border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-lg px-2 py-1 text-sm mr-2" />
                <div className="flex gap-2">
                  <button onClick={() => simpanEdit(k.id)} className="text-xs bg-brand-500 text-white rounded-full px-3 py-1">Simpan</button>
                  <button onClick={() => setEditId(null)} className="text-xs text-gray-500 dark:text-gray-400">Batal</button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-medium">{k.nama}</p>
                <div className="flex gap-2">
                  <button onClick={() => { setEditId(k.id); setEditNama(k.nama) }} className="text-xs text-brand-500 font-medium bg-brand-50 dark:bg-brand-950/40 rounded-full px-3 py-1">Edit</button>
                  <button onClick={() => hapus(k.id, k.nama)} className="text-xs text-red-500 font-medium bg-red-50 dark:bg-red-950/30 rounded-full px-3 py-1">Hapus</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      )}
    </div>
  )
}
