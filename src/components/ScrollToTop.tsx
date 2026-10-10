'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

function scrollToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
}

function restorePagePosition() {
  // Section links keep their destination, including browser history returns.
  if (window.location.hash) {
    const hash = window.location.hash.slice(1);
    let id = hash;
    try { id = decodeURIComponent(hash); } catch { /* Use the literal fragment if it is not encoded correctly. */ }
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ block: 'start', behavior: 'instant' });
      return;
    }
  }
  scrollToTop();
}

export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    let samePageFrame: number | null = null;
    let historyFrame: number | null = null;

    const handleHistoryNavigation = () => {
      restorePagePosition();
      if (historyFrame !== null) window.cancelAnimationFrame(historyFrame);
      historyFrame = window.requestAnimationFrame(restorePagePosition);
    };

    const handleSamePageLink = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!(link instanceof HTMLAnchorElement) || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;

      if (link.origin === window.location.origin && link.pathname === window.location.pathname && link.search === window.location.search && !link.hash) {
        if (samePageFrame !== null) window.cancelAnimationFrame(samePageFrame);
        samePageFrame = window.requestAnimationFrame(scrollToTop);
      }
    };

    window.history.scrollRestoration = 'manual';
    window.addEventListener('pageshow', restorePagePosition);
    window.addEventListener('popstate', handleHistoryNavigation);
    document.addEventListener('click', handleSamePageLink, true);

    return () => {
      window.history.scrollRestoration = previousRestoration;
      window.removeEventListener('pageshow', restorePagePosition);
      window.removeEventListener('popstate', handleHistoryNavigation);
      document.removeEventListener('click', handleSamePageLink, true);
      if (samePageFrame !== null) window.cancelAnimationFrame(samePageFrame);
      if (historyFrame !== null) window.cancelAnimationFrame(historyFrame);
    };
  }, []);

  useEffect(() => {
    restorePagePosition();
    // Run after the router finishes its own scroll handling.
    const frame = window.requestAnimationFrame(restorePagePosition);
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
}
