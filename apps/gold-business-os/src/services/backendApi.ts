/**
 * Nexus Gold Business OS - Backend API Client
 * Connects to Go Backend Engine & Supabase PostgreSQL
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
  checkHealth: () => fetchJson<{ status: string; database: string }>('/api/health'),
  getRates: () => fetchJson<any>('/api/rates'),
  updateRates: (rates: any) =>
    fetchJson<any>('/api/rates', {
      method: 'POST',
      body: JSON.stringify(rates),
    }),
  getCustomers: () => fetchJson<any[]>('/api/customers'),
  getMortgages: () => fetchJson<any[]>('/api/mortgages'),
  getPassbook: (customerId?: string, mortgageNumber?: string) => {
    const params = new URLSearchParams();
    if (customerId) params.set('c', customerId);
    if (mortgageNumber) params.set('m', mortgageNumber);
    return fetchJson<any>(`/api/portal/passbook?${params.toString()}`);
  },
};
