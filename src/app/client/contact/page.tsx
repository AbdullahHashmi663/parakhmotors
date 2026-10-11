'use client';

import { MapPin, Phone, Mail, Clock, MessageCircle, ArrowUpRight } from 'lucide-react';
import { CustomerPage, CustomerContentHero, CustomerFormAside, CustomerFAQ, CustomerContentCTA, useCustomerPageContent, customerStyles as s } from '@/components/CustomerPages';
import { CustomerRequestForm } from '@/components/CustomerRequestForm';
import { whatsappHref } from '@/lib/site-content';

export default function ContactPage() {
  const { page, content, settings: contact } = useCustomerPageContent('contact');
  const phone = `tel:${contact.phone.replace(/[^+\d]/g, '')}`;
  const maps = content.contact.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`;
  return <CustomerPage><CustomerContentHero page={page} href={whatsappHref(contact)} target="_blank" />
    <section className={s.section} id="contact-form"><div className={`container-custom ${s.formLayout}`}><CustomerFormAside page={page}><div data-motion="stagger" className={s.contactList}><div data-motion-item className={s.contactRow}><Phone size={21} aria-hidden="true" /><div><span>Give us a call</span><a href={phone}>{contact.phone}</a></div></div><div data-motion-item className={s.contactRow}><Mail size={21} aria-hidden="true" /><div><span>Write to our team</span><a href={`mailto:${contact.email}`}>{contact.email}</a></div></div><div data-motion-item className={s.contactRow}><MapPin size={21} aria-hidden="true" /><div><span>Visit {contact.dealershipName}</span><a href={maps} target="_blank" rel="noopener noreferrer">{contact.address}</a></div></div><div data-motion-item className={s.contactRow}><Clock size={21} aria-hidden="true" /><div><span>Showroom hours</span><strong>{contact.workingHours}</strong></div></div></div><a data-motion-press className="btn-secondary" href={whatsappHref(contact)} target="_blank" rel="noopener noreferrer"><MessageCircle aria-hidden="true" />Talk on WhatsApp<ArrowUpRight aria-hidden="true" /></a></CustomerFormAside><CustomerRequestForm kind="contact" /></div></section>
    <CustomerFAQ items={page.faq} /><CustomerContentCTA page={page} href={phone} />
  </CustomerPage>;
}
