'use client';

import { useEffect, useId, useMemo, useState, type ReactNode, type FormEvent } from 'react';
import { AlertCircle, ArrowDown, ArrowUp, Building2, Check, ExternalLink, FileText, Globe, LayoutTemplate, LoaderCircle, Plus, Save, Tags, Trash2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { DealershipSettings } from '@/types';
import { contentPageKeys, normalizeSiteContent, type ContentPageKey, type ContentStep, type ContentFAQ, type SiteContent } from '@/lib/site-content';
import styles from './AdminWebsiteEditor.module.css';

type EditorSection = 'business' | 'services' | 'pages' | 'story' | 'footer';
const sections = [
  { id: 'business', label: 'Contact & business', icon: Building2 },
  { id: 'services', label: 'Services & prices', icon: Tags },
  { id: 'pages', label: 'Page content', icon: FileText },
  { id: 'story', label: 'Homepage & about', icon: LayoutTemplate },
  { id: 'footer', label: 'Footer & privacy', icon: Globe },
] as const;

const dynamicDetails = [
  ['{{dealershipName}}', 'Business name'], ['{{phone}}', 'Phone number'], ['{{whatsapp}}', 'WhatsApp number'], ['{{email}}', 'Email address'],
  ['{{address}}', 'Showroom address'], ['{{workingHours}}', 'Working hours'], ['{{serviceAreas}}', 'Service areas'],
  ['{{minimumBudget}}', 'Minimum vehicle budget'], ['{{highBudgetThreshold}}', 'Premium budget threshold'], ['{{searchDuration}}', 'Expected search duration'],
  ['{{fee:basic}}', 'Car inspection fee'], ['{{fee:comprehensive}}', 'Comprehensive inspection fee'], ['{{fee:premium}}', 'Premium inspection fee'],
  ['{{fee:deal_package}}', 'Complete deal fee'], ['{{fee:ad_posting}}', 'Basic listing fee'], ['{{fee:sell_lahore}}', 'Parakh Verified fee'],
  ['{{fee:sell_outside}}', 'Sell for Me fee'], ['{{fee:under_1cr}}', 'Car sourcing fee'], ['{{fee:above_1cr}}', 'Premium sourcing fee'],
  ['{{payment:sell_outside}}', 'Sell for Me payment note'], ['{{payment:under_1cr}}', 'Car sourcing payment note'],
] as const;
function displayDynamicText(value: string): string {
  return dynamicDetails.reduce((text, [token, label]) => text.replaceAll(token, `[${label}]`), value);
}
function storeDynamicText(value: string): string {
  return dynamicDetails.reduce((text, [token, label]) => text.replaceAll(`[${label}]`, token), value);
}

function Field({ label, value, onChange, help, multiline = false, wide = false, type = 'text', required = false, min, max, rows = 3, allowVariables = false, readOnly = false }: {
  label: string; value: string | number; onChange: (value: string) => void; help?: string; multiline?: boolean; wide?: boolean;
  type?: 'text' | 'email' | 'tel' | 'url' | 'number'; required?: boolean; min?: number; max?: number; rows?: number; allowVariables?: boolean; readOnly?: boolean;
}) {
  const id = useId();
  return <label className={`${styles.field} ${wide ? styles.wide : ''}`} htmlFor={id}>
    <span>{label}{required ? ' *' : ''}</span>
    {multiline ? <textarea id={id} className={styles.control} value={allowVariables ? displayDynamicText(String(value)) : value} rows={rows} required={required} onChange={(event) => onChange(allowVariables ? storeDynamicText(event.target.value) : event.target.value)} aria-describedby={help ? `${id}-help` : undefined} />
      : <input id={id} className={styles.control} value={value} type={type} min={min} max={max} required={required} readOnly={readOnly} onChange={(event) => onChange(event.target.value)} aria-describedby={help ? `${id}-help` : undefined} />}
    {allowVariables && <select className={styles.control} aria-label={`Insert current detail into ${label}`} value="" onChange={(event) => { if (event.target.value) onChange(`${value}${value && !/\s$/.test(String(value)) ? ' ' : ''}${event.target.value}`); }}><option value="">Insert a current price or business detail…</option>{dynamicDetails.map(([token, name]) => <option key={token} value={token}>{name}</option>)}</select>}
    {help && <small id={`${id}-help`}>{help}</small>}
  </label>;
}

function SelectField({ label, value, onChange, children, help }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode; help?: string }) {
  const id = useId();
  return <label className={styles.field} htmlFor={id}><span>{label}</span><select id={id} className={styles.control} value={value} onChange={(event) => onChange(event.target.value)} aria-describedby={help ? `${id}-help` : undefined}>{children}</select>{help && <small id={`${id}-help`}>{help}</small>}</label>;
}

function Panel({ title, description, children, action }: { title: string; description?: string; children: ReactNode; action?: ReactNode }) {
  return <section className={styles.panel}><div className={styles.panelHeading}><div><h3>{title}</h3>{description && <p>{description}</p>}</div>{action}</div>{children}</section>;
}

function ItemActions({ label, index, total, onMove, onRemove }: { label: string; index: number; total: number; onMove: (index: number, direction: -1 | 1) => void; onRemove: (index: number) => void }) {
  return <div className={styles.itemActions}><button type="button" className={styles.iconButton} aria-label={`Move ${label} up`} disabled={index === 0} onClick={() => onMove(index, -1)}><ArrowUp size={15} aria-hidden="true" /></button><button type="button" className={styles.iconButton} aria-label={`Move ${label} down`} disabled={index === total - 1} onClick={() => onMove(index, 1)}><ArrowDown size={15} aria-hidden="true" /></button><button type="button" className={`${styles.iconButton} ${styles.danger}`} aria-label={`Remove ${label}`} onClick={() => onRemove(index)}><Trash2 size={15} aria-hidden="true" /></button></div>;
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const destination = index + direction;
  if (destination < 0 || destination >= items.length) return items;
  const next = [...items];
  [next[index], next[destination]] = [next[destination], next[index]];
  return next;
}

const lines = (value: string) => value.split('\n');
function cleanTextLists<T>(value: T): T {
  if (Array.isArray(value)) return (value.every((item) => typeof item === 'string') ? value.map((item) => item.trim()).filter(Boolean) : value.map(cleanTextLists)) as T;
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cleanTextLists(item)])) as T;
  return value;
}
const pageLabels: Record<ContentPageKey, string> = { services: 'Services', inspection: 'Car inspection', selling: 'Sell your car', sourcing: 'Find a car', about: 'About us', contact: 'Contact', investor: 'Investor cash offer', privacy: 'Privacy policy' };
const pageRoutes: Record<ContentPageKey, string> = { services: '/client/services', inspection: '/client/inspection', selling: '/client/sell-my-car', sourcing: '/client/car-finding', about: '/client/about', contact: '/client/contact', investor: '/client/investor', privacy: '/client/privacy-policy' };
const extraLabels: Record<string, string> = { investor: 'Direct cash offer highlight', details: 'Inspection details', report: 'Sample inspection report', formats: 'Report formats', formAside: 'Message beside the request form', story: 'Company story introduction', values: 'Company values introduction', contact: 'Privacy contact message' };
type TextFieldSpec<T> = { key: keyof T; label: string; help?: string; multiline?: boolean; wide?: boolean; type?: 'text' | 'email' | 'tel' | 'url' };

function TextFields<T extends object>({ value, fields, onChange }: { value: T; fields: TextFieldSpec<T>[]; onChange: (key: keyof T, value: string) => void }) {
  return <div className={styles.grid}>{fields.map((field) => <Field key={String(field.key)} label={field.label} value={String(value[field.key] ?? '')} onChange={(next) => onChange(field.key, next)} help={['image', 'heroImage', 'journeyImage'].includes(String(field.key)) ? 'Use a local image path such as /images/photo.webp or a photo from https://images.unsplash.com.' : field.help} multiline={field.multiline} wide={field.wide} type={field.type} allowVariables={field.multiline} />)}</div>;
}

function StepsEditor({ title, items, onChange, firstLabel = 'Title', secondLabel = 'Description', addLabel = 'Add item' }: { title: string; items: ContentStep[]; onChange: (items: ContentStep[]) => void; firstLabel?: string; secondLabel?: string; addLabel?: string }) {
  return <div className={styles.stack}>{items.map((item, index) => <div key={index} className={styles.item}><div className={styles.itemHeading}><h4>{title} {index + 1}</h4><ItemActions label={`${title} ${index + 1}`} index={index} total={items.length} onMove={(at, direction) => onChange(moveItem(items, at, direction))} onRemove={(at) => onChange(items.filter((_, current) => current !== at))} /></div><div className={styles.grid}><Field label={firstLabel} value={item.title} onChange={(next) => onChange(items.map((row, at) => at === index ? { ...row, title: next } : row))} /><Field label={secondLabel} value={item.description} multiline allowVariables onChange={(next) => onChange(items.map((row, at) => at === index ? { ...row, description: next } : row))} /></div></div>)}{!items.length && <p className={styles.empty}>No {title.toLowerCase()}s added yet. Add one to display this content on the website.</p>}<div><button type="button" className={styles.button} onClick={() => onChange([...items, { title: '', description: '' }])}><Plus size={15} aria-hidden="true" />{addLabel}</button></div></div>;
}

function FAQEditor({ items, onChange }: { items: ContentFAQ[]; onChange: (items: ContentFAQ[]) => void }) {
  return <StepsEditor title="Question" firstLabel="Question" secondLabel="Answer" addLabel="Add question" items={items.map((item) => ({ title: item.question, description: item.answer }))} onChange={(next) => onChange(next.map((item) => ({ question: item.title, answer: item.description })))} />;
}

export function AdminWebsiteEditor({ settings, onSaved, onError, onDirtyChange }: { settings: DealershipSettings; onSaved: (settings: DealershipSettings) => void; onError: (message: string) => void; onDirtyChange?: (dirty: boolean) => void }) {
  const [observedSettings, setObservedSettings] = useState(settings);
  const [saved, setSaved] = useState(() => ({ ...structuredClone(settings), websiteContent: normalizeSiteContent(settings.websiteContent) }));
  const [draft, setDraft] = useState(() => ({ ...structuredClone(settings), websiteContent: normalizeSiteContent(settings.websiteContent) }));
  const [section, setSection] = useState<EditorSection>('business');
  const [pageKey, setPageKey] = useState<ContentPageKey>('services');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [hasSaved, setHasSaved] = useState(false);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);
  // Refresh clean fields immediately; keep a draft intact until it is saved or discarded.
  if (settings !== observedSettings && !dirty) {
    const refreshed = { ...structuredClone(settings), websiteContent: normalizeSiteContent(settings.websiteContent) };
    setObservedSettings(settings);
    setSaved(refreshed);
    setDraft(structuredClone(refreshed));
    setHasSaved(false);
    setError('');
  }
  const content = draft.websiteContent;
  const page = content.pages[pageKey];

  useEffect(() => { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);
  useEffect(() => () => { onDirtyChange?.(false); }, [onDirtyChange]);
  useEffect(() => {
    if (!dirty) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [dirty]);

  const changeSetting = (key: keyof DealershipSettings, value: string) => {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setHasSaved(false);
    setError('');
  };

  const changeContent = (update: (previous: SiteContent) => SiteContent) => {
    setDraft((previous) => ({ ...previous, websiteContent: update(previous.websiteContent) }));
    setHasSaved(false);
    setError('');
  };
  const changePage = (update: (previous: SiteContent['pages'][ContentPageKey]) => SiteContent['pages'][ContentPageKey]) => changeContent((previous) => ({ ...previous, pages: { ...previous.pages, [pageKey]: update(previous.pages[pageKey]) } }));

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving || !dirty) return;
    setError('');
    setSaving(true);
    try {
      const result = await api.admin.updateSettings({ ...draft, currency: 'PKR', websiteContent: cleanTextLists(draft.websiteContent), activeThemeId: settings.activeThemeId });
      setDraft(structuredClone(result.data));
      setSaved(structuredClone(result.data));
      setObservedSettings(result.data);
      setHasSaved(true);
      onSaved(result.data);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Your changes could not be saved. Please try again.';
      setError(message);
      onError(message);
    } finally {
      setSaving(false);
    }
  };

  return <form className={styles.editor} onSubmit={save}>
    <div className={styles.intro}><div><h2>Your website, in one place.</h2><p>Update your services, prices and business details here. Save your changes to publish them across the website.</p></div><span className={styles.status} data-dirty={dirty} role="status">{dirty ? <><FileText size={13} aria-hidden="true" /> Unsaved changes</> : <><Check size={13} aria-hidden="true" /> {hasSaved ? 'Changes published' : 'Up to date'}</>}</span></div>
    <nav className={styles.sectionNav} aria-label="Website editor sections">{sections.map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-pressed={section === id} onClick={() => setSection(id)}><Icon size={15} aria-hidden="true" />{label}</button>)}</nav>
    {error && <div className={styles.alert} role="alert"><AlertCircle size={17} aria-hidden="true" /><p>{error}</p></div>}
    <fieldset disabled={saving} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
      {section === 'business' && <div className={styles.stack}>
        <Panel title="Business identity" description="These details identify your company throughout the website."><div className={styles.grid}>
          <Field label="Business name" value={draft.dealershipName} onChange={(value) => changeSetting('dealershipName', value)} required />
          <Field label="Tagline" value={draft.tagline} onChange={(value) => changeSetting('tagline', value)} />
          <Field label="Announcement" value={draft.announcement} onChange={(value) => changeSetting('announcement', value)} help="Leave blank to hide the announcement." wide />
          <Field label="Currency" value="PKR" readOnly onChange={() => {}} help="Vehicle prices and service fees are shown in Pakistani rupees (PKR)." />
        </div></Panel>
        <Panel title="Contact details" description="Phone buttons, WhatsApp links, forms and the footer use these details."><div className={styles.grid}>
          <Field label="Phone number" value={draft.phone} onChange={(value) => changeSetting('phone', value)} type="tel" required help="Include the country code, for example +92 300 1234567." />
          <Field label="WhatsApp number" value={draft.whatsapp} onChange={(value) => changeSetting('whatsapp', value)} type="tel" required help="Include the country code. This can differ from your phone number." />
          <Field label="Email address" value={draft.email} onChange={(value) => changeSetting('email', value)} type="email" required />
          <Field label="Working hours" value={draft.workingHours} onChange={(value) => changeSetting('workingHours', value)} />
          <Field label="Showroom address" value={draft.address} onChange={(value) => changeSetting('address', value)} multiline wide />
        </div></Panel>
        <Panel title="WhatsApp, maps & social profiles" description="Leave a social profile or map link blank to hide it."><TextFields value={content.contact} onChange={(key, value) => changeContent((previous) => ({ ...previous, contact: { ...previous.contact, [key]: value } }))} fields={[
          { key: 'whatsappMessage', label: 'Default WhatsApp message', multiline: true, wide: true, help: 'The message customers see when they open WhatsApp from your website.' },
          { key: 'serviceAreas', label: 'Service areas', wide: true },
          { key: 'mapsUrl', label: 'Google Maps link', type: 'url', help: 'Paste the share link for your showroom.' },
          { key: 'facebookUrl', label: 'Facebook profile', type: 'url' },
          { key: 'instagramUrl', label: 'Instagram profile', type: 'url' },
          { key: 'youtubeUrl', label: 'YouTube channel', type: 'url' },
        ]} /></Panel>
        <Panel title="Payment details" description="Your car finding page displays these bank details and payment instructions."><TextFields value={content.payment} onChange={(key, value) => changeContent((previous) => ({ ...previous, payment: { ...previous.payment, [key]: value } }))} fields={[
          { key: 'bankName', label: 'Bank name' },
          { key: 'accountTitle', label: 'Account title' },
          { key: 'accountNumber', label: 'Account number or IBAN', help: 'Check this carefully before publishing.' },
          { key: 'instructions', label: 'Payment instructions', multiline: true, wide: true },
        ]} /></Panel>
      </div>}
      {section === 'services' && <div className={styles.stack}>
        <Panel title="Service packages & prices" description="Fees are shared across service cards, booking forms and your website. Turn a package off to stop accepting new requests for it."><div className={styles.stack}>{content.packages.map((item, index) => <div key={item.id} className={styles.item}><div className={styles.itemHeading}><div><h4>{item.title || 'Untitled package'}</h4><p>{item.kind === 'sourcing' ? 'Car finding' : item.kind === 'selling' ? 'Car selling' : item.kind === 'investor' ? 'Cash offer' : 'Car inspection'}</p></div><label className={styles.switch}><input type="checkbox" checked={item.enabled} onChange={(event) => changeContent((previous) => ({ ...previous, packages: previous.packages.map((row, at) => at === index ? { ...row, enabled: event.target.checked } : row) }))} />Available to customers</label></div><div className={styles.grid}>
          <Field label="Package name" value={item.title} onChange={(value) => changeContent((previous) => ({ ...previous, packages: previous.packages.map((row, at) => at === index ? { ...row, title: value } : row) }))} />
          <Field label={`Service fee (${draft.currency || 'PKR'})`} value={item.price} type="number" min={0} max={1000000000} onChange={(value) => changeContent((previous) => ({ ...previous, packages: previous.packages.map((row, at) => at === index ? { ...row, price: Number(value) } : row) }))} help="Enter the full amount, for example 7000." />
          <Field label="Description" value={item.description} multiline wide onChange={(value) => changeContent((previous) => ({ ...previous, packages: previous.packages.map((row, at) => at === index ? { ...row, description: value } : row) }))} />
          <Field label="Included features" value={item.features.join('\n')} multiline rows={5} onChange={(value) => changeContent((previous) => ({ ...previous, packages: previous.packages.map((row, at) => at === index ? { ...row, features: lines(value) } : row) }))} help="One feature per line." />
          <div className={styles.stack}><Field label="Price unit" value={item.unit} onChange={(value) => changeContent((previous) => ({ ...previous, packages: previous.packages.map((row, at) => at === index ? { ...row, unit: value } : row) }))} help="For example, inspection, deal or sourcing fee." /><Field label="Payment note" value={item.paymentNote} multiline onChange={(value) => changeContent((previous) => ({ ...previous, packages: previous.packages.map((row, at) => at === index ? { ...row, paymentNote: value } : row) }))} help="For example, Pay after the sale." /></div>
        </div></div>)}</div></Panel>
        <Panel title="Car finding requirements" description="These limits determine which sourcing package customers receive."><div className={styles.grid}>
          <Field label={`Minimum vehicle budget (${draft.currency || 'PKR'})`} type="number" min={0} value={content.sourcing.minimumBudget} onChange={(value) => changeContent((previous) => ({ ...previous, sourcing: { ...previous.sourcing, minimumBudget: Number(value) } }))} />
          <Field label={`Premium budget threshold (${draft.currency || 'PKR'})`} type="number" min={0} value={content.sourcing.highBudgetThreshold} onChange={(value) => changeContent((previous) => ({ ...previous, sourcing: { ...previous.sourcing, highBudgetThreshold: Number(value) } }))} help="Budgets above this amount use the premium sourcing fee." />
          <Field label="Expected search duration" value={content.sourcing.searchDuration} onChange={(value) => changeContent((previous) => ({ ...previous, sourcing: { ...previous.sourcing, searchDuration: value } }))} />
        </div></Panel>
        <Panel title="Service catalogue" description="Choose which services appear on your services page and homepage. Reorder cards using the arrow buttons."><div className={styles.stack}>{content.services.map((item, index) => <div key={item.id} className={styles.item}><div className={styles.itemHeading}><div><h4>{item.title || `Service ${index + 1}`}</h4><p>{item.featured ? 'Featured on the homepage' : 'Shown on the services page'}</p></div><ItemActions label={item.title || `service ${index + 1}`} index={index} total={content.services.length} onMove={(at, direction) => changeContent((previous) => ({ ...previous, services: moveItem(previous.services, at, direction) }))} onRemove={(at) => changeContent((previous) => ({ ...previous, services: previous.services.filter((_, current) => current !== at) }))} /></div>
          <TextFields value={item} onChange={(key, value) => changeContent((previous) => ({ ...previous, services: previous.services.map((row, at) => at === index ? { ...row, [key]: value } : row) }))} fields={[{ key: 'title', label: 'Service title' }, { key: 'label', label: 'Short label' }, { key: 'description', label: 'Description', multiline: true, wide: true }, { key: 'ctaLabel', label: 'Button text' }, { key: 'image', label: 'Image address', help: 'Use a website image path or an HTTPS image link.' }, { key: 'imageAlt', label: 'Image description', help: 'Briefly describe the image for people using screen readers.' }]} />
          <div className={styles.grid} style={{ marginTop: 20 }}><SelectField label="Service destination" value={item.href} onChange={(value) => changeContent((previous) => ({ ...previous, services: previous.services.map((row, at) => at === index ? { ...row, href: value } : row) }))}>{contentPageKeys.filter((key) => key !== 'privacy').map((key) => <option key={key} value={pageRoutes[key]}>{pageLabels[key]}</option>)}</SelectField><Field label="Card features" value={item.features.join('\n')} multiline help="One feature per line." onChange={(value) => changeContent((previous) => ({ ...previous, services: previous.services.map((row, at) => at === index ? { ...row, features: lines(value) } : row) }))} />
          <div className={styles.field}><span>Show prices from these packages</span>{content.packages.map((pkg) => <label key={pkg.id} className={styles.switch}><input type="checkbox" checked={item.packageIds.includes(pkg.id)} onChange={(event) => changeContent((previous) => ({ ...previous, services: previous.services.map((row, at) => at === index ? { ...row, packageIds: event.target.checked ? [...row.packageIds, pkg.id] : row.packageIds.filter((id) => id !== pkg.id) } : row) }))} />{pkg.title || pkg.id}{!pkg.enabled ? ' (unavailable)' : ''}</label>)}</div>
          <div className={styles.stack}><label className={styles.switch}><input type="checkbox" checked={item.enabled} onChange={(event) => changeContent((previous) => ({ ...previous, services: previous.services.map((row, at) => at === index ? { ...row, enabled: event.target.checked } : row) }))} />Show this service</label><label className={styles.switch}><input type="checkbox" checked={item.featured} onChange={(event) => changeContent((previous) => ({ ...previous, services: previous.services.map((row, at) => at === index ? { ...row, featured: event.target.checked } : row) }))} />Feature on the homepage</label></div></div>
        </div>)}{!content.services.length && <p className={styles.empty}>Add your first service to display it on the website.</p>}<div><button type="button" className={styles.button} onClick={() => changeContent((previous) => ({ ...previous, services: [...previous.services, { id: `service-${crypto.randomUUID().slice(0, 8)}`, title: '', label: '', description: '', features: [], href: '/client/contact', image: '', imageAlt: '', ctaLabel: 'Talk to our team', packageIds: [], featured: false, enabled: true }] }))}><Plus size={15} aria-hidden="true" />Add service</button></div></div></Panel>
      </div>}
      {section === 'pages' && <div className={styles.stack}>
        <div className={styles.picker}><SelectField label="Page to edit" value={pageKey} onChange={(value) => setPageKey(value as ContentPageKey)}>{contentPageKeys.map((key) => <option key={key} value={key}>{pageLabels[key]}</option>)}</SelectField><a href={pageRoutes[pageKey]} target="_blank" rel="noreferrer">Open page <ExternalLink size={13} aria-hidden="true" /></a></div>
        <Panel title={`${pageLabels[pageKey]} introduction`} description="This content appears at the top of the page. New lines in a headline create a line break."><TextFields value={page} onChange={(key, value) => changePage((previous) => ({ ...previous, [key]: value }))} fields={[{ key: 'eyebrow', label: 'Small introduction label' }, { key: 'primaryLabel', label: 'Main button text' }, { key: 'headline', label: 'Page headline', multiline: true }, { key: 'description', label: 'Introduction', multiline: true }, { key: 'image', label: 'Hero image address', help: 'Use a website image path or an HTTPS image link.' }, { key: 'imageAlt', label: 'Image description' }, { key: 'imageLabel', label: 'Image caption' }]} /></Panel>
        <Panel title="Service & form headings" description="Pages display the fields relevant to their layout."><TextFields value={page} onChange={(key, value) => changePage((previous) => ({ ...previous, [key]: value }))} fields={[{ key: 'sectionTitle', label: 'Main section heading', multiline: true }, { key: 'sectionDescription', label: 'Main section description', multiline: true }, { key: 'formTitle', label: 'Request form heading', multiline: true }, { key: 'formDescription', label: 'Request form introduction', multiline: true }]} /></Panel>
        <Panel title="How it works"><div className={styles.stack}><Field label="Process section heading" value={page.stepsTitle} multiline onChange={(value) => changePage((previous) => ({ ...previous, stepsTitle: value }))} /><StepsEditor title="Step" items={page.steps} addLabel="Add step" onChange={(items) => changePage((previous) => ({ ...previous, steps: items }))} /></div></Panel>
        <Panel title="Common questions" description="Insert current prices or contact details into an answer to keep it updated automatically when those details change."><FAQEditor items={page.faq} onChange={(items) => changePage((previous) => ({ ...previous, faq: items }))} /></Panel>
        <Panel title="Closing call to action"><TextFields value={page} onChange={(key, value) => changePage((previous) => ({ ...previous, [key]: value }))} fields={[{ key: 'ctaTitle', label: 'Closing headline', multiline: true }, { key: 'ctaDescription', label: 'Closing message', multiline: true }, { key: 'ctaLabel', label: 'Closing button text' }]} /></Panel>
        {Object.entries(page.extras).map(([key, block]) => <Panel key={key} title={extraLabels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase())} description="The page uses the fields that apply to this section."><div className={styles.stack}>
          <TextFields value={block} onChange={(field, value) => changePage((previous) => ({ ...previous, extras: { ...previous.extras, [key]: { ...previous.extras[key], [field]: value } } }))} fields={[{ key: 'eyebrow', label: 'Small section label' }, { key: 'title', label: 'Section title', multiline: true }, { key: 'description', label: 'Section description', multiline: true, wide: true }]} />
          <Field label="Supporting points" value={block.items.join('\n')} multiline help="One point per line. Leave blank when this section does not need a list." onChange={(value) => changePage((previous) => ({ ...previous, extras: { ...previous.extras, [key]: { ...previous.extras[key], items: lines(value) } } }))} />
          <StepsEditor title="Detail" items={block.rows} addLabel="Add detail" onChange={(items) => changePage((previous) => ({ ...previous, extras: { ...previous.extras, [key]: { ...previous.extras[key], rows: items } } }))} />
        </div></Panel>)}
      </div>}
      {section === 'story' && <div className={styles.stack}>
        <Panel title="Homepage introduction"><div className={styles.stack}><div className={styles.grid}><Field label="Homepage headline" value={draft.heroHeadline} multiline onChange={(value) => changeSetting('heroHeadline', value)} /><Field label="Homepage introduction" value={draft.heroSubheadline} multiline onChange={(value) => changeSetting('heroSubheadline', value)} /></div><TextFields value={content.home} onChange={(key, value) => changeContent((previous) => ({ ...previous, home: { ...previous.home, [key]: value } }))} fields={[{ key: 'heroEyebrow', label: 'Small introduction label' }, { key: 'heroImage', label: 'Hero image address' }, { key: 'heroImageAlt', label: 'Image description' }, { key: 'heroImageLabel', label: 'Image caption' }, { key: 'heroTrustTitle', label: 'Trust badge title' }, { key: 'heroTrustText', label: 'Trust badge message' }]} /></div></Panel>
        <Panel title="Homepage services & inspection"><div className={styles.stack}><TextFields value={content.home} onChange={(key, value) => changeContent((previous) => ({ ...previous, home: { ...previous.home, [key]: value } }))} fields={[{ key: 'servicesTitle', label: 'Services heading', multiline: true }, { key: 'servicesDescription', label: 'Services introduction', multiline: true }, { key: 'inspectionTitle', label: 'Inspection heading', multiline: true }, { key: 'inspectionDescription', label: 'Inspection introduction', multiline: true }]} /><Field label="Inspection checks" value={content.home.inspectionChecks.join('\n')} multiline help="One check per line." onChange={(value) => changeContent((previous) => ({ ...previous, home: { ...previous.home, inspectionChecks: lines(value) } }))} /></div></Panel>
        <Panel title="Homepage journey"><div className={styles.stack}><TextFields value={content.home} onChange={(key, value) => changeContent((previous) => ({ ...previous, home: { ...previous.home, [key]: value } }))} fields={[{ key: 'journeyTitle', label: 'Journey heading', multiline: true }, { key: 'journeyDescription', label: 'Journey introduction', multiline: true }, { key: 'journeyImage', label: 'Journey image address' }, { key: 'journeyImageAlt', label: 'Image description' }]} /><StepsEditor title="Step" items={content.home.steps} addLabel="Add step" onChange={(items) => changeContent((previous) => ({ ...previous, home: { ...previous.home, steps: items } }))} /></div></Panel>
        <Panel title="Homepage questions"><div className={styles.stack}><Field label="Questions section heading" value={content.home.faqTitle} multiline onChange={(value) => changeContent((previous) => ({ ...previous, home: { ...previous.home, faqTitle: value } }))} /><FAQEditor items={content.home.faq} onChange={(items) => changeContent((previous) => ({ ...previous, home: { ...previous.home, faq: items } }))} /></div></Panel>
        <Panel title="Your company story"><div className={styles.grid}><Field label="Story heading" value={content.about.storyTitle} multiline onChange={(value) => changeContent((previous) => ({ ...previous, about: { ...previous.about, storyTitle: value } }))} /><Field label="Company quote" value={content.about.quote} multiline onChange={(value) => changeContent((previous) => ({ ...previous, about: { ...previous.about, quote: value } }))} /><Field label="Story paragraphs" value={content.about.paragraphs.join('\n')} multiline rows={8} wide help="One paragraph per line." onChange={(value) => changeContent((previous) => ({ ...previous, about: { ...previous.about, paragraphs: lines(value) } }))} /></div></Panel>
        <Panel title="Company statistics" description="Only publish figures that accurately represent your business."><div className={styles.stack}>{content.about.stats.map((item, index) => <div className={styles.item} key={index}><div className={styles.itemHeading}><h4>Statistic {index + 1}</h4><ItemActions label={`statistic ${index + 1}`} index={index} total={content.about.stats.length} onMove={(at, direction) => changeContent((previous) => ({ ...previous, about: { ...previous.about, stats: moveItem(previous.about.stats, at, direction) } }))} onRemove={(at) => changeContent((previous) => ({ ...previous, about: { ...previous.about, stats: previous.about.stats.filter((_, current) => current !== at) } }))} /></div><TextFields value={item} onChange={(key, value) => changeContent((previous) => ({ ...previous, about: { ...previous.about, stats: previous.about.stats.map((row, at) => at === index ? { ...row, [key]: value } : row) } }))} fields={[{ key: 'value', label: 'Figure', help: 'For example, 200+ or 100%.' }, { key: 'label', label: 'Statistic label' }, { key: 'description', label: 'Supporting detail', wide: true }]} /></div>)}<div><button className={styles.button} type="button" onClick={() => changeContent((previous) => ({ ...previous, about: { ...previous.about, stats: [...previous.about.stats, { value: '', label: '', description: '' }] } }))}><Plus size={15} aria-hidden="true" />Add statistic</button></div></div></Panel>
        <Panel title="Company values"><StepsEditor title="Value" items={content.about.values} addLabel="Add value" onChange={(items) => changeContent((previous) => ({ ...previous, about: { ...previous.about, values: items } }))} /></Panel>
      </div>}
      {section === 'footer' && <div className={styles.stack}>
        <Panel title="Footer & final message"><TextFields value={content.footer} onChange={(key, value) => changeContent((previous) => ({ ...previous, footer: { ...previous.footer, [key]: value } }))} fields={[{ key: 'eyebrow', label: 'Small introduction label' }, { key: 'ctaLabel', label: 'Contact button text' }, { key: 'headline', label: 'Footer headline', multiline: true }, { key: 'note', label: 'Footer note' }, { key: 'copyrightYear', label: 'Copyright year' }]} /></Panel>
        <Panel title="Privacy policy" description="Edit the policy text customers see on your privacy page."><div className={styles.stack}><Field label="Last updated" value={content.privacy.updated} onChange={(value) => changeContent((previous) => ({ ...previous, privacy: { ...previous.privacy, updated: value } }))} help="For example, 11 October 2026. Leave blank to hide the date." /><StepsEditor title="Policy section" items={content.privacy.sections} addLabel="Add policy section" onChange={(items) => changeContent((previous) => ({ ...previous, privacy: { ...previous.privacy, sections: items } }))} /></div></Panel>
      </div>}
    </fieldset>
    <div className={styles.saveBar}><div aria-live="polite"><p>{dirty ? 'You have unpublished changes.' : hasSaved ? 'Your website has been updated.' : 'All changes are saved.'}</p><small>{dirty ? 'Changes in every section will be saved together.' : 'You can keep editing any section.'}</small></div><div className={styles.saveActions}><button type="button" className={styles.button} disabled={!dirty || saving} onClick={() => { setDraft(structuredClone(saved)); setError(''); setHasSaved(false); }}>Discard changes</button><button type="submit" className={`${styles.button} ${styles.primary}`} disabled={!dirty || saving}>{saving ? <LoaderCircle size={15} aria-hidden="true" /> : <Save size={15} aria-hidden="true" />}{saving ? 'Publishing…' : 'Save & publish'}</button></div></div>
  </form>;
}
