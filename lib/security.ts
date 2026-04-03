/**
 * Server-side security utilities
 */

/**
 * Sanitizes objects before logging to prevent accidental data leakage.
 */
export function sanitizeForLogging(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  const sensitiveKeys = [
    'password', 'token', 'secret', 'apiKey', 'api_key',
    'authorization', 'auth', 'sessionId', 'session_id',
    'accessToken', 'access_token', 'refreshToken', 'refresh_token',
    'creditCard', 'ssn', 'email', 'phone', 'address',
  ];

  const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };

  for (const key in sanitized) {
    if (sensitiveKeys.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeForLogging(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * Validates that a request's origin matches its host — guards against CSRF.
 */
export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  if (!origin || !host) return false;

  try {
    const originUrl = new URL(origin);
    return originUrl.host === host;
  } catch {
    return false;
  }
}

/**
 * Simple in-memory rate limiter.
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const valid = (this.requests.get(key) || []).filter(t => now - t < this.windowMs);
    if (valid.length >= this.maxRequests) return false;
    valid.push(now);
    this.requests.set(key, valid);
    return true;
  }

  reset(key: string): void {
    this.requests.delete(key);
  }
}
