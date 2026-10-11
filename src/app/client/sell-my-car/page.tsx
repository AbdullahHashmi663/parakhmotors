'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Camera, BadgeCheck, Handshake, ShieldCheck } from 'lucide-react';
import { CustomerPage, CustomerContentHero, CustomerSectionTitle, CustomerChecklist, CustomerSteps, CustomerFAQ, CustomerContentCTA, CustomerFormAside, useCustomerPageContent, customerStyles as s } from '@/components/CustomerPages';
import { CustomerRequestForm } from '@/components/CustomerRequestForm';
import { formatServicePrice, getActivePackages, getServicePackage, resolveContentText } from '@/lib/site-content';

const icons = { ad_posting: Camera, sell_lahore: BadgeCheck, sell_outside: Handshake };

export default function SellMyCarPage() {
  const { page, content, settings } = useCustomerPageContent('selling');
  const [selectedPackage, setSelectedPackage] = useState('ad_posting');
  const packages = getActivePackages(content, 'selling');
  const investor = getServicePackage(content, 'investor');
  const text = (value: string) => resolveContentText(value, settings);
  function choose(id: string) { setSelectedPackage(id); document.getElementById('selling-form')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }
  function scrollToSellingForm() {
    document.getElementById('selling-form')?.scrollIntoView({ behavior: 'instant', block: 'start' });
  }
  function startSelling() {
    setSelectedPackage('sell_outside');
    scrollToSellingForm();
  }
  function compareServices() {
    document.getElementById('selling-packages')?.scrollIntoView({ behavior: 'instant', block: 'start' });
  }
  return <CustomerPage><CustomerContentHero page={page} href="#selling-form" onPrimaryClick={startSelling} secondary={{ href: '#selling-packages', label: 'Compare services', onClick: compareServices }} />
    <section className={s.section}><div className="container-custom" id="selling-packages"><CustomerSectionTitle eyebrow={page.eyebrow} title={page.sectionTitle} description={page.sectionDescription} /><div data-motion="stagger" className={s.grid}>{packages.map(pkg => {
      const Icon = icons[pkg.id as keyof typeof icons] || Handshake;
      return <div data-motion-item data-motion-hover="lift" className={s.card} key={pkg.id}><div className={s.icon}><Icon size={24} aria-hidden="true" /></div><h3>{text(pkg.title)}</h3><div className={s.price}>{formatServicePrice(pkg.price)}{pkg.unit && <small> / {pkg.unit}</small>}</div><p>{text(pkg.description)}</p><CustomerChecklist items={pkg.features.map(text)} />{pkg.paymentNote && <p>{text(pkg.paymentNote)}</p>}<button data-motion-press type="button" className={s.submit} onClick={() => choose(pkg.id)}>Choose this service<ArrowRight size={16} aria-hidden="true" /></button></div>;
    })}</div>{investor?.enabled && <div data-motion="reveal" className={s.notice}><ShieldCheck size={23} aria-hidden="true" /><p>{text(investor.description)} <Link href="/client/investor">{text(investor.title)}</Link></p></div>}</div></section>
    <CustomerSteps title={page.stepsTitle} steps={page.steps} />
    <section className={s.section}><div className={`container-custom ${s.formLayout}`}><CustomerFormAside page={page} /><CustomerRequestForm id="selling-form" kind="sell" selectedPackage={selectedPackage} onPackageChange={setSelectedPackage} /></div></section>
    <CustomerFAQ items={page.faq} /><CustomerContentCTA page={page} href="#selling-form" onClick={scrollToSellingForm} />
  </CustomerPage>;
}
