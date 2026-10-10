import { dataStore } from '../repositories/data-store';
import { ApiError } from '../utils/api-error';
import { contactFields, enumField, inquiryStatuses, resourceId, textField } from '../utils/validation';
import type { InquiryStatus } from '@/types';

export class InquiryService {
  static async getAllInquiries(status?: InquiryStatus) {
    const list = await dataStore.getInquiries();
    if (status) enumField(status, inquiryStatuses, 'inquiry status');
    return status ? list.filter((i) => i.status === status) : list;
  }

  static async createInquiry(payload: Record<string, unknown>) {
    const { name, email, phone } = contactFields(payload, 'name');
    const message = textField(payload, 'message', { max: 5000 });
    const type = enumField(payload.type ?? 'general', ['general', 'vehicle', 'finance', 'inspection', 'sell'] as const, 'inquiry type');
    const vehicleId = textField(payload, 'vehicleId', { optional: true, max: 120 });
    if (vehicleId && !(await dataStore.getVehicleById(resourceId(vehicleId)))) throw ApiError.badRequest('The referenced vehicle is unavailable');
    return await dataStore.createInquiry({ name, email, phone, type, vehicleId: vehicleId || undefined, message, status: 'new' });
  }

  static async updateStatus(id: string, status: unknown) {
    const updated = await dataStore.updateInquiryStatus(resourceId(id), enumField(status, inquiryStatuses, 'inquiry status'));
    if (!updated) throw ApiError.notFound('Inquiry not found');
    return updated;
  }
}
