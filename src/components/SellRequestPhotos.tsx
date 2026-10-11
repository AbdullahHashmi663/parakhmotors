'use client';

import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { SellRequestPhoto } from '@/types';
import styles from './SellRequestPhotos.module.css';

export function SellRequestPhotos({ photos, vehicleName }: {
  photos?: SellRequestPhoto[];
  vehicleName: string;
}) {
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const previousOverflow = useRef('');

  const closeViewer = useCallback(() => {
    setActivePhotoIndex(null);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  const showPrevious = useCallback(() => {
    if (!photos?.length) return;
    setActivePhotoIndex((index) => index === null ? null : (index - 1 + photos.length) % photos.length);
  }, [photos]);

  const showNext = useCallback(() => {
    if (!photos?.length) return;
    setActivePhotoIndex((index) => index === null ? null : (index + 1) % photos.length);
  }, [photos]);

  useEffect(() => {
    if (activePhotoIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeViewer();
      if (event.key === 'ArrowLeft') showPrevious();
      if (event.key === 'ArrowRight') showNext();
    };

    document.addEventListener('keydown', handleKeyDown);
    previousOverflow.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow.current;
    };
  }, [activePhotoIndex, closeViewer, showNext, showPrevious]);

  if (!photos?.length) return null;

  return (
    <div className={styles.photos}>
      <p className={styles.label}>{photos.length} {photos.length === 1 ? 'photo' : 'photos'}</p>
      <ul className={styles.grid} aria-label={`Photos of ${vehicleName}`}>
        {photos.map((photo, index) => (
          <li key={photo.id}>
            <button
              type="button"
              className={styles.thumbnail}
              onClick={(event) => {
                triggerRef.current = event.currentTarget;
                setActivePhotoIndex(index);
              }}
              aria-label={`View photo ${index + 1} of ${vehicleName} full screen`}
            >
              <Image
                src={photo.url}
                alt={`${vehicleName}, submitted photo ${index + 1}`}
                width={photo.width}
                height={photo.height}
                loading="lazy"
                unoptimized
              />
            </button>
          </li>
        ))}
      </ul>
      {activePhotoIndex !== null && typeof document !== 'undefined' && createPortal((
        <div className={styles.viewer} onClick={closeViewer}>
          <section
            className={styles.viewerContent}
            role="dialog"
            aria-modal="true"
            aria-label={`${vehicleName} photos`}
            onClick={(event) => event.stopPropagation()}
            onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null; }}
            onTouchEnd={(event) => {
              const startX = touchStartX.current;
              const endX = event.changedTouches[0]?.clientX;
              if (startX === null || endX === undefined) return;
              const distance = endX - startX;
              if (Math.abs(distance) > 45) {
                if (distance > 0) showPrevious();
                else showNext();
              }
              touchStartX.current = null;
            }}
          >
            <button className={styles.closeButton} type="button" onClick={closeViewer} aria-label="Close full-screen photo viewer"><X size={25} /></button>
            {photos.length > 1 && <button className={`${styles.navButton} ${styles.previousButton}`} type="button" onClick={showPrevious} aria-label="Previous photo"><ChevronLeft size={30} /></button>}
            <Image
              key={activePhotoIndex}
              className={styles.fullImage}
              src={photos[activePhotoIndex].url}
              alt={`${vehicleName}, submitted photo ${activePhotoIndex + 1}`}
              width={photos[activePhotoIndex].width}
              height={photos[activePhotoIndex].height}
              unoptimized
              priority
            />
            {photos.length > 1 && <button className={`${styles.navButton} ${styles.nextButton}`} type="button" onClick={showNext} aria-label="Next photo"><ChevronRight size={30} /></button>}
            <span className={styles.photoCount}>{activePhotoIndex + 1} / {photos.length}</span>
          </section>
        </div>
      ), document.body)}
    </div>
  );
}
