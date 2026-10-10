'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Globe2, Menu, Phone, X } from 'lucide-react';
import { gsap } from 'gsap';
import { BrandLogo } from './BrandLogo';
import { useDealershipSettings } from './useDealershipSettings';
import styles from './SiteNavbar.module.css';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Our services', href: '/client/services' },
  { label: 'Buy a car', href: '/#inventory-section' },
  { label: 'Sell your car', href: '/client/sell-my-car' },
  { label: 'About us', href: '/client/about' },
];

export function SiteNavbar() {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const mobileMenuOpen = openPath === pathname;
  const header = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const menuPanel = useRef<HTMLDivElement>(null);
  const menuIcon = useRef<HTMLSpanElement>(null);
  const menuTimeline = useRef<gsap.core.Timeline | null>(null);
  const isMenuOpen = useRef(false);
  const reduceMotion = useRef(false);
  const contact = useDealershipSettings();
  const phoneHref = `tel:${contact.phone.replace(/[^+\d]/g, '')}`;

  useEffect(() => {
    const element = header.current;
    const panel = menuPanel.current;
    const icon = menuIcon.current;
    if (!element || !panel || !icon) return;

    // The disclosure is inaccessible immediately on close, including during its exit.
    isMenuOpen.current = false;
    panel.hidden = true;
    panel.inert = true;
    const media = gsap.matchMedia(element);
    media.add({
      mobile: '(max-width: 1000px)',
      desktop: '(min-width: 1001px)',
      reduced: '(prefers-reduced-motion: reduce)',
    }, (context) => {
      const { mobile, desktop, reduced } = context.conditions!;
      reduceMotion.current = reduced;
      menuTimeline.current = null;

      if (!mobile) {
        isMenuOpen.current = false;
        panel.hidden = true;
        panel.inert = true;
      }

      if (mobile && !reduced) {
        const items = panel.querySelectorAll('[data-menu-item]');
        const timeline = gsap.timeline({
          paused: true,
          defaults: { ease: 'power3.out' },
          onReverseComplete: () => { panel.hidden = true; },
        })
          .fromTo(panel,
            { opacity: 0, y: -10, clipPath: 'inset(0 0 100% 0)' },
            { opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)', duration: 0.42 }, 0)
          .fromTo(items, { opacity: 0, x: -12 },
            { opacity: 1, x: 0, duration: 0.32, stagger: 0.035 }, 0.09)
          .to(icon, { rotation: 90, duration: 0.34 }, 0);
        menuTimeline.current = timeline;
        if (isMenuOpen.current) {
          panel.hidden = false;
          panel.inert = false;
          timeline.progress(1);
        }
      } else {
        panel.hidden = !isMenuOpen.current;
        panel.inert = !isMenuOpen.current;
        gsap.set(icon, { rotation: isMenuOpen.current ? 90 : 0 });
      }

      if (desktop && !reduced) {
        gsap.from(element.querySelectorAll('[data-nav-item]'), {
          opacity: 0, y: 7, duration: 0.45, stagger: 0.035, ease: 'power2.out',
          clearProps: 'opacity,transform',
        });
      }

      return () => { menuTimeline.current = null; };
    });

    let frame = 0;
    const updateShadow = () => {
      frame = 0;
      element.dataset.scrolled = String(window.scrollY > 24);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(updateShadow); };
    updateShadow();
    window.addEventListener('scroll', onScroll, { passive: true });
    const mobileBreakpoint = window.matchMedia('(max-width: 1000px)');
    const onBreakpointChange = (event: MediaQueryListEvent) => {
      if (!event.matches) setOpenPath(null);
    };
    mobileBreakpoint.addEventListener('change', onBreakpointChange);
    return () => {
      window.removeEventListener('scroll', onScroll);
      mobileBreakpoint.removeEventListener('change', onBreakpointChange);
      cancelAnimationFrame(frame);
      media.revert();
      menuTimeline.current = null;
      panel.hidden = true;
      panel.inert = true;
    };
  }, [pathname]);

  const setMenuOpen = (open: boolean) => {
    const panel = menuPanel.current;
    setOpenPath(open ? pathname : null);
    isMenuOpen.current = open;
    if (!panel) return;
    panel.inert = !open;
    const timeline = menuTimeline.current;
    if (!timeline || reduceMotion.current) {
      panel.hidden = !open;
      if (menuIcon.current) gsap.set(menuIcon.current, { rotation: 0 });
      return;
    }
    if (open) {
      panel.hidden = false;
      timeline.timeScale(1).play();
    } else {
      if (timeline.progress() === 0) panel.hidden = true;
      timeline.timeScale(1.45).reverse();
    }
  };

  return (
    <header ref={header} className={styles.header} onKeyDown={(event) => {
      if (event.key === 'Escape' && mobileMenuOpen) {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    }}>
      <div className={styles.announcement}>
        <div className={styles.announcementInner}>
          <span>{contact.announcement}</span>
          <div className={styles.announcementContact}>
            <span className={styles.country}><Globe2 size={12} aria-hidden="true" /> Pakistan</span>
            <a href={phoneHref}><Phone size={12} aria-hidden="true" /> {contact.phone}</a>
          </div>
        </div>
      </div>
      <div className={styles.navInner}>
        <Link href="/" className={styles.brand} aria-label="Parakh Motors home" onClick={() => setMenuOpen(false)}>
          <BrandLogo />
        </Link>
        <nav aria-label="Main navigation" className={styles.desktopNav}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={styles.navLink}
              data-nav-item
              aria-current={!link.href.includes('#') && pathname === link.href ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link href="/client/inspection#booking-form" className={styles.bookingLink} data-motion-press data-nav-item>
          Book an inspection <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
        <button
          ref={menuButton}
          type="button"
          className={styles.menuButton}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
          data-motion-press
          onClick={() => setMenuOpen(!isMenuOpen.current)}
        >
          <span ref={menuIcon} className={styles.menuIcon}>
            {mobileMenuOpen ? <X size={23} aria-hidden="true" /> : <Menu size={23} aria-hidden="true" />}
          </span>
        </button>
      </div>
      <div ref={menuPanel} id="mobile-navigation" className={styles.mobileMenu} hidden inert aria-hidden={!mobileMenuOpen}>
        <nav aria-label="Mobile navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={!link.href.includes('#') && pathname === link.href ? 'page' : undefined}
              data-menu-item
              onClick={() => setMenuOpen(false)}
            >
              {link.label} <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          ))}
        </nav>
        <Link href="/client/inspection#booking-form" className={styles.mobileBooking} data-menu-item data-motion-press onClick={() => setMenuOpen(false)}>
          Book an inspection <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
        <a className={styles.mobilePhone} href={phoneHref} data-menu-item><Phone size={16} aria-hidden="true" /> {contact.phone}</a>
      </div>
    </header>
  );
}

