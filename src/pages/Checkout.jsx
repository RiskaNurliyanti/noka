import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/apiClient";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getCart, clearCart } from "../lib/cart";
import { formatNomor, formatDaftarProduk } from "../lib/whatsapp";
import SearchableSelect from "../components/SearchableSelect";
import PageHeader from "../components/PageHeader";

export default function Checkout() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // =========================
  // PART 1 - STATE
  // =========================

  const [items, setItems] = useState([]);
  const [toko, setToko] = useState(null);

  // "ambil_sendiri" atau "kurir"
  const [metodeAntar, setMetodeAntar] = useState("ambil_sendiri");

  const [kurirList, setKurirList] = useState([]);
  const [kurirId, setKurirId] = useState("");

  const [alamat, setAlamat] = useState("");
  const [catatan, setCatatan] = useState("");

  const [guestNama, setGuestNama] = useState("");
  const [guestWa, setGuestWa] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =========================
  // LOAD DATA
  // =========================

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const cart = getCart();

    if (!cart.length) {
      navigate("/keranjang");
      return;
    }

    setItems(cart);

    const [tokoRes, kurirRes] = await Promise.all([
      api.get(`/toko/${cart[0].toko_id}`),
      // Cuma kurir yang lagi tersedia (online) yang boleh dipilih.
      api.get("/kurir?tersedia=1&per_page=100"),
    ]);

    setToko(tokoRes.data);
    setKurirList(kurirRes.data?.data || []);
  }

  // =========================
  // TOTAL (estimasi tampilan - harga final dikunci ulang oleh backend saat checkout)
  // =========================

  const total = items.reduce(
    (total, item) => total + item.harga * item.qty,
    0
  );

  // =========================
  // KURIR DIPILIH
  // =========================

  const kurirDipilih = kurirList.find(
    (k) => String(k.id) === String(kurirId)
  );

  // =========================
  // HANDLE CHECKOUT
  // =========================

  const handleCheckout = async () => {
    // Buka tab WA KOSONG di sini juga, SEBELUM ada `await` apa pun -
    // ini "reservasi tempat" selagi izin popup dari klik pengguna masih
    // "fresh". Kalau window.open() dipanggil SETELAH await (mis. setelah
    // request API ke backend selesai), banyak browser modern (terutama
    // Safari & Chrome versi baru) menganggap izin dari klik pengguna sudah
    // kadaluarsa dan MEMBLOKIR popup-nya diam-diam - itu sebabnya WA
    // sempat berhenti muncul sama sekali padahal pesanan tetap berhasil
    // dibuat. Trik di sini: buka tab kosong duluan (selagi masih dianggap
    // bagian dari klik langsung), baru isi alamatnya belakangan pakai
    // `.location.href` setelah data pesanan (harga final dari backend)
    // siap - mengisi alamat tab yang SUDAH terbuka tidak butuh izin baru.
    const jendelaTokoAwal = window.open('', '_blank')
    const jendelaKurirAwal = metodeAntar === 'kurir' ? window.open('', '_blank') : null

    try {
      setLoading(true);
      setError("");

      // =========================
      // VALIDASI
      // =========================

      if (!toko) {
        throw new Error("Data toko belum dimuat");
      }

      if (!toko.sedang_buka) {
        throw new Error("Toko sedang tutup, tidak bisa checkout sekarang. Coba lagi nanti kalau toko sudah buka.");
      }

      if (metodeAntar === "kurir") {
        if (!kurirDipilih) {
          throw new Error("Silakan pilih kurir");
        }
        if (!alamat.trim()) {
          throw new Error("Alamat pengiriman wajib diisi kalau diantar kurir");
        }
      }

      if (!toko.no_whatsapp) {
        throw new Error("Toko ini belum punya nomor WhatsApp, hubungi admin dulu sebelum bisa menerima pesanan");
      }

      if (!items.length) {
        throw new Error("Keranjang kosong");
      }

      if (!user) {
        if (!guestNama.trim()) {
          throw new Error("Nama pembeli wajib diisi");
        }

        if (!guestWa.trim()) {
          throw new Error("Nomor WhatsApp wajib diisi");
        }
      }

      // =========================
      // SIMPAN PESANAN - harga & total dihitung ulang & dikunci oleh backend
      // (bukan dipercaya dari state frontend), lihat PesananController::store
      // =========================

      const res = await api.post("/pesanan", {
        toko_id: toko.id,
        kurir_id: metodeAntar === "kurir" ? kurirDipilih.id : null,
        alamat_antar: metodeAntar === "kurir" ? alamat : (alamat.trim() || null),
        catatan: catatan || null,
        guest_nama: user ? undefined : guestNama,
        guest_whatsapp: user ? undefined : guestWa,
        item: items.map((item) => ({ produk_id: item.produk_id, qty: item.qty, catatan: item.catatan || null })),
      });

      const pesanan = res.data;

      // =========================
      // PESAN WHATSAPP - dibangun dari data pesanan yang dikembalikan
      // backend (harga & total otoritatif), bukan dari state keranjang lokal.
      // =========================

      const daftarProduk = formatDaftarProduk(pesanan.item, { withSubtotal: true });

      const infoPembeli = `Pembeli :\n${user ? profile?.nama : guestNama}\n\nWA :\n${user ? profile?.no_whatsapp : guestWa}\n`;

      // Pesan buat TOKO - selalu dikirim, baik ambil sendiri MAUPUN
      // diantar kurir. Toko tetap perlu tahu ada pesanan masuk supaya bisa
      // mulai siapkan pesanannya, tidak peduli cara pengantarannya - dulu
      // toko cuma dapat WA kalau ambil_sendiri, sama sekali tidak dapat
      // kabar kalau pesanan diantar kurir (cuma kurir yang tahu).
      const pesanWaToko = `🛒 PESANAN BARU

Toko : ${toko.nama_toko}

${daftarProduk}

Total : Rp ${Number(pesanan.total_harga).toLocaleString("id-ID")}
${metodeAntar === "kurir"
  ? `\nDiantar kurir : ${kurirDipilih?.nama_layanan || "-"} (${kurirDipilih?.no_whatsapp || "-"})\n`
  : "\nDiambil sendiri oleh pembeli\n"}
Catatan :
${catatan || "-"}

${infoPembeli}`;

      // Pesan buat KURIR - cuma dikirim kalau metode antarnya emang kurir.
      const pesanWaKurir = `🛒 PESANAN BARU

Toko : ${toko.nama_toko}

${daftarProduk}

Total : Rp ${Number(pesanan.total_harga).toLocaleString("id-ID")}

Alamat antar :
${alamat}

Catatan :
${catatan || "-"}

${infoPembeli}`;

      // =========================
      // KIRIM WA - toko SELALU dapat kabar. Kalau diantar kurir, kurir
      // JUGA dapat pesan terpisah (2 tab WA sekaligus) - kalau ambil
      // sendiri, cuma toko yang perlu tahu (tidak ada kurir yang terlibat).
      // =========================

      // Isi tab yang SUDAH terbuka di awal fungsi tadi (bukan window.open()
      // baru) - lihat komentar panjang di awal handleCheckout kenapa ini
      // penting buat menghindari popup blocker.
      if (jendelaTokoAwal) {
        jendelaTokoAwal.location.href = `https://wa.me/${formatNomor(toko?.no_whatsapp || "")}?text=${encodeURIComponent(pesanWaToko)}`;
      } else {
        showToast(
          "Tab WhatsApp ke toko diblokir browser - buka manual dari halaman Pesanan Saya kalau perlu.",
          "error"
        );
      }

      if (metodeAntar === "kurir") {
        if (jendelaKurirAwal) {
          jendelaKurirAwal.location.href = `https://wa.me/${formatNomor(kurirDipilih?.no_whatsapp || "")}?text=${encodeURIComponent(pesanWaKurir)}`;
        } else {
          // Sebagian browser (terutama di HP) cuma mengizinkan 1 tab baru
          // per klik pengguna - tab kedua bisa saja tetap diblokir walau
          // sudah pakai trik "buka duluan". Kalau itu terjadi, kasih tahu
          // pengguna supaya tidak bingung kenapa kurirnya tidak dapat pesan.
          showToast(
            "Tab WhatsApp ke kurir diblokir browser - buka manual dari halaman Pesanan Saya kalau perlu.",
            "error"
          );
        }
      }

      clearCart();

      navigate("/pesanan-saya");
    } catch (err) {
      console.error(err);

      // Checkout gagal (validasi/API error) - tutup tab kosong yang sudah
      // sempat terbuka di awal tadi, jangan sampai nyisa tab blank percuma
      // kalau ternyata checkout-nya tidak jadi berhasil.
      jendelaTokoAwal?.close();
      jendelaKurirAwal?.close();

      setError(
        err.message || "Checkout gagal"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // RETURN
  // =========================

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-8 px-4">

  <div className="max-w-5xl mx-auto">

    {/* HEADER */}
    <PageHeader badge="🛒 Checkout" title="Checkout Pesanan" subtitle="Pilih cara pesananmu sampai, lalu lengkapi datanya." />

    {/* TOKO TUTUP - tampil dari awal, jangan tunggu pembeli isi form dulu
        baru dikasih tahu pas submit. */}
    {toko && !toko.sedang_buka && (
      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-2xl p-4 mb-4 flex items-start gap-3">
        <span className="text-xl">🔴</span>
        <div>
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">{toko.nama_toko} sedang tutup</p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
            Toko ini sedang tidak menerima pesanan. Coba lagi nanti kalau toko sudah buka, atau pilih toko lain.
          </p>
        </div>
      </div>
    )}

    {/* ERROR */}

    {error && (

      <div className="mb-6 bg-red-100 border border-red-300 text-red-700 rounded-xl p-4">

        {error}

      </div>

    )}

    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-6 space-y-6">

      {/* TOKO */}

      <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-2xl p-5">

        <h2 className="font-bold text-orange-700 dark:text-orange-400 text-lg">
          🏪 Toko
        </h2>

        <p className="mt-2 text-gray-700 dark:text-gray-300">
          {toko?.nama_toko || "-"}
        </p>

      </div>

      {/* METODE PENGANTARAN */}

      <div>

        <h2 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-3">
          🚦 Cara pesanan sampai
        </h2>

        <div className="grid grid-cols-2 gap-3">

          <button
            type="button"
            onClick={() => setMetodeAntar("ambil_sendiri")}
            className={`rounded-xl p-4 text-left border-2 transition ${
              metodeAntar === "ambil_sendiri"
                ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                : "border-gray-200 dark:border-gray-700"
            }`}
          >
            <p className="font-semibold text-gray-800 dark:text-gray-100">🚶 Ambil sendiri</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Chat langsung ke toko buat atur pengambilan</p>
          </button>

          <button
            type="button"
            onClick={() => setMetodeAntar("kurir")}
            className={`rounded-xl p-4 text-left border-2 transition ${
              metodeAntar === "kurir"
                ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                : "border-gray-200 dark:border-gray-700"
            }`}
          >
            <p className="font-semibold text-gray-800 dark:text-gray-100">🛵 Diantar kurir</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Chat langsung ke kurir yang kamu pilih</p>
          </button>

        </div>

      </div>

      {/* DATA PEMBELI */}

      {!user && (

        <div>

          <h2 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-3">
            👤 Data Pembeli
          </h2>

          <div className="grid md:grid-cols-2 gap-4">

            <input
              type="text"
              placeholder="Nama Lengkap"
              value={guestNama}
              onChange={(e)=>setGuestNama(e.target.value)}
              className="border dark:border-gray-700 rounded-xl p-3 text-gray-800 focus:ring-2 focus:ring-orange-400 outline-none"
            />

            <input
              type="text"
              placeholder="Nomor WhatsApp"
              value={guestWa}
              onChange={(e)=>setGuestWa(e.target.value)}
              className="border dark:border-gray-700 rounded-xl p-3 text-gray-800 focus:ring-2 focus:ring-orange-400 outline-none"
            />

          </div>

        </div>

      )}

      {/* ALAMAT - cuma wajib kalau diantar kurir */}

      {metodeAntar === "kurir" && (

        <div>

          <h2 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-3">
            📍 Alamat Pengiriman
          </h2>

          <textarea
            value={alamat}
            onChange={(e)=>setAlamat(e.target.value)}
            placeholder="Masukkan alamat lengkap..."
            className="w-full border dark:border-gray-700 rounded-xl p-4 h-28 text-gray-800 focus:ring-2 focus:ring-orange-400 outline-none"
          />

        </div>

      )}

      {/* PILIH KURIR - cuma muncul kalau metode diantar kurir */}

      {metodeAntar === "kurir" && (

      <div>

        <h2 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-3">
          🚚 Pilih Kurir
        </h2>

        {kurirList.length === 0 ? (

          <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada kurir yang tersedia saat ini. Coba pilih "Ambil sendiri" ya.</p>

        ) : (

        <SearchableSelect
          value={kurirId}
          onChange={setKurirId}
          placeholder="-- Pilih Kurir --"
          options={kurirList.map((k) => ({ value: k.id, label: k.nama_layanan }))}
        />

        )}

        {kurirDipilih && (

          <div className="mt-3 bg-green-100 text-green-700 rounded-xl p-3 font-semibold">

            ✓ Kurir :
            {" "}
            {kurirDipilih.nama_layanan}

          </div>

        )}

      </div>

      )}

      {/* CATATAN */}

      <div>

        <h2 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-3">
          📝 Catatan tambahan untuk pesanan ini
        </h2>

        <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
          Ini untuk catatan di luar produk, misalnya jam pengambilan/pengantaran. Catatan yang sudah kamu tulis per-produk (kalau ada) tetap ikut terkirim, tidak akan hilang.
        </p>

        <textarea
          value={catatan}
          onChange={(e)=>setCatatan(e.target.value)}
          placeholder="Contoh: ambil jam 3 sore"
          className="w-full border dark:border-gray-700 rounded-xl p-4 h-24 text-gray-800 focus:ring-2 focus:ring-orange-400 outline-none"
        />

      </div>

      {/* PRODUK */}

      <div>

        <h2 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-3">
          🛒 Produk
        </h2>

        <div className="space-y-3">

          {items.map((item)=>(

            <div
              key={item.produk_id}
              className="flex justify-between items-center border dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-800"
            >

              <div>

                <p className="font-semibold text-gray-800 dark:text-gray-100">

                  {item.nama}

                </p>

                <p className="text-sm text-gray-500 dark:text-gray-400">

                  {item.qty} × Rp {item.harga.toLocaleString("id-ID")}

                </p>

                {item.catatan && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    📝 {item.catatan}
                  </p>
                )}

              </div>

              <div className="font-bold text-orange-600 dark:text-orange-400">

                Rp {(item.qty * item.harga).toLocaleString("id-ID")}

              </div>

            </div>

          ))}

        </div>

      </div>
            {/* TOTAL */}

      <div className="
        bg-orange-500
        rounded-2xl
        p-5
        flex
        justify-between
        items-center
        text-white
      ">

        <span className="font-semibold text-lg">
          Total Bayar
        </span>

        <span className="text-2xl font-bold">
          Rp {total.toLocaleString("id-ID")}
        </span>

      </div>

      {/* BUTTON */}

      <button
        onClick={handleCheckout}
        disabled={loading || (toko && !toko.sedang_buka)}
        className="
          w-full
          bg-green-600
          hover:bg-green-700
          disabled:bg-gray-400
          disabled:cursor-not-allowed
          text-white
          font-bold
          text-lg
          py-4
          rounded-2xl
          shadow-lg
          transition
        "
      >

        {loading
          ? "Memproses Pesanan..."
          : toko && !toko.sedang_buka
            ? "🔴 Toko sedang tutup"
            : metodeAntar === "kurir"
              ? "✅ Buat Pesanan & Chat Kurir"
              : "✅ Buat Pesanan & Chat Toko"}

      </button>

    </div>

  </div>

</div>

  );
}
