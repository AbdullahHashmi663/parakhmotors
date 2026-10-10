'use client';

import React from 'react';
import Link from 'next/link';
import styles from './Footer.module.css';

export const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.top}>
          <div className={styles.brandCol}>
            <div className={styles.brandName}>
              Parakh Motors <span style={{ color: 'var(--primary-red)' }}>•</span>
            </div>
            <p className={styles.brandDesc}>
              Trust Better, Buy & Sell Fearlessly. Pakistan&apos;s authoritative platform for
              certified luxury vehicle inspections, verified inventory, and car concierge services.
            </p>
          </div>

          <div>
            <h4 className={styles.colTitle}>Services</h4>
            <ul className={styles.linkList}>
              <li>
                <Link href="#inspection" className={styles.linkItem}>
                  200+ Point Inspection
                </Link>
              </li>
              <li>
                <Link href="#inventory" className={styles.linkItem}>
                  Verified Inventory
                </Link>
              </li>
              <li>
                <Link href="#sell-car" className={styles.linkItem}>
                  Sell My Car
                </Link>
              </li>
              <li>
                <Link href="#api-status" className={styles.linkItem}>
                  Car Concierge
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className={styles.colTitle}>Architecture</h4>
            <ul className={styles.linkList}>
              <li>
                <Link href="/api/health" target="_blank" className={styles.linkItem}>
                  /api/health
                </Link>
              </li>
              <li>
                <Link href="/api/vehicles" target="_blank" className={styles.linkItem}>
                  /api/vehicles
                </Link>
              </li>
              <li>
                <Link href="/api/inspections" target="_blank" className={styles.linkItem}>
                  /api/inspections
                </Link>
              </li>
              <li>
                <Link href="/api/sell-requests" target="_blank" className={styles.linkItem}>
                  /api/sell-requests
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className={styles.colTitle}>Contact</h4>
            <div className={styles.contactInfo}>
              <div className={styles.contactItem}>
                <span>📍</span>
                <span>Lahore • Islamabad • Karachi</span>
              </div>
              <div className={styles.contactItem}>
                <span>📞</span>
                <span>+92 313 4959787</span>
              </div>
              <div className={styles.contactItem}>
                <span>✉️</span>
                <span>concierge@parakhmotors.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <div>© 2026 Parakh Motors. All Rights Reserved.</div>
          <div style={{ color: 'var(--text-muted)' }}>
            Full-Stack Next.js 16 (App Router + Route Handlers)
          </div>
        </div>
      </div>
    </footer>
  );
};
