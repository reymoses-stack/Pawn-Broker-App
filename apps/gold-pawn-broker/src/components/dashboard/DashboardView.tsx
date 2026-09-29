import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatWeight, formatDate, getRelativeDays } from '../../utils/formatters';
import { 
  TrendingUp, Users, Gem, Wallet, AlertTriangle, 
  Clock, ArrowUpRight, ArrowDownRight, Sparkles, 
  Receipt, Plus, ShieldAlert, CheckCircle2, ChevronRight,
  Globe, RefreshCw, SlidersHorizontal, Search, Lock,
  Phone, ArrowRight, UserPlus, FileCheck, KeyRound,
  QrCode, Smartphone, MessageCircle
} from 'lucide-react';
import { openWhatsApp, buildReminderMessage } from '../../utils/whatsappService';

export const DashboardView: React.FC = () => {
  const { 
    mortgages, 
    customers, 
    payments, 
    expenses, 
    currentBranch, 
    settings,
    getCashBalance, 
    getBankBalance,
    setIsNewMortgageOpen,
    setIsNewCustomerOpen,
    setIsPaymentModalOpen,
    setIsExpenseModalOpen,
    setSelectedMortgage,
    setSelectedCustomer,
    setActiveTab,
    packets,
    goodReturnsRates,
    setIsGoodReturnsModalOpen,
    refreshGoodReturnsRates,
    setIsCustomerPortalOpen,
    setPortalCustomerId,
    setIsDrawerModalOpen,
    setDrawerModalInitialTab,
    language,
    t
  } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];

  // Branch filtering
  const branchMortgages = mortgages.filter(m => m.branchId === currentBranch.id);
  const activeMortgages = branchMortgages.filter(m => m.status === 'Active' || m.status === 'Due' || m.status === 'Overdue');
  
  // Section 5 Metrics
  const activePrincipalOutstanding = activeMortgages.reduce((sum, m) => sum + m.outstandingPrincipal, 0);
  const activeInterestOutstanding = activeMortgages.reduce((sum, m) => sum + (m.outstandingInterest || 0), 0);

  // Today's disbursements
  const todayDisbursements = branchMortgages
    .filter(m => m.mortgageDate === todayStr)
    .reduce((sum, m) => sum + m.principalAmount, 0);

  // Today's collections
  const todayPayments = payments.filter(p => p.branchId === currentBranch.id && p.paymentDate.startsWith(todayStr) && p.status === 'Completed');
  const todayPrincipalCollection = todayPayments.reduce((sum, p) => sum + p.allocatedPrincipal, 0);
  const todayInterestCollection = todayPayments.reduce((sum, p) => sum + p.allocatedInterest, 0);

  // Today's expenses
  const todayExpenses = expenses
    .filter(e => e.branchId === currentBranch.id && e.date === todayStr)
    .reduce((sum, e) => sum + e.amount, 0);

  // Gold Pledged Metrics
  const branchPackets = packets.filter(p => p.branchId === currentBranch.id && p.status === 'In Locker');
  const totalNetPledgedGold = branchPackets.reduce((sum, p) => sum + p.totalNetWeight, 0);
  const totalGrossPledgedGold = branchPackets.reduce((sum, p) => sum + p.totalGrossWeight, 0);

  // Due & Overdue buckets
  const dueTodayList = activeMortgages.filter(m => m.maturityDate === todayStr);
  const overdueList = activeMortgages.filter(m => {
    const days = getRelativeDays(m.maturityDate);
    return days.isPast;
  });
  const overduePrincipal = overdueList.reduce((sum, m) => sum + m.outstandingPrincipal, 0);

  const dueWithin7Days = activeMortgages.filter(m => {
    const d = getRelativeDays(m.maturityDate);
    return !d.isPast && d.days <= 7;
  });
  const dueTodayPrincipal = dueTodayList.reduce((sum, m) => sum + m.outstandingPrincipal, 0);
  const dueWithin7DaysPrincipal = dueWithin7Days.reduce((sum, m) => sum + m.outstandingPrincipal, 0);

  // KPIs
  const cashBal = getCashBalance();
  const bankBal = getBankBalance();
  const netOperatingResult = todayInterestCollection - todayExpenses;
  const avgLoan = activeMortgages.length > 0 ? activePrincipalOutstanding / activeMortgages.length : 0;

  // Mobile priority accounts tab switcher
  const [mobilePriorityTab, setMobilePriorityTab] = useState<'overdue' | 'dueToday' | 'next7Days'>(
    overdueList.length > 0 ? 'overdue' : dueTodayList.length > 0 ? 'dueToday' : 'next7Days'
  );

  const handleSendReminderWhatsApp = (m: any) => {
    const cust = customers.find(c => c.id === m.customerId);
    if (!cust?.mobile) {
      alert(language === 'ta' ? 'வாடிக்கையாளரின் மொபைல் எண் இல்லை.' : 'Customer mobile number is missing.');
      return;
    }
    const msg = buildReminderMessage({
      mortgage: m,
      customer: cust,
      branch: currentBranch,
      settings,
      language
    });
    openWhatsApp(cust.mobile, msg);
  };

  return (
    <div className="space-y-3 sm:space-y-6 pb-8 sm:pb-12 text-slate-800">
      
      {/* 1. TOP HERO DASHBOARD ACTION HUB */}
      <div>
        <div className="flex items-center justify-between mb-2 sm:mb-3 px-1">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
              {language === 'ta' ? 'முகப்புப்பலகை' : 'Dashboard'}
            </h2>
          </div>
          <span className="text-[11px] sm:text-xs text-slate-500 font-medium truncate max-w-[150px] sm:max-w-none text-right">
            {language === 'ta' ? 'கிளை: ' : 'Branch: '}
            <strong className="text-slate-800">{currentBranch.name}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3.5">
          
          {/* Card 1: New Gold Pledge */}
          <div 
            onClick={() => setIsNewMortgageOpen(true)}
            className="group cursor-pointer p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-white border border-amber-300/80 hover:border-amber-400 hover:shadow-md transition-all active:scale-[0.98] relative overflow-hidden flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-bold shadow-sm shadow-amber-500/30 group-hover:scale-105 transition">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="mt-2 sm:mt-3">
              <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm group-hover:text-amber-900 transition flex items-center gap-1">
                <span className="truncate">{language === 'ta' ? '+ புதிய அடமானம்' : '+ New Pledge'}</span>
                <ArrowRight className="w-3 h-3 text-amber-600 shrink-0 group-hover:translate-x-0.5 transition-transform hidden sm:block" />
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 line-clamp-1 sm:line-clamp-none">
                {language === 'ta' ? 'நகை எடை, விலை & ரசீது' : 'Appraise gold & receipt'}
              </p>
            </div>
          </div>

          {/* Card 2: Receive Payment */}
          <div 
            onClick={() => setIsPaymentModalOpen(true)}
            className="group cursor-pointer p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-400/5 to-white border border-emerald-300/80 hover:border-emerald-400 hover:shadow-md transition-all active:scale-[0.98] relative overflow-hidden flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm shadow-emerald-600/30 group-hover:scale-105 transition">
                <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-mono font-bold text-emerald-900 bg-emerald-100/80 px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-200">
                {language === 'ta' ? 'ரொக்கம்' : 'Cash/UPI'}
              </span>
            </div>
            <div className="mt-2 sm:mt-3">
              <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm group-hover:text-emerald-900 transition flex items-center gap-1">
                <span className="truncate">{language === 'ta' ? '₹ வட்டி வசூல்' : '₹ Collect Cash'}</span>
                <ArrowRight className="w-3 h-3 text-emerald-600 shrink-0 group-hover:translate-x-0.5 transition-transform hidden sm:block" />
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 line-clamp-1 sm:line-clamp-none">
                {language === 'ta' ? 'வட்டி & அசல் வரவு' : 'Vaddi & Asal settlement'}
              </p>
            </div>
          </div>

          {/* Card 3: Fast Customer Lookup */}
          <div 
            onClick={() => setActiveTab('customers')}
            className="group cursor-pointer p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500/10 via-blue-400/5 to-white border border-blue-300/80 hover:border-blue-400 hover:shadow-md transition-all active:scale-[0.98] relative overflow-hidden flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm shadow-blue-600/30 group-hover:scale-105 transition">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-mono font-bold text-blue-900 bg-blue-100/80 px-1.5 sm:px-2 py-0.5 rounded-full border border-blue-200">
                {customers.length}
              </span>
            </div>
            <div className="mt-2 sm:mt-3">
              <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm group-hover:text-blue-900 transition flex items-center gap-1">
                <span className="truncate">{language === 'ta' ? 'வாடிக்கையாளர்' : 'Customers'}</span>
                <ArrowRight className="w-3 h-3 text-blue-600 shrink-0 group-hover:translate-x-0.5 transition-transform hidden sm:block" />
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 line-clamp-1 sm:line-clamp-none">
                {language === 'ta' ? 'போன் எண் & KYC' : 'Phone, Aadhaar & KYC'}
              </p>
            </div>
          </div>

          {/* Card 4: Vault & Gold Custody */}
          <div 
            onClick={() => setActiveTab('gold_inventory')}
            className="group cursor-pointer p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-white border border-purple-300/80 hover:border-purple-400 hover:shadow-md transition-all active:scale-[0.98] relative overflow-hidden flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-sm shadow-purple-600/30 group-hover:scale-105 transition">
                <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-mono font-bold text-purple-900 bg-purple-100/80 px-1.5 sm:px-2 py-0.5 rounded-full border border-purple-200">
                {branchPackets.length} {language === 'ta' ? 'பாக்கெட்' : 'pkts'}
              </span>
            </div>
            <div className="mt-2 sm:mt-3">
              <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm group-hover:text-purple-900 transition flex items-center gap-1">
                <span className="truncate">{language === 'ta' ? 'பெட்டகம்' : 'Safe Vault'}</span>
                <ArrowRight className="w-3 h-3 text-purple-600 shrink-0 group-hover:translate-x-0.5 transition-transform hidden sm:block" />
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 line-clamp-1 sm:line-clamp-none">
                {language === 'ta' ? 'லாக்கர் & நகை இருப்பு' : 'Locker audit & custody'}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* 2. PRIMARY OPERATIONAL KPIS (FITS CLEANLY INTO 2X2 ROWS ON MOBILE) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3.5">
        
        {/* KPI 1: Active Loan Portfolio */}
        <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
                {language === 'ta' ? 'நடப்பு கடன் (Asal)' : 'Active Loan Book'}
              </span>
              <div className="p-1 sm:p-1.5 bg-amber-500/15 text-amber-800 rounded-lg sm:rounded-xl shrink-0">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-base sm:text-2xl font-black text-slate-900 font-mono tracking-tight truncate">
              {formatCurrency(activePrincipalOutstanding)}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-1.5 sm:mt-2.5 text-[9px] sm:text-[11px] text-slate-500 pt-1.5 sm:pt-2 border-t border-slate-100 gap-0.5 sm:gap-0">
            <span>{language === 'ta' ? 'அடமானம்: ' : 'Pledges: '}<strong className="text-slate-800 font-bold">{activeMortgages.length}</strong></span>
            <span className="hidden sm:inline">{language === 'ta' ? 'சராசரி: ' : 'Avg: '}<strong className="text-slate-800 font-bold">{formatCurrency(avgLoan)}</strong></span>
          </div>
        </div>

        {/* KPI 2: Gold Collateral in Vault */}
        <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
                {language === 'ta' ? 'பெட்டக தங்கம்' : 'Vault Gold'}
              </span>
              <div className="p-1 sm:p-1.5 bg-yellow-500/15 text-yellow-800 rounded-lg sm:rounded-xl shrink-0">
                <Gem className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-base sm:text-2xl font-black text-amber-900 font-mono tracking-tight truncate">
              {formatWeight(totalNetPledgedGold)}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-1.5 sm:mt-2.5 text-[9px] sm:text-[11px] text-slate-500 pt-1.5 sm:pt-2 border-t border-slate-100 gap-0.5 sm:gap-0">
            <span>{language === 'ta' ? 'மொத்த எடை: ' : 'Gross: '}<strong className="text-slate-800 font-bold">{formatWeight(totalGrossPledgedGold)}</strong></span>
            <span className="hidden sm:inline">{language === 'ta' ? 'லாக்கரில்: ' : 'Pkts: '}<strong className="text-slate-800 font-bold">{branchPackets.length}</strong></span>
          </div>
        </div>

        {/* KPI 3: Today's Inflow Collections */}
        <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
                {language === 'ta' ? 'இன்றைய வசூல்' : 'Today Collections'}
              </span>
              <div className="p-1 sm:p-1.5 bg-emerald-500/15 text-emerald-800 rounded-lg sm:rounded-xl shrink-0">
                <ArrowDownRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-base sm:text-2xl font-black text-emerald-800 font-mono tracking-tight truncate">
              {formatCurrency(todayPrincipalCollection + todayInterestCollection)}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-1.5 sm:mt-2.5 text-[9px] sm:text-[11px] text-slate-500 pt-1.5 sm:pt-2 border-t border-slate-100 gap-0.5 sm:gap-0">
            <span>{language === 'ta' ? 'வட்டி: ' : 'Vaddi: '}<strong className="text-emerald-800 font-bold">{formatCurrency(todayInterestCollection)}</strong></span>
            <span className="hidden sm:inline">{language === 'ta' ? 'அசல்: ' : 'Asal: '}<strong className="text-slate-800 font-bold">{formatCurrency(todayPrincipalCollection)}</strong></span>
          </div>
        </div>

        {/* KPI 4: Physical Cash Drawer Balance */}
        <div 
          onClick={() => {
            setDrawerModalInitialTab('CashIn');
            setIsDrawerModalOpen(true);
          }}
          className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white hover:bg-amber-50/20 border border-slate-200/90 hover:border-amber-300 shadow-2xs flex flex-col justify-between cursor-pointer transition group"
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate group-hover:text-amber-900 transition">
                {language === 'ta' ? 'கல்லா ரொக்கம்' : 'Counter Cash'}
              </span>
              <div className="flex items-center gap-1">
                <span 
                  onClick={(e) => {
                    e.stopPropagation();
                    setDrawerModalInitialTab('CashIn');
                    setIsDrawerModalOpen(true);
                  }}
                  className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-950 text-[10px] font-extrabold hover:bg-emerald-200 transition"
                  title="Cash In / Deposit"
                >
                  + In
                </span>
                <span 
                  onClick={(e) => {
                    e.stopPropagation();
                    setDrawerModalInitialTab('Withdrawal');
                    setIsDrawerModalOpen(true);
                  }}
                  className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-950 text-[10px] font-extrabold hover:bg-rose-200 transition"
                  title="Withdraw / Cash Out"
                >
                  - Out
                </span>
                <div className="p-1 sm:p-1.5 bg-emerald-500/15 text-emerald-800 rounded-lg sm:rounded-xl shrink-0 ml-0.5">
                  <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700" />
                </div>
              </div>
            </div>
            <div className="text-base sm:text-2xl font-black text-slate-900 font-mono tracking-tight truncate">
              {formatCurrency(cashBal)}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-1.5 sm:mt-2.5 text-[9px] sm:text-[11px] text-slate-500 pt-1.5 sm:pt-2 border-t border-slate-100 gap-0.5 sm:gap-0">
            <span 
              onClick={(e) => {
                e.stopPropagation();
                setDrawerModalInitialTab('CashIn');
                setIsDrawerModalOpen(true);
              }}
              className="hover:underline"
            >
              {language === 'ta' ? 'வங்கி: ' : 'Bank: '}
              <strong className="text-blue-900 font-bold font-mono">{formatCurrency(bankBal)}</strong>
            </span>
            <span className="text-emerald-700 font-bold">● {language === 'ta' ? 'கல்லா ரெடி' : 'Drawer Active'}</span>
          </div>
        </div>

      </div>

      {/* 3. DEDICATED SEPARATE CARDS: 3 ACCOUNTS REQUIRING INTEREST RENEWAL, FOLLOW-UP, OR SETTLEMENT */}
      <div className="space-y-2.5 sm:space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 px-1">
          <div>
            <h3 className="font-black text-slate-900 text-xs sm:text-base flex items-center gap-1.5 sm:gap-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 shrink-0" />
              <span>
                {language === 'ta' 
                  ? 'கல்லா தவணை & உடனடி கவன கணக்குகள்' 
                  : 'Accounts Requiring Renewal, Follow-up, or Settlement'}
              </span>
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 line-clamp-1 sm:line-clamp-none">
              {language === 'ta'
                ? 'வட்டி புதுப்பித்தல், தாமத வசூல், மற்றும் முன்கூட்டிய நகை மீட்பு தீர்வு'
                : 'Overdue late follow-up, today interest renewals, and upcoming pledge settlements'}
            </p>
          </div>
          
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <span className="text-[10px] sm:text-xs text-slate-600 bg-slate-100 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg sm:rounded-xl font-bold font-mono">
              {overdueList.length + dueTodayList.length + dueWithin7Days.length} {language === 'ta' ? 'கணக்குகள்' : 'Actionable'}
            </span>
          </div>
        </div>

        {/* MOBILE VIEW (md:hidden): 3 COMPACT CARDS IN ONE ROW + ACTIVE LIST CONTAINER */}
        <div className="md:hidden space-y-2.5">
          {/* 3 Cards fitting in 1 Row */}
          <div className="grid grid-cols-3 gap-1.5">
            {/* Card 1: Overdue */}
            <button
              type="button"
              onClick={() => setMobilePriorityTab('overdue')}
              className={`p-2 rounded-xl text-left border transition-all flex flex-col justify-between ${
                mobilePriorityTab === 'overdue'
                  ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400/50 shadow-xs'
                  : 'bg-white border-slate-200/90 active:bg-rose-50/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                  {overdueList.length}
                </span>
              </div>
              <div className="mt-1.5">
                <div className="text-[11px] font-black text-rose-900 truncate">
                  {language === 'ta' ? 'தவறியவை' : 'Overdue'}
                </div>
                <div className="text-[9.5px] font-mono font-bold text-slate-700 truncate">
                  {formatCurrency(overduePrincipal)}
                </div>
              </div>
            </button>

            {/* Card 2: Due Today */}
            <button
              type="button"
              onClick={() => setMobilePriorityTab('dueToday')}
              className={`p-2 rounded-xl text-left border transition-all flex flex-col justify-between ${
                mobilePriorityTab === 'dueToday'
                  ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/50 shadow-xs'
                  : 'bg-white border-slate-200/90 active:bg-amber-50/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-950 border border-amber-300">
                  {dueTodayList.length}
                </span>
              </div>
              <div className="mt-1.5">
                <div className="text-[11px] font-black text-amber-950 truncate">
                  {language === 'ta' ? 'இன்று தவணை' : 'Due Today'}
                </div>
                <div className="text-[9.5px] font-mono font-bold text-slate-700 truncate">
                  {formatCurrency(dueTodayPrincipal)}
                </div>
              </div>
            </button>

            {/* Card 3: Next 7 Days */}
            <button
              type="button"
              onClick={() => setMobilePriorityTab('next7Days')}
              className={`p-2 rounded-xl text-left border transition-all flex flex-col justify-between ${
                mobilePriorityTab === 'next7Days'
                  ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-400/50 shadow-xs'
                  : 'bg-white border-slate-200/90 active:bg-blue-50/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-900 border border-blue-300">
                  {dueWithin7Days.length}
                </span>
              </div>
              <div className="mt-1.5">
                <div className="text-[11px] font-black text-blue-900 truncate">
                  {language === 'ta' ? 'அடுத்த 7 நாள்' : 'Next 7 Days'}
                </div>
                <div className="text-[9.5px] font-mono font-bold text-slate-700 truncate">
                  {formatCurrency(dueWithin7DaysPrincipal)}
                </div>
              </div>
            </button>
          </div>

          {/* Active Priority Tab Item List (Mobile) */}
          <div className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs p-3">
            {mobilePriorityTab === 'overdue' && (
              <div>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-rose-100">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                    <span className="text-xs font-black text-rose-900">
                      {language === 'ta' ? 'தவணை தவறிய கணக்குகள்' : 'Overdue Accounts (Late Follow-up)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('mortgages_overdue')}
                    className="text-[11px] font-bold text-rose-700 hover:underline flex items-center gap-0.5"
                  >
                    <span>{language === 'ta' ? 'அனைத்தும்' : 'View All'}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {overdueList.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                    <p className="font-bold text-slate-700">{language === 'ta' ? 'தவணை தவறியவை எதுவும் இல்லை' : 'No Overdue Accounts'}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{language === 'ta' ? 'அனைத்து கணக்குகளும் சரியான நேரத்தில் உள்ளன' : 'All accounts are current'}</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
                    {overdueList.map(m => {
                      const cust = customers.find(c => c.id === m.customerId);
                      const rel = getRelativeDays(m.maturityDate);
                      return (
                        <div key={m.id} className="p-2.5 rounded-xl bg-rose-50/40 border border-rose-200/70">
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono font-black text-rose-900 text-xs">{m.mortgageNumber}</span>
                                <span className="font-bold text-slate-800 text-xs truncate max-w-[120px]">{cust?.name || m.customerId}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 font-mono">
                                <a href={`tel:${cust?.mobile || ''}`} className="text-rose-700 font-bold">
                                  📞 {cust?.mobile || 'No Phone'}
                                </a>
                                <span>•</span>
                                <span>Pkt: {m.packetId}</span>
                              </div>
                            </div>
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-100 text-rose-800 border border-rose-200 shrink-0">
                              {rel.days}d Overdue
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-rose-100">
                            <div>
                              <div className="text-[9px] text-slate-400 font-bold uppercase">Principal</div>
                              <div className="font-mono font-black text-slate-900 text-xs">{formatCurrency(m.outstandingPrincipal)}</div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleSendReminderWhatsApp(m)}
                                className="p-1 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg hover:bg-emerald-100 active:scale-95"
                                title="Send WhatsApp Reminder"
                              >
                                <MessageCircle className="w-3.5 h-3.5 fill-emerald-600/20" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedMortgage(m);
                                  setIsPaymentModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-black text-[11px] shadow-2xs"
                              >
                                {language === 'ta' ? 'வட்டி வசூல்' : 'Collect Vaddi'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedMortgage(m)}
                                className="px-2 py-1 bg-white text-slate-700 border border-slate-200 rounded-lg font-bold text-[11px]"
                              >
                                {language === 'ta' ? 'விவரம்' : 'View'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {mobilePriorityTab === 'dueToday' && (
              <div>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-100">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    <span className="text-xs font-black text-amber-950">
                      {language === 'ta' ? 'இன்று தவணை கணக்குகள்' : 'Due Today (Immediate Renewal)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('mortgages_due')}
                    className="text-[11px] font-bold text-amber-900 hover:underline flex items-center gap-0.5"
                  >
                    <span>{language === 'ta' ? 'அனைத்தும்' : 'View All'}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {dueTodayList.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                    <p className="font-bold text-slate-700">{language === 'ta' ? 'இன்று தவணை எதுவும் இல்லை' : 'No Mortgages Due Today'}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{language === 'ta' ? 'அனைத்து கணக்குகளும் சீராக உள்ளன' : 'No renewals scheduled today'}</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
                    {dueTodayList.map(m => {
                      const cust = customers.find(c => c.id === m.customerId);
                      return (
                        <div key={m.id} className="p-2.5 rounded-xl bg-amber-50/40 border border-amber-200/70">
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono font-black text-amber-900 text-xs">{m.mortgageNumber}</span>
                                <span className="font-bold text-slate-800 text-xs truncate max-w-[120px]">{cust?.name || m.customerId}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 font-mono">
                                <a href={`tel:${cust?.mobile || ''}`} className="text-amber-800 font-bold">
                                  📞 {cust?.mobile || 'No Phone'}
                                </a>
                                <span>•</span>
                                <span>Pkt: {m.packetId}</span>
                              </div>
                            </div>
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-200 text-amber-950 border border-amber-300 shrink-0">
                              Due Today
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-amber-100">
                            <div>
                              <div className="text-[9px] text-slate-400 font-bold uppercase">Principal</div>
                              <div className="font-mono font-black text-slate-900 text-xs">{formatCurrency(m.outstandingPrincipal)}</div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleSendReminderWhatsApp(m)}
                                className="p-1 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg hover:bg-emerald-100 active:scale-95"
                                title="Send WhatsApp Reminder"
                              >
                                <MessageCircle className="w-3.5 h-3.5 fill-emerald-600/20" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedMortgage(m);
                                  setIsPaymentModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg font-black text-[11px] shadow-2xs"
                              >
                                {language === 'ta' ? 'புதுப்பித்தல்' : 'Renew / Pay'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedMortgage(m)}
                                className="px-2 py-1 bg-white text-slate-700 border border-slate-200 rounded-lg font-bold text-[11px]"
                              >
                                {language === 'ta' ? 'விவரம்' : 'View'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {mobilePriorityTab === 'next7Days' && (
              <div>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-blue-100">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    <span className="text-xs font-black text-blue-900">
                      {language === 'ta' ? 'அடுத்த 7 நாட்கள் கணக்குகள்' : 'Next 7 Days (Settlement Notice)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('mortgages_active')}
                    className="text-[11px] font-bold text-blue-800 hover:underline flex items-center gap-0.5"
                  >
                    <span>{language === 'ta' ? 'அனைத்தும்' : 'View All'}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {dueWithin7Days.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                    <p className="font-bold text-slate-700">{language === 'ta' ? 'அடுத்த 7 நாட்களில் தவணை இல்லை' : 'No Mortgages Due in Next 7 Days'}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{language === 'ta' ? 'அனைத்து கணக்குகளும் சீராக உள்ளன' : 'Schedule is clear'}</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
                    {dueWithin7Days.map(m => {
                      const cust = customers.find(c => c.id === m.customerId);
                      const rel = getRelativeDays(m.maturityDate);
                      return (
                        <div key={m.id} className="p-2.5 rounded-xl bg-blue-50/40 border border-blue-200/70">
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono font-black text-blue-900 text-xs">{m.mortgageNumber}</span>
                                <span className="font-bold text-slate-800 text-xs truncate max-w-[120px]">{cust?.name || m.customerId}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 font-mono">
                                <a href={`tel:${cust?.mobile || ''}`} className="text-blue-700 font-bold">
                                  📞 {cust?.mobile || 'No Phone'}
                                </a>
                                <span>•</span>
                                <span>Due: {m.maturityDate}</span>
                              </div>
                            </div>
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-blue-100 text-blue-900 border border-blue-200 shrink-0">
                              {rel.label}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-blue-100">
                            <div>
                              <div className="text-[9px] text-slate-400 font-bold uppercase">Principal</div>
                              <div className="font-mono font-black text-slate-900 text-xs">{formatCurrency(m.outstandingPrincipal)}</div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedMortgage(m);
                                  setIsPaymentModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[11px] shadow-2xs"
                              >
                                {language === 'ta' ? 'வசூல்' : 'Collect'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedMortgage(m)}
                                className="px-2 py-1 bg-white text-slate-700 border border-slate-200 rounded-lg font-bold text-[11px]"
                              >
                                {language === 'ta' ? 'விவரம்' : 'View'}
                              </button>
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
        </div>

        {/* DESKTOP VIEW (hidden md:grid): 3 DEDICATED CARDS SIDE-BY-SIDE */}
        <div className="hidden md:grid md:grid-cols-3 md:gap-4 lg:gap-5">
          
          {/* CARD 1: OVERDUE ACCOUNTS (Late Follow-up & Penalty) */}
          <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-b from-rose-50/80 via-white to-rose-50/20 border-2 border-rose-200/90 shadow-2xs p-3.5 sm:p-5 flex flex-col justify-between transition hover:shadow-md">
            <div>
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-rose-100">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-rose-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-xs sm:text-sm">
                      {language === 'ta' ? 'தவணை தவறியவை' : '1. Overdue Accounts'}
                    </h4>
                    <p className="text-[10px] sm:text-[11px] text-rose-700 font-bold">
                      {language === 'ta' ? 'தாமத வசூல் & அபராதம்' : 'Late Follow-up & Penalty'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
                    {overdueList.length}
                  </span>
                  <div className="text-[10px] font-mono font-bold text-rose-900 mt-1">
                    {formatCurrency(overduePrincipal)}
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
                {overdueList.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-500">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                    <p className="font-bold text-slate-700">{language === 'ta' ? 'தவணை தவறியவை எதுவும் இல்லை' : 'No Overdue Accounts'}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{language === 'ta' ? 'அனைத்து கணக்குகளும் சரியான நேரத்தில் உள்ளன' : 'All customer pledge accounts are current'}</p>
                  </div>
                ) : (
                  overdueList.map(m => {
                    const cust = customers.find(c => c.id === m.customerId);
                    const rel = getRelativeDays(m.maturityDate);
                    return (
                      <div
                        key={m.id}
                        className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white hover:bg-rose-50/50 border border-rose-200/80 shadow-2xs transition"
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono font-black text-rose-900 text-xs">{m.mortgageNumber}</span>
                              <span className="font-extrabold text-slate-800 text-xs">{cust?.name || m.customerId}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[10px] sm:text-[11px] text-slate-500 font-mono">
                              <a 
                                href={`tel:${cust?.mobile || ''}`}
                                className="text-rose-700 hover:underline font-bold flex items-center gap-0.5"
                                title="Call customer"
                              >
                                📞 {cust?.mobile || 'No Phone'}
                              </a>
                              <span>•</span>
                              <span>Pkt: {m.packetId}</span>
                            </div>
                          </div>

                          <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200 shrink-0">
                            {rel.days}d Overdue
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-rose-100/80">
                          <div>
                            <div className="text-[9px] text-slate-400 uppercase font-bold">Principal (அசல்)</div>
                            <div className="font-mono font-black text-slate-900 text-xs">
                              {formatCurrency(m.outstandingPrincipal)}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSendReminderWhatsApp(m)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg sm:rounded-xl font-bold text-xs transition flex items-center gap-1 active:scale-95"
                              title="Send WhatsApp Reminder"
                            >
                              <MessageCircle className="w-3.5 h-3.5 fill-emerald-600/20" />
                              <span className="hidden xl:inline">WhatsApp</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedMortgage(m);
                                setIsPaymentModalOpen(true);
                              }}
                              className="px-2.5 sm:px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg sm:rounded-xl font-black text-xs shadow-xs transition"
                            >
                              {language === 'ta' ? 'வட்டி வசூல்' : 'Collect Vaddi'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedMortgage(m)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg sm:rounded-xl font-bold text-xs transition"
                            >
                              {language === 'ta' ? 'விவரம்' : 'View'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-rose-100 flex items-center justify-between text-[11px] text-rose-800 font-medium">
              <span>{language === 'ta' ? 'அபராதம் கணக்கிடப்படுகிறது' : 'Penal interest auto-accrues'}</span>
              <button 
                type="button"
                onClick={() => setActiveTab('mortgages_overdue')}
                className="font-bold hover:underline flex items-center gap-0.5"
              >
                <span>{language === 'ta' ? 'அனைத்தும்' : 'View All'}</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* CARD 2: DUE TODAY ACCOUNTS (Immediate Interest Renewal) */}
          <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-b from-amber-50/80 via-white to-amber-50/20 border-2 border-amber-300 shadow-2xs p-3.5 sm:p-5 flex flex-col justify-between transition hover:shadow-md">
            <div>
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-amber-200">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-sm shadow-xs">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-xs sm:text-sm">
                      {language === 'ta' ? 'இன்று தவணை' : '2. Due Today'}
                    </h4>
                    <p className="text-[10px] sm:text-[11px] text-amber-800 font-bold">
                      {language === 'ta' ? 'வட்டி புதுப்பித்தல்' : 'Immediate Interest Renewal'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black bg-amber-200 text-amber-950 border border-amber-400">
                    {dueTodayList.length}
                  </span>
                  <div className="text-[10px] font-mono font-bold text-amber-950 mt-1">
                    {formatCurrency(dueTodayPrincipal)}
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
                {dueTodayList.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-500">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                    <p className="font-bold text-slate-700">{language === 'ta' ? 'இன்று தவணை எதுவும் இல்லை' : 'No Mortgages Due Today'}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{language === 'ta' ? 'அடுத்த தவணைகள் வரும் நாட்களில் உள்ளன' : 'Next maturities are scheduled in upcoming days'}</p>
                  </div>
                ) : (
                  dueTodayList.map(m => {
                    const cust = customers.find(c => c.id === m.customerId);
                    return (
                      <div
                        key={m.id}
                        className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white hover:bg-amber-50/50 border border-amber-200 shadow-2xs transition"
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono font-black text-amber-900 text-xs">{m.mortgageNumber}</span>
                              <span className="font-extrabold text-slate-800 text-xs">{cust?.name || m.customerId}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[10px] sm:text-[11px] text-slate-500 font-mono">
                              <a 
                                href={`tel:${cust?.mobile || ''}`}
                                className="text-amber-800 hover:underline font-bold flex items-center gap-0.5"
                                title="Call customer"
                              >
                                📞 {cust?.mobile || 'No Phone'}
                              </a>
                              <span>•</span>
                              <span>Pkt: {m.packetId}</span>
                            </div>
                          </div>

                          <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold bg-amber-200 text-amber-950 border border-amber-300 shrink-0">
                            Due Today
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-amber-100">
                          <div>
                            <div className="text-[9px] text-slate-400 uppercase font-bold">Principal (அசல்)</div>
                            <div className="font-mono font-black text-slate-900 text-xs">
                              {formatCurrency(m.outstandingPrincipal)}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSendReminderWhatsApp(m)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg sm:rounded-xl font-bold text-xs transition flex items-center gap-1 active:scale-95"
                              title="Send WhatsApp Reminder"
                            >
                              <MessageCircle className="w-3.5 h-3.5 fill-emerald-600/20" />
                              <span className="hidden xl:inline">WhatsApp</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedMortgage(m);
                                setIsPaymentModalOpen(true);
                              }}
                              className="px-2.5 sm:px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg sm:rounded-xl font-black text-xs shadow-xs transition"
                            >
                              {language === 'ta' ? 'புதுப்பித்தல்' : 'Renew / Pay'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedMortgage(m)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg sm:rounded-xl font-bold text-xs transition"
                            >
                              {language === 'ta' ? 'விவரம்' : 'View'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-amber-200 flex items-center justify-between text-[11px] text-amber-900 font-medium">
              <span>{language === 'ta' ? 'இன்றைய முடிவு நேரம் வரை' : 'Counter renewal before close'}</span>
              <button 
                type="button"
                onClick={() => setActiveTab('mortgages_due')}
                className="font-bold hover:underline flex items-center gap-0.5"
              >
                <span>{language === 'ta' ? 'அனைத்தும்' : 'View All'}</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* CARD 3: NEXT 7 DAYS ACCOUNTS (Settlement or Advance Notice) */}
          <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-b from-blue-50/80 via-white to-blue-50/20 border-2 border-blue-200/90 shadow-2xs p-3.5 sm:p-5 flex flex-col justify-between transition hover:shadow-md">
            <div>
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-blue-100">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-xs sm:text-sm">
                      {language === 'ta' ? 'அடுத்த 7 நாட்கள்' : '3. Next 7 Days'}
                    </h4>
                    <p className="text-[10px] sm:text-[11px] text-blue-800 font-bold">
                      {language === 'ta' ? 'முன்கூட்டிய தகவல் & நகை மீட்பு' : 'Settlement & Advance Notice'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black bg-blue-100 text-blue-900 border border-blue-300">
                    {dueWithin7Days.length}
                  </span>
                  <div className="text-[10px] font-mono font-bold text-blue-950 mt-1">
                    {formatCurrency(dueWithin7DaysPrincipal)}
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
                {dueWithin7Days.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-500">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                    <p className="font-bold text-slate-700">{language === 'ta' ? 'அடுத்த 7 நாட்களில் தவணை இல்லை' : 'No Mortgages Due in Next 7 Days'}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{language === 'ta' ? 'அனைத்து கணக்குகளும் சீராக உள்ளன' : 'Schedule is clear for the coming week'}</p>
                  </div>
                ) : (
                  dueWithin7Days.map(m => {
                    const cust = customers.find(c => c.id === m.customerId);
                    const rel = getRelativeDays(m.maturityDate);
                    return (
                      <div
                        key={m.id}
                        className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white hover:bg-blue-50/50 border border-blue-200/80 shadow-2xs transition"
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono font-black text-blue-900 text-xs">{m.mortgageNumber}</span>
                              <span className="font-extrabold text-slate-800 text-xs">{cust?.name || m.customerId}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[10px] sm:text-[11px] text-slate-500 font-mono">
                              <a 
                                href={`tel:${cust?.mobile || ''}`}
                                className="text-blue-700 hover:underline font-bold flex items-center gap-0.5"
                                title="Call customer"
                              >
                                📞 {cust?.mobile || 'No Phone'}
                              </a>
                              <span>•</span>
                              <span>Due: {m.maturityDate}</span>
                            </div>
                          </div>

                          <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold bg-blue-100 text-blue-900 border border-blue-200 shrink-0">
                            {rel.label}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-blue-100/80">
                          <div>
                            <div className="text-[9px] text-slate-400 uppercase font-bold">Principal (அசல்)</div>
                            <div className="font-mono font-black text-slate-900 text-xs">
                              {formatCurrency(m.outstandingPrincipal)}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedMortgage(m);
                                setIsPaymentModalOpen(true);
                              }}
                              className="px-2.5 sm:px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg sm:rounded-xl font-bold text-xs shadow-xs transition"
                            >
                              {language === 'ta' ? 'வசூல்' : 'Collect'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedMortgage(m)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg sm:rounded-xl font-bold text-xs transition"
                            >
                              {language === 'ta' ? 'விவரம்' : 'View'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-blue-100 flex items-center justify-between text-[11px] text-blue-800 font-medium">
              <span>{language === 'ta' ? 'முன்கூட்டியே நினைவூட்டல்' : 'Send WhatsApp / SMS reminder'}</span>
              <button 
                type="button"
                onClick={() => setActiveTab('mortgages_active')}
                className="font-bold hover:underline flex items-center gap-0.5"
              >
                <span>{language === 'ta' ? 'அனைத்தும்' : 'View All'}</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* 3B. BULLION LIVE RATES & CUSTOMER SELF-SERVICE QR WEB PORTAL ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        
        {/* LEFT: GoodReturns Live Bullion Rates */}
        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-3 sm:space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-600" />
                <h3 className="font-black text-slate-900 text-xs sm:text-sm">
                  {language === 'ta' ? 'GoodReturns நேரடி தங்கம் விலை' : 'GoodReturns Live Spot Rates'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsGoodReturnsModalOpen(true)}
                className="text-[10px] sm:text-[11px] font-bold text-amber-800 hover:underline"
              >
                {language === 'ta' ? 'நகரம் மாற்று' : 'Change City'}
              </button>
            </div>

            {/* City Badge & 24h change */}
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50/60 border border-amber-200/80 mb-2.5">
              <div className="flex items-center justify-between text-xs mb-0.5">
                <span className="font-bold text-slate-700">
                  {goodReturnsRates.city} {goodReturnsRates.isManualOverride ? '(Custom Rate)' : 'Bullion Market'}
                </span>
                {goodReturnsRates.isManualOverride ? (
                  <span className="text-[10px] text-amber-800 font-bold bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                    Manual Override
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100/80 px-1.5 py-0.2 rounded">
                    ▲ +₹{goodReturnsRates.change24h['22K']}/g
                  </span>
                )}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 font-mono">
                {goodReturnsRates.isManualOverride ? 'Custom pawnbroker lending rates' : 'Synced from GoodReturns.in • 24h Market Trend'}
              </div>
            </div>

            {/* Live Rate Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-1.5 sm:gap-2 text-xs">
              <div className="p-2 sm:p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/70">
                <div className="text-[9px] sm:text-[10px] text-amber-900 font-bold uppercase truncate">24K Pure (999)</div>
                <div className="text-sm sm:text-base font-black text-slate-900 font-mono mt-0.5">
                  ₹{goodReturnsRates.rates['24K'].toLocaleString('en-IN')}<span className="text-[9px] font-normal text-slate-500">/g</span>
                </div>
              </div>

              <div className="p-2 sm:p-2.5 rounded-xl bg-amber-100/70 border border-amber-300">
                <div className="text-[9px] sm:text-[10px] text-amber-950 font-black uppercase truncate">22K 916 Hallmark</div>
                <div className="text-sm sm:text-base font-black text-amber-950 font-mono mt-0.5">
                  ₹{goodReturnsRates.rates['22K'].toLocaleString('en-IN')}<span className="text-[9px] font-normal text-amber-800">/g</span>
                </div>
              </div>

              <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase truncate">20K Hallmark</div>
                <div className="text-sm sm:text-base font-black text-slate-800 font-mono mt-0.5">
                  ₹{goodReturnsRates.rates['20K'].toLocaleString('en-IN')}<span className="text-[9px] font-normal text-slate-500">/g</span>
                </div>
              </div>

              <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase truncate">18K Hallmark</div>
                <div className="text-sm sm:text-base font-black text-slate-800 font-mono mt-0.5">
                  ₹{goodReturnsRates.rates['18K'].toLocaleString('en-IN')}<span className="text-[9px] font-normal text-slate-500">/g</span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsGoodReturnsModalOpen(true)}
            className="w-full py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-950 font-extrabold text-xs border border-amber-300 transition flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-800" />
            <span>Open Bullion Bulletin & Margin</span>
          </button>
        </div>

        {/* RIGHT: Customer Self-Service QR Web Portal Card */}
        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-950 via-slate-900 to-amber-900 text-white shadow-md flex flex-col justify-between space-y-3 sm:space-y-4 border border-amber-500/30">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-amber-500/20">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-white text-xs sm:text-sm">
                    {language === 'ta' ? 'வாடிக்கையாளர் QR வலை போர்ட்டல்' : 'Customer Self-Service QR Portal'}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-amber-300/80 font-bold">
                    {language === 'ta' ? 'நேரடி இணைய பாஸ்புக்' : 'No App Store Needed • Instant Passbook'}
                  </p>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-amber-400 text-slate-950 uppercase">
                Active
              </span>
            </div>

            <div className="mt-3 flex items-center gap-3">
              {/* Standee QR Preview icon */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white p-1.5 rounded-xl flex items-center justify-center shadow-md shrink-0">
                <QrCode className="w-11 h-11 sm:w-13 sm:h-13 text-slate-900" />
              </div>

              <div className="space-y-0.5 text-xs">
                <p className="text-amber-100 font-medium text-[11px] sm:text-xs leading-relaxed">
                  {language === 'ta'
                    ? 'வாடிக்கையாளர் உங்கள் கடைக்கு வரும்போது இந்த QR குறியீட்டை ஸ்கேன் செய்து தங்கள் அடகு விவரங்களை பார்க்கலாம்.'
                    : 'Customers scan this counter QR to track loans, paid vaddi, due dates & pledged ornaments.'}
                </p>
                <div className="text-[10px] text-amber-300 font-mono pt-0.5">
                  ✓ {language === 'ta' ? 'கவுண்டர் செக்-இன் QR' : 'Counter Check-in QR'} • ✓ {language === 'ta' ? 'அச்சிடும் ஸ்டாண்டி' : 'Printable Standee'}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setPortalCustomerId(null);
                setIsCustomerPortalOpen(true);
              }}
              className="flex-1 py-2 px-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-slate-950 font-black text-xs shadow-md transition flex items-center justify-center gap-1.5"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{language === 'ta' ? 'போர்ட்டல் திற' : 'Open Web Portal'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPortalCustomerId(null);
                setIsCustomerPortalOpen(true);
              }}
              className="py-2 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition flex items-center gap-1"
              title="Print Shop Counter QR Standee"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-300" />
              <span>{language === 'ta' ? 'ஸ்டாண்டி' : 'Standee QR'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* 4. RECENT PLEDGES TABLE / MOBILE CARDS (RESPONSIVE FOR ALL VIEWPORTS) */}
      <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-black text-slate-900 text-xs sm:text-sm">Recent Pawn Mortgages</h3>
            <p className="text-[10px] sm:text-xs text-slate-500">Latest active pawn tickets in {currentBranch.name}</p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('mortgages_active')}
            className="text-[11px] sm:text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-0.5 sm:gap-1 transition"
          >
            <span>View All ({branchMortgages.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* MOBILE VIEW (md:hidden): Compact Native Row Cards */}
        <div className="md:hidden space-y-2 mt-2.5">
          {branchMortgages.slice(0, 5).map(m => {
            const cust = customers.find(c => c.id === m.customerId);
            const totalNet = m.items.reduce((s, i) => s + (i.netWeight || 0), 0);
            const rel = getRelativeDays(m.maturityDate);

            return (
              <div 
                key={m.id}
                onClick={() => setSelectedMortgage(m)}
                className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/80 active:scale-[0.99] transition cursor-pointer"
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-amber-900 text-xs">{m.mortgageNumber}</span>
                    <span className="font-bold text-slate-900 text-xs truncate max-w-[130px]">{cust?.name || m.customerId}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                    m.status === 'Active' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                    m.status === 'Overdue' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                    m.status === 'Due' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                    'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {m.status}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-[11px] text-slate-600 mt-1.5 pt-1.5 border-t border-slate-200/60">
                  <span className="truncate max-w-[170px]">{m.items.map(i => i.itemType).join(', ')}</span>
                  <span className="font-mono font-bold text-slate-800">{formatWeight(totalNet)}</span>
                </div>

                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-200/60">
                  <div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase">{language === 'ta' ? 'அசல்' : 'Principal'}</div>
                    <div className="font-mono font-black text-slate-900 text-xs">{formatCurrency(m.outstandingPrincipal)}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMortgage(m);
                        setIsPaymentModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-2xs"
                    >
                      {language === 'ta' ? 'வசூல்' : 'Collect'}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMortgage(m);
                      }}
                      className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold"
                    >
                      {language === 'ta' ? 'விவரம்' : 'View'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* DESKTOP VIEW (hidden md:block): Complete Table */}
        <div className="hidden md:block overflow-x-auto mt-2">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider font-bold border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-3">Ticket / Pledge No</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Gold Collateral</th>
                <th className="py-2.5 px-3">Net Weight</th>
                <th className="py-2.5 px-3">Principal</th>
                <th className="py-2.5 px-3">Maturity Date</th>
                <th className="py-2.5 px-3">Packet ID</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {branchMortgages.slice(0, 6).map(m => {
                const cust = customers.find(c => c.id === m.customerId);
                const totalNet = m.items.reduce((s, i) => s + (i.netWeight || 0), 0);
                const rel = getRelativeDays(m.maturityDate);

                return (
                  <tr 
                    key={m.id}
                    onClick={() => setSelectedMortgage(m)}
                    className="hover:bg-amber-50/40 cursor-pointer transition"
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-900">
                      {m.mortgageNumber}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{cust?.name || m.customerId}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{cust?.mobile || ''}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-slate-700 font-medium truncate block max-w-[140px]">
                        {m.items.map(i => i.itemType).join(', ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                      {formatWeight(totalNet)}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-black text-slate-900">
                      {formatCurrency(m.outstandingPrincipal)}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800">{formatDate(m.maturityDate)}</div>
                      <div className={`text-[10px] font-bold ${
                        rel.isPast ? 'text-rose-700' : rel.days === 0 ? 'text-amber-800' : 'text-slate-400'
                      }`}>
                        {rel.label}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                      {m.packetId}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        m.status === 'Active' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                        m.status === 'Overdue' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                        m.status === 'Due' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMortgage(m);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-amber-50 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 shadow-2xs transition"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

