import React from 'react';
import { useApp } from '../../context/AppContext';
import { Languages } from 'lucide-react';

interface LanguageToggleProps {
  className?: string;
  variant?: 'responsive' | 'compact' | 'pill' | 'button';
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ 
  className = '',
  variant = 'responsive' 
}) => {
  const { language, setLanguage } = useApp();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ta' : 'en');
  };

  if (variant === 'responsive') {
    return (
      <div className={`shrink-0 ${className}`}>
        {/* Compact for mobile screens */}
        <button
          type="button"
          onClick={toggleLanguage}
          className="sm:hidden flex items-center gap-1 px-2 py-1.5 rounded-xl border border-amber-300/80 bg-white/90 hover:bg-amber-50 text-slate-900 font-extrabold text-xs transition shadow-2xs shrink-0"
          title={language === 'en' ? 'தமிழுக்கு மாறவும் (Switch to Tamil)' : 'Switch to English'}
        >
          <Languages className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span>{language === 'en' ? 'தமிழ்' : 'EN'}</span>
        </button>

        {/* Full pill for sm+ screens */}
        <div 
          className="hidden sm:inline-flex items-center p-0.5 rounded-xl bg-slate-200/80 border border-slate-300/80 shadow-inner select-none"
          role="group"
          aria-label="Language selection"
        >
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
              language === 'en'
                ? 'bg-amber-500 text-slate-950 shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            <span>English</span>
          </button>

          <button
            type="button"
            onClick={() => setLanguage('ta')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
              language === 'ta'
                ? 'bg-amber-500 text-slate-950 shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            <span>தமிழ்</span>
          </button>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={toggleLanguage}
        className={`flex items-center gap-1 px-2 py-1.5 rounded-xl border border-amber-300/80 bg-white/90 hover:bg-amber-50 text-slate-900 font-extrabold text-xs transition shadow-2xs shrink-0 ${className}`}
        title={language === 'en' ? 'தமிழுக்கு மாறவும் (Switch to Tamil)' : 'Switch to English'}
      >
        <Languages className="w-3.5 h-3.5 text-amber-700 shrink-0" />
        <span>{language === 'en' ? 'தமிழ்' : 'EN'}</span>
      </button>
    );
  }

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={toggleLanguage}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300/80 bg-white/90 hover:bg-amber-50 text-slate-800 font-bold text-xs transition shadow-2xs ${className}`}
        title="Switch Language / மொழி மாற்றுக"
      >
        <Languages className="w-3.5 h-3.5 text-amber-700" />
        <span>{language === 'en' ? 'தமிழ்' : 'English'}</span>
      </button>
    );
  }

  return (
    <div 
      className={`inline-flex items-center p-0.5 rounded-xl bg-slate-200/80 border border-slate-300/80 shadow-inner select-none ${className}`}
      role="group"
      aria-label="Language selection"
    >
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
          language === 'en'
            ? 'bg-amber-500 text-slate-950 shadow-xs font-extrabold'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
        }`}
      >
        <span>English</span>
      </button>

      <button
        type="button"
        onClick={() => setLanguage('ta')}
        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
          language === 'ta'
            ? 'bg-amber-500 text-slate-950 shadow-xs font-extrabold'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
        }`}
      >
        <span>தமிழ்</span>
      </button>
    </div>
  );
};
