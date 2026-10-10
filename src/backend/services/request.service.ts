import { dataStore } from '../repositories/data-store';
import { contactFields, numberField, textField } from '../utils/validation';

export class RequestService {
  static async getAllSellRequests() { return await dataStore.getSellRequests(); }

  static async submitSellRequest(raw: Record<string, unknown>) {
    const { name: sellerName, phone, email } = contactFields(raw, 'sellerName');
    const city = textField(raw, 'city', { max: 120 });
    const brand = textField(raw, 'brand', { max: 120 });
    const model = textField(raw, 'model', { max: 160 });
    const year = numberField(raw, 'year', 1900, new Date().getFullYear() + 1, true);
    const mileage = numberField(raw, 'mileage', 0, 2000000, true);
    const expectedPrice = numberField(raw, 'expectedPrice', 1, 10000000000, true);
    const conditionDescription = textField(raw, 'conditionDescription', { optional: true, max: 5000 });
    // This provisional range uses the submitted asking price, not a market appraisal.
    const baseVariance = expectedPrice * .05;
    return await dataStore.createSellRequest({ sellerName, phone, email, city, brand, model, year, mileage, expectedPrice, estimatedMarketValueMin: Math.max(0, Math.round((expectedPrice - baseVariance) / 100000) * 100000), estimatedMarketValueMax: Math.round((expectedPrice + baseVariance * 1.2) / 100000) * 100000, conditionDescription: conditionDescription || undefined, status: 'received' });
  }

  static async getAllFindRequests() { return await dataStore.getFindRequests(); }

  static async submitFindRequest(raw: Record<string, unknown>) {
    const { name: buyerName, phone, email } = contactFields(raw, 'buyerName');
    const targetBrand = textField(raw, 'targetBrand', { max: 120 });
    const targetModel = textField(raw, 'targetModel', { max: 160 });
    const minYear = numberField(raw, 'minYear', 1900, new Date().getFullYear() + 1, true);
    const budgetMax = numberField(raw, 'budgetMax', 4000000, 10000000000, true);
    const preferredCity = textField(raw, 'preferredCity', { max: 120 });
    const notes = textField(raw, 'notes', { optional: true, max: 5000 });
    return await dataStore.createFindRequest({ buyerName, phone, email, targetBrand, targetModel, minYear, budgetMax, preferredCity, notes: notes || undefined, status: 'active' });
  }
}
