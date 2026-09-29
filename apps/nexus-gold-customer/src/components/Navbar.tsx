import React from 'react';
import { Customer, Branch } from '../types';
import { ShieldCheck, LogOut, Phone, MessageCircle } from 'lucide-react';
import { Language, translations } from '../i18n/translations';

interface NavbarProps {
  customer: Customer;
  branch: Branch;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  customer,
  branch,
  language,
  onLanguageChange,
  onLogout
}) => {
  const t = translations[language];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-amber-200/80 px-4 py-3 sm:px-6 shadow-2xs">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        
        {/* Brand & Customer Identity */}
        <div className="flex items-center gap-3">
          <div className="relative">
            {customer.photoUrl ? (
              <img
                src={customer.photoUrl}
                alt={customer.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-amber-400 shadow-xs"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-amber-500 text-white font-black flex items-center justify-center">
                {customer.name.charAt(0)}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5 border-2 border-white" title="KYC Verified">
              <ShieldCheck className="w-2.5 h-2.5 text-white" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-slate-900">
                {customer.name}
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-bold">
                <ShieldCheck className="w-2.5 h-2.5" />
                <span>KYC VERIFIED</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="font-mono text-amber-900 font-bold">{customer.id}</span>
              <span>•</span>
              <span className="font-mono text-[10px] text-slate-500">{customer.kycRecord.maskedId}</span>
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Quick WhatsApp Branch Button */}
          <a
            href={`https://wa.me/${branch.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello, this is ${customer.name} (ID: ${customer.id}). I am inquiring about my gold loan.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs transition"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-emerald-600/20 text-emerald-600" />
            <span>{language === 'ta' ? 'கடை வாட்ஸ்அப்' : 'WhatsApp'}</span>
          </a>

          {/* Quick Call Branch Button */}
          <a
            href={`tel:${branch.phone}`}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs transition"
          >
            <Phone className="w-3.5 h-3.5 text-amber-700" />
            <span>{language === 'ta' ? 'அழைக்கவும்' : 'Call Branch'}</span>
          </a>

          {/* Language Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => onLanguageChange('en')}
              className={`px-2.5 py-1 rounded-lg transition text-[11px] ${
                language === 'en'
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange('ta')}
              className={`px-2.5 py-1 rounded-lg transition text-[11px] ${
                language === 'ta'
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              தமிழ்
            </button>
          </div>

          {/* Sign Out */}
          <button
            type="button"
            onClick={onLogout}
            className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-700 border border-slate-200 hover:border-rose-200 transition"
            title={t.logout}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
