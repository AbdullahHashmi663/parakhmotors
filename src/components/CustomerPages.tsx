'use client';

import { Fragment, useId, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Check, ChevronRight, ShieldCheck } from 'lucide-react';
import { SiteNavbar } from '@/components/SiteNavbar';
import { SiteFooter } from '@/components/SiteFooter';
import { MotionScene } from '@/components/MotionScene';
import { useDealershipSettings } from '@/components/useDealershipSettings';
import { resolveContentText, type ContentPageKey, type PageContent } from '@/lib/site-content';
import styles from './CustomerPages.module.css';

export { styles as customerStyles };

export function useCustomerPageContent(key: ContentPageKey) {
  const settings = useDealershipSettings();
  const resolve = (value: unknown): unknown => {
    if (typeof value === 'string') return resolveContentText(value, settings);
    if (Array.isArray(value)) return value.map(resolve);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([name, field]) => [name, resolve(field)]));
    return value;
  };
  return { settings, content: settings.websiteContent, page: resolve(settings.websiteContent.pages[key]) as PageContent };
}

export function CustomerContentHero({ page, href, secondary, onPrimaryClick, target }: { page: PageContent; href?: string; target?: '_blank'; secondary?: { href: string; label: string; onClick?: () => void }; onPrimaryClick?: () => void }) {
  const lines = page.headline.split('\n');
  return <CustomerHero eyebrow={page.eyebrow} title={<CustomerHeadline title={lines.length > 1 ? lines.slice(0, -1).join('\n') : page.headline} accent={lines.length > 1 ? lines.at(-1) : undefined} />} description={page.description} image={page.image} imageAlt={page.imageAlt} imageLabel={page.imageLabel} action={href && page.primaryLabel ? { href, label: page.primaryLabel, onClick: onPrimaryClick, target } : undefined} secondary={secondary} />;
}

export function CustomerContentCTA({ page, href, onClick }: { page: PageContent; href?: string; onClick?: () => void }) {
  if (!page.ctaTitle && !page.ctaDescription && !page.ctaLabel) return null;
  return <CustomerCTA title={page.ctaTitle} description={page.ctaDescription} label={page.ctaLabel} href={href} onClick={onClick} />;
}

export function CustomerFormAside({ page, children }: { page: PageContent; children?: ReactNode }) {
  const aside = page.extras.formAside;
  return <aside data-motion="reveal" className={styles.formAside}>{aside?.eyebrow && <p className={styles.eyebrow}>{aside.eyebrow}</p>}<h2><CustomerHeadline title={page.formTitle} /></h2><p>{page.formDescription}</p>{Boolean(aside?.items.length) && <CustomerChecklist items={aside.items} />}{aside?.description && <div className={styles.asideNote}><ShieldCheck size={22} strokeWidth={1.5} aria-hidden="true" /><span>{aside.description}</span></div>}{children}</aside>;
}

export function CustomerHeadline({ title, accent }: { title: string; accent?: string }) {
  return <>{title.split('\n').map((line, i) => <Fragment key={`${i}-${line}`}>{i > 0 && <br />}{line}</Fragment>)}{accent && <><br /><span className={styles.accent}>{accent}</span></>}</>;
}

export function CustomerParagraphs({ text }: { text: string }) {
  return <>{text.split(/\n\s*\n/).filter(Boolean).map((paragraph, i) => <p key={`${i}-${paragraph}`}>{paragraph}</p>)}</>;
}

export function CustomerPage({ children }: { children: ReactNode }) {
  const mainId = `${useId()}-main`;
  return <MotionScene><a href={`#${mainId}`} className="skip-link">Skip to content</a><SiteNavbar /><main className={styles.page} id={mainId} tabIndex={-1}>{children}</main><SiteFooter /></MotionScene>;
}

export function CustomerHero({ eyebrow, title, description, image, imageAlt = 'A considered approach to your next car', imageLabel = 'Good cars. Clear decisions.', action, secondary }: { eyebrow: string; title: ReactNode; description: string; image?: string; imageAlt?: string; imageLabel?: string; action?: { href: string; label: string; onClick?: () => void; target?: '_blank' }; secondary?: { href: string; label: string; onClick?: () => void } }) {
  const settings = useDealershipSettings();
  return <section className={styles.hero}><div className="container-custom"><div className={styles.heroInner}><div data-motion="hero"><nav data-motion-item aria-label="Breadcrumb" className={styles.breadcrumb}><Link href="/">Home</Link><ChevronRight size={12} aria-hidden="true" /><span>{eyebrow}</span></nav><p data-motion-item className={styles.eyebrow}>{eyebrow}</p><h1 data-motion-item>{title}</h1><p data-motion-item className={styles.intro}>{description}</p>{action && <div data-motion-item className={styles.actions}><Link data-motion-press className="btn-primary" href={action.href} target={action.target} rel={action.target === '_blank' ? 'noopener noreferrer' : undefined} onClick={action.onClick} scroll={action.onClick ? false : undefined}>{action.label}<ArrowRight size={15} aria-hidden="true" /></Link>{secondary && <Link data-motion-press className="btn-secondary" href={secondary.href} onClick={secondary.onClick} scroll={secondary.onClick ? false : undefined}>{secondary.label}</Link>}</div>}</div>{image && <div data-motion="image" className={styles.heroImage}><Image src={image} alt={imageAlt} fill sizes="(max-width: 800px) 100vw, 45vw" preload /><div className={styles.imageLabel}><ShieldCheck size={26} strokeWidth={1.4} aria-hidden="true" /><div><strong>{imageLabel}</strong>{settings.dealershipName}</div></div></div>}</div></div></section>;
}

export function CustomerSectionTitle({ eyebrow, title, description }: { eyebrow: string; title: ReactNode; description?: string }) {
  return <div className={styles.sectionTitle}><div data-motion="heading"><p className={styles.eyebrow}>{eyebrow}</p><h2>{typeof title === 'string' ? <CustomerHeadline title={title} /> : title}</h2></div>{description && <p data-motion="reveal">{description}</p>}</div>;
}

export function CustomerChecklist({ items }: { items: string[] }) {
  return <ul className={styles.checklist}>{items.map((item, i) => <li key={`${i}-${item}`}><Check size={14} strokeWidth={1.6} aria-hidden="true" />{item}</li>)}</ul>;
}

export function CustomerSteps({ title, steps, eyebrow = 'A clear way forward' }: { title: string; steps: { title: string; description: string }[]; eyebrow?: string }) {
  if (!steps.length) return null;
  return <section className={`${styles.section} ${styles.green}`}><div className="container-custom"><CustomerSectionTitle eyebrow={eyebrow} title={title} /><div data-motion="stagger" className={styles.steps}>{steps.map((step, i) => <div data-motion-item className={styles.step} key={`${i}-${step.title}`}><span className={styles.stepNumber}>{String(i + 1).padStart(2, '0')}</span><h3>{step.title}</h3><p>{step.description}</p></div>)}</div></div></section>;
}

export function CustomerFAQ({ items, eyebrow = 'A little more clarity', title = 'Your questions, answered.' }: { items: { question: string; answer: string }[]; eyebrow?: string; title?: string }) {
  if (!items.length) return null;
  return <section className={styles.section}><div className="container-custom"><CustomerSectionTitle eyebrow={eyebrow} title={title} /><div data-motion="stagger" className={styles.faq}>{items.map((item, i) => <details data-motion-item data-motion-feedback="accordion" key={`${i}-${item.question}`}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div></div></section>;
}

export function CustomerCTA({ title = 'Your next move starts here.', description = 'A car question, a buying decision, or a car to sell. Let’s talk it through.', href = '/client/contact', label = 'Talk to our team', onClick }: { title?: string; description?: string; href?: string; label?: string; onClick?: () => void }) {
  return <section className={styles.green}><div className="container-custom"><div data-motion="stagger" className={styles.cta}><div data-motion-item><h2>{title}</h2><p>{description}</p></div><Link data-motion-item data-motion-press href={href} onClick={onClick} scroll={onClick ? false : undefined}>{label}<ArrowRight size={17} aria-hidden="true" /></Link></div></div></section>;
}

