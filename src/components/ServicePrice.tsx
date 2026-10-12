import { BadgePercent } from 'lucide-react';
import { formatServicePrice, servicePackageDiscountPercent, servicePackagePrice, servicePriceLabel, type ServiceOffering, type SiteContent, type ServicePackage } from '@/lib/site-content';
import styles from './ServicePrice.module.css';

function Range({ values }: { values: number[] }) {
  const low = Math.min(...values);
  const high = Math.max(...values);
  return <>{formatServicePrice(low)}{low !== high ? `–${high.toLocaleString('en-PK')}` : ''}</>;
}

export function ServicePrice({ item, unit = item.unit, compact = false }: { item: ServicePackage; unit?: string; compact?: boolean }) {
  const discount = servicePackageDiscountPercent(item);
  return <div className={`${styles.price} ${compact ? styles.compact : ''}`}>
    <div className={styles.amounts}><strong>{formatServicePrice(servicePackagePrice(item))}</strong>{discount > 0 && <del>{formatServicePrice(item.price)}</del>}{unit && <small> / {unit}</small>}</div>
    {discount > 0 && <span className={styles.badge}><BadgePercent aria-hidden="true" /><span><strong>SPECIAL DISCOUNT</strong><em>Save {discount}%</em></span></span>}
  </div>;
}

export function ServiceOfferingPrice({ content, offering }: { content: SiteContent; offering: ServiceOffering }) {
  const packages = content.packages.filter(item => offering.packageIds.includes(item.id) && item.enabled && item.price > 0);
  const discounts = packages.filter(item => servicePackageDiscountPercent(item) > 0);
  const discount = Math.max(0, ...discounts.map(servicePackageDiscountPercent));
  if (!packages.length) return <div className={styles.price}>{servicePriceLabel(content, offering)}</div>;
  const currentPrices = packages.map(servicePackagePrice);
  const originalPrices = packages.map(item => item.price);
  return <div className={styles.price}>
    <div className={styles.amounts}><strong><Range values={currentPrices} /></strong>{discount > 0 && <del><Range values={originalPrices} /></del>}</div>
    {discount > 0 && <span className={styles.badge}><BadgePercent aria-hidden="true" /><span><strong>SPECIAL DISCOUNT</strong><em>Save up to {discount}%</em></span></span>}
  </div>;
}
