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
