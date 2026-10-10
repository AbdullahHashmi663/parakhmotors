import { NextRequest } from 'next/server';
import { VehicleController } from '@/backend/controllers/vehicle.controller';

export async function GET(request: NextRequest) {
  return VehicleController.handleGetVehicles(request);
}

export async function POST(request: NextRequest) {
  return VehicleController.handleCreateVehicle(request);
}
