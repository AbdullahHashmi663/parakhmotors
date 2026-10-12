'use client';

import { Search } from 'lucide-react';
import { CustomerPage, CustomerContentHero, CustomerSectionTitle, CustomerChecklist, CustomerSteps, CustomerFAQ, CustomerContentCTA, CustomerFormAside, useCustomerPageContent, customerStyles as s } from '@/components/CustomerPages';
import { CustomerRequestForm } from '@/components/CustomerRequestForm';
import { formatServicePrice, getActivePackages, resolveContentText } from '@/lib/site-content';
import { ServicePrice } from '@/components/ServicePrice';

export default function CarFindingPage() {
  const { page, content, settings } = useCustomerPageContent('sourcing');
  const text = (value: string) => resolveContentText(value, settings);
  const packages = getActivePackages(content, 'sourcing');
  return <CustomerPage><CustomerContentHero page={page} href="#finder-form" secondary={{ href: '#sourcing-fees', label: 'View sourcing fees' }} />
    <section className={s.section} id="sourcing-fees"><div className="container-custom"><div data-motion="reveal" className={s.notice}><Search size={21} strokeWidth={1.5} aria-hidden="true" /><p><strong>Available for budgets of {formatServicePrice(content.sourcing.minimumBudget)} and above.</strong><br />Expected search period: {text(content.sourcing.searchDuration)}.</p></div><CustomerSectionTitle eyebrow={page.eyebrow} title={page.sectionTitle} description={page.sectionDescription} /><div data-motion="stagger" className={s.gridTwo}>{packages.map(pkg => <div data-motion-item data-motion-hover="lift" className={s.card} key={pkg.id}><span className={s.cardLabel}>Vehicle budget · {pkg.id === 'above_1cr' ? `Above ${formatServicePrice(content.sourcing.highBudgetThreshold)}` : `${formatServicePrice(content.sourcing.minimumBudget)} to ${formatServicePrice(content.sourcing.highBudgetThreshold)}`}</span><h3>{text(pkg.title)}</h3><ServicePrice item={pkg} /><p>{text(pkg.description)}</p><CustomerChecklist items={pkg.features.map(text)} />{pkg.paymentNote && <p>{text(pkg.paymentNote)}</p>}</div>)}</div></div></section>
    <CustomerSteps title={page.stepsTitle} steps={page.steps} />
    <section className={s.section}><div className="container-custom"><div className={s.formLayout} id="finder-form"><CustomerFormAside page={page} /><CustomerRequestForm kind="finder" /></div></div></section>
    <CustomerFAQ items={page.faq} /><CustomerContentCTA page={page} href="#finder-form" />
  </CustomerPage>;
}
