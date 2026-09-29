/**
 * Nexus Gold Pawn Broker - Unified Backend API Client
 * Connects to the Go backend engine (with Supabase PostgreSQL)
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

async function fetchJson<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error [${response.status}] ${endpoint}: ${errorText}`);
  }

  return response.json();
}

export const backendApi = {
  // Health
  checkHealth: () => fetchJson<{ status: string; database: string }>('/api/health'),

  // Doorstep Pincodes
  getPincodes: () => fetchJson<any[]>('/api/pincodes'),
  addPincode: (pin: { pincode: string; area: string }) =>
    fetchJson<{ success: boolean; pincode: any }>('/api/pincodes', {
      method: 'POST',
      body: JSON.stringify(pin),
    }),
  updatePincode: (id: string, updates: { active?: boolean; area?: string }) =>
    fetchJson<{ success: boolean }>('/api/pincodes', {
      method: 'PATCH',
      body: JSON.stringify({ id, ...updates }),
    }),
  deletePincode: (id: string) =>
    fetchJson<{ success: boolean }>(`/api/pincodes?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  // Pawn Enquiries (Doorstep Loan Requests)
  getEnquiries: () => fetchJson<any[]>('/api/enquiries'),
  createEnquiry: (enquiry: any) =>
    fetchJson<{ success: boolean; enquiry: any }>('/api/enquiries', {
      method: 'POST',
      body: JSON.stringify(enquiry),
    }),
  updateEnquiryStatus: (id: string, status: string, notes?: string) =>
    fetchJson<{ success: boolean }>('/api/enquiries', {
      method: 'PATCH',
      body: JSON.stringify({ id, status, notes }),
    }),

  // Master Customers
  getCustomers: () => fetchJson<any[]>('/api/customers'),
  getCustomer: (idOrMobile: string) => fetchJson<any>(`/api/customers?id=${encodeURIComponent(idOrMobile)}`),
  createCustomer: (customer: any) =>
    fetchJson<any>('/api/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    }),
  updateCustomer: (customer: any) =>
    fetchJson<any>('/api/customers', {
      method: 'PUT',
      body: JSON.stringify(customer),
    }),

  // Mortgages
  getMortgages: () => fetchJson<any[]>('/api/mortgages'),
  getMortgageByNumber: (num: string) => fetchJson<any>(`/api/mortgages?number=${encodeURIComponent(num)}`),
  createMortgage: (mortgage: any) =>
    fetchJson<any>('/api/mortgages', {
      method: 'POST',
      body: JSON.stringify(mortgage),
    }),

  // Payments
  getPayments: (mortgageId?: string) =>
    fetchJson<any[]>(mortgageId ? `/api/payments?mortgageId=${encodeURIComponent(mortgageId)}` : '/api/payments'),
  createPayment: (payment: any) =>
    fetchJson<any>('/api/payments', {
      method: 'POST',
      body: JSON.stringify(payment),
    }),

  // Rates
  getRates: () => fetchJson<any>('/api/rates'),
  updateRates: (rates: any) =>
    fetchJson<any>('/api/rates', {
      method: 'POST',
      body: JSON.stringify(rates),
    }),

  // Passbook
  getPassbook: (customerId?: string, mortgageNumber?: string) => {
    const params = new URLSearchParams();
    if (customerId) params.set('c', customerId);
    if (mortgageNumber) params.set('m', mortgageNumber);
    return fetchJson<any>(`/api/portal/passbook?${params.toString()}`);
  },
};
