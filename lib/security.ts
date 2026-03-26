/**
 * Security utilities to prevent unauthorized access and data leakage
 */

/**
 * Disable console in production to prevent data leakage
 * Prevents users from accessing sensitive information via browser console
 */
export function disableConsole() {
  if (typeof window === 'undefined') return;

  // Only disable in production
  if (process.env.NODE_ENV !== 'production') return;

  // Override console methods
  const noop = () => {};
  
  console.log = noop;
  console.debug = noop;
  console.info = noop;
  console.warn = noop;
  console.error = noop;
  console.trace = noop;
  console.time = noop;
  console.timeEnd = noop;
  console.group = noop;
  console.groupEnd = noop;
  console.table = noop;
  console.assert = noop;
  console.clear = noop;
  console.count = noop;
  console.dir = noop;
  console.dirxml = noop;
  console.profile = noop;
  console.profileEnd = noop;

  // Prevent debugger
  Object.defineProperty(window, 'debugger', {
    get() {
      throw new Error('Debugger access denied');
    },
  });

  // Prevent devtools detection workarounds
  const devtools = { open: false, orientation: null };
  const threshold = 160;

  setInterval(() => {
    if (window.outerHeight - window.innerHeight > threshold ||
        window.outerWidth - window.innerWidth > threshold) {
      if (!devtools.open) {
        devtools.open = true;
        devtools.orientation = window.outerHeight > window.outerWidth ? 'vertical' : 'horizontal';
      }
    } else {
      devtools.open = false;
      devtools.orientation = null;
    }
  }, 500);
}

/**
 * Prevent sensitive data from being logged
 * Sanitizes objects before logging to prevent accidental data leakage
 */
export function sanitizeForLogging(obj: any): any {
  if (!obj) return obj;

  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'apiKey',
    'api_key',
    'authorization',
    'auth',
    'sessionId',
    'session_id',
    'accessToken',
    'access_token',
    'refreshToken',
    'refresh_token',
    'creditCard',
    'ssn',
    'email',
    'phone',
    'address',
  ];

  if (typeof obj !== 'object') return obj;

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
 * Prevent XSS attacks by sanitizing user input
 */
export function sanitizeHTML(html: string): string {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Prevent CSRF attacks by validating origin
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
 * Rate limiting helper
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
    const requests = this.requests.get(key) || [];

    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }

  reset(key: string): void {
    this.requests.delete(key);
  }
}

/**
 * Prevent localStorage/sessionStorage access for sensitive data
 */
export function secureStorage() {
  if (typeof window === 'undefined') return;

  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'apiKey',
    'authorization',
    'sessionId',
  ];

  // Override localStorage
  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key: string, value: string) {
    if (sensitiveKeys.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
      console.warn(`⚠️ Attempted to store sensitive data in storage: ${key}`);
      return;
    }
    originalSetItem.call(this, key, value);
  };

  // Override getItem to prevent access to sensitive data
  const originalGetItem = Storage.prototype.getItem;
  Storage.prototype.getItem = function(key: string) {
    if (sensitiveKeys.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
      console.warn(`⚠️ Attempted to access sensitive data from storage: ${key}`);
      return null;
    }
    return originalGetItem.call(this, key);
  };
}

/**
 * Prevent right-click context menu in production
 */
export function disableContextMenu() {
  if (typeof window === 'undefined') return;
  if (process.env.NODE_ENV !== 'production') return;

  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });
}

/**
 * Prevent keyboard shortcuts for devtools
 */
export function disableDevtoolsShortcuts() {
  if (typeof window === 'undefined') return;
  if (process.env.NODE_ENV !== 'production') return;

  document.addEventListener('keydown', (e) => {
    // F12 - DevTools
    if (e.key === 'F12') {
      e.preventDefault();
      return false;
    }

    // Ctrl+Shift+I - DevTools
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      return false;
    }

    // Ctrl+Shift+J - Console
    if (e.ctrlKey && e.shiftKey && e.key === 'J') {
      e.preventDefault();
      return false;
    }

    // Ctrl+Shift+C - Inspector
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      return false;
    }

    // Ctrl+Shift+K - Console (Firefox)
    if (e.ctrlKey && e.shiftKey && e.key === 'K') {
      e.preventDefault();
      return false;
    }
  });
}

/**
 * Initialize all security measures
 */
export function initializeSecurity() {
  if (typeof window === 'undefined') return;

  disableConsole();
  secureStorage();
  disableContextMenu();
  disableDevtoolsShortcuts();
}
