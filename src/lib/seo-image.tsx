import { brandLogo } from '@/lib/brand-logo';
import { createThemeTokens } from '@/lib/theme-tokens';
import { formatMileage, formatPKR } from '@/lib/utils';
import type { Theme, Vehicle } from '@/types';

export const seoImageSize = { width: 1200, height: 630 };
export const seoImageUrl = '/api/og?v=inspection-logo';

/** Shared by every Open Graph and Twitter card; the actual vector logo is embedded. */
export function SeoImage({ theme, vehicle }: { theme: Theme; vehicle?: Vehicle }) {
  const { tokens: t } = createThemeTokens(theme);
  const title = vehicle ? `${vehicle.year} ${vehicle.title}` : 'A better drive. Starts with trust.';
  const detail = vehicle
    ? `${formatMileage(vehicle.mileage)}  ·  ${vehicle.transmission}  ·  ${vehicle.fuelType}`
    : 'Car inspections, buying and selling in Pakistan.';

  return <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: t['--pm-paper'], color: t['--pm-ink'], padding: '58px 70px', fontFamily: 'sans-serif', position: 'relative' }}>
    <svg width="1060" height="514" viewBox="0 0 1060 514" style={{ position: 'absolute', left: 70, top: 58 }}>
      <path d={brandLogo.mark} fill={t['--pm-green']} fillRule="evenodd" opacity="0.045" transform="translate(680 85) scale(1.2)" />
    </svg>
    <svg width={vehicle ? 390 : 680} height={vehicle ? 112 : 195} viewBox={brandLogo.viewBox}>
      <path d={brandLogo.mark} fill={t['--pm-green']} fillRule="evenodd" />
      <path d={brandLogo.wordmark} fill={t['--pm-green']} fillRule="evenodd" />
      <path d={brandLogo.accent} fill={t['--pm-muted']} fillRule="evenodd" />
    </svg>
    <div style={{ display: 'flex', flexDirection: 'column', marginTop: vehicle ? 48 : 40, maxWidth: 1000 }}>
      <div style={{ display: 'flex', fontSize: vehicle ? 54 : 52, fontWeight: 700, lineHeight: 1.12, letterSpacing: '-1.5px', maxHeight: 124, overflow: 'hidden' }}>{title}</div>
      <div style={{ display: 'flex', fontSize: 25, color: t['--pm-muted'], marginTop: 20 }}>{detail}</div>
      {vehicle && <div style={{ display: 'flex', fontSize: 36, fontWeight: 700, color: t['--pm-green'], marginTop: 24 }}>{formatPKR(vehicle.discountPrice ?? vehicle.price)}</div>}
    </div>
    <div style={{ display: 'flex', position: 'absolute', bottom: 38, left: 70, right: 70, justifyContent: 'space-between', borderTop: `1px solid ${t['--pm-line']}`, paddingTop: 20, color: t['--pm-muted'], fontSize: 20 }}>
      <span>parakhmotors.com</span><span>{vehicle ? vehicle.location : 'INSPECT  ·  BUY  ·  SELL'}</span>
    </div>
  </div>;
}
