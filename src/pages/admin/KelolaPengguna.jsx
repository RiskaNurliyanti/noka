// Kelola akun pengguna (admin).
import { useEffect, useState } from 'react'
import { api } from '../../lib/apiClient'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../components/ConfirmDialog'
import EmptyState from '../../components/EmptyState'
import Spinner from '../../components/Spinner'
import PageHeader from '../../components/PageHeader'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Input from '../../components/Input'
import Badge from '../../components/Badge'
import Pagination from '../../components/Pagination'

const PER_HALAMAN = 6

const ROLE_LABEL = {
  pembeli: 'Pelanggan',
  mitra_toko: 'Penjual',
  mitra_kurir: 'Kurir',
  admin: 'Admin Website',
  super_admin: 'Super Admin',
}

const ROLE_WARNA = {
  pembeli: 'gray',
  mitra_toko: 'brand',
  mitra_kurir: 'amber',
  admin: 'green',
  super_admin: 'green',
}

// Role yang boleh dikelola Admin Website (bukan sesama admin/super admin)
const ROLE_DI_BAWAH = ['pembeli', 'mitra_toko', 'mitra_kurir']

export default function KelolaPengguna() {
  const { user: currentUser, role: viewerRole } = useAuth()
  const { showToast } = useToast()
  const confirmAsync = useConfirm()
  const isSuperAdmin = viewerRole === 'super_admin'

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [cari, setCari] = useState('')
  const [page, setPage] = useState(1)
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({ nama: '', no_whatsapp: '' })

  async function muat() {
    setLoading(true)
    const res = await api.get('/admin/users?per_page=500')
    setUsers(res.data?.data || [])
    setLoading(false)
  }
  useEffect(() => { muat() }, [])

  // Admin Website nggak boleh lihat/kelola akun admin/super_admin sama sekali
  // (backend juga menegakkan ini - filter di sini murni buat UX, bukan satu-satunya lapisan)
  const daftarDasar = isSuperAdmin ? users : users.filter((u) => ROLE_DI_BAWAH.includes(u.role))
  const daftar = daftarDasar
    .filter((u) => !filter || u.role === filter)
    .filter((u) => !cari || (u.nama || '').toLowerCase().includes(cari.toLowerCase()) || (u.email || '').toLowerCase().includes(cari.toLowerCase()))

  const totalPages = Math.max(1, Math.ceil(daftar.length / PER_HALAMAN))
  const halamanIni = daftar.slice((page - 1) * PER_HALAMAN, page * PER_HALAMAN)

  const bisaDikelola = (u) => isSuperAdmin || ROLE_DI_BAWAH.includes(u.role)

  async function ubahRole(user, roleBaru) {
    if (user.id === currentUser.id) {
      const yakin = await confirmAsync('Kamu mau ubah role akunmu sendiri? Hati-hati, ini bisa bikin kamu kehilangan akses.')
      if (!yakin) return
    }

    try {
      // Pelepasan kepemilikan toko/kurir (kalau role lama mitra_toko/mitra_kurir)
      // sudah ditangani atomic di backend (Admin\UserController::updateRole).
      await api.patch(`/admin/users/${user.id}/role`, { role: roleBaru })
      showToast('Role diperbarui')
      muat()
    } catch (err) {
      showToast('Gagal ubah role: ' + err.message, 'error')
    }
  }

  function mulaiEdit(u) {
    setEditId(u.id)
    setEditForm({ nama: u.nama || '', no_whatsapp: u.no_whatsapp || '' })
  }

  async function simpanEdit(id) {
    try {
      await api.put(`/admin/users/${id}`, editForm)
      setEditId(null)
      showToast('Profil pengguna diperbarui')
      muat()
    } catch (err) {
      showToast('Gagal menyimpan: ' + err.message, 'error')
    }
  }

  async function toggleAktif(u) {
    if (u.id === currentUser.id) return showToast('Nggak bisa nonaktifkan akunmu sendiri', 'error')
    const yakin = await confirmAsync(
      u.status_aktif
        ? `Nonaktifkan akun "${u.nama || u.email}"? Dia nggak akan bisa akses fitur yang butuh login sampai diaktifkan lagi.`
        : `Aktifkan lagi akun "${u.nama || u.email}"?`
    )
    if (!yakin) return
    try {
      await api.patch(`/admin/users/${u.id}/status-aktif`, { status_aktif: !u.status_aktif })
      showToast(u.status_aktif ? 'Akun dinonaktifkan' : 'Akun diaktifkan')
      muat()
    } catch (err) {
      showToast('Gagal mengubah status: ' + err.message, 'error')
    }
  }

  const opsiRole = isSuperAdmin ? Object.entries(ROLE_LABEL) : Object.entries(ROLE_LABEL).filter(([val]) => ROLE_DI_BAWAH.includes(val))

  return (
    <div>
      <PageHeader
        badge="👥 Pengguna"
        title="Kelola pengguna"
        subtitle={
          isSuperAdmin
            ? 'Kamu Super Admin - bisa kelola semua akun, termasuk sesama Admin Website.'
            : 'Kamu Admin Website - cuma bisa kelola akun Penjual, Kurir, dan Pelanggan. Akun sesama admin dikelola Super Admin.'
        }
      />

      <div className="flex gap-2 flex-wrap mb-3">
        {['', ...opsiRole.map(([val]) => val)].map((r) => (
          <button key={r} onClick={() => { setFilter(r); setPage(1) }}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${filter === r ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
            {r === '' ? 'Semua' : ROLE_LABEL[r]}
          </button>
        ))}
      </div>

      <Input value={cari} onChange={(e) => { setCari(e.target.value); setPage(1) }} placeholder="Cari nama atau email..." className="w-full md:w-80 mb-5" />

      {loading ? <Spinner /> : halamanIni.length === 0 ? (
        <EmptyState icon="👥" title="Tidak ada pengguna" description="Coba ubah filter atau kata kunci pencarian." />
      ) : (
        <div className="space-y-2">
          {halamanIni.map((u) => (
            <Card key={u.id} className="hover:shadow-sm transition">
              {editId === u.id ? (
                <div className="grid md:grid-cols-3 gap-2">
                  <Input value={editForm.nama} onChange={(e) => setEditForm((f) => ({ ...f, nama: e.target.value }))} placeholder="Nama" />
                  <Input value={editForm.no_whatsapp} onChange={(e) => setEditForm((f) => ({ ...f, no_whatsapp: e.target.value }))} placeholder="Nomor WhatsApp" />
                  <div className="flex gap-2 items-center">
                    <Button size="sm" onClick={() => simpanEdit(u.id)}>Simpan</Button>
                    <button onClick={() => setEditId(null)} className="text-xs text-gray-500 dark:text-gray-400">Batal</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{u.nama || '(tanpa nama)'}</p>
                      <Badge color={ROLE_WARNA[u.role]}>{ROLE_LABEL[u.role]}</Badge>
                      {!u.status_aktif && <Badge color="red">Nonaktif</Badge>}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{u.email}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      WA: {u.no_whatsapp || (
                        <span className="text-red-500">belum diisi{(u.role === 'admin' || u.role === 'super_admin') ? ' - penting buat akun ini' : ''}</span>
                      )}
                    </p>
                  </div>

                  {bisaDikelola(u) ? (
                    <div className="flex gap-2 items-center flex-wrap">
                      <select
                        value={u.role}
                        onChange={(e) => ubahRole(u, e.target.value)}
                        className="text-xs border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-brand-400"
                      >
                        {opsiRole.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                      </select>
                      <button onClick={() => mulaiEdit(u)} className="text-xs text-brand-600 font-medium">Edit</button>
                      <button onClick={() => toggleAktif(u)} className="text-xs text-red-500 font-medium">
                        {u.status_aktif ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-gray-500 italic">Dikelola Super Admin</span>
                  )}
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
