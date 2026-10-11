'use client';

import { Compass, Handshake, ScanLine } from 'lucide-react';
import { CustomerPage, CustomerContentHero, CustomerHeadline, CustomerSectionTitle, CustomerSteps, CustomerContentCTA, useCustomerPageContent, customerStyles as s } from '@/components/CustomerPages';
import { resolveContentText } from '@/lib/site-content';

const icons = [ScanLine, Handshake, Compass];

export default function AboutPage() {
  const { page, content, settings } = useCustomerPageContent('about');
  const text = (value: string) => resolveContentText(value, settings);
  const about = content.about;
  const quote = text(about.quote).split('\n');
  return <CustomerPage><CustomerContentHero page={page} href="/client/contact" />
    <section className={s.section}><div className={`container-custom ${s.story}`}><div data-motion="heading"><p className={s.eyebrow}>{page.extras.story?.eyebrow}</p><h2><CustomerHeadline title={text(about.storyTitle)} /></h2></div><div data-motion="reveal">{about.paragraphs.map((paragraph, i) => <p key={i}>{text(paragraph)}</p>)}</div></div></section>
    {about.stats.length > 0 && <section style={{ borderTop: '1px solid var(--pm-line)', borderBottom: '1px solid var(--pm-line)', padding: '42px 0' }}><div className="container-custom"><div data-motion="stagger" className={s.gridFour}>{about.stats.map((item, i) => <div data-motion-item data-motion-hover="lift" key={i} className={s.card}><span className={s.price} style={{ marginTop: 0, fontSize: 'calc(32px * var(--pm-text-scale))' }}>{text(item.value)}</span><h3 style={{ fontSize: 'calc(16px * var(--pm-text-scale))', marginTop: '8px' }}>{text(item.label)}</h3><p style={{ margin: '8px 0 0', fontSize: 'calc(12px * var(--pm-text-scale))' }}>{text(item.description)}</p></div>)}</div></div></section>}
    <section className={`${s.section} ${s.green}`}><div className="container-custom"><CustomerSectionTitle eyebrow={page.extras.values?.eyebrow || ''} title={page.sectionTitle} description={page.sectionDescription} /><div data-motion="stagger" className={s.steps}>{about.values.map((item, i) => {
      const Icon = icons[i % icons.length];
      return <div data-motion-item key={i} className={s.step}><div className={s.icon}><Icon size={24} aria-hidden="true" /></div><h3>{text(item.title)}</h3><p>{text(item.description)}</p></div>;
    })}</div>{about.quote && <blockquote data-motion="heading" className={s.statement}><CustomerHeadline title={quote.length > 1 ? quote.slice(0, -1).join('\n') : quote[0]} accent={quote.length > 1 ? quote.at(-1) : undefined} /></blockquote>}</div></section>
    <CustomerSteps title={page.stepsTitle} steps={page.steps} /><CustomerContentCTA page={page} />
  </CustomerPage>;
}
