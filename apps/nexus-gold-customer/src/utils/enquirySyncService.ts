import { PawnEnquiry } from '../types';

const getSyncEndpoints = () => {
  const envApi = import.meta.env.VITE_API_URL;
  const custom = typeof window !== 'undefined' ? localStorage.getItem('broker_server_url') : null;
  return [
    ...(envApi ? [`${envApi.replace(/\/$/, '')}/api/enquiries`] : []),
    ...(custom ? [`${custom.replace(/\/$/, '')}/api/enquiries`] : []),
    'http://localhost:8080/api/enquiries',
    'http://localhost:5174/api/enquiries',
    'http://10.0.2.2:5174/api/enquiries',
    '/api/enquiries'
  ];
};

export async function sendEnquiryToPawnBroker(enquiry: PawnEnquiry): Promise<boolean> {
  // 1. BroadcastChannel for instant cross-tab / window sync
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel('nexus_pawn_enquiries_channel');
      channel.postMessage({ type: 'NEW_ENQUIRY', enquiry });
      channel.close();
    }
  } catch (e) {
    console.warn('BroadcastChannel failed', e);
  }

  // 2. LocalStorage backup
  try {
    if (typeof window !== 'undefined') {
      const existingStr = localStorage.getItem('nexus_shared_enquiries');
      const existing = existingStr ? JSON.parse(existingStr) : [];
      const updated = [enquiry, ...existing.filter((item: any) => item.id !== enquiry.id)];
      localStorage.setItem('nexus_shared_enquiries', JSON.stringify(updated));
    }
  } catch (e) {
    console.warn('LocalStorage save failed', e);
  }

  // 3. Network HTTP POST to Pawn Broker Server
  const endpoints = getSyncEndpoints();
  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enquiry),
        mode: 'cors',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        console.log(`Enquiry synced successfully to ${endpoint}`);
        return true;
      }
    } catch {
      // try next endpoint
    }
  }

  return true;
}
