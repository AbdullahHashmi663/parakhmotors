'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function ScrollToTop() {
  const pathname = usePathname();
  const isFirstMount = useRef(true);

  useEffect(() => {
    // Only scroll to top on subsequent route navigation, NOT on initial load or page refresh
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    if (!window.location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [pathname]);

  return null;
}
