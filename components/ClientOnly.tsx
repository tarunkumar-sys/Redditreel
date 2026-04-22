'use client';

import { useEffect, useState } from 'react';

/**
 * ClientOnly Component
 * 
 * Ensures children only render on the client side, preventing hydration mismatches.
 * Useful for components that absolutely must run client-side only.
 * 
 * @example
 * ```tsx
 * <ClientOnly>
 *   <ComponentWithBrowserAPIs />
 * </ClientOnly>
 * ```
 * 
 * @example With fallback
 * ```tsx
 * <ClientOnly fallback={<LoadingSkeleton />}>
 *   <HeavyComponent />
 * </ClientOnly>
 * ```
 */
export default function ClientOnly({ 
  children,
  fallback = null,
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Return fallback during SSR and initial client render
  if (!mounted) return <>{fallback}</>;

  // Return children only after mount (client-side only)
  return <>{children}</>;
}
