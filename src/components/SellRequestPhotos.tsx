import Image from 'next/image';
import type { SellRequestPhoto } from '@/types';
import styles from './SellRequestPhotos.module.css';

export function SellRequestPhotos({ photos, vehicleName }: {
  photos?: SellRequestPhoto[];
  vehicleName: string;
}) {
  if (!photos?.length) return null;

  return (
    <div className={styles.photos}>
      <p className={styles.label}>{photos.length} {photos.length === 1 ? 'photo' : 'photos'}</p>
      <ul className={styles.grid} aria-label={`Photos of ${vehicleName}`}>
        {photos.map((photo, index) => (
          <li key={photo.id}>
            <a
              className={styles.thumbnail}
              href={photo.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open photo ${index + 1} of ${vehicleName} in a new tab`}
            >
              <Image
                src={photo.url}
                alt={`${vehicleName}, submitted photo ${index + 1}`}
                width={photo.width}
                height={photo.height}
                loading="lazy"
                unoptimized
              />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
