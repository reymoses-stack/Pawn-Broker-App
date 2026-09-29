import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Home, 
  Gem, 
  Calculator, 
  Sparkles, 
  Building2 
} from 'lucide-react';
import { Language } from '../../i18n/translations';

interface TabItem {
  id: string;
  key: string;
  labelEn: string;
  labelTa: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badge?: number;
}

interface BottomNavProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  activeMortgagesCount: number;
  language: Language;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  activeMortgagesCount,
  language
}) => {
  const dockRef = useRef<HTMLDivElement>(null);

  const tabs: TabItem[] = [
    {
      id: 'loans',
      key: 'pledges',
      labelEn: 'Pledges',
      labelTa: 'அடமானம்',
      icon: Gem,
      accentColor: '#f59e0b',
      badge: activeMortgagesCount
    },
    {
      id: 'calculator',
      key: 'calculator',
      labelEn: 'Estimate',
      labelTa: 'மதிப்பீடு',
      icon: Calculator,
      accentColor: '#10b981'
    },
    {
      id: 'dashboard',
      key: 'home',
      labelEn: 'Home',
      labelTa: 'முகப்பு',
      icon: Home,
      accentColor: '#f59e0b'
    },
    {
      id: 'enquiry',
      key: 'enquiry',
      labelEn: 'New Pawn',
      labelTa: 'விசாரிப்பு',
      icon: Sparkles,
      accentColor: '#38bdf8'
    },
    {
      id: 'branch',
      key: 'branch',
      labelEn: 'Branch',
      labelTa: 'கடை',
      icon: Building2,
      accentColor: '#eab308'
    }
  ];

  // Determine active tab index among the 5 items
  const getActiveIndex = useCallback((): number => {
    if (activeTab === 'dashboard') return 2;
    if (activeTab === 'loans') return 0;
    if (activeTab === 'calculator') return 1;
    if (activeTab === 'enquiry') return 3;
    if (activeTab === 'branch') return 4;
    return 2; // Default to Home
  }, [activeTab]);

  const activeIndex = getActiveIndex();

  // Sliding & Hover state for Apple Liquid Glass interaction
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [trackWidth, setTrackWidth] = useState(360);

  // Measure track width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (dockRef.current) {
        setTrackWidth(dockRef.current.clientWidth - 12); // minus p-1.5 (6px on each side)
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const handleNav = useCallback((tabId: string) => {
    onSelectTab(tabId);
  }, [onSelectTab]);

  // Update pointer position relative to inner track
  const updatePointer = useCallback((clientX: number) => {
    if (!dockRef.current) return;
    const rect = dockRef.current.getBoundingClientRect();
    const innerX = clientX - rect.left - 6; // offset by 6px container padding
    const currentInnerWidth = rect.width - 12;
    const clampedX = Math.max(0, Math.min(innerX, currentInnerWidth));
    setHoverX(clampedX);
    setTrackWidth(currentInnerWidth);
  }, []);

  // Touch slide gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      setIsInteracting(true);
      updatePointer(e.touches[0].clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      updatePointer(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    if (hoverX !== null && trackWidth > 0) {
      const slotWidth = trackWidth / 5;
      const targetIndex = Math.max(0, Math.min(4, Math.floor(hoverX / slotWidth)));
      handleNav(tabs[targetIndex].id);
    }
    setIsInteracting(false);
    setHoverX(null);
  };

  // Mouse hover handlers
  const handleMouseMove = (e: React.MouseEvent) => {
    setIsInteracting(true);
    updatePointer(e.clientX);
  };

  const handleMouseLeave = () => {
    setIsInteracting(false);
    setHoverX(null);
  };

  const slotWidth = trackWidth > 0 ? trackWidth / 5 : 72;
  const targetSlot = isInteracting && hoverX !== null
    ? Math.max(0, Math.min(4, Math.floor(hoverX / slotWidth)))
    : activeIndex;

  const isHomePill = targetSlot === 2;

  return (
    <nav 
      aria-label="Mobile Bottom Navigation Dock"
      className="no-print fixed bottom-3 left-3 right-3 z-40 max-w-sm mx-auto select-none pointer-events-auto"
    >
      {/* Apple Liquid Glassmorphism Dock Chassis */}
      <div 
        ref={dockRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative h-[62px] bg-slate-950/80 dark:bg-black/85 backdrop-blur-3xl border border-white/20 rounded-[28px] p-1.5 shadow-[0_20px_45px_-10px_rgba(0,0,0,0.6),inset_0_1.5px_1px_rgba(255,255,255,0.35),inset_0_-1px_1px_rgba(255,255,255,0.08)] touch-none"
      >
        {/* Specular Liquid Top Glare */}
        <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-white/70 to-transparent pointer-events-none" />

        {/* Inner Track */}
        <div className="relative w-full h-full">

          {/* Sliding Liquid Glass Capsule (Pill) - Sits ONLY on the 5 tabs */}
          <div 
            className="absolute top-0 bottom-0 rounded-[20px] pointer-events-none"
            style={{
              width: 'calc(20% - 6px)',
              left: `calc(${targetSlot * 20}% + 3px)`,
              transition: 'left 0.28s cubic-bezier(0.2, 0.9, 0.28, 1.25), background 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
              background: isHomePill 
                ? 'radial-gradient(ellipse at top, rgba(245,158,11,0.4) 0%, rgba(217,119,6,0.2) 65%, rgba(255,255,255,0.12) 100%)'
                : 'radial-gradient(ellipse at top, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.1) 75%, rgba(255,255,255,0.04) 100%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: isHomePill 
                ? '1px solid rgba(251,191,36,0.6)' 
                : '1px solid rgba(255,255,255,0.38)',
              boxShadow: isHomePill
                ? '0 10px 24px -2px rgba(245,158,11,0.5), inset 0 1px 2px 0 rgba(255,255,255,0.7)'
                : '0 8px 20px -4px rgba(0,0,0,0.35), inset 0 1px 2px 0 rgba(255,255,255,0.55)'
            }}
          >
            {/* Inner specular reflection sheen */}
            <div className="absolute inset-0 rounded-[20px] bg-gradient-to-b from-white/25 via-white/5 to-transparent opacity-90" />
            
            {/* Liquid Droplet Center Pip */}
            <div 
              className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1 rounded-full transition-colors ${
                isHomePill ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]' : 'bg-white/80 shadow-[0_0_6px_rgba(255,255,255,0.8)]'
              }`} 
            />
          </div>

          {/* 5 Equal Dock Slots Grid */}
          <div className="relative z-10 w-full h-full grid grid-cols-5">
            {tabs.map((tab, idx) => {
              const isSelected = targetSlot === idx;
              const isHome = idx === 2;
              const Icon = tab.icon;

              const scale = isSelected 
                ? (isHome ? 1.12 : 1.06) 
                : 1;

              const translateY = isSelected 
                ? (isHome ? -2 : -1) 
                : 0;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleNav(tab.id)}
                  className="w-full h-full flex flex-col items-center justify-center py-1 transition-transform duration-200 ease-out focus:outline-none cursor-pointer"
                  style={{
                    transform: `scale(${scale}) translateY(${translateY}px)`
                  }}
                >
                  <div className="relative flex items-center justify-center">
                    <Icon 
                      className={`w-5 h-5 transition-all duration-200 ${
                        isHome
                          ? isSelected 
                            ? 'text-amber-300 stroke-[2.4] drop-shadow-[0_2px_12px_rgba(245,158,11,0.9)]' 
                            : 'text-amber-400 stroke-[2.2]'
                          : isSelected
                            ? 'text-white stroke-[2.4] drop-shadow-[0_2px_8px_rgba(255,255,255,0.5)]'
                            : 'text-slate-400 stroke-[1.8]'
                      }`} 
                    />
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className="absolute -top-1 -right-2.5 bg-rose-500 text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-[0_2px_6px_rgba(244,63,94,0.6)] border border-white/40">
                        {tab.badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-[9px] mt-0.5 tracking-tight transition-colors ${
                    isHome
                      ? isSelected ? 'font-bold text-amber-200 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]' : 'font-semibold text-amber-300/80'
                      : isSelected 
                        ? 'font-bold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]' 
                        : 'font-medium text-slate-400'
                  }`}>
                    {language === 'ta' ? tab.labelTa : tab.labelEn}
                  </span>
                </button>
              );
            })}
          </div>

        </div>
      </div>
    </nav>
  );
};
