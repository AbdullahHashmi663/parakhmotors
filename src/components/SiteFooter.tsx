'use client';

import Link from 'next/link';
import { ArrowUpRight, Clock3, MapPin, MessageCircle } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { useDealershipSettings } from './useDealershipSettings';
import styles from './SiteFooter.module.css';

const services = [
  { label: 'Car inspection', href: '/client/inspection' },
  { label: 'Find your next car', href: '/client/car-finding' },
  { label: 'Sell your car', href: '/client/sell-my-car' },
  { label: 'Investor services', href: '/client/investor' },
];

const company = [
  { label: 'About Parakh', href: '/client/about' },
  { label: 'Our services', href: '/client/services' },
  { label: 'Contact us', href: '/client/contact' },
  { label: 'Privacy policy', href: '/client/privacy-policy' },
];

export function SiteFooter() {
  const contact = useDealershipSettings();
  const whatsappHref = `https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`;

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top} data-motion="stagger">
          <div data-motion-item>
            <p className={styles.eyebrow}>YOUR NEXT CHAPTER STARTS HERE</p>
            <h2>Good cars. <span>Better decisions.</span></h2>
          </div>
          <Link href="/client/contact" className={styles.contactButton} data-motion-item data-motion-press>
            Let&apos;s talk cars <ArrowUpRight size={19} aria-hidden="true" />
          </Link>
        </div>
        <div className={styles.main} data-motion="stagger">
          <div className={styles.brandColumn} data-motion-item>
            <Link href="/" aria-label="Parakh Motors home" className={styles.brand}><BrandLogo inverse /></Link>
            <p>{contact.tagline}</p>
            <a className={styles.whatsapp} href={whatsappHref} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={18} aria-hidden="true" /> Chat on WhatsApp <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          </div>
          <div className={styles.linkColumn} data-motion-item>
            <h3>What we do</h3>
            {services.map((link) => <Link href={link.href} key={link.href}>{link.label}</Link>)}
          </div>
          <div className={styles.linkColumn} data-motion-item>
            <h3>Get to know us</h3>
            {company.map((link) => <Link href={link.href} key={link.href}>{link.label}</Link>)}
          </div>
          <div className={styles.visitColumn} data-motion-item>
            <h3>Come say hello</h3>
            <p><MapPin size={17} aria-hidden="true" /> <span>{contact.address}</span></p>
            <p><Clock3 size={17} aria-hidden="true" /> <span>{contact.workingHours}</span></p>
            <a className={styles.phone} href={`tel:${contact.phone.replace(/[^+\d]/g, '')}`}>{contact.phone}</a>
            <a className={styles.email} href={`mailto:${contact.email}`}>{contact.email}</a>
          </div>
        </div>
        <div className={styles.bottom} data-motion="reveal">
          <p>© 2026 {contact.dealershipName}. All rights reserved.</p>
          <span>Made for the road ahead.</span>
          <Link href="/admin">Team access <ArrowUpRight size={12} aria-hidden="true" /></Link>
        </div>
      </div>
    </footer>
  );
}
