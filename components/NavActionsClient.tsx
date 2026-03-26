'use client';

import { useEffect, useRef } from 'react';

// Thin client wrapper: captures clicks on [data-login-trigger] buttons
// rendered by the NavActions server component and fires openLogin().
export default function NavActionsClient({
  children,
  onLogin,
}: {
  children: React.ReactNode;
  onLogin: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('[data-login-trigger]')) onLogin();
    };
    el.addEventListener('click', handler);
    return () => el.removeEventListener('click', handler);
  }, [onLogin]);

  return <div ref={ref} style={{ display: 'contents' }}>{children}</div>;
}
