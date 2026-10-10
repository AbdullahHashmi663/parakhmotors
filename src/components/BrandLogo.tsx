import styles from './BrandLogo.module.css';
import { brandLogo } from '@/lib/brand-logo';

type BrandLogoProps = {
  compact?: boolean;
  inverse?: boolean;
  className?: string;
};

/** A sculpted car crest with an original vector wordmark; no font dependency. */
export function BrandLogo({ compact = false, inverse = false, className = '' }: BrandLogoProps) {
  const badge = inverse ? 'var(--pm-lime)' : 'var(--pm-button-bg)';
  const car = inverse ? 'var(--pm-accent-text)' : 'var(--pm-button-text)';
  const lettering = inverse ? 'var(--pm-inverse-text)' : 'var(--pm-green)';
  return (
    <svg
      className={`${styles.logo} ${compact ? styles.compact : ''} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={compact ? brandLogo.markViewBox : brandLogo.viewBox}
      fill="none"
      role="img"
      aria-label="Parakh Motors"
      focusable="false"
    >
      <g className={styles.mark}>
        <path d={brandLogo.crest} fill={badge} />
        <path className={styles.crestLine} d={brandLogo.inset} stroke={car} strokeWidth="0.8" />
        <g stroke={car} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path className={styles.carLine} d={brandLogo.roof} />
          <path d={brandLogo.body} />
          <path d={brandLogo.windshield} strokeWidth="1.25" />
          <path d={brandLogo.details} strokeWidth="1.5" />
        </g>
        {brandLogo.lights.map((path) => <path key={path} d={path} fill={car} />)}
        <path d={brandLogo.grille} stroke={car} strokeWidth="1.1" />
        <path d={brandLogo.horizon} stroke={car} strokeWidth="1" />
        <path d={brandLogo.diamond} fill={car} />
      </g>
      {!compact && (
        <g transform="translate(-6 0)" stroke={lettering} strokeLinecap="square" strokeLinejoin="miter">
          {brandLogo.wordmark.map((path) => <path key={path} d={path} strokeWidth="2.3" />)}
          {brandLogo.descriptor.map((path) => <path key={path} d={path} strokeWidth="1.2" />)}
          <path d={brandLogo.rules} strokeWidth="0.7" />
        </g>
      )}
    </svg>
  );
}
