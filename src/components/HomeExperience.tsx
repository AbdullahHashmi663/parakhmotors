'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { animate, createScope } from 'animejs';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, ArrowRight, ShieldCheck, Search, CarFront, BadgeCheck, ScanLine, Handshake, Check, Heart, MapPin, Gauge, Fuel, SlidersHorizontal, ChevronDown, Compass, MessageCircle, Plus, Minus, CircleCheck } from 'lucide-react';
import { SiteNavbar } from '@/components/SiteNavbar';
import { SiteFooter } from '@/components/SiteFooter';
import { VehicleDetails } from '@/components/VehicleDetails';
import { VehicleImage } from '@/components/VehicleImage';
import { MotionScene } from '@/components/MotionScene';
import { useDealershipSettings, defaultContact } from '@/components/useDealershipSettings';
import { api } from '@/lib/api-client';
import { formatPKR, formatMileage } from '@/lib/utils';
import type { Vehicle } from '@/types';
import styles from './HomeExperience.module.css';

const services = [
  { title: 'Know what you’re buying.', label: 'Car inspection', text: 'A closer look at every detail. Get the full picture with our independent 200+ point inspection.', href: '/client/inspection', cta: 'Explore inspections', icon: ScanLine, photo: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=640&q=85', alt: 'Careful examination of a vehicle engine', tag: 'FROM PKR 7,000' },
  { title: 'Your perfect car. Found.', label: 'Car sourcing', text: 'Tell us what drives you. We find, verify and shortlist the right cars for your life and your budget.', href: '/client/car-finding', cta: 'Find it for me', icon: Compass, photo: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=640&q=85', alt: 'Silver sports car on a quiet road', tag: 'PERSONAL TO YOU' },
  { title: 'A better way to sell.', label: 'Sell your car', text: 'From an honest valuation to the final handshake. We handle the details so you can move forward.', href: '/client/sell-my-car', cta: 'Start selling', icon: Handshake, photo: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=640&q=85', alt: 'Premium vehicle ready for its next owner', tag: 'LESS HASSLE. MORE VALUE.' },
];
const questions = [
  { question: 'What does a 200+ point inspection cover?', answer: 'We inspect the engine and transmission, body and paint, chassis, suspension, brakes, tyres, electronics and interior. You receive a detailed report of our findings so you can make an informed decision before buying.' },
  { question: 'Can you help me find a specific car?', answer: 'Yes. Share your preferred make, model, budget and city through our car sourcing form. Our team will search for suitable options, verify their condition and help you assess your shortlist.' },
  { question: 'How do I sell my car through Parakh?', answer: 'Start with the selling form and share your vehicle details and expected price. We will get in touch to discuss a valuation, arrange an inspection and guide you through listing, negotiations and the handover.' },
  { question: 'Where are your services available?', answer: 'Our base is in Gulberg III, Lahore. We also support vehicle sourcing across Pakistan. Share your city when booking and our team will confirm inspection availability and arrangements for your location.' },
];

export function HomeExperience({ initialVehicles }: { initialVehicles: Vehicle[] }) {
  const contact = useDealershipSettings();
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [query, setQuery] = useState('');
  const [brand, setBrand] = useState('all');
  const [body, setBody] = useState('all');
  const [budget, setBudget] = useState('all');
  const [showAll, setShowAll] = useState(false);
  const [shortlist, setShortlist] = useState<string[]>([]);
  const [shortlistOnly, setShortlistOnly] = useState(false);
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [vehicleTrigger, setVehicleTrigger] = useState<HTMLButtonElement | null>(null);
  function openVehicle(vehicle: Vehicle, trigger: HTMLButtonElement) { setVehicleTrigger(trigger); setSelected(vehicle); }
  const [inventoryError, setInventoryError] = useState(false);
  const [inventoryLoading, setInventoryLoading] = useState(initialVehicles.length === 0);
  const inventoryMounted = useRef(false);
  const refreshInventory = useCallback(async () => {
    setInventoryLoading(true);
    setInventoryError(false);
    try {
      const firstPage = await api.vehicles.list({ limit: 100, page: 1 });
      const collection = [...firstPage.data];
      for (let page = 2; page <= (firstPage.meta?.totalPages ?? 1); page += 1) {
        if (!inventoryMounted.current) return;
        collection.push(...(await api.vehicles.list({ limit: 100, page })).data);
      }
      if (inventoryMounted.current) setVehicles(collection);
    } catch {
      if (inventoryMounted.current) setInventoryError(true);
    } finally {
      if (inventoryMounted.current) setInventoryLoading(false);
    }
  }, []);
  useEffect(() => {
    inventoryMounted.current = true;
    void Promise.resolve().then(() => { if (inventoryMounted.current) return refreshInventory(); });
    return () => { inventoryMounted.current = false; };
  }, [refreshInventory]);
  const filtered = useMemo(() => vehicles.filter(v => {
    if (v.status === 'sold') return false;
    if (shortlistOnly && !shortlist.includes(v.id)) return false;
    if (brand !== 'all' && v.brand !== brand) return false;
    if (body !== 'all' && v.bodyType !== body) return false;
    if (budget === 'under30' && v.price >= 30000000) return false;
    if (budget === '30to60' && (v.price < 30000000 || v.price > 60000000)) return false;
    if (budget === 'over60' && v.price <= 60000000) return false;
    return `${v.title} ${v.model} ${v.brand} ${v.location}`.toLowerCase().includes(query.toLowerCase().trim());
  }), [vehicles, brand, body, budget, query, shortlistOnly, shortlist]);
  const hasFilters = query.trim() || brand !== 'all' || body !== 'all' || budget !== 'all' || shortlistOnly;
  const visible = showAll || hasFilters ? filtered : filtered.slice(0, 3);
  const brands = [...new Set(vehicles.filter(v => v.status !== 'sold').map(v => v.brand))].sort();
  const resultsCount = useRef<HTMLSpanElement>(null);
  const previousCount = useRef<number | null>(null);
  useEffect(() => {
    const changed = previousCount.current !== null && previousCount.current !== filtered.length;
    previousCount.current = filtered.length;
    const counter = resultsCount.current;
    if (!changed || !counter) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion.matches) return;
    const scope = createScope({ root: counter }).add(() => {
      animate(counter, { opacity: [.6, 1], y: [4, 0], duration: 280, ease: 'out(3)' });
    });
    const stopMotion = () => { if (reducedMotion.matches) scope.revert(); };
    reducedMotion.addEventListener('change', stopMotion);
    return () => { reducedMotion.removeEventListener('change', stopMotion); scope.revert(); };
  }, [filtered.length]);
  function resetFilters() { setQuery(''); setBrand('all'); setBody('all'); setBudget('all'); setShortlistOnly(false); }

  return <MotionScene>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <SiteNavbar />
    <main id="main-content" className={styles.main}>
      <section className={`${styles.hero} container-custom`} aria-labelledby="hero-title">
        <div data-motion="hero" className={styles.heroCopy}>
          <div data-motion-item className={styles.eyebrow}><span /> THE ROAD AHEAD, REIMAGINED</div>
          <h1 data-motion-item id="hero-title">{contact.heroHeadline === defaultContact.heroHeadline ? <>A better drive.<br />Starts with <span>trust.</span></> : contact.heroHeadline}</h1>
          <p data-motion-item>{contact.heroSubheadline === defaultContact.heroSubheadline ? <>Great cars. Honest advice. Complete peace of mind.<br className={styles.desktopBreak} /> Your next chapter deserves a better beginning.</> : contact.heroSubheadline}</p>
          <div data-motion-item className={styles.heroActions}>
            <Link data-motion-press href="#inventory-section" className="btn-primary">Find your next car <ArrowUpRight aria-hidden="true" /></Link>
            <Link data-motion-press href="/client/services" className={styles.textLink}>Explore our services <ArrowRight aria-hidden="true" /></Link>
          </div>
          <div data-motion-item className={styles.heroTrust}><div className={styles.trustIcon}><ShieldCheck aria-hidden="true" /></div><div><strong>Confidence comes standard.</strong><span>Independent inspections. Personal support.</span></div></div>
          <div data-motion-item className={styles.heroFootnote}><span>INSPECT.</span><span>FIND.</span><span>SELL.</span><span>DRIVE WITH CONFIDENCE.</span></div>
        </div>
        <div className={styles.heroVisual}>
          <div data-motion="image" className={styles.heroMedia}><Image src="/images/parakh-journey.webp" alt="A silver luxury SUV overlooking the sunlit mountains of northern Pakistan" fill preload sizes="(max-width: 760px) 100vw, 50vw" className={styles.heroImage} /></div>
          <div className={styles.imageTopLabel}><span /> OPEN ROADS. NEW POSSIBILITIES.</div>
          <div data-motion="reveal" className={styles.promiseCard}><div className={styles.promiseBadge}><BadgeCheck aria-hidden="true" /></div><div><span>THE PARAKH PROMISE</span><strong>Every detail checked.<br />Every journey considered.</strong></div><ArrowUpRight aria-hidden="true" /></div>
          <div className={styles.verticalLabel}>YOUR JOURNEY. OUR COMMITMENT.</div>
        </div>
      </section>
      <section className={styles.valueStrip} aria-label="The Parakh difference"><div data-motion="stagger" className={`container-custom ${styles.valueGrid}`}>
        <div data-motion-item><ScanLine aria-hidden="true" /><p><strong>200+ point inspections</strong><span>Clarity in every detail</span></p></div>
        <div data-motion-item><ShieldCheck aria-hidden="true" /><p><strong>Independent advice</strong><span>Your interests come first</span></p></div>
        <div data-motion-item><Handshake aria-hidden="true" /><p><strong>End-to-end support</strong><span>From first look to handover</span></p></div>
        <div data-motion-item><MapPin aria-hidden="true" /><p><strong>Rooted in Pakistan</strong><span>Local knowledge. Wider horizons.</span></p></div>
      </div></section>
      <section className={`${styles.section} container-custom`} id="services">
        <div className={styles.sectionHeading}><div data-motion="heading"><div className={styles.eyebrow}><span /> MADE FOR YOUR NEXT MOVE</div><h2>One destination.<br />Every car possibility.</h2></div><div data-motion="reveal" className={styles.headingAside}><p>Buying, selling, or just making sure.<br />We make the complicated feel simple.</p><Link data-motion-press href="/client/services" className={styles.textLink}>Discover all services <ArrowUpRight aria-hidden="true" /></Link></div></div>
        <div data-motion="stagger" className={styles.serviceGrid}>{services.map((service, i) => <Link data-motion-item data-motion-hover="lift" data-motion-press href={service.href} className={styles.serviceCard} key={service.label}>
          <div className={styles.serviceImage}><Image src={service.photo} alt={service.alt} fill sizes="(max-width: 760px) 100vw, 33vw" /><span>{service.tag}</span></div>
          <div className={styles.serviceContent}><div className={styles.serviceMeta}><service.icon aria-hidden="true" /><span>{service.label}</span><small>0{i + 1}</small></div><h3>{service.title}</h3><p>{service.text}</p><div className={styles.serviceCta}>{service.cta}<span><ArrowUpRight aria-hidden="true" /></span></div></div>
        </Link>)}</div>
      </section>
      <section className={styles.inspectionSection}>
        <div className={`container-custom ${styles.inspectionGrid}`}>
          <div className={styles.inspectionCopy}><div data-motion="heading"><div className={`${styles.eyebrow} ${styles.lightEyebrow}`}><span /> LOOK BEYOND THE SHINE</div><h2>A good-looking car<br />should have nothing<br />to hide.</h2></div><p>Beauty is on the surface. Confidence goes deeper. Our independent inspections reveal the details that matter, before you make your decision.</p><div data-motion="stagger" className={styles.checkGrid}>{['Engine & diagnostics', 'Body & paint condition', 'Chassis & suspension', 'Electronics & interior'].map(item => <span data-motion-item key={item}><CircleCheck aria-hidden="true" />{item}</span>)}</div><Link data-motion-press href="/client/inspection" className={styles.limeButton}>Get the full picture <ArrowUpRight aria-hidden="true" /></Link><span className={styles.inspectionPrice}>Inspections from PKR 7,000</span></div>
          <div data-motion="reveal" className={styles.reportVisual}><div className={styles.reportHeader}><div className={styles.reportMark}><ShieldCheck aria-hidden="true" /><strong>PARAKH <small>INSPECTION REPORT</small></strong></div><span>SAMPLE REPORT</span></div><div className={styles.reportTitle}><span>KNOW YOUR CAR. KNOW YOUR NEXT MOVE.</span><h3>Confidence, in detail.</h3></div><div className={styles.scanIllustration}><svg data-motion="draw" viewBox="0 0 400 190" fill="none" aria-hidden="true"><path d="M56 130H35V108L65 95L110 54H251L297 91L350 103L365 126V139H334M112 139H267M66 111H105M282 107H334" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" /><path d="M123 66H175V94H96L123 66ZM188 66H246L279 94H188V66Z" stroke="currentColor" strokeWidth="2" /><circle cx="85" cy="134" r="27" stroke="currentColor" strokeWidth="2.5" /><circle cx="302" cy="134" r="27" stroke="currentColor" strokeWidth="2.5" /><circle cx="85" cy="134" r="16" stroke="currentColor" /><circle cx="302" cy="134" r="16" stroke="currentColor" /><path d="M58 35V20H76M324 20H342V35M58 163V178H76M324 178H342V163" stroke="var(--pm-green)" strokeWidth="1.5" /><path d="M200 18V178" stroke="var(--pm-green)" strokeDasharray="4 5" /><circle cx="133" cy="109" r="5" fill="var(--pm-green)" /><circle cx="262" cy="109" r="5" fill="var(--pm-green)" /><circle cx="208" cy="52" r="5" fill="var(--pm-green)" /></svg><span>200+ individual checkpoints</span></div><div data-motion="stagger" className={styles.reportRows}>{[['Mechanical condition', 'Engine, transmission & brakes'], ['Exterior & structure', 'Paint depth, panels & chassis'], ['Interior & electrical', 'Systems, controls & cabin']].map(([title, detail]) => <div data-motion-item key={title}><span><Check aria-hidden="true" /></span><p><strong>{title}</strong><small>{detail}</small></p><ChevronDown aria-hidden="true" /></div>)}</div><div className={styles.reportBottom}><ShieldCheck aria-hidden="true" />A clear report. An informed decision.</div></div>
        </div>
      </section>
      <section className={`${styles.section} container-custom`} id="inventory-section">
        <div className={styles.sectionHeading}><div data-motion="heading"><div className={styles.eyebrow}><span /> THE RIGHT CAR IS OUT THERE</div><h2>Meet your next chapter.</h2></div><div data-motion="reveal" className={styles.headingAside}><p>A considered collection. A personal choice.<br />Explore the cars currently in our inventory.</p></div></div>
        <form data-motion="reveal" className={styles.filterBar} onSubmit={e => { e.preventDefault(); setShowAll(true); document.getElementById('vehicle-results')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }); }}>
          <div className={styles.searchInput}><Search aria-hidden="true" /><label htmlFor="vehicle-search" className="sr-only">Search cars by model or city</label><input id="vehicle-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search your next car..." /></div>
          <div data-motion-feedback="choice" className={styles.selectField}><label htmlFor="brand-filter">Make</label><select id="brand-filter" value={brand} onChange={e => setBrand(e.target.value)}><option value="all">All brands</option>{brands.map(b => <option key={b}>{b}</option>)}</select></div>
          <div data-motion-feedback="choice" className={styles.selectField}><label htmlFor="body-filter">Body type</label><select id="body-filter" value={body} onChange={e => setBody(e.target.value)}><option value="all">All types</option>{['sedan', 'suv', 'crossover', 'hatchback', 'coupe'].map(b => <option key={b} value={b}>{b === 'suv' ? 'SUV' : b[0].toUpperCase() + b.slice(1)}</option>)}</select></div>
          <div data-motion-feedback="choice" className={styles.selectField}><label htmlFor="budget-filter">Budget</label><select id="budget-filter" value={budget} onChange={e => setBudget(e.target.value)}><option value="all">Any budget</option><option value="under30">Under PKR 3 crore</option><option value="30to60">PKR 3–6 crore</option><option value="over60">Over PKR 6 crore</option></select></div>
          <button data-motion-press type="submit" className={styles.searchButton}><Search aria-hidden="true" /><span>Search cars</span></button>
        </form>
        <div data-motion="reveal" className={styles.resultsToolbar} id="vehicle-results"><span ref={resultsCount} aria-live="polite">{inventoryLoading && !vehicles.length ? 'Loading the collection…' : inventoryError && !vehicles.length ? 'Collection temporarily unavailable' : <>{filtered.length} {filtered.length === 1 ? 'car' : 'cars'} to discover{hasFilters ? ' · matching your search' : ''}</>}</span><div>{hasFilters && <button data-motion-press type="button" onClick={resetFilters}>Clear filters</button>}<button data-motion-press data-motion-feedback="heart" type="button" aria-pressed={shortlistOnly} onClick={() => setShortlistOnly(!shortlistOnly)} className={shortlistOnly ? styles.selectedShortlist : ''}><Heart aria-hidden="true" />Shortlist ({shortlist.length})</button></div></div>
        {inventoryError && <div data-motion="reveal" className={styles.inventoryWarning} role="status"><p>{vehicles.length ? 'We couldn’t refresh the inventory. Showing the last available collection.' : 'Our collection is temporarily unavailable. Please try again, or contact our team for current availability.'}</p><button data-motion-press className="btn-secondary" type="button" onClick={() => void refreshInventory()} disabled={inventoryLoading}>{inventoryLoading ? 'Refreshing…' : 'Try again'}</button></div>}
        <div data-motion="stagger" className={styles.vehicleGrid}>{visible.map(v => <article data-motion-item data-motion-hover="lift" className={styles.vehicleCard} key={v.id}><div className={styles.vehicleImage}><button type="button" onClick={event => openVehicle(v, event.currentTarget)} aria-label={`View ${v.title}`}><VehicleImage src={v.images[0] || '/images/parakh-journey.webp'} alt={v.title} fill sizes="(max-width: 760px) 100vw, 33vw" /></button><span className={styles.verifiedTag}><BadgeCheck aria-hidden="true" />{v.condition === 'certified_pre_owned' ? 'Parakh Certified' : 'Inspected'}</span><button data-motion-press data-motion-feedback="heart" type="button" className={styles.saveCar} aria-label={`${shortlist.includes(v.id) ? 'Remove' : 'Save'} ${v.title} ${shortlist.includes(v.id) ? 'from' : 'to'} shortlist`} aria-pressed={shortlist.includes(v.id)} onClick={() => setShortlist(ids => ids.includes(v.id) ? ids.filter(id => id !== v.id) : [...ids, v.id])}><Heart fill={shortlist.includes(v.id) ? 'currentColor' : 'none'} aria-hidden="true" /></button></div><div className={styles.vehicleContent}><div className={styles.vehicleMeta}><span>{v.year} · {v.brand}</span><span><MapPin aria-hidden="true" />{v.location.split(',')[0]}</span></div><button data-motion-press type="button" className={styles.vehicleTitle} onClick={event => openVehicle(v, event.currentTarget)}><h3>{v.title}</h3></button><div className={styles.vehicleSpecs}><span><Gauge aria-hidden="true" />{formatMileage(v.mileage)}</span><span><Fuel aria-hidden="true" />{v.fuelType}</span><span><SlidersHorizontal aria-hidden="true" />{v.transmission}</span></div><div className={styles.vehicleBottom}><strong>{formatPKR(v.price)}</strong><button data-motion-press type="button" onClick={event => openVehicle(v, event.currentTarget)} aria-label={`View details for ${v.title}`}><ArrowUpRight aria-hidden="true" /></button></div>{v.status === 'reserved' && <p className={styles.reserved}>Reserved · ask about availability</p>}</div></article>)}</div>
        {filtered.length === 0 && !inventoryLoading && !inventoryError && <div data-motion="reveal" className={styles.emptyState}><CarFront aria-hidden="true" /><h3>{shortlistOnly ? 'Your shortlist starts here.' : 'Your perfect match is still out there.'}</h3><p>{shortlistOnly ? 'Tap the heart on a car to save it here.' : 'Try another search, or let our team find it for you.'}</p><button data-motion-press className="btn-secondary" type="button" onClick={resetFilters}>Explore all cars <ArrowRight aria-hidden="true" /></button></div>}
        <div data-motion="reveal" className={styles.inventoryFooter}>{!showAll && !hasFilters && filtered.length > 3 && <button data-motion-press type="button" className="btn-secondary" onClick={() => setShowAll(true)}>View all {filtered.length} cars <ArrowUpRight aria-hidden="true" /></button>}<p>Haven’t found the one? <Link href="/client/car-finding">Let us find it for you <ArrowRight aria-hidden="true" /></Link></p></div>
      </section>
      <section className={styles.journeySection}><div className={`container-custom ${styles.journeyGrid}`}><div data-motion="image" className={styles.journeyPhoto}><Image src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1100&q=85" alt="The view from a car on an open road" fill sizes="(max-width: 760px) 100vw, 45vw" /><div><span>A PARTNER FOR THE ROAD AHEAD.</span><strong>Good journeys<br />begin with good people.</strong></div></div><div className={styles.journeyCopy}><div data-motion="heading"><div className={styles.eyebrow}><span /> THE HUMAN SIDE OF AUTOMOTIVE</div><h2>More than a car.<br />A connection.</h2></div><p>A car is a part of your life. The daily commute, the weekend escape, the milestones along the way. We’re here to make choosing it feel right.</p><div data-motion="stagger" className={styles.steps}>{[['01', 'Let’s start with you.', 'Your needs, your plans, your budget. We listen first.'], ['02', 'We do the groundwork.', 'Honest checks, considered options and clear answers.'], ['03', 'Move forward with confidence.', 'Personal guidance through the details and the handover.']].map(([number, title, text]) => <div data-motion-item key={number}><span>{number}</span><p><strong>{title}</strong><small>{text}</small></p></div>)}</div><Link data-motion-press href="/client/about" className={styles.textLink}>Get to know Parakh <ArrowUpRight aria-hidden="true" /></Link></div></div></section>
      <section className={`${styles.section} container-custom ${styles.faqSection}`}><div data-motion="heading"><div className={styles.eyebrow}><span /> A LITTLE MORE CLARITY</div><h2>Good questions.<br />Honest answers.</h2><p>We’re here to make things clearer.<br />Need a personal answer?</p><Link data-motion-press href="/client/contact" className={styles.textLink}><MessageCircle aria-hidden="true" />Let’s talk <ArrowUpRight aria-hidden="true" /></Link></div><div data-motion="stagger" className={styles.questions}>{questions.map(q => <details data-motion-item data-motion-feedback="accordion" key={q.question}><summary>{q.question}<Plus className={styles.faqPlus} aria-hidden="true" /><Minus className={styles.faqMinus} aria-hidden="true" /></summary><p>{q.answer}</p></details>)}</div></section>
    </main>
    <SiteFooter />
    <VehicleDetails vehicle={selected} returnFocusTo={vehicleTrigger} onClose={() => setSelected(null)} />
  </MotionScene>;
}
