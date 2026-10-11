'use client';

import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react';
import Image from 'next/image';
import { Camera, X } from 'lucide-react';
import styles from './AdminVehiclePhotoUpload.module.css';

const MAX_PHOTOS = 20;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_TOTAL_SIZE = 30 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function AdminVehiclePhotoUpload({ onChange, disabled }: { onChange: (files: File[]) => void; disabled?: boolean }) {
  const id = useId();
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  const previewUrls = useRef(new Set<string>());
  const [error, setError] = useState('');

  useEffect(() => () => { previewUrls.current.forEach(URL.revokeObjectURL); previewUrls.current.clear(); }, []);

  function choosePhotos(event: ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = '';
    if (!chosen.length) return;
    const next = [...previews];
    let issue = '';
    for (const file of chosen) {
      if (!ACCEPTED_TYPES.includes(file.type)) { issue = 'Choose JPG, PNG or WebP photos.'; continue; }
      if (!file.size || file.size > MAX_FILE_SIZE) { issue = 'Each photo must be 5 MB or smaller.'; continue; }
      if (next.length >= MAX_PHOTOS) { issue = `Choose up to ${MAX_PHOTOS} photos.`; break; }
      if (next.reduce((total, item) => total + item.file.size, file.size) > MAX_TOTAL_SIZE) { issue = 'Selected photos must total 30 MB or less.'; break; }
      if (next.some((item) => item.file.name === file.name && item.file.size === file.size && item.file.lastModified === file.lastModified)) { issue = 'That photo is already selected.'; continue; }
      const url = URL.createObjectURL(file);
      previewUrls.current.add(url);
      next.push({ file, url });
    }
    setPreviews(next);
    onChange(next.map(({ file }) => file));
    setError(issue);
  }

  function removePhoto(index: number) {
    const removed = previews[index];
    if (removed) {
      URL.revokeObjectURL(removed.url);
      previewUrls.current.delete(removed.url);
    }
    const next = previews.filter((_, photoIndex) => photoIndex !== index);
    setPreviews(next);
    onChange(next.map(({ file }) => file));
    setError('');
  }

  return <div className={styles.upload}>
    <label className={styles.label} htmlFor={`${id}-files`}><Camera size={17} aria-hidden="true" />Upload car photos <span>(optional)</span></label>
    <input id={`${id}-files`} className={styles.input} type="file" multiple accept={ACCEPTED_TYPES.join(',')} onChange={choosePhotos} disabled={disabled || previews.length >= MAX_PHOTOS} aria-describedby={`${id}-hint${error ? ` ${id}-error` : ''}`} aria-invalid={!!error} />
    <p id={`${id}-hint`} className={styles.hint}>JPG, PNG or WebP · Up to 5 MB per photo · {previews.length}/{MAX_PHOTOS} selected. Photos are optimized before they appear in your car gallery.</p>
    {error && <p id={`${id}-error`} className={styles.error} role="alert">{error}</p>}
    {previews.length > 0 && <ul className={styles.previews} aria-label="Selected vehicle photos">{previews.map(({ file, url }, index) => <li key={`${file.name}-${file.lastModified}-${index}`}><div className={styles.preview}><Image src={url} alt={`Vehicle photo ${index + 1}`} fill sizes="100px" unoptimized /><button type="button" aria-label={`Remove vehicle photo ${index + 1}`} onClick={() => removePhoto(index)} disabled={disabled}><X size={15} aria-hidden="true" /></button></div><span>Photo {index + 1}</span></li>)}</ul>}
  </div>;
}
