/**
 * Rate Limiter — In-Memory
 * 
 * Basit in-memory rate limiter. Cold start'ta sıfırlanır, 
 * Vercel serverless ortamında birden fazla instance için state paylaşmaz
 * ancak abuse engellemek için yeterlidir.
 */

const attempts = new Map();

// Eski kayıtları temizle (memory leak önleme)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, data] of attempts) {
      if (now - data.firstAttempt > data.windowMs) {
        attempts.delete(key);
      }
    }
  }, 60 * 1000);
}

function checkInMemory(identifier, options) {
  const {
    maxAttempts = 5,
    windowMs = 15 * 60 * 1000,
    blockDurationMs = 15 * 60 * 1000,
  } = options;

  const now = Date.now();

  if (!attempts.has(identifier)) {
    attempts.set(identifier, {
      count: 1,
      firstAttempt: now,
      blockedUntil: null,
      windowMs,
    });
    return { allowed: true, remaining: maxAttempts - 1, retryAfterMs: 0 };
  }

  const data = attempts.get(identifier);

  if (data.blockedUntil && now < data.blockedUntil) {
    const retryAfterMs = data.blockedUntil - now;
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs,
      retryAfterSec: Math.ceil(retryAfterMs / 1000),
    };
  }

  if (data.blockedUntil && now >= data.blockedUntil) {
    attempts.set(identifier, { count: 1, firstAttempt: now, blockedUntil: null, windowMs });
    return { allowed: true, remaining: maxAttempts - 1, retryAfterMs: 0 };
  }

  if (now - data.firstAttempt > windowMs) {
    attempts.set(identifier, { count: 1, firstAttempt: now, blockedUntil: null, windowMs });
    return { allowed: true, remaining: maxAttempts - 1, retryAfterMs: 0 };
  }

  data.count++;

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

export async function checkRateLimit(identifier, options = {}) {
  const {
    maxAttempts = 5,
    windowMs = 15 * 60 * 1000,
    blockDurationMs = 15 * 60 * 1000,
  } = options;

  return checkInMemory(identifier, { maxAttempts, windowMs, blockDurationMs });
}

export async function resetRateLimit(identifier) {
  attempts.delete(identifier);
}
