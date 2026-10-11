'use client';

import { useEffect, useState, type ComponentType } from 'react';

export function SiteMotionLoader() {
  const [Motion, setMotion] = useState<ComponentType | null>(null);
  useEffect(() => {
    let active = true;
    void import('./SiteMotion').then(({ SiteMotion }) => {
      if (active) setMotion(() => SiteMotion);
    });
    return () => { active = false; };
  }, []);
  return Motion ? <Motion /> : null;
}
