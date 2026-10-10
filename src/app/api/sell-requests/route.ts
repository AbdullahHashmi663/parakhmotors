import { NextRequest } from 'next/server';
import { RequestController } from '@/backend/controllers/request.controller';

export async function GET(request: NextRequest) {
  return RequestController.handleGetSellRequests(request);
}

export async function POST(request: NextRequest) {
  return RequestController.handleSubmitSellRequest(request);
}
