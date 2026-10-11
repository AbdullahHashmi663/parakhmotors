'use client';

import { CustomerPage, CustomerContentHero, CustomerParagraphs, useCustomerPageContent, customerStyles as s } from '@/components/CustomerPages';
import { resolveContentText } from '@/lib/site-content';

export default function PrivacyPolicyPage() {
  const { page, content, settings } = useCustomerPageContent('privacy');
  const sections = content.privacy.sections;
  const text = (value: string) => resolveContentText(value, settings);
  const contact = page.extras.contact;
  return <CustomerPage><CustomerContentHero page={page} />
    <section className={s.section}><div className={`container-custom ${s.legalLayout}`}><nav data-motion="reveal" className={s.legalNav} aria-label="Privacy policy sections">{sections.map((section, i) => <a href={`#privacy-section-${i + 1}`} key={i}>{i + 1}. {text(section.title)}</a>)}{contact && <a href="#privacy-contact">{sections.length + 1}. {contact.title}</a>}</nav><div>{content.privacy.updated && <p className={s.intro}>Last updated: {content.privacy.updated}</p>}{sections.map((section, i) => <section data-motion="reveal" id={`privacy-section-${i + 1}`} className={s.legalSection} key={i}><h2>{i + 1}. {text(section.title)}</h2><CustomerParagraphs text={text(section.description)} /></section>)}{contact && <section data-motion="reveal" className={s.legalSection} id="privacy-contact"><h2>{sections.length + 1}. {contact.title}</h2><CustomerParagraphs text={contact.description} /></section>}</div></div></section>
  </CustomerPage>;
}
