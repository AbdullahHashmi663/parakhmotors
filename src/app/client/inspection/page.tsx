'use client';

import { useState } from 'react';
import { ArrowRight, Check, ChevronDown, CircleCheck, ClipboardCheck, FileText, Handshake, PhoneCall, ShieldCheck, Video } from 'lucide-react';
import { CustomerPage, CustomerContentHero, CustomerHeadline, CustomerSectionTitle, CustomerChecklist, CustomerSteps, CustomerFAQ, CustomerContentCTA, CustomerFormAside, useCustomerPageContent, customerStyles as s } from '@/components/CustomerPages';
import { CustomerRequestForm } from '@/components/CustomerRequestForm';
import { formatServicePrice, getActivePackages, resolveContentText } from '@/lib/site-content';

const formatIcons = [FileText, Video, PhoneCall];

export default function InspectionPage() {
  const { page, content, settings } = useCustomerPageContent('inspection');
  const [selectedPackage, setSelectedPackage] = useState('basic');
  const packages = getActivePackages(content, 'inspection');
  const text = (value: string) => resolveContentText(value, settings);
  const details = page.extras.details;
  const report = page.extras.report;
  const formats = page.extras.formats;
  function choosePackage(value: string) { setSelectedPackage(value); document.getElementById('booking-form')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }
  return <CustomerPage><CustomerContentHero page={page} href="#booking-form" secondary={{ href: '#packages', label: 'Compare packages' }} />
    <section className={s.section} id="packages"><div className="container-custom"><CustomerSectionTitle eyebrow={page.eyebrow} title={page.sectionTitle} description={page.sectionDescription} /><div data-motion="stagger" className={s.gridTwo}>{packages.map(pkg => {
      const Icon = pkg.id === 'deal_package' ? Handshake : ClipboardCheck;
      return <div data-motion-item data-motion-hover="lift" className={s.card} key={pkg.id}><div className={s.icon}><Icon size={25} strokeWidth={1.5} aria-hidden="true" /></div><h3>{text(pkg.title)}</h3><div className={s.price}>{formatServicePrice(pkg.price)}{pkg.unit && <small> / {pkg.unit}</small>}</div><p>{text(pkg.description)}</p><CustomerChecklist items={pkg.features.map(text)} />{pkg.paymentNote && <p>{text(pkg.paymentNote)}</p>}<button data-motion-press type="button" className={s.submit} onClick={() => choosePackage(pkg.id)}>Choose {text(pkg.title)}<ArrowRight size={16} aria-hidden="true" /></button></div>;
    })}</div></div></section>
    <CustomerSteps title={page.stepsTitle} steps={page.steps} />
    {details && report && <section className={`${s.section} ${s.green}`}><div className="container-custom"><div className={s.blueprintSection}>
      <div className={s.blueprintCopy}><div data-motion="heading"><p className={s.eyebrow}>{details.eyebrow}</p><h2><CustomerHeadline title={details.title} /></h2></div><p data-motion="reveal">{details.description}</p><div data-motion="stagger" className={s.blueprintGrid}>{details.items.map((item, i) => <span data-motion-item className={s.blueprintItem} key={i}><CircleCheck size={16} aria-hidden="true" />{item}</span>)}</div><button data-motion-press type="button" className="btn-primary" disabled={!packages.length} onClick={() => choosePackage(packages[0]?.id || '')}>{page.primaryLabel}<ArrowRight size={16} aria-hidden="true" /></button></div>
      <div data-motion="reveal" className={s.reportVisual}><div className={s.reportHeader}><div className={s.reportMark}><ShieldCheck aria-hidden="true" /><strong>{settings.dealershipName.toUpperCase()} <small>INSPECTION REPORT</small></strong></div><span>{report.items[0]}</span></div><div className={s.reportTitle}><span>{report.eyebrow}</span><h3>{report.title}</h3></div><div className={s.scanIllustration}><svg data-motion="draw" viewBox="0 0 400 190" fill="none" aria-hidden="true"><path d="M56 130H35V108L65 95L110 54H251L297 91L350 103L365 126V139H334M112 139H267M66 111H105M282 107H334" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" /><path d="M123 66H175V94H96L123 66ZM188 66H246L279 94H188V66Z" stroke="currentColor" strokeWidth="2" /><circle cx="85" cy="134" r="27" stroke="currentColor" strokeWidth="2.5" /><circle cx="302" cy="134" r="27" stroke="currentColor" strokeWidth="2.5" /><circle cx="85" cy="134" r="16" stroke="currentColor" /><circle cx="302" cy="134" r="16" stroke="currentColor" /><path d="M58 35V20H76M324 20H342V35M58 163V178H76M324 178H342V163" stroke="var(--pm-green)" strokeWidth="1.5" /><path d="M200 18V178" stroke="var(--pm-green)" strokeDasharray="4 5" /><circle cx="133" cy="109" r="5" fill="var(--pm-green)" /><circle cx="262" cy="109" r="5" fill="var(--pm-green)" /><circle cx="208" cy="52" r="5" fill="var(--pm-green)" /></svg><span>{report.items[1]}</span></div><div data-motion="stagger" className={s.reportRows}>{report.rows.map((row, i) => <div data-motion-item key={i}><span><Check aria-hidden="true" /></span><p><strong>{row.title}</strong><small>{row.description}</small></p><ChevronDown aria-hidden="true" /></div>)}</div><div className={s.reportBottom}><ShieldCheck aria-hidden="true" />{report.description}</div></div>
    </div></div></section>}
    {formats && formats.rows.length > 0 && <section className={s.section}><div className="container-custom"><CustomerSectionTitle eyebrow={formats.eyebrow} title={formats.title} description={formats.description} /><div data-motion="stagger" className={s.grid}>{formats.rows.map((item, i) => {
      const Icon = formatIcons[i % formatIcons.length];
      return <div data-motion-item data-motion-hover="lift" className={s.card} key={i}><div className={s.icon}><Icon size={23} strokeWidth={1.5} aria-hidden="true" /></div><h3>{item.title}</h3><p>{item.description}</p></div>;
    })}</div></div></section>}
    <section className={s.section}><div className="container-custom"><div className={s.formLayout} id="booking-form"><CustomerFormAside page={page} /><CustomerRequestForm kind="inspection" selectedPackage={selectedPackage} onPackageChange={setSelectedPackage} /></div></div></section>
    <CustomerFAQ items={page.faq} /><CustomerContentCTA page={page} href="#booking-form" />
  </CustomerPage>;
}
