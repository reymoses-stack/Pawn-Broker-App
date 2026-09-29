import React, { useRef } from 'react';
import { 
  Home, 
  Gem, 
  Calculator, 
  FileText, 
  Building2, 
  ShieldCheck, 
  LogOut, 
  X, 
  MessageCircle, 
  Phone, 
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { Customer, Branch, Mortgage } from '../../types';
import { Language } from '../../i18n/translations';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onSelectTab: (tab: any) => void;
  customer: Customer;
  branch: Branch;
  mortgages: Mortgage[];
  language: Language;
  onLogout: () => void;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  customer,
  branch,
  mortgages,
  language,
  onLogout
}) => {
  const drawerTouchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleDrawerTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      drawerTouchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }
  };

  const handleDrawerTouchEnd = (e: React.TouchEvent) => {
    if (drawerTouchStartRef.current && e.changedTouches.length === 1) {
      const deltaX = e.changedTouches[0].clientX - drawerTouchStartRef.current.x;
      const deltaY = e.changedTouches[0].clientY - drawerTouchStartRef.current.y;
      if (deltaX < -35 && Math.abs(deltaX) > Math.abs(deltaY)) {
        // Swiped left on drawer -> close
        onClose();
      }
      drawerTouchStartRef.current = null;
    }
  };

  const navItems = [
    {
      id: 'dashboard',
      labelEn: 'Passbook Dashboard',
      labelTa: 'முகப்புப்பலகை',
      icon: Home,
      badge: null
    },
    {
      id: 'loans',
      labelEn: 'My Gold Pledges (Girvi)',
      labelTa: 'எனது அடமான நகைகள்',
      icon: Gem,
      badge: mortgages.length > 0 ? mortgages.length : null
    },
    {
      id: 'calculator',
      labelEn: 'Loan Eligibility Calculator',
      labelTa: 'தங்கக் கடன் கால்குலேட்டர்',
      icon: Calculator,
      badge: (
        <span className="bg-amber-100 text-amber-900 text-[9px] font-black px-1.5 py-0.2 rounded border border-amber-300">
          75% LTV
        </span>
      )
    },
    {
      id: 'enquiry',
      labelEn: 'New Pawn Enquiry',
      labelTa: 'புதிய அடமான விசாரிப்பு',
      icon: FileText,
      badge: (
        <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.2 rounded border border-emerald-300">
          NEW
        </span>
      )
    },
    {
      id: 'branch',
      labelEn: 'Branch & Safe Vault Info',
      labelTa: 'கடை முகவரி & பெட்டகம்',
      icon: Building2,
      badge: null
    }
  ];

  const handleWhatsAppChat = () => {
    const text = encodeURIComponent(
      `Hello ${branch.name},\nCustomer: ${customer.name} (Mobile: ${customer.mobile}).\nI need assistance regarding my gold loan account.`
    );
    const cleanPhone = branch.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${text}`, '_blank');
  };

  return (
    <>
      {/* Mobile Semi-Transparent Backdrop with Ghost Click Prevention */}
      <div
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ touchAction: 'none' }}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <aside
        onTouchStart={handleDrawerTouchStart}
        onTouchEnd={handleDrawerTouchEnd}
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white border-r border-amber-200/90 shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-out select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header of Drawer */}
        <div>
          <div className="flex items-center justify-between p-4 border-b border-amber-200/70 bg-gradient-to-r from-amber-50 to-amber-100/50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shadow-xs">
                NG
              </div>
              <span className="font-extrabold text-xs text-amber-950 tracking-tight">
                {branch.name}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-white border border-slate-200 shadow-2xs active:scale-95 transition cursor-pointer"
            >
              <X className="w-4 h-4 text-slate-700" />
            </button>
          </div>

          {/* Customer Profile Box */}
          <div className="p-4 border-b border-amber-100 bg-[#fbf9f5]">
            <div className="flex items-center gap-3">
              {customer.photoUrl ? (
                <img
                  src={customer.photoUrl}
                  alt={customer.name}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-300 shadow-xs"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-amber-200 text-amber-950 font-black text-sm flex items-center justify-center border-2 border-amber-300 shadow-xs">
                  {customer.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-xs font-black text-slate-900 truncate">
                  {customer.name}
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  +91 {customer.mobile}
                </div>
                <div className="mt-1">
                  {customer.isNewCustomer ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                      ★ New Enquirer
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300">
                      <ShieldCheck className="w-3 h-3 text-amber-700" />
                      <span>UIDAI KYC Verified</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="p-3 border-b border-slate-100 space-y-1.5 bg-white">
            <button
              type="button"
              onClick={() => {
                onSelectTab('calculator');
                onClose();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 text-slate-950 font-black text-xs shadow-xs flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>{language === 'ta' ? 'கடன் தகுதி கால்குலேட்டர்' : 'Gold Loan Calculator'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectTab('enquiry');
                onClose();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-xs flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'ta' ? 'புதிய அடமான விசாரிப்பு' : 'New Pawn Enquiry'}</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const isSelected = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-slate-950' : 'text-slate-500'}`} />
                    <span>{language === 'ta' ? item.labelTa : item.labelEn}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.badge}
                    <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Drawer Footer */}
        <div className="p-4 border-t border-amber-200/60 bg-gradient-to-b from-white to-amber-50/50 space-y-3">
          
          {/* Quick WhatsApp Support */}
          <button
            type="button"
            onClick={handleWhatsAppChat}
            className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>{language === 'ta' ? 'வாட்ஸ்அப் உதவி' : 'Chat with Cashier'}</span>
          </button>

          {/* Branch Credentials */}
          <div className="text-[10px] text-slate-500 leading-tight">
            <div>Lic #{branch.licenseNumber}</div>
            <div className="font-mono">{branch.workingHours}</div>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{language === 'ta' ? 'வெளியேறு' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>
    </>
  );
};
