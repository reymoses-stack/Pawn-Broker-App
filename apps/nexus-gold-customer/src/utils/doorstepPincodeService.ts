import { ServicePincode } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const PINCODE_ENDPOINTS = [
  `${API_BASE}/api/pincodes`,
  '/api/pincodes',
  'http://localhost:8080/api/pincodes',
  'http://localhost:5174/api/pincodes',
  'http://10.0.2.2:5174/api/pincodes',
];

export async function fetchDoorstepPincodes(): Promise<ServicePincode[]> {
  // Try local cache first for speed
  try {
    const cached = localStorage.getItem('nexus_doorstep_pincodes');
    if (cached) {
      const { data, ts } = JSON.parse(cached);
      // Use cache if < 5 minutes old
      if (Date.now() - ts < 5 * 60 * 1000) return data;
    }
  } catch {}

  for (const endpoint of PINCODE_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(endpoint, { method: 'GET', mode: 'cors', signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data: ServicePincode[] = await res.json();
        // Cache result
        try {
          localStorage.setItem('nexus_doorstep_pincodes', JSON.stringify({ data, ts: Date.now() }));
        } catch {}
        return data;
      }
    } catch {
      // try next endpoint
    }
  }

  // Fallback: try localStorage cache even if stale
  try {
    const cached = localStorage.getItem('nexus_doorstep_pincodes');
    if (cached) return JSON.parse(cached).data;
  } catch {}
  return [];
}

export async function checkPincodeAvailability(pincode: string): Promise<{
  available: boolean;
  area?: string;
  pincode?: string;
}> {
  if (!pincode || pincode.length !== 6) return { available: false };
  const pincodes = await fetchDoorstepPincodes();
  const match = pincodes.find(p => p.pincode === pincode.trim() && p.active);
  if (match) {
    return { available: true, area: match.area, pincode: match.pincode };
  }
  return { available: false };
}

// Invalidate cache so next check fetches fresh data
export function invalidatePincodeCache() {
  try { localStorage.removeItem('nexus_doorstep_pincodes'); } catch {}
}
