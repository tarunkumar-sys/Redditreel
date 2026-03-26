'use client';

import { useEffect } from 'react';

/**
 * Client-side security initializer
 * Runs security measures to prevent unauthorized access and data leakage
 */
export default function SecurityInitializer() {
  useEffect(() => {
    // Initialize all security measures on client side only
    if (typeof window === 'undefined') return;

    // Disable console in production
    if (process.env.NODE_ENV === 'production') {
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

      // Prevent right-click context menu
      document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
      });

      // Prevent DevTools shortcuts
      document.addEventListener('keydown', (e) => {
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.shiftKey && e.key === 'J') ||
            (e.ctrlKey && e.shiftKey && e.key === 'C') ||
            (e.ctrlKey && e.shiftKey && e.key === 'K')) {
          e.preventDefault();
          return false;
        }
      });

      // Protect localStorage/sessionStorage
      const sensitiveKeys = [
        'password',
        'token',
        'secret',
        'apiKey',
        'authorization',
        'sessionId',
      ];

      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key: string, value: string) {
        if (sensitiveKeys.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
          return;
        }
        originalSetItem.call(this, key, value);
      };

      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = function(key: string) {
        if (sensitiveKeys.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
          return null;
        }
        return originalGetItem.call(this, key);
      };
    }
  }, []);

  return null;
}
