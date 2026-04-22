/**
 * Plan bazlı özellik kısıtlamaları
 * Trial: Sınırlı özellikler (100MB upload, SMS yok, online ödeme yok)
 * Pro: Tüm özellikler açık
 */

const PLAN_LIMITS = {
  trial: {
    maxUploadMB: 100,        // 100 MB toplam yükleme limiti
    onlinePayment: false,     // PayTR online ödeme kapalı
    smsEnabled: false,        // SMS bildirimleri kapalı
    emailEnabled: true,       // E-posta bildirimleri açık
    customDomain: false,      // Özel alan adı yok
  },
  pro: {
    maxUploadMB: 10000,       // 10 GB
    onlinePayment: true,      // PayTR online ödeme açık
    smsEnabled: true,         // SMS bildirimleri açık
    emailEnabled: true,       // E-posta bildirimleri açık
    customDomain: true,       // Özel alan adı var
  },
};

/**
 * Tenant'ın plan limitlerini getir
 * @param {string} plan - "trial" veya "pro"
 * @returns Plan limitleri objesi
 */
export function getPlanLimits(plan) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.trial;
}

/**
 * Tenant'ın belirli bir özelliğe erişimi var mı?
 * @param {string} plan - "trial" veya "pro"  
 * @param {string} feature - "onlinePayment", "smsEnabled" vs.
 * @returns {boolean}
 */
export function hasFeature(plan, feature) {
  const limits = getPlanLimits(plan);
  return limits[feature] === true;
}

/**
 * Tenant'ın yükleme limitini aşıp aşmadığını kontrol et
 * @param {string} plan - "trial" veya "pro"
 * @param {number} currentUsageMB - Mevcut kullanım (MB)
 * @returns {{ allowed: boolean, limitMB: number, usedMB: number }}
 */
export function checkUploadLimit(plan, currentUsageMB) {
  const limits = getPlanLimits(plan);
  return {
    allowed: currentUsageMB < limits.maxUploadMB,
    limitMB: limits.maxUploadMB,
    usedMB: currentUsageMB,
    remainingMB: Math.max(0, limits.maxUploadMB - currentUsageMB),
  };
}
