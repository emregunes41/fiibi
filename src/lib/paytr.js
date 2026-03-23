import crypto from 'crypto';

export function generatePaytrToken(params) {
  const {
    merchant_id, merchant_key, merchant_salt,
    user_ip, merchant_oid, email, payment_amount,
    user_basket, debug_on, app_type, no_installment, max_installment,
    currency, test_mode
  } = params;

  // PayTR Hashing Format: merchant_id + user_ip + merchant_oid + email + payment_amount + user_basket + debug_on + app_type + no_installment + max_installment + currency + test_mode + merchant_salt
  const hashString = 
    merchant_id + user_ip + merchant_oid + email + payment_amount + 
    user_basket + debug_on + app_type + no_installment + 
    max_installment + currency + test_mode + merchant_salt;

  return crypto
    .createHmac('sha256', merchant_key)
    .update(hashString)
    .digest('base64');
}

export function verifyPaytrCallback(params, incomingHash) {
  const { merchant_oid, merchant_salt, status, total_amount, merchant_key } = params;
  
  // PayTR Callback Verification: merchant_oid + merchant_salt + status + total_amount
  const hashString = merchant_oid + merchant_salt + status + total_amount;
  
  const expectedHash = crypto
    .createHmac('sha256', merchant_key)
    .update(hashString)
    .digest('base64');
    
  return expectedHash === incomingHash;
}
