import QRCode from 'qrcode';

/**
 * Generates a high-quality base64 Data URL (PNG) for a given text or URL
 * using standard QR code formatting suitable for optical camera scanning.
 */
export async function generateQrDataUrl(
  text: string, 
  options: { width?: number; margin?: number; darkColor?: string; lightColor?: string } = {}
): Promise<string> {
  const { width = 280, margin = 2, darkColor = '#000000', lightColor = '#ffffff' } = options;
  try {
    return await QRCode.toDataURL(text, {
      width,
      margin,
      color: {
        dark: darkColor,
        light: lightColor
      },
      errorCorrectionLevel: 'M'
    });
  } catch (err) {
    console.error('Failed to generate QR Code Data URL', err);
    // Fallback simple SVG data URI or qrserver api
    return `https://api.qrserver.com/v1/create-qr-code/?size=${width}x${width}&margin=${margin}&data=${encodeURIComponent(text)}`;
  }
}

const PORTAL_BASE_URL_KEY = 'nexus_gold_portal_base_url';

export function getPortalBaseUrl(): string {
  try {
    const saved = localStorage.getItem(PORTAL_BASE_URL_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch {}

  const origin = typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null'
    ? window.location.origin
    : 'http://localhost:5174';

  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const cleanPath = pathname.endsWith('/') ? pathname : `${pathname}/`;
  return `${origin}${cleanPath}`;
}

export function setPortalBaseUrl(url: string): void {
  try {
    if (url && url.trim()) {
      localStorage.setItem(PORTAL_BASE_URL_KEY, url.trim());
    } else {
      localStorage.removeItem(PORTAL_BASE_URL_KEY);
    }
  } catch {}
}

/**
 * Builds the actual customer portal URL based on configured host/origin
 * so that any smartphone can access the passbook.
 */
export function buildCustomerPortalUrl(customerId?: string, branchCode?: string, mortgageId?: string): string {
  const base = getPortalBaseUrl();
  const cleanBase = base.split('?')[0].split('#')[0];
  const urlBase = cleanBase.endsWith('/') ? cleanBase : `${cleanBase}/`;
  
  const params = new URLSearchParams();
  params.set('portal', 'customer');
  if (customerId) params.set('c', customerId);
  if (branchCode) params.set('shop', branchCode);
  if (mortgageId) params.set('m', mortgageId);

  return `${urlBase}?${params.toString()}#portal`;
}
