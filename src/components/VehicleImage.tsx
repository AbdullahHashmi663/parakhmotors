'use client';

import { useState } from 'react';
import Image, { type ImageProps } from 'next/image';

const fallback = '/images/parakh-journey.webp';

export function VehicleImage({ src, alt, ...props }: Omit<ImageProps, 'src'> & { src: string }) {
  const [failedSource, setFailedSource] = useState('');
  const validSource = /^\/(?!\/)/.test(src) || /^https?:\/\//i.test(src) ? src : fallback;
  const source = failedSource === validSource ? fallback : validSource;
  // Administrator supplied photos load directly in the browser. The server image
  // optimizer remains restricted to the configured Unsplash image host.
  const externalPhoto = /^https?:\/\//i.test(source) && !source.startsWith('https://images.unsplash.com/');
  return <Image {...props} alt={alt} src={source} unoptimized={props.unoptimized || externalPhoto} onError={(event) => {
    setFailedSource(validSource);
    props.onError?.(event);
  }} />;
}
