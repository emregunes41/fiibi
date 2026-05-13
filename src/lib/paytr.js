import crypto from "crypto";

const PAYTR_MERCHANT_ID = process.env.PAYTR_MERCHANT_ID;
const PAYTR_MERCHANT_KEY = process.env.PAYTR_MERCHANT_KEY;
const PAYTR_MERCHANT_SALT = process.env.PAYTR_MERCHANT_SALT;

/**
 * PayTR Direkt API Token Oluşturma
 * Sıralama KRİTİK:
 * merchant_id + user_ip + merchant_oid + email + payment_amount
 * + payment_type + installment_count + currency + test_mode + non_3d
 */
export function createPaytrToken({
  merchantId = PAYTR_MERCHANT_ID,
  userIp,
  merchantOid,
  email,
  paymentAmount,
  paymentType = "card",
  installmentCount = "0",
  currency = "TL",
  testMode = "0",
  non3d = "0",
}) {
  const merchantKey = PAYTR_MERCHANT_KEY;
  const merchantSalt = PAYTR_MERCHANT_SALT;

  const hashStr =
    merchantId +
    userIp +
    merchantOid +
    email +
    paymentAmount +
    paymentType +
    installmentCount +
    currency +
    testMode +
    non3d;

  const token = crypto
    .createHmac("sha256", merchantKey)
    .update(hashStr + merchantSalt)
    .digest("base64");

  return token;
}

/**
 * PayTR Callback Hash Doğrulama
 * hash = HMAC-SHA256(merchant_oid + merchant_salt + status + total_amount, merchant_key)
 */
export function verifyCallbackHash({ merchantOid, status, totalAmount, hash }) {
  const merchantKey = PAYTR_MERCHANT_KEY;
  const merchantSalt = PAYTR_MERCHANT_SALT;

  const hashStr = merchantOid + merchantSalt + status + totalAmount;
  const expectedHash = crypto
    .createHmac("sha256", merchantKey)
    .update(hashStr)
    .digest("base64");

  return expectedHash === hash;
}

/**
 * Benzersiz sipariş numarası oluştur
 * Format: SUB_{tenantId}_{timestamp}
 */
export function generateMerchantOid(prefix, tenantId) {
  return `${prefix}_${tenantId}_${Date.now()}`;
}

/**
 * merchant_oid'den tenant ID çıkar
 * "SUB_clxyz123_1715520000000" → "clxyz123"
 */
export function parseMerchantOid(merchantOid) {
  const parts = merchantOid.split("_");
  if (parts.length < 3) return null;
  return {
    type: parts[0], // SUB, REC
    tenantId: parts[1],
    timestamp: parts[2],
  };
}

/**
 * BACKWARD COMPAT: iFrame API callback doğrulama
 * Eski imza: verifyPaytrCallback({ merchant_oid, merchant_salt, status, total_amount, merchant_key }, hash)
 */
export function verifyPaytrCallback(params, hash) {
  const { merchant_oid, merchant_salt, status, total_amount, merchant_key } = params;
  const hashStr = merchant_oid + merchant_salt + status + total_amount;
  const expectedHash = crypto
    .createHmac("sha256", merchant_key)
    .update(hashStr)
    .digest("base64");
  return expectedHash === hash;
}

/**
 * BACKWARD COMPAT: iFrame API token oluşturma
 * Eski imza: generatePaytrToken({ merchant_id, user_ip, merchant_oid, email, payment_amount, user_basket, no_installment, max_installment, currency, test_mode, merchant_key, merchant_salt })
 */
export function generatePaytrToken(params) {
  const hashStr =
    params.merchant_id +
    params.user_ip +
    params.merchant_oid +
    params.email +
    params.payment_amount +
    params.user_basket +
    (params.no_installment || "0") +
    (params.max_installment || "0") +
    params.currency +
    params.test_mode;

  return crypto
    .createHmac("sha256", params.merchant_key)
    .update(hashStr + params.merchant_salt)
    .digest("base64");
}

