import { NextResponse } from 'next/server';
import { getDatabaseHealth } from '@/backend/database';

export async function GET() {
  const database = await getDatabaseHealth();
  return NextResponse.json({
    status: database.connected ? 'online' : 'degraded',
    service: 'Parakh Motors Backend',
    database,
    timestamp: new Date().toISOString(),
    modules: { vehicles: '/api/vehicles', inspections: '/api/inspections', inquiries: '/api/inquiries', sellRequests: '/api/sell-requests', carFinder: '/api/car-finder' },
  }, { status: database.connected ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
}
