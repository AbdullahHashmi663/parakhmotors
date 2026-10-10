'use client';

import { useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';

export function ScrollToTop() {
  const pathname = usePathname();
  useLayoutEffect(() => {
    // Opening and refreshing a page starts at the top; explicit anchors remain usable.
    const restoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    if (!window.location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    return () => { window.history.scrollRestoration = restoration; };
  }, [pathname]);

  return null;
}
