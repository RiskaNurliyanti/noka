export const roleAccess = {
  super_admin: [
    "dashboard",
    "users",
    "toko",
    "kurir",
    "produk",
    "pesanan",
    "pengaturan",
  ],

  admin: [
    "dashboard",
    "toko",
    "produk",
    "pesanan",
  ],

  toko: [
    "dashboard",
    "produk",
    "pesanan",
  ],

  kurir: [
    "dashboard",
    "pengiriman",
  ],

  pembeli: [
    "dashboard",
    "pesanan_saya",
    "favorit",
  ],
}


export function canAccess(role, menu) {
  return roleAccess[role]?.includes(menu)
}