import React from 'react';
import { Menu, Globe, PhoneCall } from 'lucide-react';
import { Customer, Branch } from '../../types';
import { Language } from '../../i18n/translations';

interface AppHeaderProps {
  customer: Customer;
  branch: Branch;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenSidebar: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  customer,
  branch,
  language,
  onLanguageChange,
  onOpenSidebar
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#fbf9f5]/90 backdrop-blur-md border-b border-amber-200/70 select-none">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
        
        {/* Left: Hamburger Menu Button */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenSidebar}
            aria-label="Open Navigation Menu"
            className="w-10 h-10 rounded-2xl bg-white border border-amber-200/90 shadow-2xs flex items-center justify-center text-slate-700 hover:text-amber-900 hover:bg-amber-50/50 active:scale-95 transition cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* App Title & Branch */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center font-black font-mono text-xs text-slate-950 shadow-xs shadow-amber-500/30">
              NG
            </div>
            <div>
              <div className="text-xs sm:text-sm font-black text-slate-900 leading-tight truncate max-w-[150px] sm:max-w-xs">
                {branch.name}
              </div>
              <div className="text-[10px] text-amber-800 font-semibold tracking-tight">
                {customer.isNewCustomer ? (
                  <span className="text-emerald-700">★ New Customer Portal</span>
                ) : (
                  <span>Passbook • Lic #{branch.licenseNumber}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Language Switcher & Call Button */}
        <div className="flex items-center gap-2">
          
          {/* Quick Call Branch */}
          <a
            href={`tel:${branch.phone}`}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-amber-200/80 text-amber-950 text-xs font-bold hover:bg-amber-50 transition shadow-2xs"
            title="Call Pawn Shop"
          >
            <PhoneCall className="w-3.5 h-3.5 text-amber-600" />
            <span>{branch.phone}</span>
          </a>

          {/* Language Switcher */}
          <div className="flex items-center bg-white border border-amber-200/90 rounded-xl p-1 text-[11px] shadow-2xs">
            <button
              type="button"
              onClick={() => onLanguageChange('en')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                language === 'en'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange('ta')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                language === 'ta'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              தமிழ்
            </button>
          </div>

          {/* User Avatar */}
          <div className="flex items-center">
            {customer.photoUrl ? (
              <img
                src={customer.photoUrl}
                alt={customer.name}
                className="w-9 h-9 rounded-xl object-cover border border-amber-300 shadow-2xs"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-amber-200 text-amber-900 font-bold flex items-center justify-center text-xs border border-amber-300">
                {customer.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
