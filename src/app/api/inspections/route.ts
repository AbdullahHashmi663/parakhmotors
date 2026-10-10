import { NextRequest } from 'next/server';
import { InspectionController } from '@/backend/controllers/inspection.controller';

export async function GET(request: NextRequest) {
  return InspectionController.handleGetInspections(request);
}

export async function POST(request: NextRequest) {
  return InspectionController.handleBookInspection(request);
}
