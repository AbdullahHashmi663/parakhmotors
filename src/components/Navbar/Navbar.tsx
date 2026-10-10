'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './Navbar.module.css';

interface NavbarProps {
  onBookInspectionClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onBookInspectionClick }) => {
  return (
    <header className={styles.navbar}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.brand}>
          <Image
            src="/images/parakhmotors-logo.jpeg"
            alt="Parakh Motors Logo"
            width={120}
            height={44}
            className={styles.logoImg}
            priority
          />
          <div className={styles.brandText}>
            <span className={styles.brandName}>Parakh Motors</span>
            <span className={styles.brandTagline}>Trust Delivered</span>
          </div>
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
