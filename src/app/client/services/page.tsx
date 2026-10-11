'use client';

import Link from 'next/link';
import { ArrowRight, Camera, ClipboardCheck, Handshake, Megaphone, Search, ShieldCheck, Wallet } from 'lucide-react';
import { CustomerPage, CustomerContentHero, CustomerHeadline, CustomerSectionTitle, CustomerChecklist, CustomerSteps, CustomerFAQ, CustomerContentCTA, useCustomerPageContent, customerStyles as s } from '@/components/CustomerPages';
import { getServicePackage, resolveContentText, servicePriceLabel } from '@/lib/site-content';

const icons = { inspection: ClipboardCheck, deal: Handshake, sourcing: Search, listing: Megaphone, verified: Camera, selling: Handshake };

export default function ServicesPage() {
  const { page, content, settings } = useCustomerPageContent('services');
  const text = (value: string) => resolveContentText(value, settings);
  const services = content.services.filter(service => service.enabled && (!service.packageIds.length || service.packageIds.some(id => getServicePackage(content, id)?.enabled)));
  const investor = getServicePackage(content, 'investor');
  const promo = page.extras.investor;
  return <CustomerPage><CustomerContentHero page={page} href="#services" secondary={{ href: '/client/contact', label: 'Help me choose' }} />
    <section className={s.section} id="services"><div className="container-custom"><CustomerSectionTitle eyebrow={page.eyebrow} title={page.sectionTitle} description={page.sectionDescription} /><div data-motion="stagger" className={s.grid}>{services.map(service => {
      const Icon = icons[service.id as keyof typeof icons] || ShieldCheck;
      return <Link data-motion-item data-motion-hover="lift" data-motion-press href={service.href} key={service.id} className={`${s.card} ${s.cardLink}`}><div className={s.icon}><Icon size={23} strokeWidth={1.5} aria-hidden="true" /></div><span className={s.cardLabel}>{text(service.label)}</span><h3>{text(service.title)}</h3><div className={s.price}>{servicePriceLabel(content, service)}</div><p>{text(service.description)}</p><CustomerChecklist items={service.features.map(text)} /><div className={s.cardAction}>{service.ctaLabel}<ArrowRight size={17} aria-hidden="true" /></div></Link>;
    })}</div>{!services.length && <p className={s.intro}>Our service catalog is being updated. Contact our team for available services.</p>}</div></section>
    <CustomerSteps title={page.stepsTitle} steps={page.steps} />
    {investor?.enabled && promo && <section className={s.section}><div className="container-custom"><div data-motion="stagger" className={s.gridTwo}><div data-motion-item><p className={s.eyebrow}>{promo.eyebrow}</p><h2 style={{ fontSize: 'clamp(30px, 4vw, 46px)', fontWeight: 500, letterSpacing: '-.045em', lineHeight: 1.12 }}><CustomerHeadline title={promo.title} /></h2><p className={s.intro}>{promo.description}</p><div className={s.actions}><Link data-motion-press href="/client/investor" className="btn-primary">{text(investor.title)}<ArrowRight size={15} aria-hidden="true" /></Link></div></div><div data-motion-item data-motion-hover="lift" className={s.card}><div className={s.icon}><Wallet size={23} strokeWidth={1.5} aria-hidden="true" /></div><h3>{text(investor.title)}</h3><p>{text(investor.description)}</p><CustomerChecklist items={investor.features.map(text)} />{investor.paymentNote && <p>{text(investor.paymentNote)}</p>}</div></div></div></section>}
    <CustomerFAQ items={page.faq} /><CustomerContentCTA page={page} />
  </CustomerPage>;
}
