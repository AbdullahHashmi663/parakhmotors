'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { CustomerPage, CustomerContentHero, CustomerSteps, CustomerFAQ, CustomerContentCTA, CustomerFormAside, useCustomerPageContent, customerStyles as s } from '@/components/CustomerPages';
import { CustomerRequestForm } from '@/components/CustomerRequestForm';

export default function InvestorPage() {
  const { page } = useCustomerPageContent('investor');
  return <CustomerPage><CustomerContentHero page={page} href="#cash-offer-form" />
    <CustomerSteps title={page.stepsTitle} steps={page.steps} />
    <section className={s.section} id="cash-offer-form"><div className={`container-custom ${s.formLayout}`}><CustomerFormAside page={page}><Link data-motion-press href="/client/sell-my-car" className={s.cardAction}>Prefer a listing service?<ArrowRight size={16} aria-hidden="true" /></Link></CustomerFormAside><CustomerRequestForm kind="investor" /></div></section>
    <CustomerFAQ items={page.faq} /><CustomerContentCTA page={page} href="#cash-offer-form" />
  </CustomerPage>;
}
