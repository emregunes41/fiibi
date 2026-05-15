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
 * Format: TRF_{tenantId}_{reservationId}_{timestamp}
 */
export function generateTransferId(tenantId, reservationId) {
  return `TRF_${tenantId}_${reservationId}_${Date.now()}`;
}

/**
 * Komisyon hesaplama
 * Toplam tutardan platform komisyonunu düşerek satıcıya aktarılacak tutarı hesaplar.
 * Stopaj (%1) dahil edilir.
 *
 * @param {number} totalAmountKurus - Toplam tutar (kuruş)
 * @param {number} commissionRate   - Platform komisyon oranı (%)
 * @param {number} stopajRate       - Stopaj oranı (%, default: 1)
 * @returns {{ submerchantAmount: number, platformAmount: number, stopajAmount: number }}
 */
export function calculateTransferAmounts(totalAmountKurus, commissionRate, stopajRate = 1) {
  // Platform komisyonu
  const platformAmount = Math.round(totalAmountKurus * commissionRate / 100);

  // Stopaj: KDV ve vergiler hariç net satış tutarı üzerinden %1
  // Basitleştirilmiş hesap: toplam üzerinden %1
  const stopajAmount = Math.round(totalAmountKurus * stopajRate / 100);

  // Satıcıya aktarılacak tutar = toplam - komisyon - stopaj
  const submerchantAmount = totalAmountKurus - platformAmount - stopajAmount;

  return {
    submerchantAmount: Math.max(0, submerchantAmount),
    platformAmount,
    stopajAmount,
  };
}
