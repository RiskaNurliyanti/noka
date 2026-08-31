// Popup detail satu pengajuan klaim mitra buat ditinjau admin.
export default function ModalKlaimMitra({
  open,
  jenis,
  data,
  email,
  setEmail,
  onApprove,
  onClose,
}) {
  if (!open) return null;

  const nama =
    jenis === "kurir"
      ? data?.nama_layanan
      : data?.nama_toko;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-2">
          Klaim {jenis === "kurir" ? "Kurir" : "Toko"}
        </h2>

        <p className="text-sm text-gray-500 mb-4">
          Hubungkan <b>{nama}</b> dengan akun pengguna.
        </p>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email akun pemilik"
          className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 dark:bg-gray-800"
        />

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700"
          >
            Batal
          </button>

          <button
            onClick={onApprove}
            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}