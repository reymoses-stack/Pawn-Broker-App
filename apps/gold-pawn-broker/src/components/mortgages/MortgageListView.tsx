import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Mortgage, MortgageStatus } from '../../types';
import { formatCurrency, formatWeight, formatDate, getRelativeDays } from '../../utils/formatters';
import { 
  Gem, Search, Plus, Filter, Clock, 
  AlertTriangle, CheckCircle2, History, ChevronRight,
  Calendar, RotateCcw, SlidersHorizontal, ArrowUpDown, X
} from 'lucide-react';

interface MortgageListViewProps {
  initialStatusFilter?: string;
}

export const MortgageListView: React.FC<MortgageListViewProps> = ({ initialStatusFilter = 'all' }) => {
  const { 
    mortgages, 
    customers, 
    setSelectedMortgage, 
    setIsNewMortgageOpen,
    currentBranch,
    language 
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Date & Advanced Filter states
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateField, setDateField] = useState<'mortgageDate' | 'maturityDate'>('mortgageDate');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [purityFilter, setPurityFilter] = useState('all');
  const [amountRange, setAmountRange] = useState<'all' | 'under25k' | '25k-50k' | '50k-100k' | 'above100k'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'principalDesc' | 'maturityAsc'>('newest');

  const branchMortgages = mortgages.filter(m => m.branchId === currentBranch.id);

  // Active filters count
  const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) +
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0) +
    (purityFilter !== 'all' ? 1 : 0) +
    (amountRange !== 'all' ? 1 : 0) +
    (searchQuery ? 1 : 0);

  const clearAllFilters = () => {
    setStatusFilter('all');
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setPurityFilter('all');
    setAmountRange('all');
    setSortBy('newest');
  };

  const filteredMortgages = useMemo(() => {
    return branchMortgages
      .filter(m => {
        const cust = customers.find(c => c.id === m.customerId);
        
        // Text Search
        const matchesSearch = 
          m.mortgageNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.customerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.packetId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (cust && cust.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (cust && cust.mobile.includes(searchQuery));

        if (!matchesSearch) return false;

        // Status Filter
        if (statusFilter !== 'all' && m.status.toLowerCase() !== statusFilter.toLowerCase()) {
          return false;
        }

        // Date Range Filter (based on selected date field)
        const targetDate = dateField === 'mortgageDate' ? m.mortgageDate : m.maturityDate;
        if (startDate && targetDate < startDate) return false;
        if (endDate && targetDate > endDate) return false;

        // Purity Filter
        if (purityFilter !== 'all') {
          const hasPurity = m.items.some(item => item.purity === purityFilter);
          if (!hasPurity) return false;
        }

        // Amount Range Filter
        if (amountRange !== 'all') {
          const p = m.outstandingPrincipal;
          if (amountRange === 'under25k' && p >= 25000) return false;
          if (amountRange === '25k-50k' && (p < 25000 || p > 50000)) return false;
          if (amountRange === '50k-100k' && (p < 50000 || p > 100000)) return false;
          if (amountRange === 'above100k' && p <= 100000) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return b.mortgageDate.localeCompare(a.mortgageDate);
        if (sortBy === 'oldest') return a.mortgageDate.localeCompare(b.mortgageDate);
        if (sortBy === 'principalDesc') return b.outstandingPrincipal - a.outstandingPrincipal;
        if (sortBy === 'maturityAsc') return a.maturityDate.localeCompare(b.maturityDate);
        return 0;
      });
  }, [branchMortgages, customers, searchQuery, statusFilter, dateField, startDate, endDate, purityFilter, amountRange, sortBy]);

  const totalOutstanding = filteredMortgages.reduce((sum, m) => sum + m.outstandingPrincipal, 0);

  // Quick Date Range Helpers
  const setQuickDate = (type: 'thisMonth' | 'last30Days' | 'clear') => {
    const today = new Date();
    if (type === 'clear') {
      setStartDate('');
      setEndDate('');
      return;
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
      setEndDate(today.toISOString().split('T')[0]);
    }
  };

  return (
    <div className="space-y-5 text-slate-800">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 liquid-glass-card p-5 rounded-3xl border border-amber-200/70 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Gem className="w-5 h-5 text-amber-600" />
            <span>{language === 'ta' ? 'அடகு கணக்குகள் பட்டியல்' : 'Gold Mortgage / Pledge Accounts'}</span>
          </h2>
          <p className="text-xs text-slate-500">
            {language === 'ta' 
              ? 'அடகு புத்தகங்கள், தவணை விவரங்கள், மற்றும் தங்க நகைகளின் முழுமையான தகவல்.' 
              : `Active loan books, due date horizons, renewals, and gold collateral records for ${currentBranch.name}.`}
          </p>
        </div>

        <button
          onClick={() => setIsNewMortgageOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-300 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/25 transition self-start sm:self-auto border border-white/50"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'ta' ? '+ புதிய அடகு' : '+ New Gold Pledge'}</span>
        </button>
      </div>

      {/* Primary Search & Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={language === 'ta' ? 'தேடு: அடகு எண், பெயர், மொபைல், பாக்கெட்...' : 'Search pledge no, customer, mobile, packet...'}
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
            {/* Advanced Filters Toggle Button */}
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
              <span>{language === 'ta' ? 'வடிப்பான்கள்' : 'Filters'}</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-mono text-[10px] font-black flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Clear All */}
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 px-2 py-1"
                title="Reset all applied filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{language === 'ta' ? 'அழி' : 'Clear'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {[
            { id: 'all', label: language === 'ta' ? 'அனைத்து அடகுகள்' : 'All Pledges' },
            { id: 'active', label: language === 'ta' ? 'செயலில் உள்ளவை' : 'Active' },
            { id: 'due', label: language === 'ta' ? 'இன்று தவணை' : 'Due Soon' },
            { id: 'overdue', label: language === 'ta' ? 'தவணை தவறியவை' : 'Overdue' },
            { id: 'renewed', label: language === 'ta' ? 'புதுப்பிக்கப்பட்டவை' : 'Renewed' },
            { id: 'closed', label: language === 'ta' ? 'மூடப்பட்டவை' : 'Closed' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition shadow-2xs ${
                statusFilter === f.id
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black border border-amber-400 shadow-xs'
                  : 'bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Expandable Advanced Filter Drawer */}
        {showAdvancedFilters && (
          <div className="p-4 rounded-3xl bg-white border border-amber-200/80 shadow-md space-y-3 animate-in fade-in duration-200">
            <div className="text-xs font-black text-slate-900 flex items-center gap-1.5 pb-2 border-b border-amber-100">
              <Filter className="w-3.5 h-3.5 text-amber-700" />
              <span>{language === 'ta' ? 'கூடுதல் வடிப்பான் தேர்வுகள்' : 'Advanced Mortgage Filters & Date Horizons'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              
              {/* Filter 1: Date Range */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {language === 'ta' ? 'தேதி வரம்பு' : 'Date Range'}
                  </label>
                  <select
                    value={dateField}
                    onChange={(e) => setDateField(e.target.value as any)}
                    className="text-[10px] font-bold text-amber-900 bg-amber-50 rounded px-1 border border-amber-200"
                  >
                    <option value="mortgageDate">{language === 'ta' ? 'அடகு தேதி' : 'Pledge Date'}</option>
                    <option value="maturityDate">{language === 'ta' ? 'தவணை தேதி' : 'Maturity Date'}</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                    placeholder="From"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                    placeholder="To"
                  />
                </div>
                <div className="flex items-center gap-1 pt-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setQuickDate('thisMonth')}
                    className="text-amber-800 hover:underline font-bold"
                  >
                    {language === 'ta' ? 'இந்த மாதம்' : 'This Month'}
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => setQuickDate('last30Days')}
                    className="text-amber-800 hover:underline font-bold"
                  >
                    {language === 'ta' ? '30 நாட்கள்' : 'Last 30d'}
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => setQuickDate('clear')}
                    className="text-slate-500 hover:underline"
                  >
                    {language === 'ta' ? 'நீக்கு' : 'Reset'}
                  </button>
                </div>
              </div>

              {/* Filter 2: Gold Purity */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  {language === 'ta' ? 'தங்கத் தரம் (Purity)' : 'Gold Purity'}
                </label>
                <select
                  value={purityFilter}
                  onChange={(e) => setPurityFilter(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
                >
                  <option value="all">{language === 'ta' ? 'அனைத்து தரமும்' : 'All Purities'}</option>
                  <option value="24K">24K Pure Gold (999)</option>
                  <option value="22K">22K 916 Hallmark</option>
                  <option value="20K">20K Hallmark</option>
                  <option value="18K">18K Hallmark</option>
                </select>
              </div>

              {/* Filter 3: Loan Amount Bracket */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  {language === 'ta' ? 'கடன் தொகை வரம்பு' : 'Loan Principal Bracket'}
                </label>
                <select
                  value={amountRange}
                  onChange={(e) => setAmountRange(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
                >
                  <option value="all">{language === 'ta' ? 'அனைத்து தொகைகளும்' : 'All Loan Amounts'}</option>
                  <option value="under25k">&lt; ₹25,000</option>
                  <option value="25k-50k">₹25,000 - ₹50,000</option>
                  <option value="50k-100k">₹50,000 - ₹1,00,000</option>
                  <option value="above100k">&gt; ₹1,00,000</option>
                </select>
              </div>

              {/* Filter 4: Sort Order */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  {language === 'ta' ? 'வரிசைப்படுத்து (Sort)' : 'Sort Order'}
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
                >
                  <option value="newest">{language === 'ta' ? 'புதியவை முதலில்' : 'Newest Pledge First'}</option>
                  <option value="oldest">{language === 'ta' ? 'பழையவை முதலில்' : 'Oldest Pledge First'}</option>
                  <option value="principalDesc">{language === 'ta' ? 'அதிக கடன் தொகை' : 'Principal: High to Low'}</option>
                  <option value="maturityAsc">{language === 'ta' ? 'அருகிலுள்ள தவணை' : 'Maturity: Closest First'}</option>
                </select>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Summary Strip */}
      <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-700 shadow-2xs">
        <div>
          {language === 'ta' ? 'காண்பிக்கப்படும் அடகுகள்: ' : 'Showing '}
          <strong className="text-slate-900 font-bold">{filteredMortgages.length}</strong>
          {language === 'ta' ? ` (மொத்தம் ${branchMortgages.length}-ல்)` : ` of ${branchMortgages.length} in this branch`}
        </div>
        <div>
          {language === 'ta' ? 'வடிகட்டப்பட்ட நிலுவை அசல்: ' : 'Filtered Outstanding Principal: '}
          <strong className="text-amber-950 font-mono font-black">{formatCurrency(totalOutstanding)}</strong>
        </div>
      </div>

      {/* Mortgage Table */}
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">{language === 'ta' ? 'அடகு எண்' : 'Pledge ID'}</th>
                <th className="py-3 px-4">{language === 'ta' ? 'வாடிக்கையாளர்' : 'Borrower'}</th>
                <th className="py-3 px-4">{language === 'ta' ? 'அடகு தேதி' : 'Pledge Date'}</th>
                <th className="py-3 px-4">{language === 'ta' ? 'தங்க நகைகள்' : 'Gold Items'}</th>
                <th className="py-3 px-4">{language === 'ta' ? 'நிகர எடை' : 'Net Wt'}</th>
                <th className="py-3 px-4">{language === 'ta' ? 'அசல் கடன்' : 'Principal Loan'}</th>
                <th className="py-3 px-4">{language === 'ta' ? 'தவணை தேதி' : 'Maturity / Due'}</th>
                <th className="py-3 px-4">{language === 'ta' ? 'பாக்கெட் / லாக்கர்' : 'Locker / Packet'}</th>
                <th className="py-3 px-4">{language === 'ta' ? 'நிலை' : 'Status'}</th>
                <th className="py-3 px-4 text-right">{language === 'ta' ? 'செயல்பாடு' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMortgages.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <CheckCircle2 className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-60" />
                    <p className="font-bold text-slate-700">{language === 'ta' ? 'பொருந்தும் அடகுகள் எதுவும் இல்லை' : 'No pledge accounts found'}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{language === 'ta' ? 'தேர்வு செய்த வடிப்பான்களை மாற்றவும் அல்லது அழிக்கவும்' : 'Try adjusting your search query, status pill, or date filters'}</p>
                  </td>
                </tr>
              ) : (
                filteredMortgages.map(m => {
                  const cust = customers.find(c => c.id === m.customerId);
                  const totalNet = m.items.reduce((s, i) => s + (i.netWeight || 0), 0);
                  const rel = getRelativeDays(m.maturityDate);

                  return (
                    <tr
                      key={m.id}
                      onClick={() => setSelectedMortgage(m)}
                      className="hover:bg-amber-50/40 cursor-pointer transition"
                    >
                      <td className="py-3 px-4 font-mono font-black text-amber-900">
                        {m.mortgageNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{cust?.name || m.customerId}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{cust?.mobile || ''}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {formatDate(m.mortgageDate)}
                      </td>
                      <td className="py-3 px-4 max-w-[160px]">
                        <span className="text-slate-800 font-medium truncate block">
                          {m.items.map(i => `${i.itemType} (${i.purity})`).join(', ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {formatWeight(totalNet)}
                      </td>
                      <td className="py-3 px-4 font-mono font-black text-slate-900">
                        {formatCurrency(m.outstandingPrincipal)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{formatDate(m.maturityDate)}</div>
                        <div className={`text-[10px] font-bold ${
                          rel.isPast ? 'text-rose-700' : rel.days === 0 ? 'text-amber-800' : 'text-slate-400'
                        }`}>
                          {rel.label}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {m.packetId}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          m.status === 'Active' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                          m.status === 'Overdue' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                          m.status === 'Due' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                          m.status === 'Renewed' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMortgage(m);
                          }}
                          className="px-3 py-1 bg-white hover:bg-amber-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-2xs transition"
                        >
                          {language === 'ta' ? 'திற' : 'Open'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
