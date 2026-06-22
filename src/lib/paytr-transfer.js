import crypto from "crypto";

const PAYTR_MERCHANT_ID = process.env.PAYTR_MERCHANT_ID;
const PAYTR_MERCHANT_KEY = process.env.PAYTR_MERCHANT_KEY;
const PAYTR_MERCHANT_SALT = process.env.PAYTR_MERCHANT_SALT;

/**
 * PayTR Platform Transfer API — Transfer Talimatı
 * Pazaryeri modelinde, ödeme sonrası satıcıya hak edişini aktarır.
 *
 * @param {Object} params
 * @param {string} params.merchantOid   - Orijinal sipariş numarası (PayTR callback'ten gelen merchant_oid)
 * @param {string} params.transId       - Bu transfer için benzersiz takip numarası
 * @param {number} params.submerchantAmount - Satıcıya ödenecek tutar (kuruş cinsinden, örn: 92.00 TL → 9200)
 * @param {number} params.totalAmount   - Siparişin toplam tutarı (kuruş cinsinden)
 * @param {string} params.transferName  - Satıcının banka hesap adı/ünvanı
 * @param {string} params.transferIban  - Satıcının IBAN numarası
 * @returns {Promise<Object>} PayTR API yanıtı
 *
 * Başarılı: { status: "success", merchant_amount: "5", submerchant_amount: "92", trans_id: "...", reference: "..." }
 * Başarısız: { status: "error", err_no: "010", err_msg: "..." }
 */
export async function sendTransferRequest({
  merchantOid,
  transId,
  submerchantAmount,
  totalAmount,
  transferName,
  transferIban,
}) {
  const merchantId = PAYTR_MERCHANT_ID;
  const merchantKey = PAYTR_MERCHANT_KEY;
  const merchantSalt = PAYTR_MERCHANT_SALT;

  if (!merchantId || !merchantKey || !merchantSalt) {
    throw new Error("PayTR credentials eksik. PAYTR_MERCHANT_ID, PAYTR_MERCHANT_KEY, PAYTR_MERCHANT_SALT gerekli.");
  }

  // Token: merchant_id + merchant_oid + trans_id + submerchant_amount + total_amount + transfer_name + transfer_iban + merchant_salt
  const hashStr =
    merchantId +
    merchantOid +
    transId +
    String(submerchantAmount) +
    String(totalAmount) +
    transferName +
    transferIban;

  const paytrToken = crypto
    .createHmac("sha256", merchantKey)
    .update(hashStr + merchantSalt)
    .digest("base64");

  const formData = new URLSearchParams({
    merchant_id: merchantId,
    merchant_oid: merchantOid,
    trans_id: transId,
    submerchant_amount: String(submerchantAmount),
    total_amount: String(totalAmount),
    transfer_name: transferName,
    transfer_iban: transferIban,
    paytr_token: paytrToken,
  });

  const response = await fetch("https://www.paytr.com/odeme/platform/transfer", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString(),
  });

  const result = await response.json();
  return result;
}

/**
 * Transfer Callback Hash Doğrulama
 * PayTR, transferler tamamlandığında bildirim gönderir.
 * hash = HMAC-SHA256(trans_ids + merchant_salt, merchant_key)
 */
export function verifyTransferCallbackHash({ transIds, hash }) {
  const merchantKey = PAYTR_MERCHANT_KEY;
  const merchantSalt = PAYTR_MERCHANT_SALT;

  const expectedHash = crypto
    .createHmac("sha256", merchantKey)
    .update(transIds + merchantSalt)
    .digest("base64");

  return expectedHash === hash;
}

/**
 * Benzersiz transfer ID oluştur
 * PayTR kuralı: Alfanumerik, özel karakter yok, en fazla 60 karakter
 * Format: TRF{tenantId kısa}{reservationId kısa}{timestamp}
 */
export function generateTransferId(tenantId, reservationId) {
  const tId = String(tenantId).replace(/[^a-zA-Z0-9]/g, "").slice(-8);
  const rId = String(reservationId).replace(/[^a-zA-Z0-9]/g, "").slice(-12);
  return `TRF${tId}${rId}${Date.now()}`;
}

/**
 * Komisyon hesaplama — PayTR Pazaryeri Modeli
 *
 * Online ödeme tutarı üzerinden hesaplama yapılır (elden alınan kısım hariç).
 *
 * Örnek: 23.000₺ online ödeme, %6 komisyon, %3.99 PayTR:
 *   - Toplam komisyon: 23.000 * %6 = 1.380₺
 *   - PayTR payı: 23.000 * %3.99 = 917,70₺ (PayTR platform komisyonundan keser)
 *   - Fiibi net payı: 1.380 - 917,70 = 462,30₺
 *   - Satıcıya gidecek: 23.000 - 1.380 = 21.620₺
 *
 * @param {number} onlineAmountKurus - Online ödeme tutarı (kuruş cinsinden)
 * @param {number} commissionRate    - Toplam platform komisyon oranı (%, örn: 6)
 * @param {number} paytrFeeRate      - PayTR komisyon oranı (%, default: 3.99)
 * @returns {{ submerchantAmount, totalCommission, paytrFee, fiibiFee }}
 */
export function calculateTransferAmounts(onlineAmountKurus, commissionRate, paytrFeeRate = 3.99) {
  // Toplam platform komisyonu (Fiibi belirlediği oran)
  const totalCommission = Math.round(onlineAmountKurus * commissionRate / 100);

  // PayTR'ın payı — toplam tutardan kesilir, platform komisyonunun içinden çıkar
  const paytrFee = Math.round(onlineAmountKurus * paytrFeeRate / 100);

  // Fiibi'nin net kazancı = Toplam komisyon - PayTR payı
  const fiibiFee = Math.max(0, totalCommission - paytrFee);

  // Satıcıya aktarılacak tutar = Online ödeme - Toplam komisyon
  const submerchantAmount = onlineAmountKurus - totalCommission;

  return {
    submerchantAmount: Math.max(0, submerchantAmount),
    totalCommission,
    paytrFee,
    fiibiFee,
  };
}
