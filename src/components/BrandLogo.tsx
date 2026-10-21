import styles from './BrandLogo.module.css';
import { brandLogo } from '@/lib/brand-logo';

type BrandLogoProps = {
  compact?: boolean;
  inverse?: boolean;
  className?: string;
};

/** Supplied inspection symbol and wordmark, colored by the selected theme. */
export function BrandLogo({ compact = false, inverse = false, className = '' }: BrandLogoProps) {
  const lettering = inverse ? 'var(--pm-inverse-text)' : 'var(--pm-green)';
  const secondary = inverse ? 'var(--pm-inverse-accent)' : 'var(--pm-muted)';
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
        <path d={brandLogo.mark} fill={lettering} fillRule="evenodd" />
      </g>
      {!compact && (
        <g fillRule="evenodd">
          <path d={brandLogo.wordmark} fill={lettering} />
          <path d={brandLogo.accent} fill={secondary} />
        </g>
      )}
    </svg>
  );
}
