'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/** Only a committed page may be animated; streamed HTML stays untouched. */
export function MotionScene({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = root.current;
    if (!scene) return;
    scene.dataset.motionReady = 'true';
    scene.dispatchEvent(new CustomEvent('parakh:motion-ready', { bubbles: true }));
    return () => {
      scene.dataset.motionReady = 'false';
      scene.dispatchEvent(new CustomEvent('parakh:motion-ready', { bubbles: true }));
    };
  }, []);

  return <div ref={root} data-motion-scene data-motion-ready="false">{children}</div>;
}
