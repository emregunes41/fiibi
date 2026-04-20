/**
 * Platform Sabitleri
 * Tüm platform genelinde kullanılan sabit değerler.
 * Hardcoded string'ler yerine bu sabitler kullanılmalıdır.
 */

export const PLATFORM = {
  // Temel bilgiler
  name: "fiibi",
  legalName: "fiibi Teknoloji",
  domain: "fiibi.co",
  supportEmail: "destek@fiibi.co",
  supportPhone: "+90 (212) 000 00 00",
  address: "İstanbul, Türkiye",

  // Ödeme / Komisyon
  defaultCommissionRate: 5, // %5 varsayılan komisyon
  paymentProvider: "PayTR",
  currency: "TRY",

  // Yasal
  taxId: "0000000000",         // Platform VKN (güncellenecek)
  mersisNo: "0000000000000000", // MERSİS numarası (güncellenecek)
  
  // Teknik
  sessionCookieName: "admin_token",
  cartStorageKey: "fiibi_cart",
};

/**
 * Sub-merchant (alt üye işyeri) yasal türleri
 */
export const LEGAL_TYPES = [
  { value: "personal", label: "Şahıs", description: "Gerçek kişi / Serbest meslek" },
  { value: "sole_proprietorship", label: "Şahıs Şirketi", description: "Şahıs şirketi (esnaf)" },
  { value: "limited", label: "Limited Şirketi", description: "Ltd. Şti." },
  { value: "joint_stock", label: "Anonim Şirket", description: "A.Ş." },
];

/**
 * Sub-merchant kayıt durumları
 */
export const SUB_MERCHANT_STATUS = {
  NOT_STARTED: "NOT_STARTED",
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};
