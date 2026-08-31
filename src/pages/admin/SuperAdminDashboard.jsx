// Dashboard khusus super admin.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

import { api } from "../../lib/apiClient";
import { useToast } from "../../context/ToastContext";
import Card from "../../components/Card";
import Button from "../../components/Button";
import StatCard from "../../components/StatCard";

const MENU_SUPER_ADMIN = [
  ["/admin/pengguna", "👥", "Kelola Pengguna"],
  ["/admin/kurir", "🛵", "Kelola Kurir"],
  ["/admin/toko", "🏬", "Kelola Toko"],
  ["/admin/produk", "📦", "Kelola Produk"],
  ["/admin/kategori-toko", "📂", "Kategori Toko"],
  ["/admin/kategori", "📂", "Kategori Produk"],
  ["/admin/pesanan", "🛒", "Kelola Pesanan"],
  ["/admin/review", "⭐", "Moderasi Review"],
  ["/admin/laporan", "📮", "Kelola Aduan"],
  ["/admin/langganan", "💳", "Langganan Toko"],
  ["/admin/analitik", "📈", "Analitik Pengunjung"],
  ["/super-admin/audit-log", "🔒", "Audit Log"],
  ["/super-admin/status-database", "🔍", "Status Database"],
  // Alamat halaman ini "/super-admin/pengaturan" - BEDA dari alamat API
  // "/admin/pengaturan" yang dipanggil PengaturanSistem.jsx buat ambil/simpan
  // data. Jangan disamakan lagi kalau nanti diubah - link halaman & endpoint
  // API kebetulan mirip tapi memang dua hal yang berbeda.
  ["/super-admin/pengaturan", "⚙️", "Pengaturan Sistem"],
];

export default function SuperAdminDashboard() {
  const { showToast } = useToast();
  const [stat, setStat] = useState(null);
  const [grafik, setGrafik] = useState([]);
  const [produkTerlaris, setProdukTerlaris] = useState([]);
  const [tokoTerlaris, setTokoTerlaris] = useState([]);
  const [klaim, setKlaim] = useState([]);
  const [logAktivitas, setLogAktivitas] = useState([]);
  const [pengaturan, setPengaturan] = useState(null);
  const [totalUser, setTotalUser] = useState(0);

  async function muatData() {
    const [statRes, grafikRes, produkRes, tokoRes, klaimRes, userRes, logRes, settingRes] = await Promise.all([
      api.get("/admin/statistik"),
      api.get("/admin/penjualan-harian?limit=30"),
      api.get("/admin/produk-terlaris?limit=5"),
      api.get("/toko-populer?limit=5"),
      api.get("/admin/klaim?status=pending"),
      api.get("/admin/users?per_page=1"),
      api.get("/admin/log-aktivitas?limit=5"),
      api.get("/admin/pengaturan"),
    ]);

    setStat(statRes.data);
    setGrafik([...(grafikRes.data || [])].reverse());
    setProdukTerlaris(produkRes.data || []);
    setTokoTerlaris(tokoRes.data || []);
    setKlaim(klaimRes.data?.data || []);
    setTotalUser(userRes.data?.total || 0);
    setLogAktivitas(logRes.data || []);
    setPengaturan(settingRes.data);
  }

  useEffect(() => { muatData(); }, []);

  async function prosesKlaim(item, approve) {
    try {
      await api.patch(`/admin/klaim/${item.id}/${approve ? "approve" : "reject"}`);
      showToast(approve ? "Klaim disetujui" : "Klaim ditolak");
      muatData();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-500 text-white flex items-center justify-center text-xl flex-shrink-0">🛡️</div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Dashboard Super Admin</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Kontrol penuh sistem marketplace NOKA</p>
          </div>
        </div>
        {klaim.length > 0 && (
          <span className="text-sm font-semibold text-accent-600 bg-accent-50 dark:bg-accent-950/30 rounded-full px-4 py-2 whitespace-nowrap">
            🔔 {klaim.length} klaim menunggu
          </span>
        )}
      </div>

      {/* MENU SUPER ADMIN */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {MENU_SUPER_ADMIN.map(([href, icon, label]) => (
          <Link key={label} to={href}>
            <Card className="flex items-center gap-3 hover:border-brand-300 dark:hover:border-brand-700 transition" padded={false}>
              <div className="p-4 flex items-center gap-3 w-full">
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 flex items-center justify-center text-lg flex-shrink-0">{icon}</div>
                <p className="text-sm font-semibold truncate">{label}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* METRIK UTAMA - 3 angka paling penting, dibedakan dari statistik lain */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <p className="text-xs text-gray-500 dark:text-gray-400">💰 Total nilai pesanan</p>
          <p className="text-2xl font-extrabold mt-1 text-green-600 dark:text-green-400">Rp{Number(stat?.total_pendapatan ?? 0).toLocaleString("id-ID")}</p>
        </Card>
        <Card className="border-l-4 border-l-accent-500">
          <p className="text-xs text-gray-500 dark:text-gray-400">🔥 Pesanan hari ini</p>
          <p className="text-2xl font-extrabold mt-1 text-accent-600">{stat?.pesanan_hari_ini ?? 0}</p>
        </Card>
        <Card className="border-l-4 border-l-brand-500">
          <p className="text-xs text-gray-500 dark:text-gray-400">🛒 Total pesanan sepanjang waktu</p>
          <p className="text-2xl font-extrabold mt-1 text-brand-600">{stat?.total_pesanan ?? 0}</p>
        </Card>
      </div>

      {/* STATISTIK LAINNYA */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard icon="👥" label="Total user" value={totalUser} />
        <StatCard icon="🏪" label="Total toko" value={stat?.total_toko ?? 0} />
        <StatCard icon="🛵" label="Total kurir" value={stat?.total_kurir ?? 0} />
        <StatCard icon="📦" label="Total produk" value={stat?.total_produk ?? 0} />
        <StatCard icon="🏬" label="Total penjual" value={stat?.total_penjual ?? 0} />
      </div>

      {/* GRAFIK PESANAN */}
      <Card>
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-semibold">📈 Statistik pesanan NOKA</h2>
          <span className="text-xs text-gray-400 dark:text-gray-500">30 hari terakhir</span>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={grafik}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tanggal" />
              <YAxis />
              <Tooltip formatter={(value) => [value, "Jumlah Pesanan"]} />
              <Line type="monotone" dataKey="jumlah_pesanan" stroke="#1d5c99" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* PERFORMA MARKETPLACE */}
      <div className="grid md:grid-cols-2 gap-5">
        <Card>
          <h2 className="font-semibold mb-4">🏆 Produk terlaris</h2>
          {produkTerlaris.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">Belum ada data.</p>
          ) : (
            <div className="space-y-3">
              {produkTerlaris.map((p, index) => (
                <div key={p.produk_id} className="flex justify-between items-center text-sm">
                  <div className="flex gap-3 items-center">
                    <span className="w-6 h-6 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-600 flex items-center justify-center text-xs font-bold">{index + 1}</span>
                    <span>{p.nama}</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{p.total_terjual} terjual</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="font-semibold mb-4">⭐ Toko populer</h2>
          {tokoTerlaris.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">Belum ada data.</p>
          ) : (
            <div className="space-y-3">
              {tokoTerlaris.map((t, index) => (
                <div key={t.toko_id} className="flex justify-between items-center text-sm">
                  <div className="flex gap-3 items-center">
                    <span className="w-6 h-6 rounded-full bg-accent-100 dark:bg-accent-950/40 text-accent-600 flex items-center justify-center text-xs font-bold">{index + 1}</span>
                    <span>{t.nama_toko}</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{t.jumlah_pesanan} pesanan</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* KLAIM MITRA */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold">🔐 Klaim toko / kurir</h2>
          <span className="text-xs px-3 py-1 rounded-full bg-accent-100 dark:bg-accent-950/40 text-accent-600">{klaim.length} pending</span>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Pastikan verifikasi manual melalui WhatsApp sebelum menyetujui klaim. Jika disetujui, akun pengguna menjadi pemilik toko atau kurir.
        </p>

        <div className="space-y-3">
          {klaim.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">Tidak ada klaim yang menunggu diproses.</p>
          ) : (
            klaim.map((k) => (
              <div key={k.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <div className="flex justify-between items-center gap-4 flex-wrap">
                  <div>
                    <p className="font-semibold">{k.jenis === "kurir" ? k.kurir?.nama_layanan : k.toko?.nama_toko}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pengklaim: {k.user?.nama || "-"} ({k.user?.email || "-"})</p>
                    {k.catatan && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Catatan: {k.catatan}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="success" onClick={() => prosesKlaim(k, true)}>✓ Setujui</Button>
                    <Button size="sm" variant="danger" onClick={() => prosesKlaim(k, false)}>✕ Tolak</Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* LOG AKTIVITAS + PENGATURAN */}
      <div className="grid md:grid-cols-2 gap-5">
        <Card>
          <h2 className="font-semibold mb-4">📜 Log aktivitas</h2>
          {logAktivitas.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">Belum ada aktivitas.</p>
          ) : (
            <div className="space-y-3">
              {logAktivitas.map((log) => (
                <div key={log.id} className="text-sm border-b border-gray-100 dark:border-gray-800 pb-3 last:border-0 last:pb-0">
                  <p className="font-medium">{log.aksi}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">oleh: {log.user?.nama || "System"}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">⚙️ Pengaturan sistem</h2>
            <Link to="/super-admin/pengaturan"><Button variant="ghost" size="sm">Ubah →</Button></Link>
          </div>
          {pengaturan && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Nama website</span>
                <b>{pengaturan.nama_web}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Mode maintenance</span>
                <b className={pengaturan.maintenance_mode ? 'text-red-500' : 'text-green-600'}>{pengaturan.maintenance_mode ? "Aktif" : "Nonaktif"}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">WhatsApp admin</span>
                <b>{pengaturan.admin_whatsapp || "-"}</b>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
