import type { SiteContent } from '@/lib/site-content';

export type VehicleCondition = 'certified_pre_owned' | 'used' | 'brand_new';
export type FuelType = 'petrol' | 'diesel' | 'hybrid' | 'electric';
export type TransmissionType = 'automatic' | 'manual';
export type BodyType = 'sedan' | 'suv' | 'crossover' | 'hatchback' | 'coupe';
export type ListingStatus = 'available' | 'reserved' | 'sold';

export interface Vehicle {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  price: number; // in PKR
  mileage: number; // in km
  fuelType: FuelType;
  transmission: TransmissionType;
  bodyType: BodyType;
  condition: VehicleCondition;
  inspectionScore: number; // 0 - 100
  color: string;
  location: string;
  status: ListingStatus;
  featured: boolean;
  images: string[];
  features: string[];
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleQueryParams {
  search?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  bodyType?: BodyType;
  fuelType?: FuelType;
  condition?: VehicleCondition;
  sort?: 'price_asc' | 'price_desc' | 'year_desc' | 'mileage_asc' | 'latest';
  page?: number;
  limit?: number;
}

export type InspectionPackage = 'basic' | 'comprehensive' | 'premium' | 'deal_package';
export type InspectionStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface InspectionBooking {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  city: string;
  carMake: string;
  carModel: string;
  carYear: number;
  packageType: InspectionPackage;
  preferredDate: string;
  preferredTimeSlot?: string;
  locationAddress?: string;
  status: InspectionStatus;
  estimatedFee: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type InquiryType = 'general' | 'vehicle' | 'finance' | 'inspection' | 'sell';
export type InquiryStatus = 'new' | 'in_review' | 'contacted' | 'resolved';

export interface CustomerInquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: InquiryType;
  vehicleId?: string;
  message: string;
  status: InquiryStatus;
  createdAt: string;
}

export interface SellRequestPhoto {
  id: string;
  url: string;
  width: number;
  height: number;
  size: number;
}

export interface SellCarRequest {
  id: string;
  sellerName: string;
  phone: string;
  email: string;
  city: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  expectedPrice: number;
  estimatedMarketValueMin: number;
  estimatedMarketValueMax: number;
  conditionDescription?: string;
  photos?: SellRequestPhoto[];
  status: 'received' | 'valuation_provided' | 'inspection_scheduled' | 'listed';
  createdAt: string;
}

export interface FindCarRequest {
  id: string;
  buyerName: string;
  phone: string;
  email: string;
  targetBrand: string;
  targetModel: string;
  minYear: number;
  budgetMax: number;
  preferredCity: string;
  notes?: string;
  status: 'active' | 'options_found' | 'fulfilled' | 'closed';
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    [key: string]: unknown;
  };
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
  timestamp: string;
}

export interface Theme {
  id: string;
  name: string;
  category: string;
  description: string;
  background: string;
  foreground: string;
  card_bg: string;
  border_color: string;
  primary: string;
  accent: string;
  glow_color: string;
  is_active: boolean;
}

export interface DealershipSettings {
  dealershipName: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  workingHours: string;
  announcement: string;
  currency: string;
  heroHeadline: string;
  heroSubheadline: string;
  activeThemeId: string;
  websiteContent: SiteContent;
}

