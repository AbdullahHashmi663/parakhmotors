import { NextRequest } from 'next/server';
import { RequestController } from '@/backend/controllers/request.controller';

export async function GET(request: NextRequest) {
  return RequestController.handleGetFindRequests(request);
}

export async function POST(request: NextRequest) {
  return RequestController.handleSubmitFindRequest(request);
}
