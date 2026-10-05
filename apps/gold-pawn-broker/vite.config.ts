import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';

const SHARED_ENQUIRIES_PATH = path.resolve('/Users/revanthmoses/.gemini/antigravity-ide/scratch/shared-pawn-enquiries.json');
const SHARED_PINCODES_PATH = path.resolve('/Users/revanthmoses/.gemini/antigravity-ide/scratch/shared-doorstep-pincodes.json');

function sharedApiPlugin(): Plugin {
  return {
    name: 'shared-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // ─── CORS ───────────────────────────────────────────────────────────
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }

        // ─── /api/enquiries ─────────────────────────────────────────────────
        if (req.url?.startsWith('/api/enquiries')) {
          const readEnquiries = (): any[] => {
            try { if (fs.existsSync(SHARED_ENQUIRIES_PATH)) return JSON.parse(fs.readFileSync(SHARED_ENQUIRIES_PATH, 'utf-8')); } catch {}
            return [];
          };
          const saveEnquiries = (list: any[]) => {
            try { fs.writeFileSync(SHARED_ENQUIRIES_PATH, JSON.stringify(list, null, 2), 'utf-8'); } catch {}
          };

          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify(readEnquiries()));
          }
          if (req.method === 'POST') {
            let body = '';
            req.on('data', c => { body += c; });
            req.on('end', () => {
              try {
                const e = JSON.parse(body);
                const updated = [e, ...readEnquiries().filter(i => i.id !== e.id)];
                saveEnquiries(updated);
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 201;
                return res.end(JSON.stringify({ success: true, enquiry: e }));
              } catch { res.statusCode = 400; return res.end(JSON.stringify({ success: false })); }
            });
            return;
          }
          if (req.method === 'PATCH') {
            let body = '';
            req.on('data', c => { body += c; });
            req.on('end', () => {
              try {
                const { id, status, notes } = JSON.parse(body);
                const updated = readEnquiries().map(i => i.id === id ? { ...i, status: status || i.status, notes: notes !== undefined ? notes : i.notes } : i);
                saveEnquiries(updated);
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: true }));
              } catch { res.statusCode = 400; return res.end(JSON.stringify({ success: false })); }
            });
            return;
          }
          return next();
        }

        // ─── /api/pincodes ──────────────────────────────────────────────────
        if (req.url?.startsWith('/api/pincodes')) {
          const readPincodes = (): any[] => {
            try { if (fs.existsSync(SHARED_PINCODES_PATH)) return JSON.parse(fs.readFileSync(SHARED_PINCODES_PATH, 'utf-8')); } catch {}
            return [];
          };
          const savePincodes = (list: any[]) => {
            try { fs.writeFileSync(SHARED_PINCODES_PATH, JSON.stringify(list, null, 2), 'utf-8'); } catch {}
          };

          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify(readPincodes()));
          }
          if (req.method === 'POST') {
            let body = '';
            req.on('data', c => { body += c; });
            req.on('end', () => {
              try {
                const newPin = JSON.parse(body);
                const existing = readPincodes();
                if (existing.find((p: any) => p.pincode === newPin.pincode)) {
                  res.statusCode = 409;
                  return res.end(JSON.stringify({ success: false, error: 'Pincode already exists' }));
                }
                savePincodes([...existing, newPin]);
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 201;
                return res.end(JSON.stringify({ success: true, pincode: newPin }));
              } catch { res.statusCode = 400; return res.end(JSON.stringify({ success: false })); }
            });
            return;
          }
          if (req.method === 'PATCH') {
            let body = '';
            req.on('data', c => { body += c; });
            req.on('end', () => {
              try {
                const { id, ...updates } = JSON.parse(body);
                const updated = readPincodes().map((p: any) => p.id === id ? { ...p, ...updates } : p);
                savePincodes(updated);
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: true }));
              } catch { res.statusCode = 400; return res.end(JSON.stringify({ success: false })); }
            });
            return;
          }
          if (req.method === 'DELETE') {
            const urlObj = new URL(req.url || '', 'http://localhost');
            const idToDelete = urlObj.searchParams.get('id');
            if (idToDelete) {
              const updated = readPincodes().filter((p: any) => p.id !== idToDelete);
              savePincodes(updated);
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: true }));
            }
            res.statusCode = 400;
            return res.end(JSON.stringify({ success: false, error: 'Missing id' }));
          }
          return next();
        }

        // ─── /api/cashfree (Sub-AUA Aadhaar Proxy) ──────────────────────────
        if (req.url?.startsWith('/api/cashfree')) {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', c => { body += c; });
            req.on('end', async () => {
              try {
                const payload = JSON.parse(body || '{}');
                const isProd = payload.environment === 'production';
                const baseUrl = isProd 
                  ? 'https://api.cashfree.com/verification' 
                  : 'https://sandbox.cashfree.com/verification';
                const clientId = payload.clientId || process.env.VITE_CASHFREE_CLIENT_ID || '';
                const clientSecret = payload.clientSecret || payload.apiKey || process.env.VITE_CASHFREE_CLIENT_SECRET || '';

                if (!clientId || !clientSecret) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({ 
                    success: false, 
                    message: 'Cashfree Client ID and Client Secret are required' 
                  }));
                }

                // 1. Test Connection & Verify Credentials
                if (req.url?.includes('/test-connection')) {
                  try {
                    const cfRes = await fetch(`${baseUrl}/offline-aadhaar/otp`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'x-client-id': clientId,
                        'x-client-secret': clientSecret,
                      },
                      body: JSON.stringify({ aadhaar_number: '000000000000' })
                    });
                    const cfData: any = await cfRes.json().catch(() => ({}));
                    
                    if (cfData.code === 'authentication_failed' || cfRes.status === 401) {
                      res.statusCode = 401;
                      res.setHeader('Content-Type', 'application/json');
                      return res.end(JSON.stringify({ 
                        success: false, 
                        message: cfData.message || 'Invalid Cashfree Client ID or Client Secret' 
                      }));
                    }

                    res.setHeader('Content-Type', 'application/json');
                    return res.end(JSON.stringify({ 
                      success: true, 
                      message: `Successfully connected to Cashfree (${isProd ? 'Production' : 'Sandbox'})! Account credentials verified.`,
                      environment: isProd ? 'production' : 'sandbox',
                      cashfreeResponse: cfData
                    }));
                  } catch (err: any) {
                    res.statusCode = 502;
                    res.setHeader('Content-Type', 'application/json');
                    return res.end(JSON.stringify({ 
                      success: false, 
                      message: `Network error connecting to Cashfree: ${err.message}` 
                    }));
                  }
                }

                // 2. Generate OTP
                if (req.url?.includes('/generate-otp')) {
                  const cleanAadhaar = String(payload.aadhaarNumber || '').replace(/\D/g, '');
                  if (cleanAadhaar.length !== 12) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    return res.end(JSON.stringify({ success: false, message: 'Invalid 12-digit Aadhaar number' }));
                  }

                  let cfRes = await fetch(`${baseUrl}/offline-aadhaar/otp`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'x-client-id': clientId,
                      'x-client-secret': clientSecret,
                    },
                    body: JSON.stringify({ aadhaar_number: cleanAadhaar })
                  });
                  let cfData: any = await cfRes.json().catch(() => ({}));

                  // Fallback to /aadhaar/otp if 404
                  if (cfRes.status === 404) {
                    cfRes = await fetch(`${baseUrl}/aadhaar/otp`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'x-client-id': clientId,
                        'x-client-secret': clientSecret,
                      },
                      body: JSON.stringify({ aadhaar_number: cleanAadhaar })
                    });
                    cfData = await cfRes.json().catch(() => ({}));
                  }

                  if (!cfRes.ok || cfData.code === 'authentication_failed' || cfData.status === 'FAILED') {
                    res.statusCode = cfRes.status || 400;
                    res.setHeader('Content-Type', 'application/json');
                    return res.end(JSON.stringify({ 
                      success: false, 
                      message: cfData.message || 'Cashfree OTP dispatch failed',
                      raw: cfData 
                    }));
                  }

                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({ 
                    success: true, 
                    ref_id: cfData.ref_id || cfData.reference_id || cfData.data?.ref_id,
                    message: cfData.message || 'OTP sent successfully to Aadhaar-registered mobile',
                    raw: cfData 
                  }));
                }

                // 3. Verify OTP
                if (req.url?.includes('/verify-otp')) {
                  const otp = String(payload.otp || '').trim();
                  const refId = String(payload.refId || payload.transactionId || '').trim();

                  if (!otp || !refId) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    return res.end(JSON.stringify({ success: false, message: 'Missing OTP or Reference ID' }));
                  }

                  let cfRes = await fetch(`${baseUrl}/offline-aadhaar/verify`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'x-client-id': clientId,
                      'x-client-secret': clientSecret,
                    },
                    body: JSON.stringify({ otp, ref_id: refId })
                  });
                  let cfData: any = await cfRes.json().catch(() => ({}));

                  // Fallback to /aadhaar/verify if 404
                  if (cfRes.status === 404) {
                    cfRes = await fetch(`${baseUrl}/aadhaar/verify`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'x-client-id': clientId,
                        'x-client-secret': clientSecret,
                      },
                      body: JSON.stringify({ otp, ref_id: refId })
                    });
                    cfData = await cfRes.json().catch(() => ({}));
                  }

                  if (!cfRes.ok || cfData.code === 'authentication_failed' || cfData.status === 'FAILED' || cfData.status === 'INVALID') {
                    res.statusCode = cfRes.status || 400;
                    res.setHeader('Content-Type', 'application/json');
                    return res.end(JSON.stringify({ 
                      success: false, 
                      message: cfData.message || 'OTP verification failed',
                      raw: cfData 
                    }));
                  }

                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({ 
                    success: true, 
                    data: cfData,
                    message: 'Aadhaar e-KYC verified successfully via Cashfree'
                  }));
                }

                res.statusCode = 404;
                return res.end(JSON.stringify({ error: 'Endpoint not found' }));
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, message: err.message || 'Internal proxy error' }));
              }
            });
            return;
          }
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    sharedApiPlugin()
  ],
  server: {
    host: true,
    port: 5174,
  },
});
