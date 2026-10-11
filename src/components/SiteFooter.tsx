'use client';

import Link from 'next/link';
import { ArrowUpRight, Clock3, MapPin, MessageCircle, Globe } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { useDealershipSettings } from './useDealershipSettings';
import styles from './SiteFooter.module.css';
import { whatsappHref, resolveContentData } from '@/lib/site-content';

const company = [
  { label: 'About Parakh', href: '/client/about' },
  { label: 'Our services', href: '/client/services' },
  { label: 'Contact us', href: '/client/contact' },
  { label: 'Privacy policy', href: '/client/privacy-policy' },
];

export function SiteFooter() {
  const contact = useDealershipSettings();
  const content = resolveContentData(contact.websiteContent, contact);
  const whatsappUrl = whatsappHref(contact);
  const services = content.services.filter(item => item.enabled);
  const social = [{ href: content.contact.facebookUrl, label: 'Facebook' }, { href: content.contact.instagramUrl, label: 'Instagram' }, { href: content.contact.youtubeUrl, label: 'YouTube' }].filter(item => item.href);

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top} data-motion="stagger">
          <div data-motion-item>
            <p className={styles.eyebrow}>{content.footer.eyebrow}</p>
            <h2 style={{ whiteSpace: 'pre-line' }}>{content.footer.headline}</h2>
          </div>
          <Link href="/client/contact" className={styles.contactButton} data-motion-item data-motion-press>
            {content.footer.ctaLabel} <ArrowUpRight size={19} aria-hidden="true" />
          </Link>
        </div>
        <div className={styles.main} data-motion="stagger">
          <div className={styles.brandColumn} data-motion-item>
            <Link href="/" aria-label="Parakh Motors home" className={styles.brand}><BrandLogo inverse /></Link>
            <p>{contact.tagline}</p>
            <a className={styles.whatsapp} href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={18} aria-hidden="true" /> Chat on WhatsApp <ArrowUpRight size={15} aria-hidden="true" />
            </a>
            {social.length > 0 && <div className={styles.social}>{social.map(item => <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer"><Globe size={15} aria-hidden="true" />{item.label}</a>)}</div>}
          </div>
          <div className={styles.linkColumn} data-motion-item>
            <h3>What we do</h3>
            {services.map((link) => <Link href={link.href} key={link.id}>{link.title}</Link>)}
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
          <p>© {content.footer.copyrightYear} {contact.dealershipName}. All rights reserved.</p>
          <span>{content.footer.note}</span>
          <Link href="/admin">Team access <ArrowUpRight size={12} aria-hidden="true" /></Link>
        </div>
      </div>
    </footer>
  );
}
