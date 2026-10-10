'use client';

import { useEffect, useRef, useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react';
import { animate, createScope } from 'animejs';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, CircleAlert, LockKeyhole } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { InquiryType } from '@/types';
import { customerStyles as s } from './CustomerPages';
import { useDealershipSettings } from './useDealershipSettings';

type FormKind = 'inspection' | 'sell' | 'finder' | 'investor' | 'contact';

export function CustomerField({ name, label, hint, full, ...props }: InputHTMLAttributes<HTMLInputElement> & { name: string; label: string; hint?: string; full?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (props.type === 'date' && input.current) input.current.min = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }, [props.type]);
  return <div data-motion-item className={`${s.field} ${full ? s.full : ''}`}><label htmlFor={`customer-${name}`}>{label}{props.required ? ' *' : ''}</label><input ref={input} id={`customer-${name}`} name={name} aria-describedby={hint ? `hint-${name}` : undefined} {...props} />{hint && <small id={`hint-${name}`}>{hint}</small>}</div>;
}

function SelectField({ name, label, options, full, defaultValue, required }: { name: string; label: string; options: { value: string; label: string }[]; full?: boolean; defaultValue?: string; required?: boolean }) {
  return <div data-motion-item className={`${s.field} ${full ? s.full : ''}`}><label htmlFor={`customer-${name}`}>{label}{required ? ' *' : ''}</label><select id={`customer-${name}`} name={name} defaultValue={defaultValue} required={required}>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>;
}

function TextField({ name, label, placeholder, required }: { name: string; label: string; placeholder?: string; required?: boolean }) {
  return <div data-motion="reveal" className={`${s.field} ${s.full}`}><label htmlFor={`customer-${name}`}>{label}{required ? ' *' : ''}</label><textarea name={name} id={`customer-${name}`} rows={4} placeholder={placeholder} required={required} /></div>;
}

function FieldGroup({ title, children }: { title: string; children: ReactNode }) {
  return <fieldset><legend data-motion="reveal">{title}</legend><div data-motion="stagger" className={s.fields}>{children}</div></fieldset>;
}

const conditionOptions = [{ value: 'excellent', label: 'Excellent' }, { value: 'good', label: 'Good' }, { value: 'fair', label: 'Fair' }, { value: 'needs_work', label: 'Needs work' }];
const submitLabels: Record<FormKind, string> = { inspection: 'Request an inspection', sell: 'Submit my car', finder: 'Start my car search', investor: 'Request a cash offer', contact: 'Send my inquiry' };
const packageOptions = {
  inspection: [{ value: 'basic', title: 'Inspection', price: 'Rs. 7,000' }, { value: 'deal_package', title: 'Complete deal package', price: 'Rs. 30,000' }],
  sell: [{ value: 'ad_posting', title: 'Basic listing', price: 'Rs. 1,000' }, { value: 'sell_lahore', title: 'Parakh Verified', price: 'Rs. 3,000' }, { value: 'sell_outside', title: 'Sell for Me', price: 'Rs. 30,000 · Pay after sale' }, { value: 'investor', title: 'Investor cash offer', price: 'Discuss with our team' }],
};

export function CustomerRequestForm({ kind, selectedPackage, onPackageChange }: { kind: FormKind; selectedPackage?: string; onPackageChange?: (value: string) => void }) {
  const contact = useDealershipSettings();
  const whatsappUrl = `https://wa.me/${contact.whatsapp.replace(/[^\d]/g, '')}`;
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const statusRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    const status = statusRef.current;
    if (!status || !(success || error)) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion.matches) return;
    const scope = createScope({ root: status }).add(() => {
      animate(status, { opacity: [0, 1], y: [10, 0], duration: 450, ease: 'out(3)' });
      const icon = status.querySelector('svg');
      if (icon) animate(icon, { scale: [.72, 1], rotate: [-10, 0], delay: 90, duration: 500, ease: 'out(3)' });
    });
    const stopMotion = () => { if (reducedMotion.matches) scope.revert(); };
    reducedMotion.addEventListener('change', stopMotion);
    return () => { reducedMotion.removeEventListener('change', stopMotion); scope.revert(); };
  }, [success, error]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyRef.current) return;
    busyRef.current = true;
    setLoading(true);
    setError('');
    setSuccess('');
    const form = event.currentTarget;
    const data = new FormData(form);
    const value = (key: string) => String(data.get(key) || '').trim();
    const number = (key: string) => Number(value(key));
    try {
      if (kind === 'inspection') {
        const res = await api.inspections.book({ customerName: value('name'), email: value('email'), phone: value('phone'), city: value('city'), carMake: value('brand'), carModel: value('model'), carYear: number('year'), packageType: value('package') === 'deal_package' ? 'deal_package' : 'basic', preferredDate: value('date'), preferredTimeSlot: value('time'), locationAddress: value('address'), notes: `Report: ${value('report')} | Seller: ${value('sellerName')} (${value('sellerPhone')}) | Notes: ${value('notes')}` });
        setSuccess(`Your inspection request is received. Reference: #${res.data.id}. Your selected service fee is Rs. ${res.data.estimatedFee.toLocaleString()}. Our team will call ${value('phone')} to confirm the date and location.`);
      } else if (kind === 'sell' || kind === 'investor') {
        const res = await api.sellRequests.submit({ sellerName: value('name'), email: value('email'), phone: value('phone'), city: value('city'), brand: value('brand'), model: value('model'), year: number('year'), mileage: number('mileage'), expectedPrice: number('price'), conditionDescription: `${kind === 'investor' ? 'Investor Cash Request' : `Service: ${value('package')}`} | Variant: ${value('variant')} | Transmission: ${value('transmission')} | Color: ${value('color')} | Registration: ${value('registrationYear')} ${value('registrationCity')} | Paint: ${value('paint')} | Engine: ${value('engine')} | Notes: ${value('notes')}` });
        setSuccess(`Thank you, ${value('name')}. Your ${kind === 'investor' ? 'cash offer' : 'selling'} request is received. Reference: #${res.data.id}. Initial estimated range: Rs. ${res.data.estimatedMarketValueMin.toLocaleString()}–${res.data.estimatedMarketValueMax.toLocaleString()}. This estimate is based on your submitted asking price; our team will review the vehicle and call ${value('phone')}.`);
      } else if (kind === 'finder') {
        if (number('budget') < 4000000) throw new Error('Car finding is available for budgets of Rs. 40 Lac (4,000,000) and above.');
        const res = await api.carFinder.submit({ buyerName: value('name'), email: value('email'), phone: value('phone'), preferredCity: value('city'), targetBrand: value('brand'), targetModel: value('model'), minYear: number('year'), budgetMax: number('budget'), notes: `Package: ${number('budget') > 10000000 ? 'above_1cr (Rs. 100,000)' : 'under_1cr (Rs. 50,000)'} | Variant: ${value('variant')} | Colors: ${value('color')} | Address: ${value('address')} | Condition: ${value('notes')}` });
        setSuccess(`Your car search request is received. Reference: #${res.data.id}. Our team will call ${value('phone')} to discuss your requirements and confirm the sourcing package.`);
      } else {
        const res = await api.inquiries.create({ name: value('name'), email: value('email'), phone: value('phone'), type: value('inquiryType') as InquiryType, message: value('notes') });
        setSuccess(`Thank you, ${res.data.name}. Your inquiry is received. Reference: #${res.data.id}. Our team will contact you on the details you provided.`);
        form.reset();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We couldn’t submit your request. Please try again or contact our team.');
    } finally {
      busyRef.current = false;
      setLoading(false);
      requestAnimationFrame(() => statusRef.current?.focus());
    }
  }

  return <div className={s.formCard}><p data-motion="reveal">Fields marked * are required.</p>{(success || error) && <div ref={statusRef} tabIndex={-1} className={`${s.status} ${error ? s.error : ''}`} role={error ? 'alert' : 'status'}>{error ? <CircleAlert size={19} aria-hidden="true" /> : <CheckCircle2 size={19} aria-hidden="true" />}<span>{error || success}</span></div>}<form onSubmit={submit} className={s.form} aria-busy={loading}>
    {(kind === 'inspection' || kind === 'sell') && <fieldset><legend data-motion="reveal">Choose your service</legend><div data-motion="stagger" className={s.choices}>{packageOptions[kind].map(option => <label data-motion-item data-motion-feedback="choice" key={option.value} className={`${s.choice} ${selectedPackage === option.value ? s.selected : ''}`}><input type="radio" name="package" value={option.value} checked={selectedPackage ? selectedPackage === option.value : undefined} defaultChecked={selectedPackage ? undefined : option === packageOptions[kind][0]} onChange={() => onPackageChange?.(option.value)} required /><div><strong>{option.title}</strong><span>{option.price}</span></div></label>)}</div></fieldset>}
    {kind !== 'contact' && <FieldGroup title={kind === 'finder' ? 'Your ideal car' : 'Vehicle details'}><CustomerField name="brand" label="Make / brand" placeholder="e.g. Toyota" required /><CustomerField name="model" label={kind === 'finder' ? 'Model / options' : 'Model'} placeholder={kind === 'finder' ? 'e.g. Fortuner, Prado' : 'e.g. Corolla Altis'} required /><CustomerField name="year" label={kind === 'finder' ? 'Earliest model year' : 'Model year'} type="number" min="1960" max="2027" placeholder="e.g. 2022" required /><CustomerField name="variant" label="Variant" placeholder="e.g. Grande 1.8" />
      {(kind === 'sell' || kind === 'investor') && <><CustomerField name="mileage" label="Mileage (km)" type="number" min="0" max="2000000" placeholder="e.g. 45000" required /><CustomerField name="price" label="Asking price (PKR)" type="number" min="1" placeholder="e.g. 4500000" required /><CustomerField name="color" label="Colour" placeholder="e.g. Silver" /><SelectField name="transmission" label="Transmission" options={[{ value: 'automatic', label: 'Automatic' }, { value: 'manual', label: 'Manual' }]} /><SelectField name="paint" label="Paint / body condition" options={conditionOptions} /><SelectField name="engine" label="Engine condition" options={conditionOptions} /><CustomerField name="registrationYear" label="Registration year" type="number" min="1960" max="2027" placeholder="e.g. 2022" /><CustomerField name="registrationCity" label="Registration city" placeholder="e.g. Lahore" /></>}
      {kind === 'finder' && <><CustomerField name="color" label="Colour preferences" placeholder="e.g. White, grey, black" /><CustomerField name="budget" label="Maximum budget (PKR)" type="number" min="4000000" placeholder="e.g. 6000000" hint="Minimum Rs. 40 Lac. Sourcing fees are separate from your vehicle budget." required /></>}
    </FieldGroup>}
    <FieldGroup title={kind === 'contact' ? 'Let’s get acquainted' : 'Your contact details'}><CustomerField name="name" label="Full name" placeholder="Your full name" autoComplete="name" required /><CustomerField name="phone" label="Phone / WhatsApp number" type="tel" placeholder="0300 1234567" autoComplete="tel" minLength={10} maxLength={20} required /><CustomerField name="email" label="Email address" type="email" placeholder="you@example.com" autoComplete="email" required />{kind !== 'contact' && <CustomerField name="city" label="City" placeholder="e.g. Lahore" defaultValue="Lahore" autoComplete="address-level2" required />}
      {kind === 'finder' && <><CustomerField name="address" label="Your address" placeholder="House, street and area" autoComplete="street-address" full required /></>}
      {kind === 'contact' && <SelectField name="inquiryType" label="How can we help?" options={[{ value: 'general', label: 'General question' }, { value: 'inspection', label: 'Car inspection / dealing' }, { value: 'sell', label: 'Selling my car' }, { value: 'vehicle', label: 'Finding / buying a car' }, { value: 'finance', label: 'Finance / payment question' }]} />}
    </FieldGroup>
    {kind === 'inspection' && <><FieldGroup title="Inspection arrangements"><CustomerField name="date" label="Preferred date" type="date" required /><SelectField name="time" label="Preferred time" options={[{ value: 'morning', label: 'Morning' }, { value: 'afternoon', label: 'Afternoon' }, { value: 'any', label: 'Any time — please call me' }]} /><CustomerField name="address" label="Vehicle location / address" placeholder="Area, street and meeting point" full required /><SelectField name="report" label="Report preference" options={[{ value: 'detailed_sheet', label: 'Detailed written report' }, { value: 'video', label: 'Video walkthrough' }, { value: 'verbal', label: 'Phone explanation' }]} /><CustomerField name="sellerName" label="Seller name (optional)" placeholder="Seller’s full name" /><CustomerField name="sellerPhone" label="Seller phone (optional)" type="tel" placeholder="Seller’s contact number" full /></FieldGroup></>}
    <TextField name="notes" label={kind === 'contact' ? 'Your message' : kind === 'finder' ? 'Preferred condition & additional requirements' : 'Anything else we should know?'} placeholder={kind === 'contact' ? 'Tell us how we can help…' : kind === 'finder' ? 'Mileage limit, alternative models, features and any must-haves…' : 'Share the vehicle’s condition, service history or any relevant details…'} required={kind === 'contact'} />
    {kind === 'finder' && <div data-motion="reveal" className={s.bank}><strong>Advance payment details</strong>Meezan Bank · Parakh Motors<br />Account: <code>11310114115191</code><p>Our team will confirm the applicable package and payment amount. Share your transfer screenshot with our <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">WhatsApp concierge</a> and include your request reference.</p></div>}
    {(kind === 'sell' || kind === 'investor') && <div data-motion="reveal" className={s.bank}><strong>Have photos of your car?</strong><p>Submit this form, then share photos and your request reference with our <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">WhatsApp concierge</a>.</p></div>}
    <button data-motion-press type="submit" disabled={loading} className={s.submit}>{loading ? 'Sending your request…' : submitLabels[kind]}{!loading && <ArrowRight size={16} aria-hidden="true" />}</button><div data-motion="reveal" className={s.privacyNote}><LockKeyhole size={13} aria-hidden="true" /><span>We use your details to respond to this request. Read our <Link href="/client/privacy-policy">privacy policy</Link>.</span></div>
  </form></div>;
}

