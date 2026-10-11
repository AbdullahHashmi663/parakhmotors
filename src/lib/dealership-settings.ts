import type { DealershipSettings } from '@/types';
import { defaultSiteContent } from './site-content';

export const defaultDealershipSettings: DealershipSettings = {
  dealershipName: 'Parakh Motors',
  tagline: 'A little expertise goes a long way. We help you buy, sell and inspect with confidence.',
  announcement: 'Independent inspections. Honest advice. Better journeys.',
  heroHeadline: 'A better drive. Starts with trust.',
  heroSubheadline: 'Great cars. Honest advice. Complete peace of mind. Your next chapter deserves a better beginning.',
  phone: '+92 321 8466662', whatsapp: '+923218466662', email: 'info@parakhmotors.com',
  address: 'Main Boulevard, Gulberg III, Lahore, Pakistan', workingHours: 'Mon - Sat: 10:00 AM - 08:00 PM',
  currency: 'PKR', activeThemeId: 'parakh-rosso', websiteContent: defaultSiteContent,
};
