'use client';

import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react';
import Image from 'next/image';
import { Camera, CircleAlert, X } from 'lucide-react';
import { MAX_SELL_PHOTOS, SELL_PHOTO_TYPES } from '@/lib/sell-photo-rules';
import { validateOriginalSellPhoto } from '@/lib/prepare-sell-photos';
import s from './SellPhotoUpload.module.css';

type SelectedPhoto = { file: File; preview: string };

export default function SellPhotoUpload({ onChange, disabled }: { onChange: (photos: File[]) => void; disabled?: boolean }) {
  const id = useId();
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const [error, setError] = useState('');
  const previewUrls = useRef(new Set<string>());

  useEffect(() => {
    const urls = previewUrls.current;
    return () => { urls.forEach(url => URL.revokeObjectURL(url)); urls.clear(); };
  }, []);

  function selectPhotos(event: ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(event.currentTarget.files || []);
    event.currentTarget.value = '';
    if (disabled || !chosen.length) return;
    const accepted = [...photos];
    const errors = new Set<string>();
    for (const file of chosen) {
      const issue = validateOriginalSellPhoto(file);
      if (issue) { errors.add(issue); continue; }
      if (accepted.some(photo => photo.file.name === file.name && photo.file.size === file.size && photo.file.lastModified === file.lastModified && photo.file.type === file.type)) { errors.add('A photo you selected is already attached.'); continue; }
      if (accepted.length >= MAX_SELL_PHOTOS) { errors.add(`You can attach up to ${MAX_SELL_PHOTOS} photos. Remove one before adding more.`); continue; }
      const preview = URL.createObjectURL(file);
      previewUrls.current.add(preview);
      accepted.push({ file, preview });
    }
    setPhotos(accepted);
    onChange(accepted.map(photo => photo.file));
    setError([...errors].join(' '));
  }

  function removePhoto(index: number) {
    if (disabled) return;
    const photo = photos[index];
    URL.revokeObjectURL(photo.preview);
    previewUrls.current.delete(photo.preview);
    const remaining = photos.filter((_, photoIndex) => photoIndex !== index);
    setPhotos(remaining);
    onChange(remaining.map(photo => photo.file));
    setError('');
  }

  return <fieldset data-motion="reveal" className={s.upload} disabled={disabled}>
    <legend><Camera size={17} aria-hidden="true" />Car photos <span>(optional)</span></legend>
    <div className={s.chooser}>
      <label htmlFor={`${id}-photos`}>Add photos of your car</label>
      <p id={`${id}-hint`}>Up to {MAX_SELL_PHOTOS} photos · JPEG, PNG or WebP · 5 MB per photo. Include the exterior, interior and any visible damage.</p>
      <input id={`${id}-photos`} type="file" multiple accept={SELL_PHOTO_TYPES.join(',')} onChange={selectPhotos} disabled={disabled} aria-describedby={`${id}-hint${error ? ` ${id}-error` : ''}`} aria-invalid={!!error} />
    </div>
    {error && <p id={`${id}-error`} className={s.error} role="alert"><CircleAlert size={16} aria-hidden="true" /><span>{error}</span></p>}
    <p className={s.count} role="status" aria-live="polite">{photos.length ? `${photos.length} of ${MAX_SELL_PHOTOS} photos attached. ${photos.length === MAX_SELL_PHOTOS ? 'Remove a photo below to add another.' : 'You can add more or remove a photo below.'}` : 'Your photos will be sent securely with this request.'}</p>
    {photos.length > 0 && <ul className={s.previews} aria-label="Selected car photos">{photos.map((photo, index) => <li key={photo.preview}>
      <div className={s.preview}><Image src={photo.preview} alt={`Selected car photo ${index + 1}`} fill sizes="(max-width: 560px) 40vw, 180px" unoptimized /><button type="button" disabled={disabled} onClick={() => removePhoto(index)} aria-label={`Remove photo ${index + 1}`}><X size={16} aria-hidden="true" /></button></div>
      <span>Photo {index + 1}</span>
    </li>)}</ul>}
  </fieldset>;
}
