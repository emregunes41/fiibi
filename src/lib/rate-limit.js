/**
 * Basit In-Memory Rate Limiter
 * Serverless ortamda her cold start'ta sıfırlanır, ama brute force'u yavaşlatır.
 * Daha güçlü koruma için Upstash Redis ile değiştirilebilir.
 */

const attempts = new Map();

// Eski kayıtları temizle (memory leak önleme)
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of attempts) {
    if (now - data.firstAttempt > data.windowMs) {
      attempts.delete(key);
    }
  }
}, 60 * 1000); // Her 1 dakikada temizle

/**
 * Rate limit kontrolü
 * @param {string} identifier - IP adresi veya benzersiz tanımlayıcı
 * @param {object} options - { maxAttempts, windowMs, blockDurationMs }
 * @returns {{ allowed: boolean, remaining: number, retryAfterMs: number }}
 */
export function checkRateLimit(identifier, options = {}) {
  const {
    maxAttempts = 5,          // Maksimum deneme
    windowMs = 15 * 60 * 1000, // 15 dakika pencere
    blockDurationMs = 15 * 60 * 1000, // 15 dakika engelleme
  } = options;

  const now = Date.now();
  const key = identifier;

  if (!attempts.has(key)) {
    attempts.set(key, {
      count: 1,
      firstAttempt: now,
      blockedUntil: null,
      windowMs,
    });
    return { allowed: true, remaining: maxAttempts - 1, retryAfterMs: 0 };
  }

  const data = attempts.get(key);

  // Engellenmiş mi kontrol et
  if (data.blockedUntil && now < data.blockedUntil) {
    const retryAfterMs = data.blockedUntil - now;
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs,
      retryAfterSec: Math.ceil(retryAfterMs / 1000),
    };
  }

  // Engelleme süresi dolmuşsa sıfırla
  if (data.blockedUntil && now >= data.blockedUntil) {
    attempts.set(key, {
      count: 1,
      firstAttempt: now,
      blockedUntil: null,
      windowMs,
    });
    return { allowed: true, remaining: maxAttempts - 1, retryAfterMs: 0 };
  }

  // Pencere süresi dolmuşsa sıfırla
  if (now - data.firstAttempt > windowMs) {
    attempts.set(key, {
      count: 1,
      firstAttempt: now,
      blockedUntil: null,
      windowMs,
    });
    return { allowed: true, remaining: maxAttempts - 1, retryAfterMs: 0 };
  }

  // Sayacı artır
  data.count++;

  // Limit aşıldı mı?
  if (data.count > maxAttempts) {
    data.blockedUntil = now + blockDurationMs;
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: blockDurationMs,
      retryAfterSec: Math.ceil(blockDurationMs / 1000),
    };
  }

  return {
    allowed: true,
    remaining: maxAttempts - data.count,
    retryAfterMs: 0,
  };
}

/**
 * Başarılı girişten sonra sayacı sıfırla
 */
export function resetRateLimit(identifier) {
  attempts.delete(identifier);
}
