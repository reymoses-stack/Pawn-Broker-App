import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Payment } from '../../types';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { 
  Receipt, Search, RotateCcw, Printer, 
  Wallet, ShieldAlert, CheckCircle2, X,
  Calendar, Filter, SlidersHorizontal, ArrowUpDown
} from 'lucide-react';

export const PaymentListView: React.FC = () => {
  const { 
    payments, 
    mortgages, 
    customers, 
    reversePayment, 
    setReceiptModalData,
    setIsPaymentModalOpen,
    currentBranch,
    currentUser,
    language
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Completed' | 'Reversed'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amountDesc'>('newest');

  const [reversalTarget, setReversalTarget] = useState<Payment | null>(null);
  const [reversalReason, setReversalReason] = useState('');

  const branchPayments = payments.filter(p => p.branchId === currentBranch.id);

  const activeFilterCount = (methodFilter !== 'all' ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0) +
    (searchQuery ? 1 : 0);

  const clearAllFilters = () => {
    setSearchQuery('');
    setMethodFilter('all');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
    setSortBy('newest');
  };

  const setQuickDate = (type: 'today' | 'thisMonth' | 'last30Days' | 'clear') => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    if (type === 'clear') {
      setStartDate('');
      setEndDate('');
      return;
    }
    if (type === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    }
    if (type === 'thisMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    }
    if (type === 'last30Days') {
      const past30 = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setStartDate(past30);
      setEndDate(todayStr);
    }
  };

  const filteredPayments = useMemo(() => {
    return branchPayments
      .filter(p => {
        const cust = customers.find(c => c.id === p.customerId);
        
        // Search query
        const matchesSearch = 
          p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.mortgageNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (cust && cust.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (cust && cust.mobile.includes(searchQuery));

        if (!matchesSearch) return false;

        // Payment Method Filter
        if (methodFilter !== 'all' && p.paymentMethod !== methodFilter) {
          return false;
        }

        // Status Filter
        if (statusFilter !== 'all' && p.status !== statusFilter) {
          return false;
        }

        // Date Range Filter
        const pDate = p.paymentDate.split('T')[0];
        if (startDate && pDate < startDate) return false;
        if (endDate && pDate > endDate) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return b.paymentDate.localeCompare(a.paymentDate);
        if (sortBy === 'oldest') return a.paymentDate.localeCompare(b.paymentDate);
        if (sortBy === 'amountDesc') return b.amount - a.amount;
        return 0;
      });
  }, [branchPayments, customers, searchQuery, methodFilter, statusFilter, startDate, endDate, sortBy]);

  const totalCollected = filteredPayments
    .filter(p => p.status === 'Completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalCash = filteredPayments
    .filter(p => p.status === 'Completed' && p.paymentMethod === 'Cash')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalDigital = totalCollected - totalCash;

  const handleConfirmReversal = () => {
    if (!reversalTarget || !reversalReason.trim()) {
      alert('Please enter a specific reason for the payment reversal');
      return;
    }
    reversePayment(reversalTarget.id, reversalReason);
    setReversalTarget(null);
    setReversalReason('');
  };

  return (
    <div className="space-y-5 text-slate-800">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 liquid-glass-card p-5 rounded-3xl border border-amber-200/70 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            <span>{language === 'ta' ? 'வட்டி & கடன் வசூல் பதிவேடு' : 'Payment Collections Register'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'ta'
              ? 'நிகழ்நேர ரசீது வரலாறு, அசல் மற்றும் வட்டி ஒதுக்கீடு, மற்றும் காசாளர் வரவு செலவு.'
              : 'Real-time receipt history, payment allocations, Khatabook postings, and audited reversals.'}
          </p>
        </div>

        <button
          onClick={() => setIsPaymentModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/25 transition self-start sm:self-auto border border-white/40"
        >
          <Wallet className="w-4 h-4" />
          <span>{language === 'ta' ? '+ வசூல் பதிவு செய்' : '+ Receive Payment'}</span>
        </button>
      </div>

      {/* Filter and Metrics Row */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={language === 'ta' ? 'தேடு: ரசீது எண், அடகு எண், பெயர், முறை...' : 'Search by receipt ID, pledge number, customer name, mode...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/90 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-400 shadow-2xs font-medium"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {/* Filter Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition ${
                showAdvancedFilters || activeFilterCount > 1
                  ? 'bg-amber-500/15 text-amber-950 border-amber-300 shadow-2xs'
                  : 'bg-white/80 hover:bg-white text-slate-700 border-slate-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-700" />
              <span>{language === 'ta' ? 'தேதி & முறை வடிப்பான்' : 'Date & Method Filters'}</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-mono text-[10px] font-black flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 px-2 py-1"
                title="Reset all filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{language === 'ta' ? 'அழி' : 'Clear'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Method & Status Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-bold text-slate-500 mr-1">{language === 'ta' ? 'கட்டண முறை:' : 'Method:'}</span>
          {['all', 'Cash', 'UPI', 'Bank Transfer', 'Cheque'].map(m => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`px-3 py-1 rounded-xl font-bold transition text-[11px] shadow-2xs ${
                methodFilter === m
                  ? 'bg-emerald-600 text-white font-black shadow-xs'
                  : 'bg-white/80 hover:bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {m === 'all' ? (language === 'ta' ? 'அனைத்து முறைகளும்' : 'All Methods') : m}
            </button>
          ))}

          <span className="text-slate-300 mx-1">|</span>

          <span className="text-[11px] font-bold text-slate-500 mr-1">{language === 'ta' ? 'நிலை:' : 'Status:'}</span>
          {(['all', 'Completed', 'Reversed'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-xl font-bold transition text-[11px] shadow-2xs ${
                statusFilter === s
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'bg-white/80 hover:bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {s === 'all' ? (language === 'ta' ? 'அனைத்தும்' : 'All') : (s === 'Completed' ? (language === 'ta' ? 'முடிந்தது' : 'Completed') : (language === 'ta' ? 'ரத்து செய்யப்பட்டது' : 'Reversed'))}
            </button>
          ))}
        </div>

        {/* Advanced Filters Expandable Card */}
        {showAdvancedFilters && (
          <div className="p-4 rounded-3xl bg-white border border-amber-200/80 shadow-md space-y-3 animate-in fade-in duration-200 text-xs">
            <div className="font-black text-slate-900 flex items-center gap-1.5 pb-2 border-b border-amber-100">
              <Calendar className="w-3.5 h-3.5 text-amber-700" />
              <span>{language === 'ta' ? 'தேதி வரம்பு மற்றும் வரிசை வடிப்பான்கள்' : 'Date Range & Sorting'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Date Range */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  {language === 'ta' ? 'வசூல் தேதி வரம்பு' : 'Payment Date Range'}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
                <div className="flex items-center gap-1.5 pt-1 text-[10px]">
                  <button type="button" onClick={() => setQuickDate('today')} className="text-emerald-700 font-bold hover:underline">
                    {language === 'ta' ? 'இன்று' : 'Today'}
                  </button>
                  <span className="text-slate-300">•</span>
                  <button type="button" onClick={() => setQuickDate('thisMonth')} className="text-emerald-700 font-bold hover:underline">
                    {language === 'ta' ? 'இந்த மாதம்' : 'This Month'}
                  </button>
                  <span className="text-slate-300">•</span>
                  <button type="button" onClick={() => setQuickDate('last30Days')} className="text-emerald-700 font-bold hover:underline">
                    {language === 'ta' ? '30 நாட்கள்' : 'Last 30d'}
                  </button>
                </div>
              </div>

              {/* Sort Order */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  {language === 'ta' ? 'வரிசைப்படுத்து' : 'Sort Collections'}
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
                >
                  <option value="newest">{language === 'ta' ? 'சமீபத்தியது முதலில்' : 'Newest First'}</option>
                  <option value="oldest">{language === 'ta' ? 'பழையது முதலில்' : 'Oldest First'}</option>
                  <option value="amountDesc">{language === 'ta' ? 'அதிக தொகை முதலில்' : 'Highest Amount First'}</option>
                </select>
              </div>

              {/* Financial Breakup in filter */}
              <div className="p-2.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col justify-center text-xs">
                <div className="text-[10px] uppercase font-bold text-emerald-900">Breakdown (Filtered)</div>
                <div className="flex justify-between items-center mt-1 text-[11px]">
                  <span>Cash Drawer:</span>
                  <strong className="font-mono text-emerald-900">{formatCurrency(totalCash)}</strong>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span>UPI / Bank:</span>
                  <strong className="font-mono text-blue-900">{formatCurrency(totalDigital)}</strong>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Summary Banner Card */}
      <div className="p-3.5 bg-white border border-slate-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-2">
          <span>{language === 'ta' ? 'பதிவுகள்: ' : 'Showing '}</span>
          <strong className="text-slate-900 font-black">{filteredPayments.length}</strong>
          <span className="text-slate-400">({language === 'ta' ? 'மொத்தம்' : 'total'} {branchPayments.length})</span>
        </div>

        <div className="flex items-center gap-4">
          <div>
            {language === 'ta' ? 'கல்லா ரொக்கம்: ' : 'Cash: '}
            <strong className="font-mono text-emerald-700 font-black">{formatCurrency(totalCash)}</strong>
          </div>
          <div>
            {language === 'ta' ? 'வங்கி / UPI: ' : 'Bank/UPI: '}
            <strong className="font-mono text-blue-700 font-black">{formatCurrency(totalDigital)}</strong>
          </div>
          <div className="pl-3 border-l border-slate-200">
            {language === 'ta' ? 'மொத்த வசூல்: ' : 'Total Collected: '}
            <strong className="text-base font-black font-mono text-emerald-800">{formatCurrency(totalCollected)}</strong>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">{language === 'ta' ? 'ரசீது எண்' : 'Receipt ID'}</th>
                <th className="py-3 px-4">{language === 'ta' ? 'தேதி & நேரம்' : 'Date & Time'}</th>
                <th className="py-3 px-4">{language === 'ta' ? 'அடகு எண்' : 'Pledge No'}</th>
                <th className="py-3 px-4">{language === 'ta' ? 'வாடிக்கையாளர்' : 'Customer'}</th>
                <th className="py-3 px-4">{language === 'ta' ? 'முறை / குறிப்பு' : 'Method / Ref'}</th>
                <th className="py-3 px-4">{language === 'ta' ? 'மொத்த தொகை' : 'Total Amount'}</th>
                <th className="py-3 px-4">{language === 'ta' ? 'அசல் கழிவு' : 'Principal Adj'}</th>
                <th className="py-3 px-4">{language === 'ta' ? 'செலுத்திய வட்டி' : 'Interest Paid'}</th>
                <th className="py-3 px-4">{language === 'ta' ? 'நிலை' : 'Status'}</th>
                <th className="py-3 px-4 text-right">{language === 'ta' ? 'செயல்பாடுகள்' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 font-sans">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-50" />
                    <p className="font-bold text-slate-700">{language === 'ta' ? 'வசூல் பதிவுகள் எதுவும் பொருந்தவில்லை' : 'No matching payment records found'}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{language === 'ta' ? 'தேர்வு செய்த வடிப்பான்களை மாற்றவும் அல்லது அழிக்கவும்' : 'Try clearing date range or changing payment mode'}</p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map(p => {
                  const cust = customers.find(c => c.id === p.customerId);
                  const mort = mortgages.find(m => m.mortgageNumber === p.mortgageNumber);

                  return (
                    <tr key={p.id} className="hover:bg-amber-50/40 transition">
                      <td className="py-3 px-4 font-mono font-black text-amber-900">{p.id}</td>
                      <td className="py-3 px-4 text-slate-500 text-[11px] font-sans">
                        {formatDateTime(p.paymentDate)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.mortgageNumber}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{cust?.name || p.customerId}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          p.paymentMethod === 'Cash' 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}>
                          {p.paymentMethod}
                        </span>
                        {p.referenceNumber && (
                          <div className="text-[9px] text-slate-400 font-mono mt-0.5">{p.referenceNumber}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-black text-slate-900 text-sm">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        {p.allocatedPrincipal > 0 ? formatCurrency(p.allocatedPrincipal) : '—'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-900">
                        {p.allocatedInterest > 0 ? formatCurrency(p.allocatedInterest) : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                          p.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              if (mort && cust) {
                                setReceiptModalData({
                                  type: 'payment',
                                  mortgage: mort,
                                  customer: cust,
                                  payment: p,
                                  packet: undefined
                                });
                              }
                            }}
                            className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition shadow-2xs"
                            title={language === 'ta' ? 'ரசீது அச்சிடு' : 'Reprint Receipt'}
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-600" />
                          </button>

                          {currentUser?.role === 'Master Admin / Owner' && p.status === 'Completed' && (
                            <button
                              onClick={() => setReversalTarget(p)}
                              className="p-1.5 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl border border-slate-200 hover:border-rose-200 transition shadow-2xs"
                              title={language === 'ta' ? 'ரசீது ரத்து செய்' : 'Reverse Payment'}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Reversal Modal */}
      {reversalTarget && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 w-full max-w-md rounded-3xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-600 pb-2 border-b border-rose-100">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Audited Payment Reversal (Section 28)</h3>
                <p className="text-[11px] text-slate-500">Requires immutable reason log and creates double-entry reversing voucher</p>
              </div>
            </div>

            <div className="space-y-2 text-xs bg-rose-50/50 p-3 rounded-2xl border border-rose-200/80">
              <div className="flex justify-between">
                <span className="text-slate-500">Receipt ID:</span>
                <span className="font-mono font-bold text-slate-900">{reversalTarget.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount:</span>
                <span className="font-mono font-bold text-rose-700">{formatCurrency(reversalTarget.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pledge Number:</span>
                <span className="font-mono font-bold text-slate-900">{reversalTarget.mortgageNumber}</span>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-700">Mandatory Reversal Justification Reason:</label>
              <textarea
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                placeholder="e.g. Counter data entry error, customer bank transfer bounced, duplicate payment record..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-rose-400"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setReversalTarget(null)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReversal}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md transition"
              >
                Confirm & Revert Entry
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
