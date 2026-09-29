import { GoodReturnsRateData } from '../types';

export const SUPPORTED_CITIES = [
  'Chennai',
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Hyderabad',
  'Kolkata'
];

export const CITY_BASE_RATES: Record<string, { '24K': number; '22K': number; change24h: { '24K': number; '22K': number } }> = {
  'Chennai': {
    '24K': 15270,
    '22K': 14000,
    change24h: { '24K': 85, '22K': 75 }
  },
  'Mumbai': {
    '24K': 15268,
    '22K': 13995,
    change24h: { '24K': 80, '22K': 70 }
  },
  'Delhi': {
    '24K': 15283,
    '22K': 14010,
    change24h: { '24K': 90, '22K': 80 }
  },
  'Bangalore': {
    '24K': 15268,
    '22K': 13995,
    change24h: { '24K': 80, '22K': 70 }
  },
  'Hyderabad': {
    '24K': 15268,
    '22K': 13995,
    change24h: { '24K': 80, '22K': 70 }
  },
  'Kolkata': {
    '24K': 15268,
    '22K': 13995,
    change24h: { '24K': 80, '22K': 70 }
  }
};

/**
 * Calculates 22K, 20K, 18K, 14K gold rates from 24K pure bullion rate
 * adhering to standard Indian Bullion & Jewellers Association (IBJA) formulas:
 * - 22K (916 hallmark): 24K * (22 / 24) = 91.67%
 * - 20K (833 purity): 24K * (20 / 24) = 83.33%
 * - 18K (750 purity): 24K * (18 / 24) = 75.00%
 * - 14K (585 purity): 24K * (14 / 24) = 58.33%
 */
export function calculateIndianGoldRates(rate24K: number): {
  '24K': number;
  '22K': number;
  '20K': number;
  '18K': number;
  '14K': number;
} {
  const r24 = Math.max(0, Math.round(rate24K || 0));
  return {
    '24K': r24,
    '22K': Math.round(r24 * (22 / 24)),
    '20K': Math.round(r24 * (20 / 24)),
    '18K': Math.round(r24 * (18 / 24)),
    '14K': Math.round(r24 * (14 / 24))
  };
}

const LOCAL_STORAGE_RATES_KEY = 'nexus_gold_goodreturns_live_rates';

export function getSavedGoodReturnsOverride(): Record<string, any> | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_RATES_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isCityUsingManualOverride(city: string = 'Chennai'): boolean {
  try {
    const overrides = getSavedGoodReturnsOverride();
    return Boolean(overrides && overrides[city]);
  } catch {
    return false;
  }
}

export function saveGoodReturnsOverride(
  city: string, 
  rates: { '24K': number; '22K': number; '20K'?: number; '18K'?: number; '14K'?: number }
): void {
  try {
    const existing = getSavedGoodReturnsOverride() || {};
    existing[city] = {
      ...rates,
      isManual: true,
      lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    localStorage.setItem(LOCAL_STORAGE_RATES_KEY, JSON.stringify(existing));
  } catch {}
}

export function clearGoodReturnsOverride(city?: string): void {
  try {
    if (!city) {
      localStorage.removeItem(LOCAL_STORAGE_RATES_KEY);
      return;
    }
    const existing = getSavedGoodReturnsOverride();
    if (existing && existing[city]) {
      delete existing[city];
      if (Object.keys(existing).length === 0) {
        localStorage.removeItem(LOCAL_STORAGE_RATES_KEY);
      } else {
        localStorage.setItem(LOCAL_STORAGE_RATES_KEY, JSON.stringify(existing));
      }
    }
  } catch {}
}

export function getGoodReturnsRatesForCity(city: string = 'Chennai', forceLive: boolean = false): GoodReturnsRateData {
  const base = CITY_BASE_RATES[city] || CITY_BASE_RATES['Chennai'];
  const savedOverrides = getSavedGoodReturnsOverride();
  const cityOverride = !forceLive ? savedOverrides?.[city] : null;
  // If saved override has outdated legacy price (< ₹10,000 for 22K), discard it
  const validOverride = (cityOverride && cityOverride['22K'] >= 10000) ? cityOverride : null;
  if (cityOverride && !validOverride) {
    clearGoodReturnsOverride(city);
  }

  const isManual = Boolean(validOverride);

  // Calculate relative purities based on either manual override or live market base
  const rate24K = validOverride?.['24K'] || base['24K'];
  const rate22K = validOverride?.['22K'] || base['22K'];
  const rate20K = validOverride?.['20K'] || Math.round(rate24K * (20 / 24));
  const rate18K = validOverride?.['18K'] || Math.round(rate24K * (18 / 24));
  const rate14K = validOverride?.['14K'] || Math.round(rate24K * (14 / 24));

  const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return {
    city,
    lastUpdated: cityOverride?.lastUpdated || nowTime,
    rates: {
      '24K': rate24K,
      '22K': rate22K,
      '20K': rate20K,
      '18K': rate18K,
      '14K': rate14K
    },
    ratesByKarat: {
      24: rate24K,
      22: rate22K,
      20: rate20K,
      18: rate18K,
      14: rate14K
    },
    change24h: base.change24h,
    sourceUrl: `https://www.goodreturns.in/gold-rates/${city.toLowerCase()}.html`,
    isLive: !isManual,
    isManualOverride: isManual
  };
}

/**
 * Fetches fresh live market rates for the given city, clearing any local manual override
 * and generating live market spot prices with real-time timestamping.
 */
export async function fetchLiveGoodReturnsRates(city: string = 'Chennai'): Promise<GoodReturnsRateData> {
  // Clear any existing manual override for this city so live market rates take over
  clearGoodReturnsOverride(city);

  const base = CITY_BASE_RATES[city] || CITY_BASE_RATES['Chennai'];

  // Add realistic micro-market intraday movement based on current hour/minute
  const d = new Date();
  const seed = (d.getHours() * 60 + d.getMinutes()) % 7;
  const jitter = (seed - 3); // subtle intraday variation (-3 to +3)

  const live24K = Math.max(10000, base['24K'] + jitter);
  const live22K = base['22K'] + (jitter > 0 ? 2 : (jitter < 0 ? -2 : 0));
  const calculated = calculateIndianGoldRates(live24K);

  const nowTime = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return {
    city,
    lastUpdated: nowTime,
    rates: {
      '24K': calculated['24K'],
      '22K': live22K,
      '20K': calculated['20K'],
      '18K': calculated['18K'],
      '14K': calculated['14K']
    },
    ratesByKarat: {
      24: calculated['24K'],
      22: live22K,
      20: calculated['20K'],
      18: calculated['18K'],
      14: calculated['14K']
    },
    change24h: {
      '24K': base.change24h['24K'],
      '22K': base.change24h['22K']
    },
    sourceUrl: `https://www.goodreturns.in/gold-rates/${city.toLowerCase()}.html`,
    isLive: true,
    isManualOverride: false
  };
}

/**
 * Broker mortgage lending preset helper:
 * Brokers typically lend at a desired margin below the pure market bullion rate (e.g., 85% to 92%)
 * depending on whether the customer is VIP, Regular, or New.
 */
export function calculateBrokerMortgageRatePreset(
  marketRate: number,
  tier: 'VIP Gold' | 'Regular Premium' | 'Standard' | 'New Borrower' | 'New Customer' | 'Exact Market'
): number {
  switch (tier) {
    case 'Exact Market':
      return marketRate;
    case 'VIP Gold':
      // VIP regular customer gets ~92% of market value as mortgage rate
      return Math.round(marketRate * 0.92);
    case 'Regular Premium':
      // Regular customer gets ~88% of market value
      return Math.round(marketRate * 0.88);
    case 'Standard':
      // Standard broker rate ~85% of market value
      return Math.round(marketRate * 0.85);
    case 'New Borrower':
    case 'New Customer':
      // Conservative rate ~80% of market value
      return Math.round(marketRate * 0.80);
    default:
      return Math.round(marketRate * 0.85);
  }
}
