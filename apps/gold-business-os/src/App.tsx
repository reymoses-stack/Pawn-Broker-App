import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { CustomerPortal } from './components/customer/CustomerPortal';
import { StaffPortal } from './components/staff/StaffPortal';
import { AdminPortal } from './components/admin/AdminPortal';
import { CartDrawer } from './components/customer/CartDrawer';
import { ToastContainer } from './components/common/ToastContainer';
import { Coins, ShieldCheck } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activePortal } = useApp();
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col selection:bg-amber-500/20 selection:text-amber-900 overflow-x-hidden">
      {/* Dynamic Apple White Base Liquid Glass Aurora Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="liquid-aurora-1 -top-24 -left-24 opacity-80" />
        <div className="liquid-aurora-2 top-1/4 -right-20 opacity-70" />
        <div className="liquid-aurora-3 bottom-10 left-1/3 opacity-60" />
      </div>

      {/* Header with Liquid Glass blur */}
      <div className="relative z-40">
        <Header onOpenCart={() => setIsCartOpen(true)} />
      </div>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activePortal === 'CUSTOMER' && <CustomerPortal onOpenCart={() => setIsCartOpen(true)} />}
        {activePortal === 'STAFF' && <StaffPortal />}
        {activePortal === 'ADMIN' && <AdminPortal />}
      </main>

      {/* Cart & Checkout Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Real-time Toasts */}
      <ToastContainer />

      {/* Footer in Apple White Liquid Glass — Riser Gold Edition */}
      <footer className="relative z-10 border-t border-slate-200/80 liquid-glass py-8 mt-16 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-200/70">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center text-white font-serif-gold font-bold shadow-md">
                  R
                </div>
                <span className="text-base font-bold text-slate-900 font-serif-gold tracking-wide">
                  RISER GOLD
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold border border-amber-300">
                  Tamil Nadu Bullion Hub
                </span>
              </div>
              <p className="text-xs text-slate-500 max-w-lg">
                India's modern gold ecosystem — instant gold loan pledge at 75% statutory LTV, old gold transparent scrap selling with zero hidden cuts, and 24K Swiss-grade investment bullion.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-xs">
              <a
                href="https://www.risergold.in"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-full liquid-glass-sub text-amber-900 font-bold border border-amber-300 hover:bg-amber-50 transition shadow-sm"
              >
                www.risergold.in ↗
              </a>
              <a
                href="tel:+919150047900"
                className="px-4 py-2 rounded-full liquid-glass-btn-primary text-white font-bold transition shadow-md"
              >
                📞 +91 91500 47900
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-[11px] text-slate-500">
            <div>
              <span className="font-bold text-slate-900 block text-xs font-serif-gold mb-1">Registered Office</span>
              <p className="leading-relaxed">
                5A/1, PVM Swamy, SH 40 7th Street, Overhead Tank, Pattamadai, Tirunelveli, Tamil Nadu - 627453
              </p>
            </div>

            <div>
              <span className="font-bold text-slate-900 block text-xs font-serif-gold mb-1">Customer Support</span>
              <p>Hotline: +91 91500 47900</p>
              <p>Email: risergold@riserone.in</p>
              <p>Mon - Sat: 9:30 AM - 7:00 PM</p>
            </div>

            <div>
              <span className="font-bold text-slate-900 block text-xs font-serif-gold mb-1">Compliance & Security</span>
              <p className="flex items-center gap-1 text-emerald-700 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> RBI 75% LTV Benchmark
              </p>
              <p>100% BIS Hallmarked Ornaments</p>
              <p>German Non-Destructive XRF Testing</p>
            </div>

            <div>
              <span className="font-bold text-slate-900 block text-xs font-serif-gold mb-1">Engineering</span>
              <p>Architecture: The Nexus Lab OS</p>
              <p>UI: Apple White Liquid Glassmorphism</p>
              <p>Feed: GoodReturns & Bullion Realtime</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 gap-2">
            <div>
              © {new Date().getFullYear()} Riser Gold (Riser One Group). All rights reserved.
            </div>
            <div className="flex items-center gap-3">
              <span>Powered by <strong className="text-slate-700">The Nexus Lab</strong></span>
              <span>•</span>
              <a href="https://www.risergold.in/gold-rates" target="_blank" rel="noreferrer" className="text-amber-800 hover:underline font-semibold">
                Live Gold Rates Feed
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
