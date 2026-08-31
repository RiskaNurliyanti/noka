<<<<<<< HEAD
// Dashboard ringkas admin.
=======
>>>>>>> 2fff3a60799c7dedfea322691fe3a95949db6590
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/apiClient";
import { useToast } from "../../context/ToastContext";
import Card from "../../components/Card";
import Button from "../../components/Button";
import StatCard from "../../components/StatCard";

const MENU_CEPAT = [
  ["/admin/toko", "🏪", "Kelola Toko"],
  ["/admin/kurir", "🛵", "Kelola Kurir"],
  ["/admin/kategori", "📂", "Kategori"],
  ["/admin/review", "⭐", "Review"],
  ["/admin/pesanan", "🛒", "Pesanan"],
];

export default function DashboardAdmin() {
  const { showToast } = useToast();
  const [klaim, setKlaim] = useState([]);
  const [stat, setStat] = useState(null);
  const [produkTerlaris, setProdukTerlaris] = useState([]);
  const [tokoTerlaris, setTokoTerlaris] = useState([]);

  async function muatData() {
    const [klaimRes, statRes, produkRes, tokoRes] = await Promise.all([
      api.get("/admin/klaim?status=pending"),
      api.get("/admin/statistik"),
      api.get("/admin/produk-terlaris?limit=5"),
      api.get("/toko-populer?limit=5"),
    ]);

    setKlaim(klaimRes.data?.data || []);
    setStat(statRes.data);
    setProdukTerlaris(produkRes.data || []);
    setTokoTerlaris(tokoRes.data || []);
  }

  useEffect(() => { muatData(); }, []);

  // Approve/reject lewat endpoint atomic (DB transaction) di backend -
  // Admin\KlaimController::approve/reject.
  async function prosesKlaim(item, disetujui) {
    try {
      await api.patch(`/admin/klaim/${item.id}/${disetujui ? "approve" : "reject"}`);
      showToast(disetujui ? "Klaim disetujui" : "Klaim ditolak");
      muatData();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Admin NOKA</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Kelola toko, kurir, pesanan, dan aktivitas marketplace</p>
        </div>
        <span className="px-4 py-2 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-600 font-semibold text-sm">🛡️ Admin</span>
      </Card>

      {/* MENU CEPAT */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        {MENU_CEPAT.map(([href, icon, label]) => (
          <Link key={label} to={href}>
            <Card className="hover:shadow-md transition">
              <p className="text-2xl">{icon}</p>
              <p className="text-sm font-semibold mt-2">{label}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* STATISTIK */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon="🏪" label="Total toko" value={stat?.total_toko ?? 0} />
        <StatCard icon="🛵" label="Total kurir" value={stat?.total_kurir ?? 0} />
        <StatCard icon="📦" label="Total pesanan" value={stat?.total_pesanan ?? 0} accent="accent" />
        <StatCard icon="🔥" label="Pesanan hari ini" value={stat?.pesanan_hari_ini ?? 0} accent="green" />
      </div>

      {/* PERFORMA */}
      <div className="grid md:grid-cols-2 gap-5">
        <Card>
          <h2 className="font-semibold mb-4">🏆 Produk terlaris</h2>
          {produkTerlaris.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">Belum ada data.</p>
          ) : (
            <div className="space-y-3">
              {produkTerlaris.map((p, index) => (
                <div key={p.produk_id} className="flex justify-between items-center text-sm">
                  <div className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-600 flex items-center justify-center text-xs font-bold">{index + 1}</span>
                    <span>{p.nama}</span>
                  </div>
                  <span className="text-gray-500 dark:text-gray-400 text-xs">{p.total_terjual} terjual</span>
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
                  <div className="flex gap-3">
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

      {/* KLAIM TOKO / KURIR */}
      <Card>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">🔐 Klaim toko / kurir</h2>
          <span className="text-xs px-3 py-1 rounded-full bg-accent-100 dark:bg-accent-950/40 text-accent-600">{klaim.length} pending</span>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Pastikan verifikasi manual melalui WhatsApp sebelum menyetujui klaim. Jika disetujui, akun pengguna akan menjadi pemilik toko/kurir tersebut.
        </p>

        <div className="space-y-3">
          {klaim.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">Tidak ada klaim yang menunggu diproses.</p>
          ) : (
            klaim.map((k) => (
              <div key={k.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <div className="flex flex-wrap justify-between gap-3 items-center">
                  <div>
                    <p className="text-sm font-semibold">
                      {k.jenis === "kurir" ? k.kurir?.nama_layanan : k.toko?.nama_toko}
                      <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">({k.jenis})</span>
                    </p>
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
    </div>
  );
}
