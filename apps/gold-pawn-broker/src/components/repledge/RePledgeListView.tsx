import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { RePledge, RePledgeCustodyStatus } from '../../types';
import { formatCurrency, formatWeight, formatDate } from '../../utils/formatters';
import { 
  Building2, Landmark, Search, Filter, Plus, 
  AlertTriangle, CheckCircle2, Clock, ArrowRight, 
  ArrowDownToLine, Gem, ShieldAlert, Sparkles, 
  TrendingUp, Wallet, ShieldCheck, ExternalLink, Trash2
} from 'lucide-react';
import { NewRePledgeModal } from './NewRePledgeModal';
import { BankRetrievalModal } from './BankRetrievalModal';

export const RePledgeListView: React.FC = () => {
  const { 
    rePledges, 
    mortgages, 
    currentBranch, 
    setSelectedMortgage, 
    setActiveTab, 
    deleteRePledge, 
    language 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [destinationFilter, setDestinationFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [retrievalTarget, setRetrievalTarget] = useState<RePledge | null>(null);

  // Branch filtered repledges
  const branchRePledges = useMemo(() => {
    return rePledges.filter(rp => rp.branchId === currentBranch.id);
  }, [rePledges, currentBranch.id]);

  // Aggregate Metrics
  const activeRePledges = branchRePledges.filter(rp => rp.custodyStatus === 'Re-Pledged' || rp.custodyStatus === 'Release Requested');
  
  const totalGoldAtBanks = activeRePledges.reduce((sum, rp) => sum + rp.appraisedNetWeight, 0);
  const totalLiquidityFromBanks = activeRePledges.reduce((sum, rp) => sum + rp.bankReceivedAmount, 0);
  const totalRetailPrincipalLent = activeRePledges.reduce((sum, rp) => sum + rp.retailLoanAmount, 0);
  const totalLiquiditySurplus = totalLiquidityFromBanks - totalRetailPrincipalLent;

  // Monthly Spread Profit
  const totalMonthlySpreadProfit = activeRePledges.reduce((sum, rp) => {
    const profit = (rp.retailLoanAmount * (rp.netSpreadMargin / 100)) / 12;
    return sum + (profit > 0 ? profit : 0);
  }, 0);

  // Redemption Safety Alerts: Customer requested release but gold is still at bank!
  const redemptionAlerts = branchRePledges.filter(rp => rp.custodyStatus === 'Release Requested');

  // Upcoming bank maturities (due in next 30 days)
  const now = new Date();
  const thirtyDaysAhead = new Date();
  thirtyDaysAhead.setDate(now.getDate() + 30);

  const upcomingMaturities = activeRePledges.filter(rp => {
    const due = new Date(rp.bankDueDate);
    return due >= now && due <= thirtyDaysAhead;
  });

  // Filter & Search Logic
  const filteredRePledges = useMemo(() => {
    return branchRePledges.filter(rp => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        rp.mortgageNumber.toLowerCase().includes(q) ||
        rp.customerName.toLowerCase().includes(q) ||
        rp.customerMobile.includes(q) ||
        rp.institutionName.toLowerCase().includes(q) ||
        rp.bankLoanNumber.toLowerCase().includes(q) ||
        (rp.accountHolderName && rp.accountHolderName.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'alerts' && rp.custodyStatus === 'Release Requested') ||
        rp.custodyStatus === statusFilter;

      const matchesDest = destinationFilter === 'all' || rp.destinationType === destinationFilter;

      return matchesSearch && matchesStatus && matchesDest;
    }).sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'dueDate') return new Date(a.bankDueDate).getTime() - new Date(b.bankDueDate).getTime();
      if (sortBy === 'amount') return b.bankReceivedAmount - a.bankReceivedAmount;
      if (sortBy === 'spread') return b.netSpreadMargin - a.netSpreadMargin;
      return 0;
    });
  }, [branchRePledges, searchQuery, statusFilter, destinationFilter, sortBy]);

  const handleOpenMortgage = (mortgageId: string) => {
    const m = mortgages.find(item => item.id === mortgageId);
    if (m) {
      setSelectedMortgage(m);
      setActiveTab('mortgages_active');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-amber-200/80 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-md shadow-amber-600/20">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {language === 'ta' ? 'மறு அடமானம் & வங்கி பெட்டகம்' : 'Re-Pledge & Bank Vault Treasury'}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold">
                {language === 'ta' ? 'மறு அடமானம்' : 'SUB-PLEDGE'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {language === 'ta'
                ? 'வங்கிகளில் மறு அடமானம் வைக்கப்பட்ட நகைகள், வட்டி இடைவெளி லாபம் & மீட்பு எச்சரிக்கைகள்'
                : 'Track ornaments forwarded to external banks, interest spread arbitrage & customer release alerts'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-md shadow-amber-500/25 transition active:scale-98 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{language === 'ta' ? '+ புதிய மறு அடமானம்' : '+ New Bank Re-Pledge'}</span>
        </button>
      </div>

      {/* Critical Safety Alert Banner (If any customer requested release for re-pledged gold) */}
      {redemptionAlerts.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-rose-50 border-2 border-rose-400 shadow-md shadow-rose-500/10 space-y-3">
          <div className="flex items-center gap-2.5 text-rose-900">
            <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 animate-bounce" />
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider">
                {language === 'ta' ? '🚨 வாடிக்கையாளர் நகை மீட்பு எச்சரிக்கை (கடை நடவடிக்கை தேவை)' : '🚨 Customer Redemption Safety Alert (Broker Action Required)'}
              </h3>
              <p className="text-xs text-rose-800 font-medium mt-0.5">
                {redemptionAlerts.length} customer(s) have requested loan closure & jewel release, but the ornaments are currently held at an external bank! Retrieve them before customer arrives.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {redemptionAlerts.map(alert => (
              <div key={alert.id} className="p-3 rounded-2xl bg-white border border-rose-300 shadow-2xs flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-black text-slate-900">{alert.mortgageNumber} • {alert.customerName}</div>
                  <div className="text-rose-700 font-bold mt-0.5">
                    At: {alert.institutionName} (#{alert.bankLoanNumber})
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Pickup Scheduled: <strong>{formatDate(alert.scheduledPickupDate || '')}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRetrievalTarget(alert)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer shrink-0"
                >
                  Retrieve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top 5 KPI Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* Metric 1: Gold at Banks */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-amber-700 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Gold at Banks</span>
            <Gem className="w-4 h-4" />
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-slate-900">
            {formatWeight(totalGoldAtBanks)}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            {activeRePledges.length} re-pledged packets
          </span>
        </div>

        {/* Metric 2: Bank Liquidity Received */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-700 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Bank Cash Raised</span>
            <Wallet className="w-4 h-4" />
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-emerald-950">
            {formatCurrency(totalLiquidityFromBanks)}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            Active credit line balance
          </span>
        </div>

        {/* Metric 3: Liquidity Surplus */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-teal-700 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Liquidity Surplus</span>
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-teal-950">
            {totalLiquiditySurplus >= 0 ? `+ ${formatCurrency(totalLiquiditySurplus)}` : formatCurrency(totalLiquiditySurplus)}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            Bank cash minus retail lent
          </span>
        </div>

        {/* Metric 4: Monthly Interest Spread Profit */}
        <div className="p-4 rounded-3xl bg-white border border-emerald-300 shadow-2xs bg-gradient-to-br from-emerald-50/50 to-teal-50/50">
          <div className="flex items-center justify-between text-emerald-700 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Spread Profit</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-emerald-950">
            {formatCurrency(totalMonthlySpreadProfit)}
            <span className="text-xs font-normal text-emerald-800">/mo</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-bold">
            Pure interest arbitrage
          </span>
        </div>

        {/* Metric 5: Upcoming Bank Maturities */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-amber-700 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Due in 30 Days</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-amber-950">
            {upcomingMaturities.length} loans
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            Prevent bank auction notices
          </span>
        </div>

      </div>

      {/* Filter and Search Hub */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={language === 'ta' ? 'கடன் எண், வாடிக்கையாளர், வங்கி பெயர் மூலம் தேடு...' : 'Search by loan #, customer, bank name, account #...'}
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:border-amber-500 outline-hidden transition"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={destinationFilter}
              onChange={e => setDestinationFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white outline-hidden cursor-pointer"
            >
              <option value="all">All Financiers</option>
              <option value="Bank">Banks Only</option>
              <option value="NBFC">NBFCs</option>
              <option value="Wholesale Broker">Wholesale Brokers</option>
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white outline-hidden cursor-pointer"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="dueDate">Sort: Bank Due Date</option>
              <option value="amount">Sort: Received Amount</option>
              <option value="spread">Sort: Spread Margin %</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          {[
            { id: 'all', label: language === 'ta' ? 'அனைத்தும்' : 'All Re-Pledges', count: branchRePledges.length },
            { id: 'Re-Pledged', label: language === 'ta' ? 'வங்கியில் உள்ளது' : 'In External Bank', count: branchRePledges.filter(r => r.custodyStatus === 'Re-Pledged').length },
            { id: 'alerts', label: language === 'ta' ? '🚨 மீட்பு எச்சரிக்கைகள்' : '🚨 Redemption Alerts', count: redemptionAlerts.length, isAlert: true },
            { id: 'Back in Vault', label: language === 'ta' ? 'கடை பெட்டகத்தில் திரும்பியது' : 'Back in Shop Vault', count: branchRePledges.filter(r => r.custodyStatus === 'Back in Vault').length },
            { id: 'Closed', label: language === 'ta' ? 'முடிக்கப்பட்டது' : 'Closed', count: branchRePledges.filter(r => r.custodyStatus === 'Closed').length }
          ].map(tab => {
            const isSelected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? (tab.isAlert ? 'bg-rose-600 text-white shadow-xs' : 'bg-slate-900 text-white shadow-xs')
                    : (tab.isAlert && tab.count > 0 
                        ? 'bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Table / Card List */}
      {filteredRePledges.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
            <Building2 className="w-8 h-8" />
          </div>
          <h3 className="font-black text-base text-slate-900">
            {language === 'ta' ? 'மறு அடமான பதிவுகள் எதுவும் இல்லை' : 'No Re-Pledges Found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {language === 'ta'
              ? 'உங்கள் கடையில் உள்ள தங்க நகைகளை வங்கிகளில் மறு அடமானம் வைத்து கூடுதல் பணப்புழக்கம் மற்றும் வட்டி இடைவெளி லாபம் பெறுங்கள்.'
              : 'Move pledged gold ornaments from your safe vault to nationalized banks or wholesale financiers to earn interest spread.'}
          </p>
          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition cursor-pointer"
          >
            + Create First Bank Re-Pledge
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredRePledges.map(rp => {
            const isDueSoon = new Date(rp.bankDueDate) <= thirtyDaysAhead && rp.custodyStatus === 'Re-Pledged';
            const isAlert = rp.custodyStatus === 'Release Requested';

            return (
              <div
                key={rp.id}
                className={`bg-white rounded-3xl border p-5 sm:p-6 transition shadow-2xs hover:shadow-md ${
                  isAlert 
                    ? 'border-2 border-rose-400 bg-rose-50/20' 
                    : isDueSoon 
                      ? 'border-amber-300' 
                      : 'border-slate-200/90 hover:border-amber-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Left Column: Loan & Customer & Bank Destination */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleOpenMortgage(rp.mortgageId)}
                        className="font-mono text-sm font-black text-amber-900 hover:underline flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{rp.mortgageNumber}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
                      </button>

                      {/* Custody Badge */}
                      {rp.custodyStatus === 'Re-Pledged' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300 text-[10px] font-black flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          <span>At External Bank</span>
                        </span>
                      )}
                      {rp.custodyStatus === 'Release Requested' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          <span>Customer Requested Release!</span>
                        </span>
                      )}
                      {rp.custodyStatus === 'Back in Vault' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Back in Shop Vault</span>
                        </span>
                      )}
                      {rp.custodyStatus === 'Closed' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black">
                          Closed
                        </span>
                      )}

                      {/* Destination Type Chip */}
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {rp.destinationType}
                      </span>
                    </div>

                    {/* Customer & Bank Names */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Customer:</span>
                        <span className="font-extrabold text-slate-900">{rp.customerName} ({rp.customerMobile})</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Pledged At Bank / Financier:</span>
                        <span className="font-extrabold text-slate-900 flex items-center gap-1">
                          <Landmark className="w-3.5 h-3.5 text-slate-500" />
                          <span>{rp.institutionName}</span>
                          <span className="font-mono text-amber-800">(#{rp.bankLoanNumber})</span>
                        </span>
                      </div>
                    </div>

                    {/* Weight & Packet Details */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <span>Net Weight: <strong className="text-amber-950 font-mono">{formatWeight(rp.appraisedNetWeight)}</strong></span>
                      <span>•</span>
                      <span>Moved: <strong className="text-slate-700">{formatDate(rp.dateMoved)}</strong></span>
                      <span>•</span>
                      <span>
                        Bank Due Date: <strong className={`font-mono ${isDueSoon ? 'text-rose-700 font-black' : 'text-slate-700'}`}>{formatDate(rp.bankDueDate)}</strong>
                      </span>
                      {rp.bankPacketReference && (
                        <>
                          <span>•</span>
                          <span>Bank Tag: <strong className="text-slate-800">{rp.bankPacketReference}</strong></span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Middle Column: Financial Arbitrage & Spread */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50/70 via-teal-50/70 to-slate-50 border border-emerald-200/80 flex flex-wrap sm:flex-nowrap items-center gap-4 text-xs shrink-0">
                    <div>
                      <span className="text-[9.5px] uppercase font-bold text-slate-500 block">Bank Received</span>
                      <div className="text-sm font-black font-mono text-emerald-950">
                        {formatCurrency(rp.bankReceivedAmount)}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        @ {rp.bankInterestRate}% p.a.
                      </span>
                    </div>

                    <div className="border-l border-slate-200 pl-3">
                      <span className="text-[9.5px] uppercase font-bold text-slate-500 block">Retail Lent</span>
                      <div className="text-sm font-black font-mono text-slate-900">
                        {formatCurrency(rp.retailLoanAmount)}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        @ {rp.customerInterestRate}% p.a.
                      </span>
                    </div>

                    <div className="border-l border-emerald-300 pl-3">
                      <span className="text-[9.5px] uppercase font-bold text-emerald-800 block">Interest Spread</span>
                      <div className="text-sm font-black font-mono text-emerald-900">
                        +{rp.netSpreadMargin}%
                      </div>
                      <span className="text-[10px] text-emerald-700 font-bold">
                        +{formatCurrency(Math.round((rp.retailLoanAmount * (rp.netSpreadMargin / 100)) / 12))}/mo
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Action Buttons */}
                  <div className="flex sm:flex-col items-center justify-end gap-2 shrink-0">
                    {(rp.custodyStatus === 'Re-Pledged' || rp.custodyStatus === 'Release Requested') && (
                      <button
                        type="button"
                        onClick={() => setRetrievalTarget(rp)}
                        className={`w-full px-4 py-2 rounded-xl text-xs font-black shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          isAlert 
                            ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse' 
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        <ArrowDownToLine className="w-3.5 h-3.5" />
                        <span>Retrieve Gold</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenMortgage(rp.mortgageId)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Gem className="w-3 h-3 text-amber-600" />
                      <span>View Pledge</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Remove this re-pledge record for ${rp.mortgageNumber}?`)) {
                          deleteRePledge(rp.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>

                {/* Sub-card: If Customer Requested Release */}
                {rp.releaseRequestedAt && rp.custodyStatus !== 'Closed' && (
                  <div className="mt-3 p-3 rounded-2xl bg-amber-100/70 border border-amber-300/80 flex items-center justify-between text-xs text-amber-950">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-700" />
                      <span>
                        Customer requested collection for: <strong>{formatDate(rp.scheduledPickupDate || '')}</strong>
                        {rp.releaseRequestedBy && ` (via ${rp.releaseRequestedBy})`}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md">
                      Requires Bank Clearance
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: New Re-Pledge */}
      <NewRePledgeModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
      />

      {/* Modal: Bank Retrieval */}
      <BankRetrievalModal
        isOpen={!!retrievalTarget}
        onClose={() => setRetrievalTarget(null)}
        rePledge={retrievalTarget}
      />

    </div>
  );
};
