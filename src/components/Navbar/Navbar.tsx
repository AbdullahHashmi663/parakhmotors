'use client';

import React from 'react';
import Link from 'next/link';
import { BrandLogo } from '../BrandLogo';
import styles from './Navbar.module.css';

interface NavbarProps {
  onBookInspectionClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onBookInspectionClick }) => {
  return (
    <header className={styles.navbar}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.brand}>
          <BrandLogo />
        </Link>

        <nav className={styles.navLinks}>
          <Link href="#inventory" className={`${styles.navLink} ${styles.navLinkActive}`}>
            Inventory
          </Link>
          <Link href="#inspection" className={styles.navLink}>
            Inspection
          </Link>
          <Link href="#sell-car" className={styles.navLink}>
            Sell My Car
          </Link>
          <Link href="#api-status" className={styles.navLink}>
            Backend APIs
          </Link>
        </nav>

        <div className={styles.actions}>
          <a
            href="https://wa.me/923134959787"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.phoneLink}
          >
            <span className={styles.phoneIcon}>📞</span>
            <span>+92 313 4959787</span>
          </a>

          <button
            type="button"
            className="btn-primary"
            onClick={onBookInspectionClick}
          >
            Book Inspection
          </button>
        </div>
      </div>
    </header>
  );
};
