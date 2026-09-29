import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
import { 
  Building2, UserCheck, Wallet, Plus, 
  QrCode, Search, ChevronDown, Landmark, Sparkles,
  TrendingUp, RefreshCw, Globe, Clock, Crown, LogOut,
  Receipt, User, Phone, CheckCircle2, ArrowRight, X, Smartphone, Menu
} from 'lucide-react';
import { UserRole, Customer, Mortgage } from '../../types';
import { LanguageToggle } from '../common/LanguageToggle';

export const Navbar: React.FC = () => {
  const { 
    currentUser, 
    setCurrentUser, 
    currentBranch, 
    setCurrentBranch, 
    branches, 
    users, 
    customers,
    getCashBalance, 
    getBankBalance,
    setIsNewMortgageOpen,
    setIsPaymentModalOpen,
    setIsExpenseModalOpen,
    setIsScannerModalOpen,
    isCustomerPortalOpen,
    setIsCustomerPortalOpen,
    setPortalCustomerId,
    setSelectedMortgage,
    setSelectedCustomer,
    mortgages,
    goodReturnsRates,
    setIsGoodReturnsModalOpen,
    refreshGoodReturnsRates,
    logout,
    setActiveTab,
    isSidebarOpen,
    toggleSidebar,
    setIsDrawerModalOpen,
    setDrawerModalInitialTab,
    language,
    t,
    unreadEnquiriesCount,
    activeTab
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const cashBalance = getCashBalance();
  const bankBalance = getBankBalance();

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cleanQuery = searchQuery.trim().toLowerCase();

  // Multi-entity search across customers and mortgages
  const matchedCustomers = cleanQuery
    ? customers.filter(c => 
        c.name.toLowerCase().includes(cleanQuery) ||
        c.mobile.includes(cleanQuery) ||
        c.kycRecord?.maskedId.toLowerCase().includes(cleanQuery) ||
        c.id.toLowerCase().includes(cleanQuery)
      ).slice(0, 4)
    : [];

  const matchedMortgages = cleanQuery
    ? mortgages.filter(m => 
        m.mortgageNumber.toLowerCase().includes(cleanQuery) ||
        m.customerId.toLowerCase().includes(cleanQuery) ||
        m.packetId.toLowerCase().includes(cleanQuery)
      ).slice(0, 4)
    : [];

  const hasResults = matchedCustomers.length > 0 || matchedMortgages.length > 0;

  return (
    <header className="no-print liquid-glass border-b border-amber-200/60 text-slate-800 sticky top-0 z-30 shadow-[0_4px_24px_rgba(217,119,6,0.06)] bg-white/90 backdrop-blur-xl">
      <div className="px-2 sm:px-5 py-2 flex items-center justify-between gap-1.5 sm:gap-4 max-w-full">
        
        {/* Left: Hamburger Toggle & Brand & Branch Selector */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          
          {/* Mobile & Desktop Sidebar Open/Close Toggle Button */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1.5 sm:p-2 text-slate-700 hover:text-amber-950 hover:bg-amber-100/70 rounded-xl transition flex items-center justify-center border border-amber-200/70 shadow-2xs active:scale-95 bg-white/80 shrink-0"
            aria-label="Toggle navigation menu"
            title={isSidebarOpen ? (language === 'ta' ? 'மெனுவை மூடு' : 'Close Menu') : (language === 'ta' ? 'மெனுவை திற' : 'Open Menu')}
          >
            {isSidebarOpen ? (
              <X className="w-4 h-4 text-amber-900" />
            ) : (
              <Menu className="w-4 h-4 text-amber-900" />
            )}
          </button>

          <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer group shrink-0"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/25 font-black text-base sm:text-lg tracking-tighter border border-white/60 group-hover:scale-105 transition">
              N
            </div>
            <div className="hidden lg:block">
              <div className="flex items-center gap-1.5 font-extrabold text-sm tracking-tight text-slate-900 leading-tight">
                <span className="bg-gradient-to-r from-amber-950 via-amber-800 to-yellow-900 bg-clip-text text-transparent">
                  NEXUS GOLD
                </span>
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-950 border border-amber-400/60 font-bold">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-none mt-0.5">Sri Nexus Gold Pawn Brokerage</p>
            </div>
          </div>

          <div className="h-5 w-[1px] bg-slate-200 hidden md:block" />

          {/* Branch Dropdown */}
          <div className="relative group hidden md:block">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/80 hover:bg-white rounded-xl border border-slate-200 shadow-xs cursor-pointer text-xs transition">
              <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <div className="text-left">
                <span className="text-slate-400 text-[8px] uppercase font-bold tracking-wider block leading-none">Branch</span>
                <span className="font-bold text-slate-800 text-[11px] leading-tight block">{currentBranch.name}</span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </div>

            <div className="absolute left-0 mt-1.5 w-60 liquid-glass-modal rounded-2xl shadow-2xl py-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-50 border border-amber-200/80">
              <div className="px-3 py-1.5 text-[9px] uppercase tracking-wider font-bold text-slate-400">
                Switch Operational Branch
              </div>
              {branches.map(b => (
                <button
                  key={b.id}
                  onClick={() => setCurrentBranch(b)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-amber-50/80 transition ${
                    b.id === currentBranch.id ? 'bg-amber-500/15 text-amber-950 font-bold' : 'text-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-semibold">{b.name}</div>
                    <div className="text-[10px] text-slate-500">{b.code} • {b.city}</div>
                  </div>
                  {b.id === currentBranch.id && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Universal Instant Lookup Search */}
        <div className="flex-1 min-w-0 max-w-xl flex items-center justify-center gap-1.5 sm:gap-3">
          
          {/* Universal Instant Lookup Search */}
          <div ref={searchRef} className="relative flex-1 min-w-0 max-w-lg">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder={language === 'ta' ? 'தேடுக (பெயர், எண், ரசீது)...' : 'Search Name, Mobile, Pledge#...'}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                className="w-full pl-7 sm:pl-8 pr-6 sm:pr-7 py-1.5 sm:py-2 bg-white/90 border border-amber-200/80 focus:border-amber-500 focus:bg-white rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 transition shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Instant Multi-Entity Search Dropdown Results */}
            {showSearchResults && cleanQuery && (
              <div className="absolute left-0 right-0 mt-1.5 liquid-glass-modal rounded-2xl shadow-2xl p-2 z-50 border border-amber-200/90 max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-1">
                
                {/* No results */}
                {!hasResults && (
                  <div className="py-6 text-center text-xs text-slate-500">
                    <p>No customer or pledge found matching <strong className="text-slate-800">"{searchQuery}"</strong></p>
                    <p className="text-[11px] text-slate-400 mt-1">Try entering phone number (10 digits), customer name, or GM-2026-...</p>
                  </div>
                )}

                {/* Customers section */}
                {matchedCustomers.length > 0 && (
                  <div className="mb-2">
                    <div className="text-[10px] uppercase font-bold text-slate-400 px-2.5 py-1 flex items-center gap-1.5">
                      <User className="w-3 h-3 text-blue-600" />
                      <span>Matching Customers ({matchedCustomers.length})</span>
                    </div>
                    {matchedCustomers.map(c => {
                      const custMortgages = mortgages.filter(m => m.customerId === c.id && (m.status === 'Active' || m.status === 'Due' || m.status === 'Overdue'));
                      return (
                        <div
                          key={c.id}
                          className="p-2 hover:bg-amber-50/80 rounded-xl transition cursor-pointer flex items-center justify-between border-b border-amber-100/50 last:border-0"
                          onClick={() => {
                            setSelectedCustomer(c);
                            setActiveTab('customers');
                            setShowSearchResults(false);
                            setSearchQuery('');
                          }}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200">
                              {c.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{c.name}</span>
                                {c.kycStatus === 'Verified' && (
                                   <span className="text-[9px] bg-emerald-100 text-emerald-800 font-semibold px-1 rounded">KYC</span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                                <span>📞 {c.mobile}</span>
                                <span>•</span>
                                <span className="font-semibold text-amber-900">{custMortgages.length} Active Loans</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCustomer(c);
                                setIsNewMortgageOpen(true);
                                setShowSearchResults(false);
                              }}
                              className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-950 font-bold text-[10px] rounded-lg border border-amber-300"
                            >
                              + Pledge
                            </button>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Mortgages section */}
                {matchedMortgages.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 px-2.5 py-1 flex items-center gap-1.5 border-t border-slate-100 pt-2">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>Matching Pledges / Bills ({matchedMortgages.length})</span>
                    </div>
                    {matchedMortgages.map(m => {
                      const cust = customers.find(c => c.id === m.customerId);
                      return (
                        <div
                          key={m.id}
                          className="p-2 hover:bg-amber-50/80 rounded-xl transition cursor-pointer flex items-center justify-between border-b border-amber-100/50 last:border-0"
                          onClick={() => {
                            setSelectedMortgage(m);
                            setShowSearchResults(false);
                            setSearchQuery('');
                          }}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-amber-800 text-xs">{m.mortgageNumber}</span>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                                m.status === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                                m.status === 'Overdue' ? 'bg-rose-100 text-rose-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {m.status}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {cust?.name || m.customerId} • Packet: {m.packetId}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-mono font-black text-slate-900 text-xs">
                              {formatCurrency(m.outstandingPrincipal)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Due: {m.maturityDate}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Quick Action 4: Gold Packet Scanner (Desktop / Tablet) */}
          <button
            type="button"
            onClick={() => setIsScannerModalOpen(true)}
            title={language === 'ta' ? 'நகை பாக்கெட் QR / பார்-கோடு ஸ்கேன்' : 'Scan Gold Packet QR / Barcode'}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 sm:py-2 bg-white/80 hover:bg-white text-slate-700 hover:text-amber-800 border border-slate-200 rounded-xl transition shadow-xs text-xs font-bold shrink-0"
          >
            <QrCode className="w-3.5 h-3.5 text-amber-700" />
            <span>
              {language === 'ta' ? 'பாக்கெட் ஸ்கேன்' : 'Scan Packet'}
            </span>
          </button>

          {/* Customer Self-Service Web Passbook QR Portal Button (Desktop / Tablet) */}
          <button
            type="button"
            onClick={() => {
              setPortalCustomerId(null);
              setIsCustomerPortalOpen(true);
            }}
            title={language === 'ta' ? 'வாடிக்கையாளர் QR போர்ட்டல் & கவுண்டர் ஸ்டாண்டி' : 'Customer QR Web Passbook Portal & Counter Standee'}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 sm:py-2 bg-gradient-to-r from-amber-500/15 via-yellow-400/20 to-amber-500/10 hover:from-amber-500/25 hover:to-yellow-400/30 text-amber-950 border border-amber-300/80 rounded-xl transition shadow-xs text-xs font-black shrink-0"
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-800" />
            <span>
              {language === 'ta' ? 'வாடிக்கையாளர் QR' : 'Customer QR Portal'}
            </span>
          </button>

          {/* Customer Enquiries Button with Real-time Count */}
          <button
            type="button"
            onClick={() => setActiveTab('enquiries')}
            title={language === 'ta' ? 'வாடிக்கையாளர் அடமான விசாரிப்புகள்' : 'Customer Pawn Enquiries'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:py-2 rounded-xl transition shadow-xs text-xs font-black shrink-0 relative cursor-pointer ${
              activeTab === 'enquiries'
                ? 'bg-amber-500 text-slate-950 border border-amber-600'
                : unreadEnquiriesCount > 0
                  ? 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-950 border-2 border-amber-400 animate-pulse'
                  : 'bg-white/80 hover:bg-white text-slate-700 border border-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">
              {language === 'ta' ? 'விசாரிப்புகள்' : 'Enquiries'}
            </span>
            {unreadEnquiriesCount > 0 && (
              <span className="flex items-center justify-center bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full shadow-xs">
                {unreadEnquiriesCount}
              </span>
            )}
          </button>

        </div>

        {/* Right: Live Bullion Pill, Drawer Balances, Language Toggle & Lock Vault */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          
          {/* GoodReturns Live Bullion Feed Ticker */}
          <div className="hidden xl:flex items-center">
            <button
              onClick={() => setIsGoodReturnsModalOpen(true)}
              title="Click to view full GoodReturns bullion rates or change city"
              className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-50 via-white to-yellow-50 border border-amber-200 hover:border-amber-400 transition group cursor-pointer text-left"
            >
              <div className="relative flex items-center justify-center">
                <span className={`w-2 h-2 rounded-full absolute ${goodReturnsRates.isManualOverride ? 'bg-amber-500' : 'bg-emerald-500 animate-ping'}`} />
                <span className={`w-2 h-2 rounded-full relative ${goodReturnsRates.isManualOverride ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              </div>
              
              <div className="leading-tight text-[11px]">
                <div className="flex items-center gap-1 font-bold">
                  <span className="text-amber-900 font-extrabold text-[9px] uppercase">
                    {goodReturnsRates.isManualOverride ? 'Gold Rate (Custom)' : 'GoodReturns'}
                  </span>
                  <span className="text-slate-400 text-[9px]">({goodReturnsRates.city}):</span>
                  <span className="font-mono text-amber-800 font-black">22K ₹{goodReturnsRates.rates['22K'].toLocaleString('en-IN')}/g</span>
                </div>
              </div>

              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  refreshGoodReturnsRates(goodReturnsRates.city, true);
                }}
                className="p-0.5 text-slate-400 hover:text-amber-700 rounded transition"
                title={goodReturnsRates.isManualOverride ? "Reset & fetch live GoodReturns market rate" : "Refresh live rate"}
              >
                <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
              </div>
            </button>
          </div>

          {/* Interactive Drawer Balances (Cash & Bank) */}
          <div className="hidden lg:flex items-center gap-1.5">
            {/* Cash Drawer Pill */}
            <div 
              onClick={() => {
                setDrawerModalInitialTab('CashIn');
                setIsDrawerModalOpen(true);
              }}
              title={language === 'ta' ? 'கல்லா பண வரவு / எடுப்பு - கிளிக் செய்க' : 'Cash Drawer In / Out - Click to manage'}
              className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 cursor-pointer flex items-center gap-1.5 text-xs transition shadow-2xs group"
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-700 group-hover:scale-110 transition-transform" />
              <div className="leading-tight">
                <span className="text-[9px] uppercase font-bold text-emerald-800 block -mb-0.5">
                  {language === 'ta' ? 'கல்லா' : 'Cash'}
                </span>
                <span className="text-emerald-950 font-black font-mono text-[11px]">
                  {formatCurrency(cashBalance)}
                </span>
              </div>
              <div className="flex items-center gap-0.5 ml-1 pl-1 border-l border-emerald-200 text-[10px] font-bold">
                <span 
                  onClick={(e) => {
                    e.stopPropagation();
                    setDrawerModalInitialTab('CashIn');
                    setIsDrawerModalOpen(true);
                  }}
                  className="px-1 py-0.2 bg-emerald-200/70 hover:bg-emerald-300 text-emerald-950 rounded"
                  title="Cash In / Deposit"
                >
                  +
                </span>
                <span 
                  onClick={(e) => {
                    e.stopPropagation();
                    setDrawerModalInitialTab('Withdrawal');
                    setIsDrawerModalOpen(true);
                  }}
                  className="px-1 py-0.2 bg-rose-200/70 hover:bg-rose-300 text-rose-950 rounded"
                  title="Withdraw / Cash Out"
                >
                  -
                </span>
              </div>
            </div>

            {/* Bank Account Pill */}
            <div 
              onClick={() => {
                setDrawerModalInitialTab('CashIn');
                setIsDrawerModalOpen(true);
              }}
              title={language === 'ta' ? 'வங்கி இருப்பு & வரவு/பற்று - கிளிக் செய்க' : 'Bank Balance & Transactions - Click to manage'}
              className="px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100/80 border border-blue-200 cursor-pointer flex items-center gap-1.5 text-xs transition shadow-2xs group"
            >
              <Landmark className="w-3.5 h-3.5 text-blue-700 group-hover:scale-110 transition-transform" />
              <div className="leading-tight">
                <span className="text-[9px] uppercase font-bold text-blue-800 block -mb-0.5">
                  {language === 'ta' ? 'வங்கி' : 'Bank'}
                </span>
                <span className="text-blue-950 font-black font-mono text-[11px]">
                  {formatCurrency(bankBalance)}
                </span>
              </div>
            </div>
          </div>

          {/* Language Switch Toggle (English / தமிழ்) */}
          <LanguageToggle variant="responsive" />

        </div>
      </div>
    </header>
  );
};

