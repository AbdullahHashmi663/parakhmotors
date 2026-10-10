import { NextRequest } from 'next/server';
import { InspectionService } from '../services/inspection.service';
import { requireAdmin } from '../auth';
import { successResponse } from '../utils/api-response';
import { handleApiError } from '../utils/api-error';
import { enumField, inspectionStatuses, readJsonObject, textField } from '../utils/validation';

export class InspectionController {
  static async handleGetInspections(request: NextRequest) {
    try {
      requireAdmin(request);
      const rawStatus = request.nextUrl.searchParams.get('status');
      const status = rawStatus ? enumField(rawStatus, inspectionStatuses, 'inspection status') : undefined;
      const inspections = await InspectionService.getAllInspections(status);
      return successResponse(inspections, { message: 'Inspections retrieved successfully', meta: { total: inspections.length } });
    } catch (error) { return handleApiError(error); }
  }

  static async handleGetInspectionById(id: string, request: NextRequest) {
    try {
      requireAdmin(request);
      return successResponse(await InspectionService.getInspectionById(id), { message: 'Inspection retrieved successfully' });
    } catch (error) { return handleApiError(error); }
  }

  static async handleBookInspection(request: NextRequest) {
    try {
      const booking = await InspectionService.bookInspection(await readJsonObject(request));
      return successResponse(booking, { message: 'Inspection requested successfully. Our team will contact you to confirm the arrangements.', status: 201 });
    } catch (error) { return handleApiError(error); }
  }

  static async handleUpdateInspectionStatus(id: string, request: NextRequest) {
    try {
      requireAdmin(request);
      const body = await readJsonObject(request);
      const notes = 'notes' in body ? textField(body, 'notes', { optional: true, max: 5000 }) : undefined;
      const updated = await InspectionService.updateStatus(id, body.status, notes);
      return successResponse(updated, { message: 'Inspection status updated successfully' });
    } catch (error) { return handleApiError(error); }
  }
}
