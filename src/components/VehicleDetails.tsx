'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent, type TouchEvent as ReactTouchEvent } from 'react';
import { gsap } from 'gsap';
import { VehicleImage } from './VehicleImage';
import Link from 'next/link';
import { X, ArrowUpRight, ArrowLeft, ArrowRight, BadgeCheck, Check, CircleCheck, MapPin, Maximize2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import { formatPKR, formatMileage } from '@/lib/utils';
import type { Vehicle } from '@/types';
import styles from './VehicleDetails.module.css';

export function VehicleDetails({ vehicle, onClose, returnFocusTo }: { vehicle: Vehicle | null; onClose: () => void; returnFocusTo?: HTMLElement | null }) {
  return vehicle ? <VehicleDialog key={vehicle.id} vehicle={vehicle} onClose={onClose} returnFocusTo={returnFocusTo} /> : null;
}

function VehicleDialog({ vehicle, onClose, returnFocusTo }: { vehicle: Vehicle; onClose: () => void; returnFocusTo?: HTMLElement | null }) {
  const ref = useRef<HTMLDialogElement>(null);
  const photoViewer = useRef<HTMLDialogElement>(null);
  const photoViewerTrigger = useRef<HTMLButtonElement | null>(null);
  const photoViewerStage = useRef<HTMLDivElement>(null);
  const gallery = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const photoIndex = useRef(0);
  const photoTransitionId = useRef(0);
  const photoTransitioning = useRef(false);
  const feedback = useRef<HTMLDivElement>(null);
  const motion = useRef<gsap.Context | null>(null);
  const closing = useRef(false);
  const submitting = useRef(false);
  const opener = useRef<HTMLElement | null>(returnFocusTo ?? null);
  const openingPath = useRef('');
  const previousPhoto = useRef(0);
  const closeCallback = useRef(onClose);
  const [photo, setPhoto] = useState(0);
  const [photoTransition, setPhotoTransition] = useState<{ id: number; from: number; to: number; direction: number } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [requestReference, setRequestReference] = useState('');
  const photos = vehicle.images.length ? vehicle.images : ['/images/parakh-journey.webp'];
  const changePhoto = useCallback((target: number, direction: number) => {
    if (photoTransitioning.current) return;
    const from = photoIndex.current;
    const to = (target + photos.length) % photos.length;
    if (from === to) return;
    if (photoViewer.current?.open) {
      photoTransitioning.current = true;
      setPhotoTransition({ id: ++photoTransitionId.current, from, to, direction });
    }
    photoIndex.current = to;
    setPhoto(to);
  }, [photos.length]);
  const movePhoto = useCallback((direction: number) => {
    changePhoto(photoIndex.current + direction, direction);
  }, [changePhoto]);
  const selectPhoto = useCallback((index: number) => {
    changePhoto(index, index >= photoIndex.current ? 1 : -1);
  }, [changePhoto]);
  const openPhotoViewer = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    photoViewerTrigger.current = event.currentTarget;
    const viewer = photoViewer.current;
    if (viewer && !viewer.open) {
      viewer.showModal();
      viewer.focus();
    }
  }, []);
  const closePhotoViewer = useCallback(() => {
    if (photoViewer.current?.open) photoViewer.current.close();
    photoTransitioning.current = false;
    setPhotoTransition(null);
    photoViewerTrigger.current?.focus({ preventScroll: true });
  }, []);
  const handlePhotoTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };
  const handlePhotoTouchEnd = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const endX = event.changedTouches[0]?.clientX;
    if (endX === undefined) return;
    const distance = endX - touchStartX.current;
    touchStartX.current = null;
    if (distance < -48) movePhoto(1);
    else if (distance > 48) movePhoto(-1);
  };
  const restoreOpener = useCallback(() => {
    if (openingPath.current === window.location.pathname && opener.current?.isConnected) {
      opener.current.focus({ preventScroll: true });
    }
  }, []);
  const finishClose = useCallback(() => {
    // Native close must happen while connected so its focus return runs before removal.
    ref.current?.close();
    restoreOpener();
    closeCallback.current();
  }, [restoreOpener]);
  useEffect(() => { closeCallback.current = onClose; }, [onClose]);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    // Strict Mode replays setup after the dialog has already taken focus.
    // Keep the original trigger instead of replacing it with a dialog child or body.
    const focused = document.activeElement;
    if (!opener.current && focused instanceof HTMLElement && focused !== document.body && !dialog.contains(focused)) {
      opener.current = focused;
    }
    if (!openingPath.current) openingPath.current = window.location.pathname;
    dialog.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const media = gsap.matchMedia();
    media.add({ animate: '(prefers-reduced-motion: no-preference)', reduce: '(prefers-reduced-motion: reduce)' }, context => {
      motion.current = context;
      if (context.conditions?.reduce) {
        if (closing.current) finishClose();
        return;
      }
      gsap.fromTo(dialog, { opacity: 0, y: 34, scale: .96, '--dialog-backdrop-opacity': 0 }, { opacity: 1, y: 0, scale: 1, '--dialog-backdrop-opacity': 1, duration: .55, ease: 'power3.out' });
      gsap.fromTo(dialog.querySelectorAll('[data-dialog-detail]'), { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: .45, stagger: .055, delay: .17, ease: 'power2.out', clearProps: 'transform,opacity' });
    }, dialog);
    return () => {
      motion.current = null;
      media.revert();
      dialog.close();
      document.body.style.overflow = previous;
      // Removing the focused dialog can reset focus again during React's commit.
      if (closing.current) restoreOpener();
    };
  }, [finishClose, restoreOpener]);
  const closeDialog = useCallback(() => {
    const dialog = ref.current;
    if (closing.current) return;
    closing.current = true;
    if (!dialog || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !motion.current) {
      finishClose();
      return;
    }
    // Keep the native dialog open until the exit ends, so focus stays contained.
    motion.current.add(() => {
      gsap.killTweensOf(dialog);
      gsap.to(dialog, { y: 22, scale: .975, opacity: 0, '--dialog-backdrop-opacity': 0, duration: .22, ease: 'power2.in', onComplete: finishClose });
    });
  }, [finishClose]);
  useEffect(() => {
    const image = gallery.current?.querySelector('img');
    if (!image || previousPhoto.current === photo) return;
    previousPhoto.current = photo;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(image, { opacity: .35, scale: 1.025 }, { opacity: 1, scale: 1, duration: .4, ease: 'power2.out', clearProps: 'transform,opacity' });
    });
    return () => media.revert();
  }, [photo]);
  useEffect(() => {
    if (!photoTransition) return;
    const stage = photoViewerStage.current;
    const incoming = stage?.querySelector<HTMLElement>('[data-photo-incoming]');
    const outgoing = stage?.querySelector<HTMLElement>('[data-photo-outgoing]');
    if (!incoming || !outgoing) {
      photoTransitioning.current = false;
      setPhotoTransition(null);
      return;
    }

    const media = gsap.matchMedia();
    let timeline: gsap.core.Timeline | undefined;
    const finish = () => {
      photoTransitioning.current = false;
      setPhotoTransition((current) => current?.id === photoTransition.id ? null : current);
    };
    media.add({ animate: '(prefers-reduced-motion: no-preference)', reduce: '(prefers-reduced-motion: reduce)' }, (context) => {
      if (context.conditions?.reduce) {
        finish();
        return;
      }
      gsap.set(incoming, { xPercent: photoTransition.direction * 100, opacity: 0.78, scale: 0.985 });
      timeline = gsap.timeline({ onComplete: finish });
      timeline.to(outgoing, { xPercent: photoTransition.direction * -24, opacity: 0.35, scale: 0.985, duration: 0.36, ease: 'power2.inOut' }, 0);
      timeline.to(incoming, { xPercent: 0, opacity: 1, scale: 1, duration: 0.42, ease: 'power3.out' }, 0);
    });
    return () => {
      timeline?.kill();
      media.revert();
    };
  }, [photoTransition]);
  useEffect(() => {
    if (!success && !error) return;
    const target = feedback.current?.querySelector('[role="status"], [role="alert"]');
    if (!target) return;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(target, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: .4, ease: 'power2.out', clearProps: 'transform,opacity' });
      if (success) gsap.fromTo(target.querySelector('svg'), { scale: .7, rotation: -15 }, { scale: 1, rotation: 0, duration: .65, ease: 'back.out(1.5)', clearProps: 'transform' });
    });
    return () => media.revert();
  }, [success, error]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    const data = new FormData(event.currentTarget);
    setPending(true); setError('');
    try {
      const response = await api.inquiries.create({ name: String(data.get('name') || '').trim(), email: String(data.get('email') || '').trim(), phone: String(data.get('phone') || '').trim(), message: String(data.get('message') || '').trim() || `I'd like to know more about ${vehicle.title}.`, type: 'vehicle', vehicleId: vehicle.id });
      setRequestReference(response.data.id);
      setSuccess(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'Please try again. Your enquiry could not be sent.'); }
    finally { submitting.current = false; setPending(false); }
  }
  return <dialog ref={ref} className={styles.dialog} aria-labelledby="vehicle-dialog-title" onCancel={event => { event.preventDefault(); closeDialog(); }} onClick={event => { if (event.target === event.currentTarget) closeDialog(); }}>
    <div className={styles.content}><button type="button" data-motion-press className={styles.close} aria-label="Close vehicle details" onClick={closeDialog}><X aria-hidden="true" /></button>
      <div ref={gallery} className={styles.gallery}><button type="button" className={styles.expandPhoto} onClick={openPhotoViewer} aria-label={`View ${vehicle.title} photo ${photo + 1} full screen`}><VehicleImage key={photo} src={photos[photo]} alt={vehicle.title} fill sizes="(max-width: 760px) 95vw, 700px" /><span className={styles.expandHint}><Maximize2 aria-hidden="true" />View photos</span></button><span><BadgeCheck aria-hidden="true" />{vehicle.condition === 'certified_pre_owned' ? 'Parakh Certified' : 'Inspected'} · {vehicle.inspectionScore}/100</span></div>
      {photos.length > 1 && <div className={styles.thumbnails}>{photos.map((src, index) => <button type="button" data-motion-press key={`${src}-${index}`} aria-label={`Show vehicle photo ${index + 1}`} aria-pressed={index === photo} onClick={() => selectPhoto(index)}><VehicleImage src={src} alt="" width={86} height={56} /></button>)}</div>}
      <div className={styles.details}><div data-dialog-detail className={styles.meta}>{vehicle.year} · {vehicle.brand}<span><MapPin aria-hidden="true" />{vehicle.location}</span></div><h2 data-dialog-detail id="vehicle-dialog-title">{vehicle.title}</h2><div data-dialog-detail className={styles.price}><div className={styles.priceValues}><strong>{formatPKR(vehicle.discountPrice ?? vehicle.price)}</strong>{vehicle.discountPrice != null && <><del>{formatPKR(vehicle.price)}</del><b>Save {Math.round((vehicle.price - vehicle.discountPrice) / vehicle.price * 100)}%</b></>}</div><span>{vehicle.status === 'reserved' ? 'Reserved — ask about availability' : 'Available for enquiry'}</span></div><div data-dialog-detail className={styles.specs}>{[['Mileage', formatMileage(vehicle.mileage)], ['Transmission', vehicle.transmission], ['Fuel type', vehicle.fuelType], ['Colour', vehicle.color]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><p className={styles.description}>{vehicle.description}</p><div className={styles.features}>{vehicle.features.map(feature => <span key={feature}><Check aria-hidden="true" />{feature}</span>)}</div>
      <div ref={feedback} className={styles.formPanel}>{success ? <div className={styles.success} role="status"><CircleCheck aria-hidden="true" /><h3>Your next chapter is one step closer.</h3><p>Your enquiry has been received. Reference: #{requestReference}. Our team will contact you about this car.</p><button type="button" data-motion-press className="btn-secondary" onClick={closeDialog}>Keep exploring</button></div> : <><h3>Let’s talk about this car.</h3><p>Leave your details and our team will help with your next step.</p><form onSubmit={submit}><div className={styles.formGrid}><label>Your name<input name="name" required autoComplete="name" placeholder="Full name" minLength={2} /></label><label>Phone number<input name="phone" required type="tel" minLength={10} maxLength={20} autoComplete="tel" placeholder="03XX XXXXXXX" /></label><label className={styles.full}>Email address (optional)<input name="email" type="email" autoComplete="email" placeholder="you@example.com" /></label><label className={styles.full}>Anything you’d like to know?<textarea name="message" rows={3} placeholder="Ask about a viewing, condition or availability..." /></label></div>{error && <p className={styles.error} role="alert">{error}</p>}<button type="submit" data-motion-press className="btn-primary" disabled={pending}>{pending ? 'Sending your enquiry...' : 'Enquire about this car'}<ArrowUpRight aria-hidden="true" /></button></form></> }</div>
      <Link href="/client/inspection#booking-form" className={styles.inspectionLink}>Prefer an independent inspection? Explore your options <ArrowUpRight aria-hidden="true" /></Link></div>
      <dialog ref={photoViewer} className={styles.photoViewer} aria-label={`${vehicle.title} photo gallery`} tabIndex={-1} onCancel={(event) => { event.preventDefault(); closePhotoViewer(); }} onKeyDown={(event) => { if (event.key === 'ArrowRight') { event.preventDefault(); movePhoto(1); } else if (event.key === 'ArrowLeft') { event.preventDefault(); movePhoto(-1); } }} onClick={(event) => { if (event.target === event.currentTarget) closePhotoViewer(); }}>
        <div className={styles.photoViewerLayout}>
          <header className={styles.photoViewerHeader}><span aria-live="polite">{vehicle.title} · Photo {photo + 1} of {photos.length}</span><button type="button" className={styles.photoViewerClose} onClick={closePhotoViewer} aria-label="Close full-screen photos"><X aria-hidden="true" /></button></header>
          <div ref={photoViewerStage} className={styles.photoViewerStage} onTouchStart={handlePhotoTouchStart} onTouchEnd={handlePhotoTouchEnd} onTouchCancel={() => { touchStartX.current = null; }}>
            {photos.length > 1 && <button type="button" className={`${styles.photoViewerArrow} ${styles.photoViewerPrevious}`} onClick={() => movePhoto(-1)} aria-label="Show previous photo"><ArrowLeft aria-hidden="true" /></button>}
            {photoTransition && <VehicleImage key={`outgoing-${photoTransition.id}`} data-photo-outgoing="" aria-hidden="true" src={photos[photoTransition.from]} alt="" fill sizes="100vw" />}
            <VehicleImage key={`full-${photo}`} data-photo-incoming={photoTransition ? '' : undefined} src={photos[photo]} alt={`${vehicle.title}, photo ${photo + 1} of ${photos.length}`} fill sizes="100vw" />
            {photos.length > 1 && <button type="button" className={`${styles.photoViewerArrow} ${styles.photoViewerNext}`} onClick={() => movePhoto(1)} aria-label="Show next photo"><ArrowRight aria-hidden="true" /></button>}
          </div>
          {photos.length > 1 && <div className={styles.photoViewerThumbnails} aria-label="Choose a vehicle photo">{photos.map((src, index) => <button type="button" key={`${src}-${index}`} aria-label={`Show photo ${index + 1}`} aria-pressed={index === photo} onClick={() => selectPhoto(index)}><VehicleImage src={src} alt="" fill sizes="88px" /></button>)}</div>}
        </div>
      </dialog>
    </div>
  </dialog>;
}
