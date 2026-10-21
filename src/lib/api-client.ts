import type {
  ApiResponse,
  Vehicle,
  VehicleQueryParams,
  InspectionBooking,
  InspectionPackage,
  CustomerInquiry,
  SellCarRequest,
  FindCarRequest,
  DealershipSettings,
  Theme,
} from '@/types';

export const ADMIN_SESSION_EXPIRED = 'parakh:admin-session-expired';

export class ApiClientError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiClientError';
  }
}

interface AdminDataResponse {
  success: boolean;
  data: {
    vehicles: Vehicle[];
    inspections: InspectionBooking[];
    inquiries: CustomerInquiry[];
    sellRequests: SellCarRequest[];
    findRequests: FindCarRequest[];
    themes: Theme[];
    settings: DealershipSettings;
  };
  status: { has_db_url: boolean; db_connected: boolean; source: string };
}

async function requestJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const headers = new Headers(options?.headers);
  if (options?.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  let response: Response;
  try {
    response = await fetch(url, { cache: 'no-store', ...options, headers });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new ApiClientError('We couldn’t reach the showroom. Check your connection and try again.', 0);
  }

  const data = await response.json().catch(() => null) as {
    success?: boolean;
    message?: string;
    error?: { message?: string };
  } | null;

  if (!response.ok || !data || data.success === false) {
    if (response.status === 401 && url !== '/api/admin/session' && typeof window !== 'undefined') {
      window.dispatchEvent(new Event(ADMIN_SESSION_EXPIRED));
    }
    const message = response.status === 401 && url !== '/api/admin/session'
      ? 'Your administrator session has expired. Please sign in again.'
      : data?.error?.message || data?.message || 'The showroom could not complete this request. Please try again.';
    throw new ApiClientError(message, response.status);
  }

  return data as T;
}

function fetcher<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  return requestJson<ApiResponse<T>>(endpoint, options);
}

function vehicleRequestBody(data: object, photos: File[] = []): string | FormData {
  if (!photos.length) return JSON.stringify(data);
  const form = new FormData();
  form.set('details', JSON.stringify(data));
  photos.forEach((photo) => form.append('photos', photo));
  return form;
}

export const api = {
  health: {
    check: () => requestJson<{ success: boolean; status?: string }>('/api/health'),
  },

  vehicles: {
    list: (params?: VehicleQueryParams) => {
      const search = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            search.set(key, String(val));
          }
        });
      }
      const qs = search.toString();
      return fetcher<Vehicle[]>(`/api/vehicles${qs ? `?${qs}` : ''}`);
    },

    getById: (id: string) => fetcher<Vehicle>(`/api/vehicles/${id}`),

    create: (data: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>, photos: File[] = []) =>
      fetcher<Vehicle>('/api/vehicles', {
        method: 'POST',
        body: vehicleRequestBody(data, photos),
      }),

    update: (id: string, updates: Partial<Vehicle>, photos: File[] = []) =>
      fetcher<Vehicle>(`/api/vehicles/${id}`, {
        method: 'PUT',
        body: vehicleRequestBody(updates, photos),
      }),

    delete: (id: string) =>
      fetcher<{ deletedId: string }>(`/api/vehicles/${id}`, {
        method: 'DELETE',
      }),
  },

  inspections: {
    list: (status?: InspectionBooking['status']) => {
      const qs = status ? `?status=${status}` : '';
      return fetcher<InspectionBooking[]>(`/api/inspections${qs}`);
    },

    getById: (id: string) => fetcher<InspectionBooking>(`/api/inspections/${id}`),

    book: (data: {
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
      notes?: string;
    }) =>
      fetcher<InspectionBooking>('/api/inspections', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateStatus: (id: string, status: InspectionBooking['status']) =>
      fetcher<InspectionBooking>(`/api/inspections/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  },

  inquiries: {
    list: () => fetcher<CustomerInquiry[]>('/api/inquiries'),
    updateStatus: (id: string, status: CustomerInquiry['status']) =>
      fetcher<CustomerInquiry>(`/api/inquiries/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),

    create: (data: {
      name: string;
      email: string;
      phone: string;
      message: string;
      type?: CustomerInquiry['type'];
      vehicleId?: string;
    }) =>
      fetcher<CustomerInquiry>('/api/inquiries', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  sellRequests: {
    list: () => fetcher<SellCarRequest[]>('/api/sell-requests'),

    submit: (data: {
      sellerName: string;
      phone: string;
      email: string;
      city: string;
      brand: string;
      model?: string;
      year: number;
      mileage: number;
      expectedPrice: number;
      conditionDescription?: string;
      packageType?: 'ad_posting' | 'sell_lahore' | 'sell_outside' | 'investor';
    }, photos: File[] = []) => {
      let body: string | FormData = JSON.stringify(data);
      if (photos.length) {
        const multipart = new FormData();
        multipart.set('details', JSON.stringify(data));
        photos.forEach(photo => multipart.append('photos', photo));
        body = multipart;
      }
      return fetcher<SellCarRequest>('/api/sell-requests', {
        method: 'POST',
        body,
      });
    },
  },

  carFinder: {
    list: () => fetcher<FindCarRequest[]>('/api/car-finder'),

    submit: (data: {
      buyerName: string;
      phone: string;
      email: string;
      targetBrand: string;
      targetModel: string;
      minYear: number;
      budgetMax: number;
      preferredCity: string;
      notes?: string;
    }) =>
      fetcher<FindCarRequest>('/api/car-finder', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  admin: {
    checkSession: () => requestJson<{ authenticated: boolean }>('/api/admin/session'),
    login: (username: string, password: string) =>
      requestJson<{ success: boolean; message: string }>('/api/admin/session', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    requestCode: (username: string, purpose: 'login' | 'password_reset') => requestJson<{ success: boolean; challengeId: string; message: string }>('/api/admin/session', {
      method: 'POST', body: JSON.stringify({ action: 'request_code', username, purpose }),
    }),
    verifyCode: (username: string, challengeId: string, code: string) => requestJson<{ success: boolean }>('/api/admin/session', {
      method: 'POST', body: JSON.stringify({ action: 'verify_code', username, challengeId, code }),
    }),
    resetPassword: (username: string, challengeId: string, code: string, newPassword: string, confirmPassword: string) => requestJson<{ success: boolean; message: string }>('/api/admin/session', {
      method: 'POST', body: JSON.stringify({ action: 'reset_password', username, challengeId, code, newPassword, confirmPassword }),
    }),
    logout: () => requestJson<{ success: boolean }>('/api/admin/session', { method: 'DELETE' }),
    getAllData: () => requestJson<AdminDataResponse>('/api/admin/data'),
    resetDefaults: () =>
      requestJson<{ success: boolean; message: string }>('/api/admin/data', {
        method: 'POST',
        body: JSON.stringify({ action: 'reset_defaults' }),
      }),
    getThemes: () => requestJson<{ success: boolean; data: Theme[]; activeTheme: Theme }>('/api/admin/themes'),
    setActiveTheme: (themeId: string) =>
      requestJson<{ success: boolean; data: Theme }>('/api/admin/themes', {
        method: 'POST',
        body: JSON.stringify({ action: 'set_active', themeId }),
      }),
    saveTheme: (theme: Theme) =>
      requestJson<{ success: boolean; data: Theme }>('/api/admin/themes', {
        method: 'POST',
        body: JSON.stringify({ action: 'save_theme', theme }),
      }),
    deleteTheme: (themeId: string) =>
      requestJson<{ success: boolean }>(`/api/admin/themes?id=${encodeURIComponent(themeId)}`, { method: 'DELETE' }),
    getSettings: () => fetcher<DealershipSettings>('/api/admin/settings'),
    updateSettings: async (settings: Partial<DealershipSettings>) => {
      const response = await fetcher<DealershipSettings>('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('parakh:settings-updated', { detail: response.data }));
        try { localStorage.setItem('pm_settings_updated', String(Date.now())); } catch {}
      }
      return response;
    },
    deleteInspection: (id: string) => fetcher<{ deletedId: string }>(`/api/inspections/${id}`, { method: 'DELETE' }),
    deleteInquiry: (id: string) => fetcher<{ deletedId: string }>(`/api/inquiries/${id}`, { method: 'DELETE' }),
    updateSellRequest: (id: string, status: string) =>
      fetcher<SellCarRequest>(`/api/sell-requests/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    deleteSellRequest: (id: string) => fetcher<{ deletedId: string }>(`/api/sell-requests/${id}`, { method: 'DELETE' }),
    updateFindRequest: (id: string, status: string) =>
      fetcher<FindCarRequest>(`/api/car-finder/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    deleteFindRequest: (id: string) => fetcher<{ deletedId: string }>(`/api/car-finder/${id}`, { method: 'DELETE' }),
  },
};
