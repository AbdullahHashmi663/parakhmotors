import { NextRequest } from 'next/server';
import { InquiryService } from '../services/inquiry.service';
import { requireAdmin } from '../auth';
import { successResponse } from '../utils/api-response';
import { handleApiError } from '../utils/api-error';
import { enumField, inquiryStatuses, readJsonObject } from '../utils/validation';

export class InquiryController {
  static async handleGetInquiries(request: NextRequest) {
    try {
      requireAdmin(request);
      const rawStatus = request.nextUrl.searchParams.get('status');
      const status = rawStatus ? enumField(rawStatus, inquiryStatuses, 'inquiry status') : undefined;
      const inquiries = await InquiryService.getAllInquiries(status);
      return successResponse(inquiries, { message: 'Inquiries retrieved successfully', meta: { total: inquiries.length } });
    } catch (error) { return handleApiError(error); }
  }

  static async handleCreateInquiry(request: NextRequest) {
    try {
      const inquiry = await InquiryService.createInquiry(await readJsonObject(request));
      return successResponse(inquiry, { message: 'Your inquiry has been submitted. Our team will contact you promptly.', status: 201 });
    } catch (error) { return handleApiError(error); }
  }

  static async handleUpdateStatus(id: string, request: NextRequest) {
    try {
      requireAdmin(request);
      const body = await readJsonObject(request);
      const updated = await InquiryService.updateStatus(id, body.status);
      return successResponse(updated, { message: 'Inquiry status updated successfully' });
    } catch (error) { return handleApiError(error); }
  }
}
