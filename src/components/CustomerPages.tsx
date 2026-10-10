import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Check, ChevronRight, ShieldCheck } from 'lucide-react';
import { SiteNavbar } from '@/components/SiteNavbar';
import { SiteFooter } from '@/components/SiteFooter';
import { MotionScene } from '@/components/MotionScene';
import styles from './CustomerPages.module.css';

export { styles as customerStyles };

export function CustomerPage({ children }: { children: ReactNode }) {
  return <MotionScene><a href="#main-content" className="skip-link">Skip to content</a><SiteNavbar /><main className={styles.page} id="main-content">{children}</main><SiteFooter /></MotionScene>;
}

export function CustomerHero({ eyebrow, title, description, image, imageAlt = 'A considered approach to your next car', imageLabel = 'Good cars. Clear decisions.', action, secondary }: { eyebrow: string; title: ReactNode; description: string; image?: string; imageAlt?: string; imageLabel?: string; action?: { href: string; label: string }; secondary?: { href: string; label: string } }) {
  return <section className={styles.hero}><div className="container-custom"><div className={styles.heroInner}><div data-motion="hero"><nav data-motion-item aria-label="Breadcrumb" className={styles.breadcrumb}><Link href="/">Home</Link><ChevronRight size={12} aria-hidden="true" /><span>{eyebrow}</span></nav><p data-motion-item className={styles.eyebrow}>{eyebrow}</p><h1 data-motion-item>{title}</h1><p data-motion-item className={styles.intro}>{description}</p>{action && <div data-motion-item className={styles.actions}><Link data-motion-press className="btn-primary" href={action.href}>{action.label}<ArrowRight size={15} aria-hidden="true" /></Link>{secondary && <Link data-motion-press className="btn-secondary" href={secondary.href}>{secondary.label}</Link>}</div>}</div>{image && <div data-motion="image" className={styles.heroImage}><Image src={image} alt={imageAlt} fill sizes="(max-width: 800px) 100vw, 45vw" preload /><div className={styles.imageLabel}><ShieldCheck size={26} strokeWidth={1.4} aria-hidden="true" /><div><strong>{imageLabel}</strong>Parakh Motors · Lahore, Pakistan</div></div></div>}</div></div></section>;
}

export function CustomerSectionTitle({ eyebrow, title, description }: { eyebrow: string; title: ReactNode; description?: string }) {
  return <div className={styles.sectionTitle}><div data-motion="heading"><p className={styles.eyebrow}>{eyebrow}</p><h2>{title}</h2></div>{description && <p data-motion="reveal">{description}</p>}</div>;
}

export function CustomerChecklist({ items }: { items: string[] }) {
  return <ul className={styles.checklist}>{items.map(item => <li key={item}><Check size={14} strokeWidth={1.6} aria-hidden="true" />{item}</li>)}</ul>;
}

export function CustomerSteps({ title, steps }: { title: string; steps: { title: string; description: string }[] }) {
  return <section className={`${styles.section} ${styles.green}`}><div className="container-custom"><CustomerSectionTitle eyebrow="A clear way forward" title={title} /><div data-motion="stagger" className={styles.steps}>{steps.map((step, i) => <div data-motion-item className={styles.step} key={step.title}><span className={styles.stepNumber}>0{i + 1}</span><h3>{step.title}</h3><p>{step.description}</p></div>)}</div></div></section>;
}

export function CustomerFAQ({ items }: { items: { question: string; answer: string }[] }) {
  return <section className={styles.section}><div className="container-custom"><CustomerSectionTitle eyebrow="A little more clarity" title="Your questions, answered." /><div data-motion="stagger" className={styles.faq}>{items.map(item => <details data-motion-item data-motion-feedback="accordion" key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div></div></section>;
}

export function CustomerCTA({ title = 'Your next move starts here.', description = 'A car question, a buying decision, or a car to sell. Let’s talk it through.', href = '/client/contact', label = 'Talk to our team' }: { title?: string; description?: string; href?: string; label?: string }) {
  return <section className={styles.green}><div className="container-custom"><div data-motion="stagger" className={styles.cta}><div data-motion-item><h2>{title}</h2><p>{description}</p></div><Link data-motion-item data-motion-press href={href}>{label}<ArrowRight size={17} aria-hidden="true" /></Link></div></div></section>;
}

