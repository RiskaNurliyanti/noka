// Halaman ajukan klaim kepemilikan toko/kurir yang belum ada pemiliknya.
import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/apiClient";
import { useToast } from "../context/ToastContext";
import { formatNomor } from "../lib/whatsapp";

// Buat toko/kurir yang admin tambahkan duluan (belum ada pemiliknya) tapi
// UMKM aslinya belum join NOKA. Prosesnya tetap sama seperti fitur lain di
// NOKA: form ini cuma bikin catatan pengajuan, verifikasinya manuala sama
// admin lewat WhatsApp - bukan approval otomatis.

export default function KlaimMitra() {
  const { jenis } = useParams(); // 'toko' atau 'kurir'
  const [params] = useSearchParams();
  const id = params.get("id");
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [nomorWaAdmin, setNomorWaAdmin] = useState("");
  const [catatan, setCatatan] = useState("");
  const [loading, setLoading] = useState(false);
  const [terkirim, setTerkirim] = useState(false);

  const namaField = jenis === "kurir" ? "nama_layanan" : "nama_toko";

  const pesanWa = data
    ? [
        `Halo admin NOKA, saya mau klaim ${jenis === "kurir" ? "layanan antar" : "toko"} "${data[namaField]}" yang sudah ada di NOKA tapi belum saya daftarkan sendiri.`,
        `Jenis klaim: ${jenis === "kurir" ? "Kurir" : "Toko"}`,
        `Nama akun saya: ${profile?.nama || "-"}`,
        `Email akun: ${user?.email ?? "-"}`,
        catatan ? `Catatan: ${catatan}` : null,
      ].filter(Boolean).join("\n")
    : "";
  const nomorBersih = formatNomor(nomorWaAdmin || "");
  const linkWaAdmin = `https://wa.me/${nomorBersih}?text=${encodeURIComponent(pesanWa)}`;

  useEffect(() => {
    if (!id) return;

    // Ambil data kurir/toko yang diklaim
    api.get(`/${jenis === "kurir" ? "kurir" : "toko"}/${id}`).then((res) => setData(res.data));

    // Ambil nomor WhatsApp admin
    api.get("/admin-whatsapp").then((res) => setNomorWaAdmin(res.data?.no_whatsapp || ""));
  }, [id, jenis]);

  async function ajukanKlaim(e) {
    e.preventDefault();

    if (!user) {
      return navigate("/login");
    }

    setLoading(true);

    try {
      await api.post("/klaim", {
        jenis,
        catatan,
        [jenis === "kurir" ? "kurir_id" : "toko_id"]: id,
      });

      showToast("Pengajuan klaim berhasil dikirim.", "success");

      // Langsung buka WhatsApp admin
      if (nomorWaAdmin) {
        window.location.href = linkWaAdmin;
        return;
      }

      setTerkirim(true);
    } catch (err) {
      showToast("Gagal mengirim klaim: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  if (!data)
    return (
      <div className="max-w-md mx-auto px-4 py-10 text-gray-400 dark:text-gray-500">
        Memuat...
      </div>
    );

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
        {terkirim ? (
          <div className="text-center">
            <p className="text-3xl mb-2">✅</p>
            <h1 className="text-lg font-bold mb-2">Pengajuan klaim terkirim</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Pengajuan klaim berhasil dikirim.
              {nomorWaAdmin
                ? " WhatsApp admin sudah otomatis dibuka. Jika belum terbuka, gunakan tombol di bawah."
                : " Admin belum mengatur nomor WhatsApp."}
            </p>

            {nomorWaAdmin && (
              <a
                href={linkWaAdmin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-semibold rounded-full px-6 py-3 transition"
              >
                Buka WhatsApp Admin
              </a>
            )}
            <div>
              <button
                onClick={() => navigate("/")}
                className="mt-6 text-sm text-gray-400 dark:text-gray-500"
              >
                Kembali ke beranda
              </button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-lg font-bold mb-1">
              Klaim {jenis === "kurir" ? "layanan antar" : "toko"} ini
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              <strong>{data[namaField]}</strong> masih belum ada pemiliknya di
              NOKA. Kalau ini usahamu, ajukan klaim - admin akan verifikasi
              manual lewat WhatsApp sebelum akun kamu dijadikan pemilik.
            </p>

            {!user ? (
              <button
                onClick={() => navigate("/login")}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-full py-3 text-sm font-semibold"
              >
                Login akun NOKA dulu buat klaim
              </button>
            ) : (
              <form onSubmit={ajukanKlaim} className="space-y-3">
                <textarea
                  required
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Ceritakan buktinya, misal: nomor WhatsApp usaha, alamat, atau info lain yang bisa dicek admin"
                  rows={4}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                />
                <button
                  disabled={loading}
                  className="w-full bg-brand-500 text-white font-semibold rounded-full py-2.5 text-sm disabled:opacity-50"
                >
                  {loading ? "Mengirim..." : "Ajukan klaim"}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
