import { MAX_ORIGINAL_PHOTO_BYTES, MAX_SELL_PHOTOS, MAX_UPLOAD_PHOTO_BYTES, SELL_PHOTO_TYPES } from './sell-photo-rules';

export function validateOriginalSellPhoto(file: Pick<File, 'type' | 'size'>): string | undefined {
  if (!(SELL_PHOTO_TYPES as readonly string[]).includes(file.type)) return 'Choose JPEG, PNG or WebP photos.';
  if (!file.size) return 'Empty files cannot be added. Choose a different photo.';
  if (file.size > MAX_ORIGINAL_PHOTO_BYTES) return 'Each photo must be 5 MB or smaller.';
}

export function fitSellPhotoDimensions(width: number, height: number, maxWidth = 1600, maxHeight = 1200) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) throw new Error('This photo has invalid dimensions. Choose a different image.');
  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

async function decodePhoto(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; release: () => void }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
    } catch {
      // The image element supports formats that some browser bitmap decoders omit.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('This photo could not be opened. Choose a different JPEG, PNG or WebP image.'));
      image.src = url;
    });
    return { source: image, width: image.naturalWidth, height: image.naturalHeight, release: () => URL.revokeObjectURL(url) };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

function encodePhoto(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(blob => {
    if (!blob || blob.type !== 'image/webp') reject(new Error('Your browser could not prepare this photo. Try a current browser or choose a different image.'));
    else resolve(blob);
  }, 'image/webp', quality));
}

export async function prepareSellPhotos(files: readonly File[]): Promise<File[]> {
  if (files.length > MAX_SELL_PHOTOS) throw new Error(`You can attach up to ${MAX_SELL_PHOTOS} photos.`);
  const prepared: File[] = [];
  for (const [index, file] of files.entries()) {
    const validationError = validateOriginalSellPhoto(file);
    if (validationError) throw new Error(`Photo ${index + 1}: ${validationError}`);
    const image = await decodePhoto(file);
    const canvas = document.createElement('canvas');
    try {
      let dimensions = fitSellPhotoDimensions(image.width, image.height);
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Your browser could not prepare these photos. Please try another browser.');
      let blob: Blob | undefined;
      for (let sizeAttempt = 0; sizeAttempt < 7; sizeAttempt++) {
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;
        context.drawImage(image.source, 0, 0, dimensions.width, dimensions.height);
        for (const quality of [0.82, 0.7, 0.58, 0.46]) {
          blob = await encodePhoto(canvas, quality);
          if (blob.size <= MAX_UPLOAD_PHOTO_BYTES) break;
        }
        if (blob && blob.size <= MAX_UPLOAD_PHOTO_BYTES) break;
        dimensions = { width: Math.max(1, Math.round(dimensions.width * 0.75)), height: Math.max(1, Math.round(dimensions.height * 0.75)) };
      }
      if (!blob || !blob.size || blob.size > MAX_UPLOAD_PHOTO_BYTES) throw new Error(`Photo ${index + 1} could not be reduced for upload. Please choose another image.`);
      prepared.push(new File([blob], `car-photo-${index + 1}.webp`, { type: 'image/webp' }));
    } finally {
      image.release();
      canvas.width = 0;
      canvas.height = 0;
    }
  }
  return prepared;
}
