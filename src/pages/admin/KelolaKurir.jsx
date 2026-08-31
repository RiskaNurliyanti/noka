import { useEffect, useRef, useState } from "react";
import { api } from "../../lib/apiClient";
import { uploadFoto } from "../../lib/storage";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../components/ConfirmDialog";
import SafeImage from "../../components/SafeImage";
import PageHeader from "../../components/PageHeader";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Badge from "../../components/Badge";
import EmptyState from "../../components/EmptyState";
import Spinner from "../../components/Spinner";
import Pagination from "../../components/Pagination";

const PER_HALAMAN = 6;
const STATUS_WARNA = { pending: "amber", approved: "green", rejected: "red" };
const STATUS_LABEL = { pending: "Pending", approved: "Approved", rejected: "Rejected" };

const FORM_KOSONG = { nama_layanan: "", no_whatsapp: "", kendaraan: "", area_layanan: "", jam_operasional: "" };

export default function KelolaKurir() {
  const { showToast } = useToast();
  const confirmAsync = useConfirm();

  const [kurir, setKurir] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [cari, setCari] = useState("");
  const [page, setPage] = useState(1);

  const [editData, setEditData] = useState(null);
  const [fotoLogo, setFotoLogo] = useState(null);
  const [previewFotoLogo, setPreviewFotoLogo] = useState(null);

  const [klaimData, setKlaimData] = useState(null);
  const [emailKlaim, setEmailKlaim] = useState("");
  const [klaimLoading, setKlaimLoading] = useState(false);

  const [formTambah, setFormTambah] = useState(FORM_KOSONG);
  const [fotoTambah, setFotoTambah] = useState(null);
  const [previewFotoTambah, setPreviewFotoTambah] = useState(null);
  const [menyimpanTambah, setMenyimpanTambah] = useState(false);
  const requestId = useRef(0);

  async function loadKurir(pageNum) {
    const params = new URLSearchParams({ per_page: String(PER_HALAMAN), page: String(pageNum) });
    if (cari) params.set("q", cari);
    const res = await api.get(`/admin/kurir?${params.toString()}`);
    setKurir(res.data?.data || []);
    setTotalPages(Math.max(1, res.data?.last_page || 1));
  }

  // Stage 8: sebelumnya fetch sampai 200 kurir sekaligus lalu difilter di
  // client (Stage 6). Sekarang backend yang paginasi & filter 'q' (endpoint
  // sudah mendukungnya), jadi cuma 1 halaman yang benar-benar diambil.
  // Debounce + guard nomor urut request sama seperti halaman lain.
  useEffect(() => {
    const id = requestId.current + 1;
    requestId.current = id;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        await loadKurir(page);
      } catch (err) {
        if (requestId.current === id) showToast(err.message, "error");
      } finally {
        if (requestId.current === id) setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [cari, page]);

  // user_id sengaja tidak diisi - status_verifikasi='approved' diset otomatis
  // di backend (Admin\KurirController::store) supaya kurir yang diinput admin
  // langsung tersedia dan bisa diklaim.
  async function tambahKurir(e) {
    e.preventDefault();

    if (!formTambah.nama_layanan || !formTambah.no_whatsapp) {
      showToast("Nama layanan dan WhatsApp wajib diisi", "error");
      return;
    }

    setMenyimpanTambah(true);
    try {
      let foto_logo = null;
      if (fotoTambah) foto_logo = await uploadFoto(fotoTambah, "kurir/logo");

      await api.post("/admin/kurir", { ...formTambah, ...(foto_logo ? { foto_logo } : {}) });
      showToast("Kurir berhasil dibuat");
      setFormTambah(FORM_KOSONG);
      setFotoTambah(null);
      if (previewFotoTambah) URL.revokeObjectURL(previewFotoTambah);
      setPreviewFotoTambah(null);
      setPage(1);
      loadKurir(1);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setMenyimpanTambah(false);
    }
  }

  async function updateVerifikasi(id, status) {
    try {
      await api.patch(`/admin/kurir/${id}/verifikasi`, { status_verifikasi: status });
      showToast(status === "approved" ? "Kurir disetujui" : "Kurir ditolak");
      loadKurir(page);
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  // NOTE: status ketersediaan (online/offline) itu keputusan kurir sendiri,
  // bukan wewenang admin (Section 17: status ketersediaan terpisah dari
  // status aktif akun) - makanya admin cuma bisa lihat, bukan ubah di sini.

  async function toggleStatusAktif(k) {
    try {
      await api.patch(`/admin/kurir/${k.id}/status-aktif`, { status_aktif: !k.status_aktif });
      showToast(k.status_aktif ? "Kurir dinonaktifkan" : "Kurir diaktifkan");
      loadKurir(page);
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function hapus(id, nama) {
    const yakin = await confirmAsync(`Hapus kurir "${nama}"?`);
    if (!yakin) return;
    try {
      await api.delete(`/admin/kurir/${id}`);
      showToast("Kurir berhasil dihapus");
      loadKurir(page);
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function simpanEdit() {
    try {
      let logo = editData.foto_logo;
      if (fotoLogo) logo = await uploadFoto(fotoLogo, "kurir/logo");

      await api.put(`/admin/kurir/${editData.id}`, {
        nama_layanan: editData.nama_layanan,
        no_whatsapp: editData.no_whatsapp,
        kendaraan: editData.kendaraan,
        area_layanan: editData.area_layanan,
        jam_operasional: editData.jam_operasional,
        foto_logo: logo,
      });

      setEditData(null);
      setFotoLogo(null);
      if (previewFotoLogo) URL.revokeObjectURL(previewFotoLogo);
      setPreviewFotoLogo(null);
      showToast("Data kurir diperbarui");
      loadKurir(page);
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  // Ditautkan lewat tabel klaim_mitra (dicatat + langsung disetujui dalam 1
  // langkah) - bukan update kolom status_klaim yang tidak ada di skema
  // database (bug versi lama, sudah diperbaiki di backend).
  async function approveKlaimKurir() {
    if (!emailKlaim) {
      showToast("Email wajib diisi", "error");
      return;
    }

    setKlaimLoading(true);
    try {
      await api.post(`/admin/kurir/${klaimData.id}/klaim-email`, { email: emailKlaim });
      showToast("Kurir berhasil diklaim");
      setKlaimData(null);
      setEmailKlaim("");
      loadKurir(page);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setKlaimLoading(false);
    }
  }

  return (
    <div>
      <PageHeader badge="🛵 Kurir" title="Kelola kurir NOKA" subtitle="Kelola mitra layanan antar NOKA." />

      <Card className="mb-6">
        <h2 className="font-semibold mb-3 text-sm">Tambah kurir baru</h2>
        <form onSubmit={tambahKurir} className="grid md:grid-cols-2 lg:grid-cols-6 gap-3">
          <Input placeholder="Nama layanan" value={formTambah.nama_layanan}
            onChange={(e) => setFormTambah({ ...formTambah, nama_layanan: e.target.value })} />
          <Input placeholder="WhatsApp" value={formTambah.no_whatsapp}
            onChange={(e) => setFormTambah({ ...formTambah, no_whatsapp: e.target.value })} />
          <Input placeholder="Kendaraan" value={formTambah.kendaraan}
            onChange={(e) => setFormTambah({ ...formTambah, kendaraan: e.target.value })} />
          <Input placeholder="Area layanan" value={formTambah.area_layanan}
            onChange={(e) => setFormTambah({ ...formTambah, area_layanan: e.target.value })} />
          <div className="flex items-center gap-2">
            {previewFotoTambah && (
              <img src={previewFotoTambah} alt="Preview" className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-gray-200 dark:border-gray-700" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                if (previewFotoTambah) URL.revokeObjectURL(previewFotoTambah);
                setFotoTambah(file);
                setPreviewFotoTambah(file ? URL.createObjectURL(file) : null);
              }}
              className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-2 w-full"
            />
          </div>
          <Button type="submit" loading={menyimpanTambah}>{menyimpanTambah ? "Menyimpan..." : "+ Tambah kurir"}</Button>
        </form>
      </Card>

      <input
        value={cari}
        onChange={(e) => { setCari(e.target.value); setPage(1); }}
        placeholder="🔍 Cari nama kurir atau nomor WhatsApp..."
        className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 mb-6"
      />

      {loading ? <Spinner /> : kurir.length === 0 ? (
        <EmptyState
          icon="🛵"
          title={cari ? "Tidak ada kurir yang cocok" : "Belum ada kurir"}
          description={cari ? "Coba ubah kata kunci pencarian." : "Tambahkan kurir pertama lewat form di atas."}
        />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {kurir.map((k) => (
            <Card key={k.id} className="space-y-4">
              <div className="flex gap-4 items-center">
                <SafeImage src={k.foto_logo} className="w-20 h-20 rounded-2xl object-cover border border-gray-200 dark:border-gray-700" />
                <div>
                  <h2 className="font-bold">{k.nama_layanan}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">🛵 {k.kendaraan || "-"}</p>
                </div>
              </div>

              <div className="text-sm space-y-1 text-gray-600 dark:text-gray-300">
                <p>📍 {k.area_layanan || "-"}</p>
                <p>📱 {k.no_whatsapp || "-"}</p>
                <p>🕒 {k.jam_operasional || "-"}</p>

                <p>
                  {k.jumlah_review > 0 ? (
                    <>⭐ {Number(k.rating_rata_rata).toFixed(1)} <span className="text-gray-400 dark:text-gray-500">({k.jumlah_review} review)</span></>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">⭐ Belum ada review</span>
                  )}
                </p>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Badge color={STATUS_WARNA[k.status_verifikasi]}>{STATUS_LABEL[k.status_verifikasi]}</Badge>
                <Badge color={k.status_ketersediaan ? 'green' : 'gray'}>{k.status_ketersediaan ? "🟢 Tersedia" : "⚪ Offline"}</Badge>
                {!k.user_id && <Badge color="amber">Belum diklaim</Badge>}
                {!k.status_aktif && <Badge color="red">Nonaktif</Badge>}
              </div>

              <div className="flex gap-2 flex-wrap">
                {!k.user_id && <Button size="sm" variant="success" onClick={() => setKlaimData(k)}>🔗 Klaim</Button>}
                <Button size="sm" variant="secondary" onClick={() => { setEditData(k); setFotoLogo(null); setPreviewFotoLogo(null); }}>✏️ Edit</Button>
                {k.status_verifikasi !== "approved" && (
                  <Button size="sm" variant="success" onClick={() => updateVerifikasi(k.id, "approved")}>✓ Approve</Button>
                )}
                <button onClick={() => toggleStatusAktif(k)} className="text-xs text-amber-600 font-medium px-3 py-1.5">
                  {k.status_aktif ? "Nonaktifkan akun" : "Aktifkan akun"}
                </button>
                <Button size="sm" variant="danger" onClick={() => hapus(k.id, k.nama_layanan)}>Hapus</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {klaimData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <Card className="max-w-sm w-full">
            <h2 className="font-bold mb-1">Klaim {klaimData.nama_layanan}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Masukkan email akun pemilik</p>
            <Input type="email" value={emailKlaim} onChange={(e) => setEmailKlaim(e.target.value)} placeholder="Email akun pemilik" />
            <div className="flex gap-2 mt-4">
              <Button loading={klaimLoading} onClick={approveKlaimKurir}>
                {klaimLoading ? "Memproses..." : "Approve"}
              </Button>
              <Button variant="secondary" onClick={() => { setKlaimData(null); setEmailKlaim(""); }}>Batal</Button>
            </div>
          </Card>
        </div>
      )}

      {editData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg space-y-4">
            <h2 className="text-xl font-bold">✏️ Edit kurir</h2>
            {[
              ["Nama layanan", "nama_layanan"],
              ["WhatsApp", "no_whatsapp"],
              ["Kendaraan", "kendaraan"],
              ["Area layanan", "area_layanan"],
              ["Jam operasional", "jam_operasional"],
            ].map(([label, key]) => (
              <Input key={key} label={label} value={editData[key] || ""} onChange={(e) => setEditData({ ...editData, [key]: e.target.value })} />
            ))}
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Foto/logo</label>
              <div className="flex items-center gap-3">
                <SafeImage
                  src={previewFotoLogo || editData.foto_logo}
                  alt="Foto kurir"
                  className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-gray-200 dark:border-gray-700"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (previewFotoLogo) URL.revokeObjectURL(previewFotoLogo);
                    setFotoLogo(file);
                    setPreviewFotoLogo(file ? URL.createObjectURL(file) : null);
                  }}
                  className="text-sm flex-1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => { setEditData(null); setFotoLogo(null); setPreviewFotoLogo(null); }}>Batal</Button>
              <Button onClick={simpanEdit}>Simpan</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
