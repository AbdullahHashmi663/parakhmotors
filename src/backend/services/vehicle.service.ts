import { dataStore } from '../repositories/data-store';
import { ApiError } from '../utils/api-error';
import { enumField, numberField, resourceId, textField } from '../utils/validation';
import type { Vehicle, VehicleQueryParams } from '@/types';

const bodyTypes = ['sedan', 'suv', 'crossover', 'hatchback', 'coupe'] as const;
const fuelTypes = ['petrol', 'diesel', 'hybrid', 'electric'] as const;
const conditions = ['certified_pre_owned', 'used', 'brand_new'] as const;

function vehicleFields(raw: Record<string, unknown>, partial: boolean): Partial<Vehicle> {
  const data: Partial<Vehicle> = {};
  for (const field of ['title', 'brand', 'model'] as const) {
    if (!partial || field in raw) data[field] = textField(raw, field, { max: field === 'title' ? 200 : 120 });
  }
  if (!partial || 'year' in raw) data.year = numberField(raw, 'year', 1900, new Date().getFullYear() + 1, true);
  if (!partial || 'price' in raw) data.price = numberField(raw, 'price', 1, 10000000000, true);
  if (!partial || 'mileage' in raw) data.mileage = numberField({ mileage: raw.mileage ?? 0 }, 'mileage', 0, 2000000, true);
  if (!partial || 'inspectionScore' in raw) data.inspectionScore = numberField({ inspectionScore: raw.inspectionScore ?? 0 }, 'inspectionScore', 0, 100, true);
  if (!partial || 'fuelType' in raw) data.fuelType = enumField(raw.fuelType ?? 'petrol', fuelTypes, 'fuel type');
  if (!partial || 'bodyType' in raw) data.bodyType = enumField(raw.bodyType ?? 'sedan', bodyTypes, 'body type');
  if (!partial || 'condition' in raw) data.condition = enumField(raw.condition ?? 'used', conditions, 'vehicle condition');
  if (!partial || 'transmission' in raw) data.transmission = enumField(raw.transmission ?? 'automatic', ['automatic', 'manual'] as const, 'transmission');
  if (!partial || 'status' in raw) data.status = enumField(raw.status ?? 'available', ['available', 'reserved', 'sold'] as const, 'listing status');
  for (const field of ['color', 'location', 'description'] as const) {
    if (!partial || field in raw) data[field] = textField(raw, field, { optional: true, max: field === 'description' ? 10000 : 200 });
  }
  if (!partial || 'featured' in raw) {
    if (raw.featured !== undefined && typeof raw.featured !== 'boolean') throw ApiError.badRequest('featured must be true or false');
    data.featured = raw.featured === true;
  }
  for (const field of ['images', 'features'] as const) {
    if (partial && !(field in raw)) continue;
    const values = raw[field] ?? [];
    if (!Array.isArray(values) || values.length > (field === 'images' ? 20 : 80) || values.some(value => typeof value !== 'string' || value.length > (field === 'images' ? 2000 : 300))) throw ApiError.badRequest(field + ' must be a list of valid text values');
    const list = (values as string[]).map(value => value.trim()).filter(Boolean);
    if (field === 'images' && list.some(value => !/^https:\/\//i.test(value) && !/^\/(?!\/)/.test(value))) throw ApiError.badRequest('Images must use HTTPS or a local image path');
    data[field] = list;
  }
  if (partial && !Object.keys(data).length) throw ApiError.badRequest('Provide at least one valid vehicle field');
  return data;
}

export class VehicleService {
  static async getVehicles(params: VehicleQueryParams) {
    for (const key of ['minPrice', 'maxPrice', 'minYear', 'maxYear', 'page', 'limit'] as const) {
      const value = params[key];
      if (value !== undefined) numberField({ [key]: value }, key, key === 'page' || key === 'limit' ? 1 : 0, key === 'limit' ? 100 : Number.MAX_SAFE_INTEGER, ['minYear', 'maxYear', 'page', 'limit'].includes(key));
    }
    if (params.minPrice !== undefined && params.maxPrice !== undefined && params.minPrice > params.maxPrice) throw ApiError.badRequest('Minimum price cannot exceed maximum price');
    if (params.minYear !== undefined && params.maxYear !== undefined && params.minYear > params.maxYear) throw ApiError.badRequest('Minimum year cannot exceed maximum year');
    if (params.bodyType) enumField(params.bodyType, bodyTypes, 'body type');
    if (params.fuelType) enumField(params.fuelType, fuelTypes, 'fuel type');
    if (params.condition) enumField(params.condition, conditions, 'vehicle condition');
    if (params.sort) enumField(params.sort, ['price_asc', 'price_desc', 'year_desc', 'mileage_asc', 'latest'] as const, 'sort order');
    if (params.search) textField({ search: params.search }, 'search', { max: 300 });
    if (params.brand) textField({ brand: params.brand }, 'brand', { max: 120 });
    let list = await dataStore.getVehicles();
    if (params.search) {
      const q = params.search.toLowerCase().trim();
      list = list.filter(v => [v.title, v.brand, v.model, v.description].some(value => value.toLowerCase().includes(q)));
    }
    if (params.brand) list = list.filter(v => v.brand.toLowerCase() === params.brand!.toLowerCase());
    if (params.minPrice !== undefined) list = list.filter(v => v.price >= params.minPrice!);
    if (params.maxPrice !== undefined) list = list.filter(v => v.price <= params.maxPrice!);
    if (params.minYear !== undefined) list = list.filter(v => v.year >= params.minYear!);
    if (params.maxYear !== undefined) list = list.filter(v => v.year <= params.maxYear!);
    if (params.bodyType) list = list.filter(v => v.bodyType === params.bodyType);
    if (params.fuelType) list = list.filter(v => v.fuelType === params.fuelType);
    if (params.condition) list = list.filter(v => v.condition === params.condition);
    switch (params.sort) {
      case 'price_asc': list.sort((a, b) => a.price - b.price); break;
      case 'price_desc': list.sort((a, b) => b.price - a.price); break;
      case 'year_desc': list.sort((a, b) => b.year - a.year); break;
      case 'mileage_asc': list.sort((a, b) => a.mileage - b.mileage); break;
      default: list.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    }
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const total = list.length;
    return { vehicles: list.slice((page - 1) * limit, page * limit), pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  static async getVehicleById(id: string) {
    const vehicle = await dataStore.getVehicleById(resourceId(id));
    if (!vehicle) throw ApiError.notFound('Vehicle not found');
    return vehicle;
  }

  static async createVehicle(raw: Record<string, unknown>) {
    return await dataStore.createVehicle(vehicleFields(raw, false) as Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>);
  }

  static async updateVehicle(id: string, raw: Record<string, unknown>) {
    const updated = await dataStore.updateVehicle(resourceId(id), vehicleFields(raw, true));
    if (!updated) throw ApiError.notFound('Vehicle not found');
    return updated;
  }

  static async deleteVehicle(id: string) {
    if (!(await dataStore.deleteVehicle(resourceId(id)))) throw ApiError.notFound('Vehicle not found');
  }
}
