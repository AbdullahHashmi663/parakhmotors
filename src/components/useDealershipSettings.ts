'use client';

import { useEffect, useState } from 'react';
import type { DealershipSettings } from '@/types';

// Match the existing dealership record, so contact links work before the request completes.
export const defaultContact = {
  dealershipName: 'Parakh Motors',
  tagline: 'A little expertise goes a long way. We help you buy, sell and inspect with confidence.',
  announcement: 'Independent inspections. Honest advice. Better journeys.',
  heroHeadline: 'A better drive. Starts with trust.',
  heroSubheadline: 'Great cars. Honest advice. Complete peace of mind. Your next chapter deserves a better beginning.',
  phone: '+92 321 8466662',
  whatsapp: '+923218466662',
  email: 'info@parakhmotors.com',
  address: 'Main Boulevard, Gulberg III, Lahore, Pakistan',
  workingHours: 'Mon - Sat: 10:00 AM - 08:00 PM',
};

type PublicContact = typeof defaultContact;

export function useDealershipSettings() {
  const [contact, setContact] = useState<PublicContact>(defaultContact);

  useEffect(() => {
    const controller = new AbortController();

    async function loadContact() {
      try {
        const response = await fetch('/api/admin/settings', { signal: controller.signal });
        if (!response.ok) return;
        const result: { success: boolean; data?: Partial<DealershipSettings> } = await response.json();
        if (!result.success || !result.data) return;
        const settings = result.data;
        setContact({
          dealershipName: settings.dealershipName || defaultContact.dealershipName,
          tagline: settings.tagline || defaultContact.tagline,
          announcement: settings.announcement || defaultContact.announcement,
          heroHeadline: settings.heroHeadline || defaultContact.heroHeadline,
          heroSubheadline: settings.heroSubheadline || defaultContact.heroSubheadline,
          phone: settings.phone || defaultContact.phone,
          whatsapp: settings.whatsapp || defaultContact.whatsapp,
          email: settings.email || defaultContact.email,
          address: settings.address || defaultContact.address,
          workingHours: settings.workingHours || defaultContact.workingHours,
        });
      } catch {
        // The saved local contact record remains usable if settings are unavailable.
      }
    }

    void loadContact();
    return () => controller.abort();
  }, []);

  return contact;
}
