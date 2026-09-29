import { PawnEnquiry } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const SYNC_ENDPOINTS = [
  `${API_BASE}/api/enquiries`,
  '/api/enquiries',
  'http://localhost:8080/api/enquiries',
  'http://localhost:5174/api/enquiries',
  'http://localhost:5175/api/enquiries'
];

export async function fetchRemoteEnquiries(): Promise<PawnEnquiry[]> {
  for (const endpoint of SYNC_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        mode: 'cors'
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          return data;
        }
      }
    } catch {
      // try next endpoint
    }
  }

  // Fallback to localStorage
  try {
    const raw = localStorage.getItem('nexus_shared_enquiries');
    if (raw) return JSON.parse(raw);
  } catch {}

  return [];
}

export async function updateRemoteEnquiryStatus(id: string, status: string, notes?: string): Promise<boolean> {
  // Update localStorage first
  try {
    const raw = localStorage.getItem('nexus_shared_enquiries');
    if (raw) {
      const list = JSON.parse(raw);
      const updated = list.map((item: any) => item.id === id ? { ...item, status, notes } : item);
      localStorage.setItem('nexus_shared_enquiries', JSON.stringify(updated));
    }
  } catch {}

  for (const endpoint of SYNC_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, notes }),
        mode: 'cors'
      });
      if (res.ok) return true;
    } catch {}
  }
  return true;
}

export function subscribeToEnquiries(onUpdate: (enquiries: PawnEnquiry[], isNewArrival: boolean) => void): () => void {
  let isSubscribed = true;
  let lastKnownIds = new Set<string>();

  const checkAndUpdate = async () => {
    if (!isSubscribed) return;
    const remoteList = await fetchRemoteEnquiries();
    if (!isSubscribed) return;

    if (remoteList && remoteList.length > 0) {
      const currentIds = new Set(remoteList.map(e => e.id));
      const hasNewArrival = lastKnownIds.size > 0 && remoteList.some(e => !lastKnownIds.has(e.id));
      lastKnownIds = currentIds;
      onUpdate(remoteList, hasNewArrival);
    }
  };

  // Initial fetch
  checkAndUpdate();

  // Polling timer (every 3 seconds)
  const interval = setInterval(checkAndUpdate, 3000);

  // BroadcastChannel listener
  let bc: BroadcastChannel | null = null;
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('nexus_pawn_enquiries_channel');
      bc.onmessage = (event) => {
        if (event.data?.type === 'NEW_ENQUIRY') {
          checkAndUpdate();
        }
      };
    }
  } catch {}

  // Window focus listener
  const onFocus = () => { checkAndUpdate(); };
  window.addEventListener('focus', onFocus);

  return () => {
    isSubscribed = false;
    clearInterval(interval);
    window.removeEventListener('focus', onFocus);
    if (bc) bc.close();
  };
}
