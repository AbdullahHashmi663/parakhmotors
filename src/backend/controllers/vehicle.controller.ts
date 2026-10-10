import { NextRequest } from 'next/server';
import { VehicleService } from '../services/vehicle.service';
import { requireAdmin } from '../auth';
import { successResponse } from '../utils/api-response';
import { handleApiError } from '../utils/api-error';
import { readJsonObject } from '../utils/validation';
import type { VehicleQueryParams } from '@/types';

export class VehicleController {
  static async handleGetVehicles(request: NextRequest) {
    try {
      const { searchParams } = request.nextUrl;
      const numeric = (key: string) => searchParams.has(key) ? Number(searchParams.get(key)) : undefined;
      const queryParams: VehicleQueryParams = {
        search: searchParams.get('search') || undefined, brand: searchParams.get('brand') || undefined,
        minPrice: numeric('minPrice'), maxPrice: numeric('maxPrice'), minYear: numeric('minYear'), maxYear: numeric('maxYear'),
        bodyType: (searchParams.get('bodyType') as VehicleQueryParams['bodyType']) || undefined,
        fuelType: (searchParams.get('fuelType') as VehicleQueryParams['fuelType']) || undefined,
        condition: (searchParams.get('condition') as VehicleQueryParams['condition']) || undefined,
        sort: (searchParams.get('sort') as VehicleQueryParams['sort']) || 'latest', page: numeric('page'), limit: numeric('limit'),
      };
      const result = await VehicleService.getVehicles(queryParams);
      return successResponse(result.vehicles, { message: 'Vehicles retrieved successfully', meta: result.pagination });
    } catch (error) { return handleApiError(error); }
  }

  static async handleGetVehicleById(id: string) {
    try {
      return successResponse(await VehicleService.getVehicleById(id), { message: 'Vehicle retrieved successfully' });
    } catch (error) { return handleApiError(error); }
  }

  static async handleCreateVehicle(request: NextRequest) {
    try {
      requireAdmin(request);
      const vehicle = await VehicleService.createVehicle(await readJsonObject(request));
      return successResponse(vehicle, { message: 'Vehicle listed successfully', status: 201 });
    } catch (error) { return handleApiError(error); }
  }

  static async handleUpdateVehicle(id: string, request: NextRequest) {
    try {
      requireAdmin(request);
      const updated = await VehicleService.updateVehicle(id, await readJsonObject(request));
      return successResponse(updated, { message: 'Vehicle updated successfully' });
    } catch (error) { return handleApiError(error); }
  }

  static async handleDeleteVehicle(id: string, request: NextRequest) {
    try {
      requireAdmin(request);
      await VehicleService.deleteVehicle(id);
      return successResponse({ deletedId: id }, { message: 'Vehicle deleted successfully' });
    } catch (error) { return handleApiError(error); }
  }
}
