import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { LedgerAccount, LedgerEntry } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { 
  BookOpen, Plus, Download, Wallet, Landmark, 
  ArrowUpRight, ArrowDownRight, ArrowDownLeft, ArrowLeftRight, Calendar, Search, Filter, X
} from 'lucide-react';

export const LedgerView: React.FC = () => {
  const { 
    ledger, 
    expenses, 
    getCashBalance, 
    getBankBalance, 
    setIsExpenseModalOpen, 
    setIsDrawerModalOpen,
    setDrawerModalInitialTab,
    currentBranch,
    language
  } = useApp();

  const [activeAccount, setActiveAccount] = useState<LedgerAccount | 'ALL'>('Cash');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [entryTypeFilter, setEntryTypeFilter] = useState<'ALL' | 'Credit' | 'Debit'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const branchLedger = useMemo(() => {
    return ledger.filter(l => l.branchId === currentBranch.id);
  }, [ledger, currentBranch.id]);

  // Unique categories dynamically extracted
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    branchLedger.forEach(l => {
      if (l.category) cats.add(l.category);
    });
    return Array.from(cats).sort();
  }, [branchLedger]);

  // Active filter count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (activeAccount !== 'ALL') count++;
    if (categoryFilter !== 'ALL') count++;
    if (entryTypeFilter !== 'ALL') count++;
    if (startDate) count++;
    if (endDate) count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [activeAccount, categoryFilter, entryTypeFilter, startDate, endDate, searchQuery]);

  const resetAllFilters = () => {
    setActiveAccount('ALL');
    setCategoryFilter('ALL');
    setEntryTypeFilter('ALL');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
  };

  const setDatePreset = (preset: 'today' | 'thisMonth' | 'last30d' | 'all') => {
    const today = new Date();
    const todayFormatted = today.toISOString().split('T')[0];

    if (preset === 'today') {
      setStartDate(todayFormatted);
      setEndDate(todayFormatted);
    } else if (preset === 'thisMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(todayFormatted);
    } else if (preset === 'last30d') {
      const past30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setStartDate(past30);
      setEndDate(todayFormatted);
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  const filteredEntries = useMemo(() => {
    return branchLedger.filter(l => {
      const matchesAccount = activeAccount === 'ALL' || l.account === activeAccount;
      
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        l.description.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q) ||
        (l.referenceId && l.referenceId.toLowerCase().includes(q));

      const matchesCat = categoryFilter === 'ALL' || l.category === categoryFilter;
      const matchesType = entryTypeFilter === 'ALL' || l.type === entryTypeFilter;

      // Date filtering
      if (startDate && l.date < startDate) return false;
      if (endDate && l.date > endDate) return false;

      return matchesAccount && matchesSearch && matchesCat && matchesType;
    });
  }, [branchLedger, activeAccount, searchQuery, categoryFilter, entryTypeFilter, startDate, endDate]);

  const cashBal = getCashBalance();
  const bankBal = getBankBalance();

  // Filtered period calculations
  const periodCreditTotal = useMemo(() => {
    return filteredEntries.filter(e => e.type === 'Credit').reduce((s, e) => s + e.amount, 0);
  }, [filteredEntries]);

  const periodDebitTotal = useMemo(() => {
    return filteredEntries.filter(e => e.type === 'Debit').reduce((s, e) => s + e.amount, 0);
  }, [filteredEntries]);

  // Daily Calculations
  const todayEntries = branchLedger.filter(l => l.date === todayStr);
  const todayCashCredit = todayEntries.filter(l => l.account === 'Cash' && l.type === 'Credit').reduce((s, l) => s + l.amount, 0);
  const todayCashDebit = todayEntries.filter(l => l.account === 'Cash' && l.type === 'Debit').reduce((s, l) => s + l.amount, 0);

  const exportCsv = () => {
    const headers = ['Date', 'Account', 'Type', 'Category', 'Description', 'Ref ID', 'Amount (INR)', 'Balance After (INR)'];
    const rows = filteredEntries.map(e => [
      e.date,
      e.account,
      e.type,
      e.category,
      `"${e.description.replace(/"/g, '""')}"`,
      e.referenceId || '',
      e.amount,
      e.balanceAfter
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Khatabook_Ledger_${currentBranch.code}_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 text-slate-800">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 liquid-glass-card p-5 rounded-3xl border border-amber-200/70 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-700" />
            <span>Khatabook Internal Accounting Register</span>
          </h2>
          <p className="text-xs text-slate-500">
            Section 16: Physical cash drawer ledger, bank account reconciliation, automated double-entry, income & expenses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Cash In / Deposit Button */}
          <button
            onClick={() => {
              setDrawerModalInitialTab('CashIn');
              setIsDrawerModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 transition border border-white/40 cursor-pointer active:scale-95"
            title="Deposit cash float or bank capital into ledger"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>+ Cash In / Deposit</span>
          </button>

          {/* Cash Out / Withdrawal Button */}
          <button
            onClick={() => {
              setDrawerModalInitialTab('Withdrawal');
              setIsDrawerModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-black text-xs rounded-xl shadow-md shadow-amber-600/20 transition border border-white/40 cursor-pointer active:scale-95"
            title="Withdraw funds from cash drawer or bank"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>- Withdrawal</span>
          </button>

          {/* Transfer Button */}
          <button
            onClick={() => {
              setDrawerModalInitialTab('Transfer');
              setIsDrawerModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-white/90 hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 shadow-xs transition cursor-pointer active:scale-95"
            title="Transfer between Cash Drawer and Bank Account"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
            <span>Transfer</span>
          </button>

          {/* Add Expense Button */}
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black text-xs rounded-xl shadow-md shadow-rose-500/20 transition border border-white/40 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Expense</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-white/90 hover:bg-white text-slate-700 text-xs font-bold rounded-xl border border-amber-200/70 shadow-xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Account Balance Banner Cards (Fitted into rows on mobile) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
        
        {/* Cash Ledger Balance */}
        <div 
          onClick={() => setActiveAccount('Cash')}
          className={`p-3 sm:p-5 rounded-2xl sm:rounded-3xl border cursor-pointer transition shadow-xs ${
            activeAccount === 'Cash'
              ? 'liquid-glass-gold border-amber-400/80 shadow-md shadow-amber-500/10'
              : 'liquid-glass-card border-amber-200/60 hover:bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="truncate">Cash Drawer</span>
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-800 font-extrabold border border-emerald-200">
              CASH
            </span>
          </div>
          <div className="text-base sm:text-2xl font-black text-emerald-800 font-mono">
            {formatCurrency(cashBal)}
          </div>
          <div className="flex items-center justify-between text-[9px] sm:text-[11px] text-slate-500 mt-1.5 pt-1.5 border-t border-amber-100 font-medium">
            <span>+{formatCurrency(todayCashCredit)} / <span className="text-rose-600">-{formatCurrency(todayCashDebit)}</span></span>
            <div className="flex items-center gap-1">
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  setDrawerModalInitialTab('CashIn');
                  setIsDrawerModalOpen(true);
                }}
                className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-950 font-bold hover:bg-emerald-200 transition cursor-pointer"
                title="Deposit Cash into Drawer"
              >
                + In
              </span>
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  setDrawerModalInitialTab('Withdrawal');
                  setIsDrawerModalOpen(true);
                }}
                className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-950 font-bold hover:bg-rose-200 transition cursor-pointer"
                title="Withdraw Cash from Drawer"
              >
                - Out
              </span>
            </div>
          </div>
        </div>

        {/* Bank Ledger Balance */}
        <div 
          onClick={() => setActiveAccount('Bank')}
          className={`p-3 sm:p-5 rounded-2xl sm:rounded-3xl border cursor-pointer transition shadow-xs ${
            activeAccount === 'Bank'
              ? 'liquid-glass-gold border-amber-400/80 shadow-md shadow-amber-500/10'
              : 'liquid-glass-card border-amber-200/60 hover:bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Landmark className="w-3.5 h-3.5 text-blue-600" />
              <span className="truncate">Bank Account</span>
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-blue-50 text-blue-800 font-extrabold border border-blue-200">
              HDFC
            </span>
          </div>
          <div className="text-base sm:text-2xl font-black text-blue-900 font-mono">
            {formatCurrency(bankBal)}
          </div>
          <div className="flex items-center justify-between text-[9px] sm:text-[11px] text-slate-500 mt-1.5 pt-1.5 border-t border-amber-100 font-medium">
            <span className="truncate">Online collections</span>
            <div className="flex items-center gap-1 shrink-0 ml-1">
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  setDrawerModalInitialTab('CashIn');
                  setIsDrawerModalOpen(true);
                }}
                className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-950 font-bold hover:bg-blue-200 transition cursor-pointer"
                title="Deposit Bank Funds"
              >
                + In
              </span>
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  setDrawerModalInitialTab('Withdrawal');
                  setIsDrawerModalOpen(true);
                }}
                className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-950 font-bold hover:bg-rose-200 transition cursor-pointer"
                title="Withdraw Bank Funds"
              >
                - Out
              </span>
            </div>
          </div>
        </div>

        {/* Total Liquidity */}
        <div 
          onClick={() => setActiveAccount('ALL')}
          className={`col-span-2 sm:col-span-1 p-3 sm:p-5 rounded-2xl sm:rounded-3xl border cursor-pointer transition shadow-xs ${
            activeAccount === 'ALL'
              ? 'liquid-glass-gold border-amber-400/80 shadow-md shadow-amber-500/10'
              : 'liquid-glass-card border-amber-200/60 hover:bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
              Consolidated Branch Liquidity
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-950 font-extrabold border border-amber-300">
              TOTAL
            </span>
          </div>
          <div className="text-base sm:text-2xl font-black text-amber-800 font-mono">
            {formatCurrency(cashBal + bankBal)}
          </div>
          <div className="text-[9px] sm:text-[11px] text-slate-500 mt-1.5 pt-1.5 border-t border-amber-100">
            Combined cash + bank balance
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="liquid-glass-card p-4 rounded-3xl border border-amber-200/70 shadow-xs space-y-3">
        {/* Row 1: Search & Account Tabs */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={language === 'ta' ? 'விளக்கம், குறிப்பு எண், வகை...' : 'Search description, reference, category...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/90 border border-amber-200/70 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 shadow-xs font-medium"
            />
          </div>

          {/* Account Selector Tabs */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs">
            {(['Cash', 'Bank', 'ALL'] as const).map(acc => (
              <button
                key={acc}
                onClick={() => setActiveAccount(acc)}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition text-xs ${
                  activeAccount === acc
                    ? 'liquid-glass-gold text-amber-950 border border-amber-400/80 shadow-xs'
                    : 'bg-white/80 text-slate-600 border border-slate-200 hover:bg-white'
                }`}
              >
                {acc === 'ALL' 
                  ? (language === 'ta' ? 'ஒருங்கிணைந்த கணக்கு' : 'Combined Ledger') 
                  : acc === 'Cash'
                  ? (language === 'ta' ? 'ரொக்க பதிவேடு' : 'Cash Ledger')
                  : (language === 'ta' ? 'வங்கி பதிவேடு' : 'Bank Ledger')}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Date Filters, Presets, Entry Type & Category */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-amber-100 text-xs">
          
          {/* Date Range Inputs */}
          <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-amber-200/80 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span className="text-[11px] font-bold text-slate-500">{language === 'ta' ? 'இருந்து:' : 'From:'}</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs text-slate-800 bg-transparent font-medium focus:outline-none"
            />
            <span className="text-[11px] font-bold text-slate-400">|</span>
            <span className="text-[11px] font-bold text-slate-500">{language === 'ta' ? 'வரை:' : 'To:'}</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs text-slate-800 bg-transparent font-medium focus:outline-none"
            />
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setDatePreset('today')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                startDate === todayStr && endDate === todayStr
                  ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {language === 'ta' ? 'இன்று' : 'Today'}
            </button>
            <button
              onClick={() => setDatePreset('thisMonth')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition"
            >
              {language === 'ta' ? 'இந்த மாதம்' : 'This Month'}
            </button>
            <button
              onClick={() => setDatePreset('last30d')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition"
            >
              {language === 'ta' ? 'கடந்த 30 நாட்கள்' : 'Last 30d'}
            </button>
          </div>

          {/* Type Filter (Credit / Debit) */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500">
              {language === 'ta' ? 'வகை:' : 'Type:'}
            </span>
            <select
              value={entryTypeFilter}
              onChange={(e) => setEntryTypeFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-white border border-amber-200/80 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400/30"
            >
              <option value="ALL">{language === 'ta' ? 'அனைத்து பரிவர்த்தனைகள்' : 'All Transactions'}</option>
              <option value="Credit">{language === 'ta' ? 'வரவு (Inflow)' : 'Inflow (Credit)'}</option>
              <option value="Debit">{language === 'ta' ? 'பற்று (Outflow)' : 'Outflow (Debit)'}</option>
            </select>
          </div>

          {/* Dynamic Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500">
              {language === 'ta' ? 'பிரிவு:' : 'Category:'}
            </span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-amber-200/80 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400/30 max-w-[160px] truncate"
            >
              <option value="ALL">{language === 'ta' ? 'அனைத்து பிரிவுகளும்' : 'All Categories'}</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Active Filter Counter & Clear */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-950 font-black text-[10px] border border-amber-400/60">
                {activeFiltersCount} {language === 'ta' ? 'வடிப்பான்கள் பயன்பாட்டில்' : 'filters active'}
              </span>
              <button
                onClick={resetAllFilters}
                className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline px-2 py-1 rounded-lg"
              >
                <X className="w-3 h-3" />
                <span>{language === 'ta' ? 'அனைத்தையும் நீக்கு' : 'Clear All'}</span>
              </button>
            </div>
          )}

        </div>

        {/* Row 3: Period Cash Flow Summary Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-amber-100 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-slate-500">
              {language === 'ta' ? 'தேர்ந்தெடுக்கப்பட்ட காலக்கட்ட சுருக்கம்:' : 'Period Summary:'}
            </span>
            <span className="text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {language === 'ta' ? 'மொத்த வரவு:' : 'Total Inflow:'} <strong>+{formatCurrency(periodCreditTotal)}</strong>
            </span>
            <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
              {language === 'ta' ? 'மொத்த பற்று:' : 'Total Outflow:'} <strong>-{formatCurrency(periodDebitTotal)}</strong>
            </span>
            <span className="text-slate-800 font-extrabold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              {language === 'ta' ? 'நிகர ஓட்டம்:' : 'Net Flow:'} <strong className={periodCreditTotal >= periodDebitTotal ? 'text-emerald-700' : 'text-rose-600'}>
                {periodCreditTotal >= periodDebitTotal ? '+' : ''}{formatCurrency(periodCreditTotal - periodDebitTotal)}
              </strong>
            </span>
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            {language === 'ta' ? 'பதிவுகள்:' : 'Showing:'} <strong className="text-slate-900 font-mono">{filteredEntries.length}</strong> {language === 'ta' ? 'பரிவர்த்தனைகள்' : 'transactions'}
          </div>
        </div>

      </div>

      {/* Ledger Table */}
      <div className="liquid-glass-card rounded-3xl border border-amber-200/70 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-amber-500/10 text-slate-700 uppercase text-[10px] tracking-wider font-extrabold border-b border-amber-200/60">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Account</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4 text-right">Inflow (Credit)</th>
                <th className="py-3 px-4 text-right">Outflow (Debit)</th>
                <th className="py-3 px-4 text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100 font-mono">
              {filteredEntries.map(e => (
                <tr key={e.id} className="hover:bg-amber-50/50 transition">
                  <td className="py-3 px-4 text-slate-500 font-sans">
                    {formatDate(e.date)}
                  </td>
                  <td className="py-3 px-4 font-sans font-bold">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      e.account === 'Cash' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-blue-50 text-blue-800 border-blue-300'
                    }`}>
                      {e.account}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans font-extrabold">
                    <span className={e.type === 'Credit' ? 'text-emerald-700' : 'text-rose-600'}>
                      {e.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans font-bold text-slate-900">
                    {e.category}
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-600 max-w-xs truncate">
                    {e.description}
                  </td>
                  <td className="py-3 px-4 text-[11px] text-slate-500">
                    {e.referenceId || '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-emerald-700">
                    {e.type === 'Credit' ? formatCurrency(e.amount) : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-rose-600">
                    {e.type === 'Debit' ? formatCurrency(e.amount) : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-slate-900">
                    {formatCurrency(e.balanceAfter)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
