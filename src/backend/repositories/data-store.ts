import 'server-only';
import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import type { Vehicle, InspectionBooking, CustomerInquiry, SellCarRequest, FindCarRequest, Theme, DealershipSettings } from '@/types';
import { databaseTransaction, getDatabasePool } from '@/backend/database';
import { defaultSiteData } from './seed-data';

type Fields = Record<string, string>;
type Executor = Pick<PoolClient, 'query'>;
type Row = Record<string, unknown>;
const vehicleFields: Fields = {
  id: 'id', title: 'title', brand: 'brand', model: 'model', year: 'year', price: 'price', mileage: 'mileage',
  fuelType: 'fuel_type', transmission: 'transmission', bodyType: 'body_type', condition: 'condition',
  inspectionScore: 'inspection_score', color: 'color', location: 'location', status: 'status', featured: 'featured',
  images: 'images', features: 'features', description: 'description', createdAt: 'created_at', updatedAt: 'updated_at',
};
const inspectionFields: Fields = {
  id: 'id', customerName: 'customer_name', email: 'email', phone: 'phone', city: 'city', carMake: 'car_make',
  carModel: 'car_model', carYear: 'car_year', packageType: 'package_type', preferredDate: 'preferred_date',
  preferredTimeSlot: 'preferred_time_slot', locationAddress: 'location_address', status: 'status',
  estimatedFee: 'estimated_fee', notes: 'notes', createdAt: 'created_at', updatedAt: 'updated_at',
};
const inquiryFields: Fields = {
  id: 'id', name: 'name', email: 'email', phone: 'phone', type: 'type', vehicleId: 'vehicle_id',
  message: 'message', status: 'status', createdAt: 'created_at',
};
const sellFields: Fields = {
  id: 'id', sellerName: 'seller_name', phone: 'phone', email: 'email', city: 'city', brand: 'brand', model: 'model',
  year: 'year', mileage: 'mileage', expectedPrice: 'expected_price', estimatedMarketValueMin: 'estimated_market_value_min',
  estimatedMarketValueMax: 'estimated_market_value_max', conditionDescription: 'condition_description', status: 'status', createdAt: 'created_at',
};
const findFields: Fields = {
  id: 'id', buyerName: 'buyer_name', phone: 'phone', email: 'email', targetBrand: 'target_brand', targetModel: 'target_model',
  minYear: 'min_year', budgetMax: 'budget_max', preferredCity: 'preferred_city', notes: 'notes', status: 'status', createdAt: 'created_at',
};
const themeFields: Fields = {
  id: 'id', name: 'name', category: 'category', description: 'description', background: 'background', foreground: 'foreground',
  card_bg: 'card_bg', border_color: 'border_color', primary: 'primary_color', accent: 'accent', glow_color: 'glow_color', is_active: 'is_active',
};
const settingsFields: Fields = {
  dealershipName: 'dealership_name', tagline: 'tagline', phone: 'phone', whatsapp: 'whatsapp', email: 'email', address: 'address',
  workingHours: 'working_hours', announcement: 'announcement', currency: 'currency', heroHeadline: 'hero_headline',
  heroSubheadline: 'hero_subheadline', activeThemeId: 'active_theme_id',
};
const numberFields = new Set(['year', 'price', 'mileage', 'inspectionScore', 'carYear', 'estimatedFee', 'expectedPrice',
  'estimatedMarketValueMin', 'estimatedMarketValueMax', 'minYear', 'budgetMax']);
function mapRow<T>(row: Row, fields: Fields): T {
  const mapped: Row = {};
  for (const [name, column] of Object.entries(fields)) {
    const value = row[column];
    mapped[name] = value instanceof Date ? value.toISOString() : value === null ? (name === 'description' ? '' : undefined)
      : numberFields.has(name) ? Number(value) : value;
  }
  return mapped as T;
}
// Identifiers come only from fixed maps. Every submitted value uses SQL parameters.
async function list<T>(table: string, fields: Fields, db: Executor = getDatabasePool()): Promise<T[]> {
  const result = await db.query(`SELECT * FROM public.${table} ORDER BY created_at DESC, id DESC`);
  return result.rows.map((row: Row) => mapRow<T>(row, fields));
}
async function get<T>(table: string, fields: Fields, id: string, db: Executor = getDatabasePool()): Promise<T | undefined> {
  const result = await db.query(`SELECT * FROM public.${table} WHERE id = $1`, [id]);
  return result.rows[0] ? mapRow<T>(result.rows[0], fields) : undefined;
}
async function insert<T>(table: string, fields: Fields, prefix: string, value: object, db: Executor = getDatabasePool()): Promise<T> {
  const payload: Row = { ...value, id: `${prefix}-${randomUUID()}` };
  const entries = Object.entries(fields).filter(([key]) => payload[key] !== undefined);
  const result = await db.query(`INSERT INTO public.${table} (${entries.map(([, column]) => column).join(', ')}) VALUES (${entries.map((_, index) => `$${index + 1}`).join(', ')}) RETURNING *`, entries.map(([key]) => payload[key]));
  return mapRow<T>(result.rows[0], fields);
}
async function update<T>(table: string, fields: Fields, id: string, value: object, db: Executor = getDatabasePool()): Promise<T | null> {
  const payload = value as Row;
  const entries = Object.entries(fields).filter(([key]) => !['id', 'createdAt', 'updatedAt'].includes(key) && payload[key] !== undefined);
  if (!entries.length) return (await get<T>(table, fields, id, db)) ?? null;
  const assignments = entries.map(([, column], index) => `${column} = $${index + 2}`);
  if (fields.updatedAt) assignments.push('updated_at = NOW()');
  const result = await db.query(`UPDATE public.${table} SET ${assignments.join(', ')} WHERE id = $1 RETURNING *`, [id, ...entries.map(([key]) => payload[key])]);
  return result.rows[0] ? mapRow<T>(result.rows[0], fields) : null;
}
async function remove(table: string, id: string, db: Executor = getDatabasePool()): Promise<boolean> {
  return Boolean((await db.query(`DELETE FROM public.${table} WHERE id = $1`, [id])).rowCount);
}
async function saveSettings(settings: DealershipSettings, db: Executor): Promise<DealershipSettings> {
  const entries = Object.entries(settingsFields);
  const result = await db.query(`INSERT INTO public.dealership_settings (id, ${entries.map(([, column]) => column).join(', ')}) VALUES ('main_settings', ${entries.map((_, index) => `$${index + 1}`).join(', ')}) ON CONFLICT (id) DO UPDATE SET ${entries.map(([, column]) => `${column} = EXCLUDED.${column}`).join(', ')}, updated_at = NOW() RETURNING *`, entries.map(([key]) => settings[key as keyof DealershipSettings]));
  return mapRow<DealershipSettings>(result.rows[0], settingsFields);
}
async function lockThemeSettings(db: Executor) {
  await db.query("SELECT pg_advisory_xact_lock(hashtext('parakh-theme-settings'))");
}
async function upsertTheme(theme: Theme, db: Executor): Promise<Theme> {
  const entries = Object.entries(themeFields);
  const result = await db.query(`INSERT INTO public.themes (${entries.map(([, column]) => column).join(', ')}) VALUES (${entries.map((_, index) => `$${index + 1}`).join(', ')}) ON CONFLICT (id) DO UPDATE SET ${entries.filter(([key]) => key !== 'id').map(([, column]) => `${column} = EXCLUDED.${column}`).join(', ')}, updated_at = NOW() RETURNING *`, entries.map(([key]) => theme[key as keyof Theme]));
  return mapRow<Theme>(result.rows[0], themeFields);
}

class DataStore {
  getVehicles() { return list<Vehicle>('vehicles', vehicleFields); }
  getVehicleById(id: string) { return get<Vehicle>('vehicles', vehicleFields, id); }
  createVehicle(value: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) { return insert<Vehicle>('vehicles', vehicleFields, 'pm-veh', value); }
  updateVehicle(id: string, value: Partial<Vehicle>) { return update<Vehicle>('vehicles', vehicleFields, id, value); }
  deleteVehicle(id: string) { return remove('vehicles', id); }
  getInspections() { return list<InspectionBooking>('inspections', inspectionFields); }
  getInspectionById(id: string) { return get<InspectionBooking>('inspections', inspectionFields, id); }
  createInspection(value: Omit<InspectionBooking, 'id' | 'createdAt' | 'updatedAt'>) { return insert<InspectionBooking>('inspections', inspectionFields, 'pm-insp', value); }
  updateInspectionStatus(id: string, status: InspectionBooking['status'], notes?: string) { return update<InspectionBooking>('inspections', inspectionFields, id, { status, notes }); }
  deleteInspection(id: string) { return remove('inspections', id); }
  getInquiries() { return list<CustomerInquiry>('inquiries', inquiryFields); }
  createInquiry(value: Omit<CustomerInquiry, 'id' | 'createdAt'>) { return insert<CustomerInquiry>('inquiries', inquiryFields, 'pm-inq', value); }
  updateInquiryStatus(id: string, status: CustomerInquiry['status']) { return update<CustomerInquiry>('inquiries', inquiryFields, id, { status }); }
  deleteInquiry(id: string) { return remove('inquiries', id); }
  getSellRequests() { return list<SellCarRequest>('sell_requests', sellFields); }
  createSellRequest(value: Omit<SellCarRequest, 'id' | 'createdAt'>) { return insert<SellCarRequest>('sell_requests', sellFields, 'pm-sell', value); }
  updateSellRequestStatus(id: string, status: SellCarRequest['status']) { return update<SellCarRequest>('sell_requests', sellFields, id, { status }); }
  deleteSellRequest(id: string) { return remove('sell_requests', id); }
  getFindRequests() { return list<FindCarRequest>('find_requests', findFields); }
  createFindRequest(value: Omit<FindCarRequest, 'id' | 'createdAt'>) { return insert<FindCarRequest>('find_requests', findFields, 'pm-find', value); }
  updateFindRequestStatus(id: string, status: FindCarRequest['status']) { return update<FindCarRequest>('find_requests', findFields, id, { status }); }
  deleteFindRequest(id: string) { return remove('find_requests', id); }
  getThemes() { return list<Theme>('themes', themeFields); }
  async getActiveTheme() {
    const result = await getDatabasePool().query('SELECT * FROM public.themes WHERE is_active = true ORDER BY id LIMIT 1');
    return result.rows[0] ? mapRow<Theme>(result.rows[0], themeFields) : defaultSiteData.themes[0];
  }
  setActiveTheme(themeId: string): Promise<Theme | null> {
    return databaseTransaction(async (db) => {
      await lockThemeSettings(db);
      if (!await get<Theme>('themes', themeFields, themeId, db)) return null;
      await db.query('UPDATE public.themes SET is_active = false, updated_at = NOW() WHERE is_active = true');
      const theme = await update<Theme>('themes', themeFields, themeId, { is_active: true }, db);
      await db.query("UPDATE public.dealership_settings SET active_theme_id = $1, updated_at = NOW() WHERE id = 'main_settings'", [themeId]);
      return theme;
    });
  }
  saveTheme(theme: Theme): Promise<Theme> {
    return databaseTransaction(async (db) => {
      await lockThemeSettings(db);
      const active = await db.query('SELECT id FROM public.themes WHERE is_active = true');
      const shouldActivate = theme.is_active || active.rows.length === 0 || active.rows[0]?.id === theme.id;
      if (shouldActivate) await db.query('UPDATE public.themes SET is_active = false, updated_at = NOW() WHERE is_active = true');
      const saved = await upsertTheme({ ...theme, is_active: shouldActivate }, db);
      if (shouldActivate) await db.query("UPDATE public.dealership_settings SET active_theme_id = $1, updated_at = NOW() WHERE id = 'main_settings'", [theme.id]);
      return saved;
    });
  }
  deleteTheme(themeId: string): Promise<boolean> {
    return databaseTransaction(async (db) => {
      await lockThemeSettings(db);
      const themes = await list<Theme>('themes', themeFields, db);
      const target = themes.find((theme) => theme.id === themeId);
      if (!target) return false;
      if (themes.length <= 1) throw new Error('The final theme cannot be deleted');
      await remove('themes', themeId, db);
      if (target.is_active) {
        const next = themes.find((theme) => theme.id !== themeId)!;
        await update<Theme>('themes', themeFields, next.id, { is_active: true }, db);
        await db.query("UPDATE public.dealership_settings SET active_theme_id = $1, updated_at = NOW() WHERE id = 'main_settings'", [next.id]);
      }
      return true;
    });
  }
  async getSettings(): Promise<DealershipSettings> {
    const settings = await get<DealershipSettings>('dealership_settings', settingsFields, 'main_settings');
    if (!settings) throw new Error('Database setup is required');
    return settings;
  }
  updateSettings(value: Partial<DealershipSettings>): Promise<DealershipSettings> {
    return databaseTransaction(async (db) => {
      await lockThemeSettings(db);
      const current = await get<DealershipSettings>('dealership_settings', settingsFields, 'main_settings', db);
      if (!current) throw new Error('Database setup is required');
      const knownUpdates = Object.fromEntries(Object.keys(settingsFields).filter((key) => value[key as keyof DealershipSettings] !== undefined).map((key) => [key, value[key as keyof DealershipSettings]]));
      if (value.activeThemeId) {
        if (!await get<Theme>('themes', themeFields, value.activeThemeId, db)) throw new Error('Unknown theme');
        await db.query('UPDATE public.themes SET is_active = false, updated_at = NOW() WHERE is_active = true');
        await update<Theme>('themes', themeFields, value.activeThemeId, { is_active: true }, db);
      }
      return saveSettings({ ...current, ...knownUpdates }, db);
    });
  }
  getAllData() {
    return databaseTransaction(async (db) => {
      await db.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const vehicles = await list<Vehicle>('vehicles', vehicleFields, db);
      const inspections = await list<InspectionBooking>('inspections', inspectionFields, db);
      const inquiries = await list<CustomerInquiry>('inquiries', inquiryFields, db);
      const sellRequests = await list<SellCarRequest>('sell_requests', sellFields, db);
      const findRequests = await list<FindCarRequest>('find_requests', findFields, db);
      const themes = await list<Theme>('themes', themeFields, db);
      const settings = await get<DealershipSettings>('dealership_settings', settingsFields, 'main_settings', db);
      if (!settings) throw new Error('Database setup is required');
      return { vehicles, inspections, inquiries, sellRequests, findRequests, themes, settings };
    });
  }
  // Restore appearance without deleting customer records or inventory.
  async resetToDefaults() {
    await databaseTransaction(async (db) => {
      await lockThemeSettings(db);
      await db.query('UPDATE public.themes SET is_active = false, updated_at = NOW() WHERE is_active = true');
      for (const theme of defaultSiteData.themes) await upsertTheme(theme, db);
      await saveSettings(defaultSiteData.settings, db);
    });
    return this.getAllData();
  }
}
export const dataStore = new DataStore();
