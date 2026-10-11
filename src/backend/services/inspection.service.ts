import { dataStore } from '../repositories/data-store';
import { ApiError } from '../utils/api-error';
import { contactFields, enumField, inspectionStatuses, numberField, resourceId, textField } from '../utils/validation';
import type { InspectionBooking } from '@/types';
import { getServicePackage } from '@/lib/site-content';

export class InspectionService {
  static async getAllInspections(status?: InspectionBooking['status']) {
    const list = await dataStore.getInspections();
    if (status) enumField(status, inspectionStatuses, 'inspection status');
    return status ? list.filter((i) => i.status === status) : list;
  }

  static async getInspectionById(id: string) {
    const inspection = await dataStore.getInspectionById(resourceId(id));
    if (!inspection) throw ApiError.notFound('Inspection booking not found');
    return inspection;
  }

  static async bookInspection(raw: Record<string, unknown>) {
    const { name: customerName, phone, email } = contactFields(raw, 'customerName');
    const city = textField(raw, 'city', { max: 120 });
    const carMake = textField(raw, 'carMake', { max: 120 });
    const carModel = textField(raw, 'carModel', { max: 160 });
    const carYear = numberField(raw, 'carYear', 1900, new Date().getFullYear() + 1, true);
    const preferredDate = textField(raw, 'preferredDate', { max: 10 });
    const parsedDate = new Date(preferredDate + 'T00:00:00Z');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate) || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== preferredDate) throw ApiError.badRequest('Choose a valid inspection date');
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    if (preferredDate < today) throw ApiError.badRequest('Choose today or a future inspection date');
    const packageType = enumField(raw.packageType, ['basic', 'comprehensive', 'premium', 'deal_package'] as const, 'inspection package');
    const settings = await dataStore.getSettings();
    const selectedPackage = getServicePackage(settings.websiteContent, packageType);
    if (!selectedPackage?.enabled) throw ApiError.badRequest('This inspection package is currently unavailable. Please choose another package or contact our team.');
    const preferredTimeSlot = textField(raw, 'preferredTimeSlot', { optional: true, max: 80 });
    const locationAddress = textField(raw, 'locationAddress', { optional: true, max: 500 });
    const notes = textField(raw, 'notes', { optional: true, max: 5000 });
    return await dataStore.createInspection({ customerName, email, phone, city, carMake, carModel, carYear, packageType, preferredDate, preferredTimeSlot: preferredTimeSlot || undefined, locationAddress: locationAddress || undefined, estimatedFee: selectedPackage.price, notes: notes || undefined, status: 'pending' });
  }

  static async updateStatus(id: string, status: unknown, notes?: string) {
    const updated = await dataStore.updateInspectionStatus(resourceId(id), enumField(status, inspectionStatuses, 'inspection status'), notes);
    if (!updated) throw ApiError.notFound('Inspection booking not found');
    return updated;
  }
}
