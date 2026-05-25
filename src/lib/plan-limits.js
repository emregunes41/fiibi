/**
 * Plan bazlı özellik kısıtlamaları
 * 
 * trial: 7 günlük deneme (Basic ile aynı limitler)
 * basic: Temel özellikler, kısıtlı
 * pro: Tüm özellikler açık
 * 
 * ⚠️ Mağaza/Ürün satışı (moduleStore) tüm planlarda kapalıdır.
 */

const PLAN_LIMITS = {
  trial: {
    label: "Deneme",
    maxUploadMB: 100,
    maxPortfolioPhotos: 20,
    smsEnabled: false,
    emailEnabled: true,
    onlinePayment: false,  // 🔥 KART GIRMEDEN KAPALI
    customDomain: false,
    chatbotEnabled: false,
    heroBgChange: false,
    moduleStore: false,
    discoveryMarketplace: false, // 🔥 KART GIRMEDEN KAPALI
  },
  bio: {
    label: "Bio (Linktree)",
    maxUploadMB: 50,
    maxPortfolioPhotos: 0,
    smsEnabled: false,
    emailEnabled: false,
    onlinePayment: false,
    customDomain: false,
    chatbotEnabled: false,
    heroBgChange: false,
    moduleStore: false,
    discoveryMarketplace: false,
  },
  basic: {
    label: "Basic",
    maxUploadMB: 100,
    maxPortfolioPhotos: 20,
    smsEnabled: false,
    emailEnabled: true,
    onlinePayment: true,
    customDomain: false,
    chatbotEnabled: false,
    heroBgChange: false,
    moduleStore: false,
    discoveryMarketplace: true,
  },
  pro: {
    label: "Pro",
    maxUploadMB: 5000,            // 5 GB
    maxPortfolioPhotos: Infinity,
    smsEnabled: true,
    emailEnabled: true,
    onlinePayment: true,
    customDomain: true,
    chatbotEnabled: true,
    heroBgChange: true,
    moduleStore: false,           // Tüm planlarda kapalı
    discoveryMarketplace: true,
  },
};

/**
 * Tenant'ın plan limitlerini getir
 * @param {string} plan - "trial", "basic" veya "pro"
 * @returns Plan limitleri objesi
 */
export function getPlanLimits(plan) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.basic;
}

/**
 * Tenant'ın belirli bir özelliğe erişimi var mı?
 * @param {string} plan - "trial", "basic" veya "pro"
 * @param {string} feature - "onlinePayment", "smsEnabled", "chatbotEnabled" vs.
 * @returns {boolean}
 */
export function hasFeature(plan, feature) {
  const limits = getPlanLimits(plan);
  return limits[feature] === true;
}

/**
 * Tenant'ın yükleme limitini aşıp aşmadığını kontrol et
 * @param {string} plan - "trial", "basic" veya "pro"
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

/**
 * Portfolyo fotoğraf limiti kontrolü
 * @param {string} plan
 * @param {number} currentCount
 * @returns {{ allowed: boolean, limit: number, used: number }}
 */
export function checkPortfolioLimit(plan, currentCount) {
  const limits = getPlanLimits(plan);
  return {
    allowed: currentCount < limits.maxPortfolioPhotos,
    limit: limits.maxPortfolioPhotos,
    used: currentCount,
  };
}

/**
 * Plan karşılaştırma tablosu (UI için)
 */
export const PLAN_COMPARISON = [
  { feature: "E-posta Bildirimleri",       basic: true,     pro: true },
  { feature: "SMS Bildirimleri",           basic: false,    pro: true },
  { feature: "Online Ödeme",              basic: true,     pro: true },
  { feature: "Sınırsız Rezervasyon",      basic: true,     pro: true },
  { feature: "Sınırsız Paket/Hizmet",     basic: true,     pro: true },
  { feature: "Portfolyo Yönetimi",        basic: "20 fotoğraf", pro: "Sınırsız" },
  { feature: "İçerik Yükleme Limiti",     basic: "100 MB",  pro: "5 GB" },
  { feature: "Arka Plan Özelleştirme",    basic: false,    pro: true },
  { feature: "AI Chatbot",               basic: false,    pro: true },
  { feature: "Özel Alan Adı (Domain)",    basic: false,    pro: true },
  { feature: "Öncelikli Destek",          basic: false,    pro: true },
  { feature: "Gelişmiş Analitik",         basic: false,    pro: true },
];
