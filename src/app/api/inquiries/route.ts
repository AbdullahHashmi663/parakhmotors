import { NextRequest } from 'next/server';
import { InquiryController } from '@/backend/controllers/inquiry.controller';

export async function GET(request: NextRequest) {
  return InquiryController.handleGetInquiries(request);
}

export async function POST(request: NextRequest) {
  return InquiryController.handleCreateInquiry(request);
}
