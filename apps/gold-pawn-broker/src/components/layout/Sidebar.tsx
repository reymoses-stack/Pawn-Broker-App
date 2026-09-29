import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, Users, Gem, Receipt, 
  BookOpen, BarChart3, ShieldCheck, Settings, 
  Lock, UserCog, LogOut, Crown,
  AlertTriangle, CheckCircle2, ChevronRight, Sparkles, Plus, X
} from 'lucide-react';

interface SidebarProps {
  onSelectSubTab?: (subTab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = () => {
  const { 
    activeTab, 
    setActiveTab, 
    mortgages, 
    customers, 
    packets,
    currentUser,
    logout,
    setIsNewMortgageOpen,
    setIsNewCustomerOpen,
    isSidebarOpen,
    setIsSidebarOpen,
    language,
    t,
    unreadEnquiriesCount
  } = useApp();

  const activeMortgagesCount = mortgages.filter(m => m.status === 'Active' || m.status === 'Due' || m.status === 'Overdue').length;
  const overdueMortgagesCount = mortgages.filter(m => m.status === 'Overdue').length;
  const dueMortgagesCount = mortgages.filter(m => m.status === 'Due').length;
  const pendingKycCount = customers.filter(c => c.kycStatus === 'Pending' || c.kycStatus === 'In Progress').length;
  const inVaultPacketsCount = packets.filter(p => p.status === 'In Locker').length;

  const navItems = [
    {
      id: 'dashboard',
      label: language === 'ta' ? 'முகப்புப்பலகை' : 'Dashboard',
      icon: LayoutDashboard,
      iconColor: 'text-amber-600',
      badge: null
    },
    {
      id: 'mortgages_active',
      label: language === 'ta' ? 'அடமானக் கணக்கு' : 'Pledges & Loans (Girvi)',
      icon: Gem,
      iconColor: 'text-amber-600',
      badge: null,
      isActive: activeTab.startsWith('mortgages')
    },
    {
      id: 'enquiries',
      label: language === 'ta' ? 'அடமான விசாரிப்புகள்' : 'Customer Enquiries',
      icon: Sparkles,
      iconColor: 'text-amber-500',
      badge: unreadEnquiriesCount > 0 ? (
        <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-2xs animate-pulse">
          {unreadEnquiriesCount} NEW
        </span>
      ) : null,
      isActive: activeTab === 'enquiries'
    },
    {
      id: 'customers',
      label: language === 'ta' ? 'வாடிக்கையாளர்கள்' : 'Customer Directory (Grahak)',
      icon: Users,
      iconColor: 'text-blue-600',
      badge: null,
      isActive: activeTab.startsWith('customers')
    },
    {
      id: 'payments',
      label: language === 'ta' ? 'வட்டி வசூல் (Payments)' : 'Payment & Vaddi Collections',
      icon: Receipt,
      iconColor: 'text-emerald-600',
      badge: null,
      isActive: activeTab === 'payments'
    },
    {
      id: 'gold_inventory',
      label: language === 'ta' ? 'லாக்கர் பெட்டகம்' : 'Safe Vault & Lockers (Petty)',
      icon: Lock,
      iconColor: 'text-yellow-600',
      badge: null,
      isActive: activeTab.startsWith('gold')
    },
    {
      id: 'accounts_ledger',
      label: language === 'ta' ? 'கல்லா கணக்கு' : 'Day Book & Khatabook',
      icon: BookOpen,
      iconColor: 'text-cyan-600',
      badge: null,
      isActive: activeTab.startsWith('accounts')
    },
    {
      id: 'reports',
      label: language === 'ta' ? 'வணிக அறிக்கைகள்' : 'Business Reports',
      icon: BarChart3,
      iconColor: 'text-indigo-600',
      badge: null,
      isActive: activeTab === 'reports'
    },
    {
      id: 'staff',
      label: language === 'ta' ? 'பணியாளர்கள்' : 'Staff & Permissions',
      icon: UserCog,
      iconColor: 'text-slate-700',
      badge: (currentUser.isOwner || currentUser.role === 'Master Admin / Owner') ? (
        <span className="bg-amber-500/20 text-amber-900 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-amber-300">
          OWNER
        </span>
      ) : null,
      isActive: activeTab === 'staff'
    },
    {
      id: 'audit',
      label: language === 'ta' ? 'கணினி தணிக்கை' : 'Audit Trail Logs',
      icon: ShieldCheck,
      iconColor: 'text-emerald-700',
      badge: null,
      isActive: activeTab === 'audit'
    },
    {
      id: 'settings',
      label: language === 'ta' ? 'கடை அமைப்புகள்' : 'Shop Settings',
      icon: Settings,
      iconColor: 'text-slate-500',
      badge: null,
      isActive: activeTab === 'settings'
    }
  ];

  // Swipe Right & Left Gesture Support for Mobile
  const touchStartRef = React.useRef<{ x: number; y: number; time: number } | null>(null);

  React.useEffect(() => {
    const handleGlobalTouchStart = (e: TouchEvent) => {
      if (typeof window === 'undefined' || window.innerWidth >= 1024) return;
      if (e.touches.length !== 1) return;

      // Do NOT trigger drawer swipe if touch originates inside tables, scrollable containers, or form inputs
      const target = e.target as HTMLElement | null;
      if (target?.closest('table, .overflow-x-auto, [data-no-swipe], input, textarea, select, .no-swipe, [role="tablist"]')) {
        touchStartRef.current = null;
        return;
      }

      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };
    };

    const handleGlobalTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      if (typeof window === 'undefined' || window.innerWidth >= 1024) return;
      if (e.changedTouches.length !== 1) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const startX = touchStartRef.current.x;
      touchStartRef.current = null;

      // Only respond if horizontal movement clearly exceeds vertical movement
      if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        if (!isSidebarOpen) {
          // STRICT EDGE SWIPE: Only open if swipe originates strictly from the very left edge (<= 28px)
          // This prevents accidental drawer openings when swiping across multi-column tables/cards
          if (deltaX > 45 && startX <= 28) {
            setIsSidebarOpen(true);
          }
        } else {
          // Close on swipe left when drawer is open
          if (deltaX < -35) {
            setIsSidebarOpen(false);
          }
        }
      }
    };

    window.addEventListener('touchstart', handleGlobalTouchStart, { passive: true });
    window.addEventListener('touchend', handleGlobalTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleGlobalTouchStart);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isSidebarOpen, setIsSidebarOpen]);

  const closeSidebarOnMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    closeSidebarOnMobile();
  };

  // Direct swipe listeners on the drawer itself for extra responsiveness
  const drawerTouchStartRef = React.useRef<{ x: number; y: number } | null>(null);

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
        setIsSidebarOpen(false);
      }
      drawerTouchStartRef.current = null;
    }
  };

  return (
    <>
      {/* Mobile Semi-Transparent Backdrop with Ghost Click Prevention */}
      <div
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsSidebarOpen(false);
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsSidebarOpen(false);
        }}
        className={`fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300 ${
          isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ touchAction: 'none' }}
        aria-hidden="true"
      />

      <aside
        onTouchStart={handleDrawerTouchStart}
        onTouchEnd={handleDrawerTouchEnd}
        className={`no-print select-none text-slate-700 shadow-xl lg:shadow-sm h-full overflow-hidden bg-white/95 border-r border-slate-200/90 flex flex-col shrink-0 transition-all duration-300 z-50
          fixed inset-y-0 left-0 lg:static
          ${isSidebarOpen 
            ? 'translate-x-0 w-72 max-w-[85vw] lg:w-64 lg:flex' 
            : '-translate-x-full lg:translate-x-0 lg:w-0 lg:border-r-0 lg:opacity-0 pointer-events-none lg:pointer-events-none'
          }`}
      >
        {/* Mobile Header with Close Button */}
        <div className="flex items-center justify-between p-3.5 border-b border-amber-200/60 lg:hidden bg-gradient-to-r from-amber-50 to-amber-100/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-900 border border-amber-300 flex items-center justify-center font-black text-xs">
              N
            </div>
            <span className="font-extrabold text-xs text-amber-950 tracking-tight">
              {language === 'ta' ? 'கல்லா மெனு' : 'Navigation Menu'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white border border-slate-200 shadow-2xs active:scale-95 transition"
            title={language === 'ta' ? 'மூடு' : 'Close'}
          >
            <X className="w-4 h-4 text-slate-700" />
          </button>
        </div>
        
        {/* Pinned Quick Create Buttons */}
        <div className="p-3 border-b border-slate-200/80 space-y-1.5 bg-gradient-to-b from-amber-50/40 to-transparent shrink-0">
          <button
            type="button"
            onClick={() => {
              setIsNewMortgageOpen(true);
              closeSidebarOnMobile();
            }}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-sm flex items-center justify-center transition border border-white/60 active:scale-98"
          >
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{language === 'ta' ? '+ புதிய அடமானம்' : '+ New Pawn Pledge'}</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsNewCustomerOpen(true);
              closeSidebarOnMobile();
            }}
            className="w-full py-1.5 px-3 rounded-xl bg-white hover:bg-amber-50/80 text-slate-800 font-bold text-xs border border-slate-200 hover:border-amber-300 shadow-2xs flex items-center justify-center transition"
          >
            <div className="flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>{language === 'ta' ? '+ புதிய வாடிக்கையாளர்' : '+ Add New Customer'}</span>
            </div>
          </button>
        </div>

        {/* Main Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-2.5 space-y-1 text-xs">
          <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Counter Operations
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.isActive !== undefined ? item.isActive : activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium transition text-left ${
                  active
                    ? 'bg-amber-500/15 text-amber-950 font-extrabold border border-amber-300/80 shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-950'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-amber-800' : item.iconColor}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge}
              </button>
            );
          })}
        </nav>

        {/* Footer: User Identity & Workstation Lock */}
        <div className="p-3 border-t border-slate-200/90 bg-slate-50/80 text-[11px] text-slate-600 space-y-2 shrink-0">
          
          {/* User Card */}
          <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 truncate">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-900 border border-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div className="truncate">
                <div className="font-extrabold text-slate-900 text-xs truncate leading-tight flex items-center gap-1">
                  <span>{currentUser.name}</span>
                  {currentUser.isOwner && <Crown className="w-3 h-3 text-amber-600 shrink-0" />}
                </div>
                <div className="text-[10px] text-slate-500 leading-none mt-0.5">
                  {currentUser.role}
                </div>
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={() => {
              closeSidebarOnMobile();
              logout();
            }}
            className="w-full py-2 px-2.5 rounded-xl bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-700 border border-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-2xs active:scale-98"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-500" />
            <span>{language === 'ta' ? 'வெளியேறு (Logout)' : 'Logout'}</span>
          </button>

        </div>
      </aside>
    </>
  );
};

