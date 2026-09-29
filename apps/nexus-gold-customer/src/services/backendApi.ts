/**
 * Nexus Gold Customer App - Unified Backend API Client
 * Connects to the Go backend engine (with Supabase PostgreSQL)
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://pawn-broker-api.vercel.app';

async function fetchJson<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL.replace(/\/$/, '')}${endpoint}`;
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

  // Pawn Enquiries (Doorstep & Counter Bookings)
  getEnquiries: () => fetchJson<any[]>('/api/enquiries'),
  createEnquiry: (enquiry: any) =>
    fetchJson<{ success: boolean; enquiry: any }>('/api/enquiries', {
      method: 'POST',
      body: JSON.stringify(enquiry),
    }),

  // Passbook & Mortgages for Customer
  getPassbook: (customerIdOrMobile: string) =>
    fetchJson<any>(`/api/portal/passbook?customer=${encodeURIComponent(customerIdOrMobile)}`),

  // Mortgages
  getMortgages: () => fetchJson<any[]>('/api/mortgages'),

  // Payments
  getPayments: (mortgageId?: string) =>
    fetchJson<any[]>(mortgageId ? `/api/payments?mortgageId=${encodeURIComponent(mortgageId)}` : '/api/payments'),

  // Rates
  getRates: () => fetchJson<any>('/api/rates'),
};
