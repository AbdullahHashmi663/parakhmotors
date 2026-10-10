'use client';

import { usePathname } from 'next/navigation';
import { useDealershipSettings } from './useDealershipSettings';
import styles from './WhatsAppButton.module.css';

export function WhatsAppButton() {
  const pathname = usePathname();
  const contact = useDealershipSettings();

  // Hide within the admin portal
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const cleanNumber = (contact.whatsapp || '+923218466662').replace(/\D/g, '');
  const prefilledMessage = encodeURIComponent('Hello Parakh Motors, I would like to inquire about your services and vehicles.');
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${prefilledMessage}`;

  return (
    <aside className={styles.wrapper} aria-label="WhatsApp Concierge">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.button}
        aria-label="Chat with Parakh Motors on WhatsApp"
        data-motion-press
      >
        <span className={styles.pulseRing} aria-hidden="true" />
        <span className={styles.iconWrapper} aria-hidden="true">
          <svg
            viewBox="0 0 32 32"
            width="32"
            height="32"
            fill="currentColor"
            aria-hidden="true"
            className={styles.icon}
          >
            <path d="M16.02 2C8.28 2 2 8.28 2 16.02c0 2.58.7 5.08 2.02 7.28L2 30l6.9-1.98A13.93 13.93 0 0 0 16.02 30C23.76 30 30 23.72 30 16.02 30 8.28 23.76 2 16.02 2zm0 25.56c-2.3 0-4.52-.66-6.44-1.9l-.46-.3-4.28 1.22 1.24-4.16-.3-.48a11.53 11.53 0 0 1-1.76-6.42C4 9.38 9.38 4 16.02 4c6.64 0 12.02 5.38 12.02 12.02 0 6.64-5.38 11.54-12.02 11.54zm6.6-8.62c-.36-.18-2.14-1.06-2.48-1.18-.32-.12-.56-.18-.8.18-.24.36-.92 1.18-1.12 1.42-.2.24-.4.26-.76.08-.36-.18-1.52-.56-2.9-1.78-1.08-.96-1.8-2.14-2.02-2.5-.2-.36-.02-.56.16-.74.16-.16.36-.42.54-.62.18-.2.24-.36.36-.6.12-.24.06-.44-.02-.62-.1-.18-.8-1.94-1.1-2.66-.3-.7-.6-.6-.82-.62l-.7-.02c-.24 0-.64.1-.98.46-.34.36-1.3 1.28-1.3 3.12 0 1.84 1.34 3.62 1.52 3.86.2.24 2.64 4.04 6.4 5.66.9.38 1.6.62 2.14.8.9.28 1.72.24 2.36.14.72-.1 2.14-.88 2.44-1.72.3-.84.3-1.56.22-1.72-.1-.16-.32-.26-.68-.44z" />
          </svg>
        </span>
        <span className={styles.label} aria-hidden="true">
          Chat on WhatsApp
        </span>
      </a>
    </aside>
  );
}
