import { dataStore } from '../repositories/data-store';
import { contactFields, enumField, numberField, textField } from '../utils/validation';
import { ApiError } from '../utils/api-error';
import { formatServicePrice, getServicePackage } from '@/lib/site-content';
import type { ProcessedSellPhoto } from '../utils/sell-photo-upload';

export class RequestService {
  static async getAllSellRequests() { return await dataStore.getSellRequests(); }

  static async submitSellRequest(raw: Record<string, unknown>, photos: ProcessedSellPhoto[] = []) {
    const { name: sellerName, phone, email } = contactFields(raw, 'sellerName');
    const city = textField(raw, 'city', { max: 120 });
    const brand = textField(raw, 'brand', { max: 120 });
    const model = textField(raw, 'model', { max: 160 });
    const year = numberField(raw, 'year', 1900, new Date().getFullYear() + 1, true);
    const mileage = numberField(raw, 'mileage', 0, 2000000, true);
    const expectedPrice = numberField(raw, 'expectedPrice', 1, 10000000000, true);
    const conditionDescription = textField(raw, 'conditionDescription', { optional: true, max: 5000 });
    const settings = await dataStore.getSettings();
    const packageType = enumField(raw.packageType ?? 'ad_posting', ['ad_posting', 'sell_lahore', 'sell_outside', 'investor'] as const, 'selling package');
    const selectedPackage = getServicePackage(settings.websiteContent, packageType);
    if (!selectedPackage?.enabled) throw ApiError.badRequest('This selling package is currently unavailable. Please choose another package or contact our team.');
    const pricingSummary = `Selected service: ${selectedPackage.title} (${packageType}) | Service fee: ${formatServicePrice(selectedPackage.price)}${selectedPackage.paymentNote ? ` | ${selectedPackage.paymentNote}` : ''}`;
    // This provisional range uses the submitted asking price, not a market appraisal.
    const baseVariance = expectedPrice * .05;
    return await dataStore.createSellRequest({ sellerName, phone, email, city, brand, model, year, mileage, expectedPrice, estimatedMarketValueMin: Math.max(0, Math.round((expectedPrice - baseVariance) / 100000) * 100000), estimatedMarketValueMax: Math.round((expectedPrice + baseVariance * 1.2) / 100000) * 100000, conditionDescription: `${pricingSummary}${conditionDescription ? `\nCustomer details: ${conditionDescription}` : ''}`, status: 'received' }, photos);
  }

  static async getAllFindRequests() { return await dataStore.getFindRequests(); }

  static async submitFindRequest(raw: Record<string, unknown>) {
    const { name: buyerName, phone, email } = contactFields(raw, 'buyerName');
    const targetBrand = textField(raw, 'targetBrand', { max: 120 });
    const targetModel = textField(raw, 'targetModel', { max: 160 });
    const minYear = numberField(raw, 'minYear', 1900, new Date().getFullYear() + 1, true);
    const settings = await dataStore.getSettings();
    const content = settings.websiteContent;
    const budgetMax = numberField(raw, 'budgetMax', content.sourcing.minimumBudget, 10000000000, true);
    const packageType = budgetMax > content.sourcing.highBudgetThreshold ? 'above_1cr' : 'under_1cr';
    const selectedPackage = getServicePackage(content, packageType);
    if (!selectedPackage?.enabled) throw ApiError.badRequest('Car sourcing is currently unavailable for this budget. Please contact our team.');
    const preferredCity = textField(raw, 'preferredCity', { max: 120 });
    const notes = textField(raw, 'notes', { optional: true, max: 5000 });
    const pricingSummary = `Selected service: ${selectedPackage.title} (${packageType}) | Service fee: ${formatServicePrice(selectedPackage.price)}${selectedPackage.paymentNote ? ` | ${selectedPackage.paymentNote}` : ''}`;
    return await dataStore.createFindRequest({ buyerName, phone, email, targetBrand, targetModel, minYear, budgetMax, preferredCity, notes: `${pricingSummary}${notes ? `\nCustomer details: ${notes}` : ''}`, status: 'active' });
  }
}
