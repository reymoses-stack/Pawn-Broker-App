import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Customer, CustomerTier } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { 
  Users, Search, UserPlus, ShieldCheck, 
  Phone, MapPin, ChevronRight, Gem, History, 
  ExternalLink, FileEdit, CheckCircle2, Clock, XCircle, Award,
  QrCode, Smartphone, Filter, X, ArrowUpDown
} from 'lucide-react';
import { KycVerificationModal } from './KycVerificationModal';
import { CustomerFormModal } from './CustomerFormModal';

export const CustomerListView: React.FC = () => {
  const { 
    customers, 
    mortgages, 
    setIsNewCustomerOpen, 
    setSelectedMortgage,
    currentBranch,
    setIsCustomerPortalOpen,
    setPortalCustomerId,
    language
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [kycFilter, setKycFilter] = useState<'all' | 'Verified' | 'Pending' | 'Failed'>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [loanStatusFilter, setLoanStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('nameAsc');
  const [selectedCust, setSelectedCust] = useState<Customer | null>(null);
  const [customerToKyc, setCustomerToKyc] = useState<Customer | null>(null);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  // Active filter count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (kycFilter !== 'all') count++;
    if (tierFilter !== 'all') count++;
    if (loanStatusFilter !== 'all') count++;
    if (sortBy !== 'nameAsc') count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [kycFilter, tierFilter, loanStatusFilter, sortBy, searchQuery]);

  const resetAllFilters = () => {
    setKycFilter('all');
    setTierFilter('all');
    setLoanStatusFilter('all');
    setSortBy('nameAsc');
    setSearchQuery('');
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        c.name.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        c.id.toLowerCase().includes(q) ||
        (c.address && c.address.toLowerCase().includes(q));
      
      if (!matchesSearch) return false;

      // KYC
      if (kycFilter !== 'all' && c.kycStatus !== kycFilter) return false;

      // Tier
      if (tierFilter !== 'all') {
        const t = c.customerTier || 'Standard';
        if (t !== tierFilter) return false;
      }

      // Active Loans
      if (loanStatusFilter !== 'all') {
        const custMortgages = mortgages.filter(m => m.customerId === c.id);
        const hasActive = custMortgages.some(m => m.status === 'Active' || m.status === 'Due' || m.status === 'Overdue');
        if (loanStatusFilter === 'with_active_loans' && !hasActive) return false;
        if (loanStatusFilter === 'zero_active_loans' && hasActive) return false;
      }

      return true;
    }).sort((a, b) => {
      const aMortgages = mortgages.filter(m => m.customerId === a.id);
      const bMortgages = mortgages.filter(m => m.customerId === b.id);

      if (sortBy === 'nameAsc') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'highestLoan') {
        const aActiveSum = aMortgages.filter(m => m.status !== 'Closed').reduce((s, m) => s + m.outstandingPrincipal, 0);
        const bActiveSum = bMortgages.filter(m => m.status !== 'Closed').reduce((s, m) => s + m.outstandingPrincipal, 0);
        return bActiveSum - aActiveSum;
      }
      if (sortBy === 'mostPledges') {
        return bMortgages.length - aMortgages.length;
      }
      return 0;
    });
  }, [customers, mortgages, searchQuery, kycFilter, tierFilter, loanStatusFilter, sortBy]);

  const tierColors: Record<CustomerTier, string> = {
    'VIP Gold': 'bg-amber-500/20 text-amber-950 border-amber-400/60',
    'Regular Premium': 'bg-blue-500/15 text-blue-950 border-blue-400/40',
    'Standard': 'bg-slate-100 text-slate-700 border-slate-300',
    'New Borrower': 'bg-emerald-500/15 text-emerald-950 border-emerald-400/40',
    'New Customer': 'bg-emerald-500/15 text-emerald-950 border-emerald-400/40'
  };

  return (
    <div className="space-y-5 text-slate-800">
      
      {/* Sticky Header & Filter Controls: Static while customer list scrolls */}
      <div className="sticky top-0 z-20 space-y-2.5 bg-[#fbf9f5]/95 backdrop-blur-md pb-2 pt-1 -mt-1 shadow-2xs">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 liquid-glass-card p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-amber-200/70 shadow-xs">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>
                {language === 'ta' ? 'வாடிக்கையாளர் முதன்மை அடைவு' : 'Customer Master Directory'}
              </span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500">
              {language === 'ta'
                ? 'கடன் வாங்குபவர் விவரக்குறிப்புகள், KYC சரிபார்ப்பு நிலை மற்றும் அடகு வரலாறு.'
                : 'Internal borrower profiles, authorized KYC verification, customer relationship tiers, and custom loan presets.'}
            </p>
          </div>

          <button
            onClick={() => setIsNewCustomerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-300 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/25 transition self-start sm:self-auto border border-white/50"
          >
            <UserPlus className="w-4 h-4" />
            <span>{language === 'ta' ? '+ புதிய வாடிக்கையாளர்' : '+ Add Customer'}</span>
          </button>
        </div>

        {/* Search & Filter Controls Toolbar */}
        <div className="liquid-glass-card p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-amber-200/70 shadow-xs space-y-2.5">
          {/* Row 1: Search & KYC Quick Filter */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={language === 'ta' ? 'பெயர், தொலைபேசி, வாடிக்கையாளர் எண்...' : 'Search by name, mobile, customer ID...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 sm:py-2 bg-white/90 border border-amber-200/70 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 font-medium"
              />
            </div>

            <div className="flex items-center gap-1 self-start sm:self-auto text-xs overflow-x-auto max-w-full pb-0.5 no-scrollbar">
              <span className="text-slate-500 text-[10px] font-bold mr-1 shrink-0">
                {language === 'ta' ? 'KYC:' : 'KYC:'}
              </span>
              {(['all', 'Verified', 'Pending', 'Failed'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setKycFilter(f)}
                  className={`px-2.5 py-1 rounded-xl font-bold transition capitalize text-[11px] shrink-0 ${
                    kycFilter === f
                      ? 'liquid-glass-gold text-amber-950 border border-amber-400/70 shadow-xs'
                      : 'bg-white/70 text-slate-600 border border-amber-200/50 hover:bg-white'
                  }`}
                >
                  {f === 'all' ? (language === 'ta' ? 'அனைத்தும்' : 'All') : f}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Customer Tier, Loan Status & Sorting */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-100 text-xs">
            
            {/* Customer Tier */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-slate-500">
                {language === 'ta' ? 'வகை:' : 'Tier:'}
              </span>
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="px-2 py-1 bg-white border border-amber-200/80 rounded-xl text-[11px] text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400/30"
              >
                <option value="all">{language === 'ta' ? 'அனைத்து வகைகள்' : 'All Tiers'}</option>
                <option value="VIP Gold">VIP Gold</option>
                <option value="Regular Premium">Regular Premium</option>
                <option value="Standard">Standard</option>
                <option value="New Borrower">{language === 'ta' ? 'புதிய கடன்' : 'New Borrower'}</option>
              </select>
            </div>

            {/* Loan Status */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-slate-500">
                {language === 'ta' ? 'கடன்:' : 'Loans:'}
              </span>
              <select
                value={loanStatusFilter}
                onChange={(e) => setLoanStatusFilter(e.target.value)}
                className="px-2 py-1 bg-white border border-amber-200/80 rounded-xl text-[11px] text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400/30"
              >
                <option value="all">{language === 'ta' ? 'அனைத்தும்' : 'All'}</option>
                <option value="with_active_loans">{language === 'ta' ? 'செயலில் உள்ளவை' : 'Has Loans'}</option>
                <option value="zero_active_loans">{language === 'ta' ? 'கடன் இல்லை' : 'Zero Loans'}</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2 py-1 bg-white border border-amber-200/80 rounded-xl text-[11px] text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400/30"
              >
                <option value="nameAsc">{language === 'ta' ? 'பெயர் (A-Z)' : 'Name (A-Z)'}</option>
                <option value="highestLoan">{language === 'ta' ? 'அதிக நிலுவை' : 'Highest Loan'}</option>
                <option value="mostPledges">{language === 'ta' ? 'அதிக அடகு' : 'Most Pledges'}</option>
                <option value="newest">{language === 'ta' ? 'புதியவர்' : 'Newest'}</option>
              </select>
            </div>

            {/* Active Filter Counter & Clear */}
            {activeFiltersCount > 0 && (
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-950 font-black text-[9px] border border-amber-400/60">
                  {activeFiltersCount}
                </span>
                <button
                  onClick={resetAllFilters}
                  className="flex items-center gap-0.5 text-[10px] font-bold text-rose-600 hover:text-rose-700 hover:underline px-1.5 py-0.5 rounded-lg"
                >
                  <X className="w-2.5 h-2.5" />
                  <span>{language === 'ta' ? 'அழி' : 'Clear'}</span>
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Customer Grid: 2 Columns on Mobile, 3 Columns on Large Screens */}
      {filteredCustomers.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-white/70 border border-dashed border-amber-300 shadow-2xs">
          <Users className="w-12 h-12 text-amber-500/70 mx-auto mb-3" />
          <h3 className="font-extrabold text-slate-800 text-sm">
            {language === 'ta' ? 'வாடிக்கையாளர்கள் இன்னும் சேர்க்கப்படவில்லை' : 'No Customers Added Yet'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {language === 'ta' 
              ? 'முதல் வாடிக்கையாளரை பதிவு செய்ய மேலே உள்ள "+ புதியவர்" பொத்தானை அழுத்தவும்.' 
              : 'Click "+ New Customer" above to register your first borrower or pledger.'}
          </p>
        </div>
      ) : (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
        {filteredCustomers.map(cust => {
          const custMortgages = mortgages.filter(m => m.customerId === cust.id);
          const activeMortgages = custMortgages.filter(m => m.status === 'Active' || m.status === 'Due' || m.status === 'Overdue');
          const totalBorrowed = custMortgages.reduce((sum, m) => sum + m.principalAmount, 0);
          const outstanding = activeMortgages.reduce((sum, m) => sum + m.outstandingPrincipal, 0);

          return (
            <div
              key={cust.id}
              onClick={() => setSelectedCust(cust)}
              className="liquid-glass-card border border-amber-200/70 hover:border-amber-400 p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-xs cursor-pointer transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-1.5 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={cust.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                      alt=""
                      className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl object-cover border border-amber-200/80 shadow-xs shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-extrabold text-slate-900 text-xs sm:text-sm group-hover:text-amber-900 transition truncate">
                        {cust.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">{cust.id}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-0.5 mt-0.5 truncate">
                        <Phone className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                        <span className="truncate">{cust.mobile}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-0.5 shrink-0">
                    <span className={`px-1.5 py-0.2 rounded-full text-[8px] sm:text-[9px] font-bold border ${tierColors[cust.customerTier || 'Standard']}`}>
                      {cust.customerTier === 'VIP Gold' ? 'VIP' : cust.customerTier || 'Std'}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[8px] sm:text-[9px] font-bold border ${
                      cust.kycStatus === 'Verified' 
                        ? 'bg-emerald-500/15 text-emerald-800 border-emerald-300'
                        : cust.kycStatus === 'Pending'
                        ? 'bg-amber-500/15 text-amber-800 border-amber-300'
                        : 'bg-rose-500/15 text-rose-800 border-rose-300'
                    }`}>
                      {cust.kycStatus === 'Verified' ? (
                        cust.kycRecord?.nameMatchScore !== undefined
                          ? `Aadhaar ✓ ${cust.kycRecord.nameMatchScore}%`
                          : 'Aadhaar ✓'
                      ) : cust.kycStatus}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] sm:text-xs text-slate-500 flex items-start gap-1 mb-2 line-clamp-1">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                  <span className="truncate">{cust.city || cust.address}</span>
                </div>

                {/* Financial Summary Snippet */}
                <div className="p-2 bg-white/80 rounded-xl sm:rounded-2xl border border-amber-200/60 grid grid-cols-2 gap-1 text-[10px] sm:text-xs shadow-2xs">
                  <div>
                    <span className="text-[8px] sm:text-[9px] text-slate-400 uppercase font-bold block truncate">Outstanding</span>
                    <span className="font-mono font-black text-amber-950 text-[11px] sm:text-xs truncate block">{formatCurrency(outstanding)}</span>
                  </div>
                  <div>
                    <span className="text-[8px] sm:text-[9px] text-slate-400 uppercase font-bold block truncate">Pledges</span>
                    <span className="font-mono font-bold text-slate-800 text-[11px] sm:text-xs">{activeMortgages.length}</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-amber-100 text-xs">
                {cust.kycStatus !== 'Verified' ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCustomerToKyc(cust);
                    }}
                    className="text-purple-700 hover:text-purple-900 font-bold flex items-center gap-0.5 text-[10px] sm:text-xs"
                  >
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verify Aadhaar</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCustomerToKyc(cust);
                    }}
                    className="text-[10px] text-emerald-800 hover:text-emerald-950 flex items-center gap-0.5 font-bold"
                  >
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                    <span className="truncate">{cust.kycRecord?.provider || 'UIDAI Synced'}</span>
                  </button>
                )}

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPortalCustomerId(cust.id);
                      setIsCustomerPortalOpen(true);
                    }}
                    title="Open Customer Web Passbook & Check-in QR"
                    className="p-1 px-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-950 font-bold text-[9px] sm:text-[10px] flex items-center gap-0.5 border border-amber-300 transition"
                  >
                    <QrCode className="w-2.5 h-2.5 text-amber-800" />
                    <span className="hidden xs:inline">QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCust(cust);
                    }}
                    className="text-slate-500 group-hover:text-amber-900 font-bold flex items-center text-[10px] sm:text-xs transition"
                  >
                    <span>View</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>
      )}

      {/* Customer Detail Drawer / Profile Modal */}
      {selectedCust && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="liquid-glass-modal border border-amber-200/70 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-amber-500/15 via-white/50 to-yellow-500/10 border-b border-amber-200/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={selectedCust.photoUrl}
                  alt=""
                  className="w-12 h-12 rounded-2xl object-cover border border-amber-300 shadow-xs"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-900 text-base">{selectedCust.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${tierColors[selectedCust.customerTier || 'Standard']}`}>
                      {selectedCust.customerTier || 'Standard'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    ID: {selectedCust.id} • Registered {formatDate(selectedCust.createdAt)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPortalCustomerId(selectedCust.id);
                    setIsCustomerPortalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-400/20 hover:from-amber-500/30 hover:to-yellow-400/30 text-amber-950 rounded-xl text-xs font-bold flex items-center gap-1 border border-amber-300 shadow-xs transition"
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-800" />
                  <span>Customer QR Passbook</span>
                </button>

                <button
                  onClick={() => {
                    setCustomerToEdit(selectedCust);
                    setSelectedCust(null);
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 border border-slate-200 shadow-xs transition"
                >
                  <FileEdit className="w-3.5 h-3.5 text-amber-700" />
                  <span>Edit Profile</span>
                </button>
                <button
                  onClick={() => setSelectedCust(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white transition"
                >
                  ✕
                </button>

              </div>
            </div>

            {/* Profile Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              
              {/* Financial Summary */}
              {(() => {
                const hist = mortgages.filter(m => m.customerId === selectedCust.id);
                const active = hist.filter(m => m.status === 'Active' || m.status === 'Due' || m.status === 'Overdue');
                const outPrincipal = active.reduce((s, m) => s + m.outstandingPrincipal, 0);
                const totBorrowed = hist.reduce((s, m) => s + m.principalAmount, 0);

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-white/80 rounded-2xl border border-amber-200/70 text-center shadow-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Outstanding Principal</span>
                      <div className="text-base font-black text-amber-700 font-mono">{formatCurrency(outPrincipal)}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Lifetime Borrowed</span>
                      <div className="text-base font-black text-slate-800 font-mono">{formatCurrency(totBorrowed)}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Active Pledges</span>
                      <div className="text-base font-black text-slate-800 font-mono">{active.length}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Settled / Closed</span>
                      <div className="text-base font-black text-emerald-600 font-mono">{hist.filter(m => m.status === 'Closed').length}</div>
                    </div>
                  </div>
                );
              })()}

              {/* Personal & Nominee Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-white/75 rounded-2xl border border-amber-200/60 space-y-1.5 shadow-xs">
                  <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>Contact & Residential Address</span>
                  </div>
                  <div className="text-slate-600">Mobile: <strong className="text-slate-800 font-mono">{selectedCust.mobile}</strong></div>
                  <div className="text-slate-600">Address: <strong className="text-slate-800">{selectedCust.address}, {selectedCust.city} - {selectedCust.pincode}</strong></div>
                  <div className="text-slate-600">Occupation: <strong className="text-slate-800">{selectedCust.occupation}</strong></div>
                  <div className="text-slate-600">Broker Valuation Adj: <strong className="text-amber-700 font-bold">{selectedCust.preferredBrokerRateAdjustment ?? 85}% of GoodReturns Spot</strong></div>
                </div>

                <div className="p-3.5 bg-white/75 rounded-2xl border border-amber-200/60 space-y-1.5 shadow-xs">
                  <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Nominee & KYC Status</span>
                  </div>
                  <div className="text-slate-600">Nominee: <strong className="text-slate-800">{selectedCust.nomineeName} ({selectedCust.nomineeRelation})</strong></div>
                  <div className="text-slate-600">Nominee Phone: <strong className="text-slate-800 font-mono">{selectedCust.nomineePhone || '-'}</strong></div>
                  <div className="text-slate-600 flex items-center justify-between pt-1">
                    <span>KYC Compliance:</span>
                    <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {selectedCust.kycStatus} ({selectedCust.kycRecord?.provider || 'Pending'})
                    </span>
                  </div>

                  {selectedCust.kycRecord && (
                    <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Aadhaar ID:</span>
                        <strong className="font-mono text-slate-800">{selectedCust.kycRecord.maskedId}</strong>
                      </div>
                      {selectedCust.kycRecord.nameMatchScore !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Name Match:</span>
                          <strong className="text-blue-700">{selectedCust.kycRecord.nameMatchScore}% ({selectedCust.kycRecord.nameMatchStatus || 'EXACT'})</strong>
                        </div>
                      )}
                      {selectedCust.kycRecord.aadhaarLegalName && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">UIDAI Name:</span>
                          <strong className="text-emerald-800">{selectedCust.kycRecord.aadhaarLegalName}</strong>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setCustomerToKyc(selectedCust)}
                    className="w-full mt-2 py-1.5 bg-amber-50 hover:bg-amber-100/70 border border-amber-300 rounded-xl text-xs font-bold text-amber-900 transition flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                    <span>{selectedCust.kycStatus === 'Verified' ? 'Re-Verify / UIDAI Sync' : 'Verify UIDAI Aadhaar'}</span>
                  </button>
                </div>
              </div>

              {/* Mortgage History (Section 7) */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <History className="w-4 h-4 text-amber-600" />
                  <span>Customer Pledge & Mortgage History</span>
                </h4>

                <div className="border border-amber-200/70 rounded-2xl overflow-hidden shadow-xs bg-white/80">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-amber-500/10 text-slate-700 uppercase text-[10px] tracking-wider font-extrabold border-b border-amber-200/60">
                      <tr>
                        <th className="py-2.5 px-3">Mortgage No</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Principal</th>
                        <th className="py-2.5 px-3">Rate</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Packet</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100">
                      {mortgages.filter(m => m.customerId === selectedCust.id).map(m => (
                        <tr key={m.id} className="hover:bg-amber-50/50 transition">
                          <td className="py-2.5 px-3 font-mono font-black text-amber-700">{m.mortgageNumber}</td>
                          <td className="py-2.5 px-3">{formatDate(m.mortgageDate)}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{formatCurrency(m.principalAmount)}</td>
                          <td className="py-2.5 px-3">{m.interestRate}% ({m.interestType})</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-950 border border-amber-300/50">
                              {m.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{m.packetId}</td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedMortgage(m);
                                setSelectedCust(null);
                              }}
                              className="px-2.5 py-1 liquid-glass-gold text-amber-950 border border-amber-300 rounded-lg text-[11px] font-bold hover:bg-amber-400/30 transition shadow-2xs"
                            >
                              Open Pledge
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            <div className="p-4 bg-gradient-to-r from-amber-500/10 via-white/80 to-yellow-500/10 border-t border-amber-200/60 flex justify-end">
              <button
                onClick={() => setSelectedCust(null)}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-xs transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* KYC Modal */}
      {customerToKyc && (
        <KycVerificationModal
          customer={customerToKyc}
          onClose={() => setCustomerToKyc(null)}
        />
      )}

      {/* Customer Form Modal (Edit) */}
      {customerToEdit && (
        <CustomerFormModal
          customerToEdit={customerToEdit}
          onClose={() => setCustomerToEdit(null)}
        />
      )}

    </div>
  );
};
