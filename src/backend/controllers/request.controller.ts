import { NextRequest } from 'next/server';
import { RequestService } from '../services/request.service';
import { requireAdmin } from '../auth';
import { successResponse } from '../utils/api-response';
import { handleApiError } from '../utils/api-error';
import { readJsonObject } from '../utils/validation';
import { readSellRequestSubmission } from '../utils/sell-photo-upload';

export class RequestController {
  static async handleGetSellRequests(request: NextRequest) {
    try {
      requireAdmin(request);
      const requests = await RequestService.getAllSellRequests();
      return successResponse(requests, { message: 'Sell car requests retrieved successfully', meta: { total: requests.length } });
    } catch (error) { return handleApiError(error); }
  }

  static async handleSubmitSellRequest(request: NextRequest) {
    try {
      const { details, photos } = await readSellRequestSubmission(request);
      const sellRequest = await RequestService.submitSellRequest(details, photos);
      return successResponse(sellRequest, { message: 'Sell car evaluation request submitted successfully', status: 201 });
    } catch (error) { return handleApiError(error); }
  }

  static async handleGetFindRequests(request: NextRequest) {
    try {
      requireAdmin(request);
      const requests = await RequestService.getAllFindRequests();
      return successResponse(requests, { message: 'Find car requests retrieved successfully', meta: { total: requests.length } });
    } catch (error) { return handleApiError(error); }
  }

  static async handleSubmitFindRequest(request: NextRequest) {
    try {
      const findRequest = await RequestService.submitFindRequest(await readJsonObject(request));
      return successResponse(findRequest, { message: 'Vehicle finding request submitted successfully', status: 201 });
    } catch (error) { return handleApiError(error); }
  }
}
