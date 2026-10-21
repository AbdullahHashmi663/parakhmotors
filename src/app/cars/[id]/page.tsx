import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getPublicVehicle } from '@/lib/public-inventory';
import { formatMileage, formatPKR } from '@/lib/utils';
import { VehicleEnquiryForm } from '@/components/VehicleEnquiryForm';
import { seoImageUrl, seoImageSize } from '@/lib/seo-image';
import styles from './page.module.css';

type PageProps = { params: Promise<{ id: string }> };
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://parakhmotors.com';

function titleCaseVehicleText(value: string) {
  return value.trim()
    .replace(/(^|[\s-])([a-z])/gi, (_match, prefix: string, letter: string) => prefix + letter.toLocaleUpperCase())
    .replace(/\bBmw\b/gi, 'BMW')
    .replace(/\bByd\b/gi, 'BYD')
    .replace(/\bMg\b/gi, 'MG')
    .replace(/\bMini\b/gi, 'MINI')
    .replace(/\bNio\b/gi, 'NIO')
    .replace(/\bRam\b/gi, 'RAM');
}

function vehicleDisplayName(vehicle: { brand: string; title: string }) {
  const brand = titleCaseVehicleText(vehicle.brand);
  const title = titleCaseVehicleText(vehicle.title);
  return title.toLocaleLowerCase().startsWith(brand.toLocaleLowerCase())
    ? title
    : `${brand} ${title}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const vehicle = await getPublicVehicle(id);
  if (!vehicle) return { title: 'Car not found', robots: { index: false, follow: false } };
  const displayName = vehicleDisplayName(vehicle);
  const displayLocation = titleCaseVehicleText(vehicle.location);
  const description = `${vehicle.year} ${displayName} for sale in ${displayLocation}, Pakistan. ${formatMileage(vehicle.mileage)} · ${titleCaseVehicleText(vehicle.transmission)} · ${titleCaseVehicleText(vehicle.fuelType)}. Enquire with Parakh Motors.`;
  const image = new URL(`${seoImageUrl}&vehicle=${encodeURIComponent(vehicle.id)}`, siteUrl).toString();
  const canonical = `/cars/${encodeURIComponent(vehicle.id)}`;
  return {
    title: `${vehicle.year} ${displayName} for Sale in ${displayLocation}`,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      title: `${vehicle.year} ${displayName} | Parakh Motors`,
      description,
      url: canonical,
      images: [{ url: image, ...seoImageSize, alt: `${vehicle.year} ${displayName} — Parakh Motors` }],
    },
    twitter: { card: 'summary_large_image', title: `${vehicle.year} ${displayName} | Parakh Motors`, description, images: [image] },
  };
}

async function VehiclePageContent({ params }: PageProps) {
  const { id } = await params;
  const vehicle = await getPublicVehicle(id);
  if (!vehicle) notFound();

  const displayName = vehicleDisplayName(vehicle);
  const displayLocation = titleCaseVehicleText(vehicle.location);
  const canonicalUrl = new URL(`/cars/${encodeURIComponent(vehicle.id)}`, siteUrl).toString();
  const currentPrice = vehicle.discountPrice ?? vehicle.price;
  const image = new URL(vehicle.images[0] || '/images/parakh-journey.webp', siteUrl).toString();
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': ['Product', 'Car'],
    name: `${vehicle.year} ${displayName}`,
    description: vehicle.description || `${vehicle.year} ${displayName} in ${displayLocation}, Pakistan.`,
    image: vehicle.images.length ? vehicle.images.map((url) => new URL(url, siteUrl).toString()) : [image],
    sku: vehicle.id,
    brand: { '@type': 'Brand', name: titleCaseVehicleText(vehicle.brand) },
    model: vehicle.model,
    vehicleModelDate: String(vehicle.year),
    mileageFromOdometer: { '@type': 'QuantitativeValue', value: vehicle.mileage, unitCode: 'KMT' },
    vehicleTransmission: vehicle.transmission,
    fuelType: vehicle.fuelType,
    bodyType: vehicle.bodyType,
    color: vehicle.color || undefined,
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'PKR',
      price: currentPrice,
      availability: vehicle.status === 'reserved' ? 'https://schema.org/LimitedAvailability' : 'https://schema.org/InStock',
      itemCondition: vehicle.condition === 'brand_new' ? 'https://schema.org/NewCondition' : 'https://schema.org/UsedCondition',
      seller: { '@type': 'AutoDealer', name: 'Parakh Motors', url: siteUrl },
    },
  };

  const photos = vehicle.images.length ? vehicle.images : ['/images/parakh-journey.webp'];
  return <main className={styles.page}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
    <nav className={styles.breadcrumbs} aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/#inventory-section">Cars for sale</Link><span aria-hidden="true">/</span><span>{vehicle.title}</span></nav>
    <div className={styles.layout}>
      <section aria-label={`${vehicle.title} photos`}>
        <div className={styles.heroPhoto}><Image src={photos[0]} alt={`${vehicle.year} ${vehicle.title} in ${vehicle.color || 'available'} condition`} fill priority sizes="(max-width: 800px) 100vw, 62vw" /></div>
        {photos.length > 1 && <div className={styles.photoGrid}>{photos.slice(1).map((photo, index) => <div key={`${photo}-${index}`}><Image src={photo} alt={`${vehicle.title}, photo ${index + 2}`} fill sizes="(max-width: 800px) 50vw, 30vw" /></div>)}</div>}
      </section>
      <article className={styles.details}>
        <p className={styles.eyebrow}>{vehicle.condition === 'certified_pre_owned' ? 'Parakh Certified' : 'Inspected'} · Stock ID {vehicle.id}</p>
        <p className={styles.meta}>{vehicle.year} · {displayLocation}</p>
        <h1>{displayName}</h1>
        <div className={styles.price}><strong>{formatPKR(currentPrice)}</strong>{vehicle.discountPrice != null && <del>{formatPKR(vehicle.price)}</del>}</div>
        <p className={styles.status}>{vehicle.status === 'reserved' ? 'Reserved · enquire about availability' : 'Available for enquiry'}</p>
        <dl className={styles.specs}>
          <div><dt>Mileage</dt><dd>{formatMileage(vehicle.mileage)}</dd></div>
          <div><dt>Transmission</dt><dd>{vehicle.transmission}</dd></div>
          <div><dt>Fuel type</dt><dd>{vehicle.fuelType}</dd></div>
          <div><dt>Body type</dt><dd>{vehicle.bodyType}</dd></div>
          <div><dt>Colour</dt><dd>{vehicle.color || 'Contact us'}</dd></div>
          <div><dt>Inspection score</dt><dd>{vehicle.inspectionScore}/100</dd></div>
        </dl>
        {vehicle.description && <div className={styles.description}><h2>About this car</h2><p>{vehicle.description}</p></div>}
        {vehicle.features.length > 0 && <div className={styles.features}><h2>Features</h2><ul>{vehicle.features.map((feature) => <li key={feature}>{feature}</li>)}</ul></div>}
        <VehicleEnquiryForm vehicle={vehicle} />
        <p className={styles.disclaimer}>Vehicle information and availability are subject to confirmation by our team.</p>
      </article>
    </div>
  </main>;
}

export default function VehiclePage({ params }: PageProps) {
  return <Suspense fallback={<main className={styles.page}><p>Loading vehicle details…</p></main>}><VehiclePageContent params={params} /></Suspense>;
}
