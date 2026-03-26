/**
 * useScrollLock
 *
 * Production-ready scroll lock with:
 * - Ref-counted locking (safe for multiple concurrent modals)
 * - Scrollbar-width compensation (no layout shift)
 * - iOS Safari fix via position:fixed + scroll-position preservation
 * - Full cleanup on unmount
 */

let lockCount = 0;
let savedScrollY = 0;

function getScrollbarWidth(): number {
  if (typeof window === 'undefined') return 0;
  return window.innerWidth - document.documentElement.clientWidth;
}

function lock() {
  if (lockCount === 0) {
    savedScrollY = window.scrollY;

    const scrollbarWidth = getScrollbarWidth();

    // Compensate for scrollbar disappearing to prevent layout shift
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // position:fixed is the only reliable cross-browser (incl. iOS Safari) scroll lock
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
  }
  lockCount++;
}

function unlock() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';

    // Restore exact scroll position
    window.scrollTo({ top: savedScrollY, behavior: 'instant' as ScrollBehavior });
  }
}

import { useEffect } from 'react';

export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    lock();
    return () => unlock();
  }, [active]);
}
