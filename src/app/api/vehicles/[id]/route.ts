import { NextRequest } from 'next/server';
import { VehicleController } from '@/backend/controllers/vehicle.controller';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return VehicleController.handleGetVehicleById(id);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return VehicleController.handleUpdateVehicle(id, request);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return VehicleController.handleDeleteVehicle(id, request);
}
