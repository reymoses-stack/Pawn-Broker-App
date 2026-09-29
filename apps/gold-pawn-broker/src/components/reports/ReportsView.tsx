import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatWeight, formatDate } from '../../utils/formatters';
import { 
  BarChart3, Download, TrendingUp, Gem, 
  Receipt, Wallet, Users, Calendar, Filter, CheckCircle2, X 
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { 
    mortgages, 
    payments, 
    expenses, 
    customers, 
    packets, 
    currentBranch,
    users,
    language
  } = useApp();

  const [activeGroup, setActiveGroup] = useState<'Mortgage' | 'Interest' | 'Gold' | 'Collections' | 'Finance'>('Mortgage');
  const [periodPreset, setPeriodPreset] = useState<'all' | 'today' | 'thisMonth' | 'last30d' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const handlePeriodChange = (preset: 'all' | 'today' | 'thisMonth' | 'last30d' | 'custom') => {
    setPeriodPreset(preset);
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
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Filter datasets by branch and date window
  const branchMortgages = useMemo(() => {
    return mortgages.filter(m => {
      if (m.branchId !== currentBranch.id) return false;
      if (startDate && m.mortgageDate < startDate) return false;
      if (endDate && m.mortgageDate > endDate) return false;
      return true;
    });
  }, [mortgages, currentBranch.id, startDate, endDate]);

  const branchPayments = useMemo(() => {
    return payments.filter(p => {
      if (p.branchId !== currentBranch.id || p.status !== 'Completed') return false;
      if (startDate && p.paymentDate < startDate) return false;
      if (endDate && p.paymentDate > endDate) return false;
      return true;
    });
  }, [payments, currentBranch.id, startDate, endDate]);

  const branchExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (e.branchId !== currentBranch.id) return false;
      if (startDate && e.date < startDate) return false;
      if (endDate && e.date > endDate) return false;
      return true;
    });
  }, [expenses, currentBranch.id, startDate, endDate]);

  const branchPackets = useMemo(() => {
    return packets.filter(p => p.branchId === currentBranch.id);
  }, [packets, currentBranch.id]);

  // Totals
  const totalPrincipalDisbursed = branchMortgages.reduce((s, m) => s + m.principalAmount, 0);
  const activePrincipal = branchMortgages.filter(m => m.status !== 'Closed').reduce((s, m) => s + m.outstandingPrincipal, 0);
  const totalInterestCollected = branchPayments.reduce((s, p) => s + p.allocatedInterest, 0);
  const totalPrincipalRecovered = branchPayments.reduce((s, p) => s + p.allocatedPrincipal, 0);
  const totalExpenses = branchExpenses.reduce((s, e) => s + e.amount, 0);
  const netOperatingProfit = totalInterestCollected - totalExpenses;

  // Gold Metrics
  const activeItems = branchMortgages.filter(m => m.status !== 'Closed').flatMap(m => m.items);
  const totalNetGold = activeItems.reduce((s, i) => s + i.netWeight, 0);
  const totalGrossGold = activeItems.reduce((s, i) => s + i.grossWeight, 0);

  // Collections by Payment Method
  const methodBreakdown = branchPayments.reduce((acc, p) => {
    acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + p.amount;
    return acc;
  }, {} as Record<string, number>);

  // Staff-wise collections
  const staffBreakdown = branchPayments.reduce((acc, p) => {
    const staff = users.find(u => u.id === p.receivedBy);
    const name = staff ? staff.name : p.receivedBy;
    acc[name] = (acc[name] || 0) + p.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-5 text-slate-800">
      
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 liquid-glass-card p-5 rounded-3xl border border-amber-200/70 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-700" />
            <span>
              {language === 'ta' ? 'வணிக பகுப்பாய்வு & கிளை அறிக்கைகள்' : 'Reports, Audits & Branch Business Intelligence'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'ta'
              ? 'பிரிவு 18: அடகு நடவடிக்கைகள், தங்க நகை கையிருப்பு, வட்டி வசூல், மற்றும் நிதி லாப-நஷ்ட சுருக்கம்.'
              : 'Section 18: Operational pawn loans, gold collateral, interest collections, and financial P&L reporting.'}
          </p>
        </div>

        <span className="px-3 py-1.5 bg-amber-500/15 text-amber-950 font-mono text-xs rounded-xl border border-amber-300 font-extrabold shadow-2xs">
          Branch: {currentBranch.name} ({currentBranch.code})
        </span>
      </div>

      {/* Date Range & Period Filter Bar */}
      <div className="liquid-glass-card p-4 rounded-3xl border border-amber-200/70 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 text-[11px] font-bold mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-700" />
              <span>{language === 'ta' ? 'அறிக்கை காலம்:' : 'Report Timeframe:'}</span>
            </span>

            {[
              { id: 'all', labelEn: 'All-Time', labelTa: 'அனைத்து காலம்' },
              { id: 'today', labelEn: 'Today', labelTa: 'இன்று' },
              { id: 'thisMonth', labelEn: 'This Month', labelTa: 'இந்த மாதம்' },
              { id: 'last30d', labelEn: 'Last 30 Days', labelTa: 'கடந்த 30 நாட்கள்' },
              { id: 'custom', labelEn: 'Custom Window', labelTa: 'குறிப்பிட்ட தேதி' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => handlePeriodChange(p.id as any)}
                className={`px-3 py-1.5 rounded-xl font-bold transition text-xs ${
                  periodPreset === p.id
                    ? 'liquid-glass-gold text-amber-950 border border-amber-400/80 shadow-xs'
                    : 'bg-white/80 text-slate-600 border border-slate-200 hover:bg-white'
                }`}
              >
                {language === 'ta' ? p.labelTa : p.labelEn}
              </button>
            ))}
          </div>

          {/* Active Period Label */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500">
              {startDate || endDate ? (
                <span>
                  {language === 'ta' ? 'கால அளவு:' : 'Window:'} <strong className="text-amber-900 font-mono">{formatDate(startDate || 'Initial')} - {formatDate(endDate || todayStr)}</strong>
                </span>
              ) : (
                <span className="text-emerald-700 font-bold">
                  {language === 'ta' ? 'முழு வரலாற்று தரவு காட்டப்படுகிறது' : 'Showing complete historical lifetime records'}
                </span>
              )}
            </span>
            {(startDate || endDate) && (
              <button
                onClick={() => handlePeriodChange('all')}
                className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline px-2 py-1"
              >
                <X className="w-3 h-3" />
                <span>{language === 'ta' ? 'மீட்டமை' : 'Reset'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Custom Date Pickers (visible if custom or specific dates selected) */}
        {(periodPreset === 'custom' || startDate || endDate) && (
          <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-amber-100 text-xs">
            <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-amber-200/80 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500">{language === 'ta' ? 'தொடக்க தேதி:' : 'From:'}</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPeriodPreset('custom');
                }}
                className="text-xs text-slate-800 bg-transparent font-medium focus:outline-none"
              />
              <span className="text-[11px] font-bold text-slate-400">|</span>
              <span className="text-[11px] font-bold text-slate-500">{language === 'ta' ? 'முடிவு தேதி:' : 'To:'}</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPeriodPreset('custom');
                }}
                className="text-xs text-slate-800 bg-transparent font-medium focus:outline-none"
              />
            </div>
            <span className="text-[10px] text-slate-500 italic">
              {language === 'ta' ? '* அனைத்து 5 தாவல்களும் தேர்ந்தெடுக்கப்பட்ட தேதிக்கேற்ப மாறும்' : '* All 5 tabs recalculate live for the selected period'}
            </span>
          </div>
        )}
      </div>

      {/* Report Group Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-1 text-xs">
        {(['Mortgage', 'Interest', 'Gold', 'Collections', 'Finance'] as const).map(group => {
          const groupLabels: Record<string, string> = {
            Mortgage: language === 'ta' ? 'அடகு கடன்கள்' : 'Mortgage Report',
            Interest: language === 'ta' ? 'வட்டி வசூல்' : 'Interest Report',
            Gold: language === 'ta' ? 'தங்க நகை இருப்பு' : 'Gold Collateral',
            Collections: language === 'ta' ? 'வசூல் விவரம்' : 'Collections',
            Finance: language === 'ta' ? 'நிதி & லாபம்' : 'Finance & P&L'
          };

          return (
            <button
              key={group}
              onClick={() => setActiveGroup(group)}
              className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 shadow-2xs ${
                activeGroup === group
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black border border-amber-400 shadow-xs'
                  : 'bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <span>{groupLabels[group] || `${group} Report`}</span>
            </button>
          );
        })}
      </div>

      {/* GROUP 1: Mortgage Reports */}
      {activeGroup === 'Mortgage' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="p-3 sm:p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-bold tracking-wider block truncate">
                {language === 'ta' ? 'மொத்த அடகுகள்' : 'Total Pledges'}
              </span>
              <div className="text-lg sm:text-2xl font-black text-slate-900 font-mono mt-0.5 sm:mt-1">{branchMortgages.length}</div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 font-mono truncate">Disbursed: {formatCurrency(totalPrincipalDisbursed)}</div>
            </div>

            <div className="p-3 sm:p-4 bg-white rounded-2xl border border-amber-300 shadow-2xs bg-gradient-to-b from-amber-50/50 to-white">
              <span className="text-[9px] sm:text-[10px] text-amber-900 uppercase font-bold tracking-wider block truncate">
                {language === 'ta' ? 'நிலுவை அசல்' : 'Active Asal'}
              </span>
              <div className="text-base sm:text-2xl font-black text-amber-900 font-mono mt-0.5 sm:mt-1">{formatCurrency(activePrincipal)}</div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">{branchMortgages.filter(m => m.status === 'Active').length} accounts</div>
            </div>

            <div className="p-3 sm:p-4 bg-white rounded-2xl border border-rose-200/90 shadow-2xs bg-gradient-to-b from-rose-50/50 to-white">
              <span className="text-[9px] sm:text-[10px] text-rose-700 uppercase font-bold tracking-wider block truncate">
                {language === 'ta' ? 'தவணை தவறியவை' : 'Overdue'}
              </span>
              <div className="text-base sm:text-2xl font-black text-rose-700 font-mono mt-0.5 sm:mt-1">
                {branchMortgages.filter(m => m.status === 'Overdue').length}
              </div>
              <div className="text-[10px] sm:text-[11px] text-rose-800 font-mono mt-0.5 font-bold truncate">
                {formatCurrency(branchMortgages.filter(m => m.status === 'Overdue').reduce((s, m) => s + m.outstandingPrincipal, 0))}
              </div>
            </div>

            <div className="p-3 sm:p-4 bg-white rounded-2xl border border-emerald-200/90 shadow-2xs bg-gradient-to-b from-emerald-50/50 to-white">
              <span className="text-[9px] sm:text-[10px] text-emerald-800 uppercase font-bold tracking-wider block truncate">
                {language === 'ta' ? 'மீட்கப்பட்டவை' : 'Settled / Closed'}
              </span>
              <div className="text-base sm:text-2xl font-black text-emerald-700 font-mono mt-0.5 sm:mt-1">
                {branchMortgages.filter(m => m.status === 'Closed').length}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">Gold released</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs">
            <h4 className="font-black text-slate-900 text-xs mb-3 uppercase tracking-wider">
              {language === 'ta' ? 'அடகு நிலை விநியோகம்' : 'Pledge Status Distribution'}
            </h4>
            <div className="space-y-3 text-xs">
              {['Active', 'Due', 'Overdue', 'Renewed', 'Closed'].map(st => {
                const count = branchMortgages.filter(m => m.status === st).length;
                const pct = branchMortgages.length > 0 ? (count / branchMortgages.length) * 100 : 0;
                return (
                  <div key={st} className="space-y-1">
                    <div className="flex justify-between text-slate-700 font-medium">
                      <span className="font-bold">{st}</span>
                      <span className="font-mono text-slate-600">{count} pledges ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                      <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* GROUP 2: Interest Reports */}
      {activeGroup === 'Interest' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
            <div className="p-3 sm:p-4 bg-white rounded-2xl border border-emerald-200/90 shadow-2xs">
              <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-bold tracking-wider block truncate">
                {language === 'ta' ? 'வசூலிக்கப்பட்ட வட்டி' : 'Total Interest'}
              </span>
              <div className="text-base sm:text-2xl font-black text-emerald-700 font-mono mt-0.5 sm:mt-1">{formatCurrency(totalInterestCollected)}</div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">Direct income</div>
            </div>

            <div className="p-3 sm:p-4 bg-white rounded-2xl border border-amber-300 shadow-2xs">
              <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-bold tracking-wider block truncate">
                {language === 'ta' ? 'வர வேண்டிய வட்டி' : 'Accrued Interest'}
              </span>
              <div className="text-base sm:text-2xl font-black text-amber-900 font-mono mt-0.5 sm:mt-1">
                {formatCurrency(branchMortgages.reduce((s, m) => s + (m.outstandingInterest || 0), 0))}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">On active loans</div>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3 sm:p-4 bg-white rounded-2xl border border-rose-200 shadow-2xs">
              <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-bold tracking-wider block truncate">
                {language === 'ta' ? 'தாமத அபராதம்' : 'Overdue Penalties'}
              </span>
              <div className="text-base sm:text-2xl font-black text-rose-700 font-mono mt-0.5 sm:mt-1">
                {formatCurrency(branchPayments.reduce((s, p) => s + p.allocatedPenalties, 0))}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">Collected on late renewals</div>
            </div>
          </div>
        </div>
      )}

      {/* GROUP 3: Gold Inventory Reports */}
      {activeGroup === 'Gold' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
            <div className="p-3 sm:p-4 bg-white rounded-2xl border border-amber-300 shadow-2xs">
              <span className="text-[9px] sm:text-[10px] text-amber-950 uppercase font-bold tracking-wider block truncate">
                {language === 'ta' ? 'அடகு நிகர எடை' : 'Net Gold Weight'}
              </span>
              <div className="text-base sm:text-2xl font-black text-amber-900 font-mono mt-0.5 sm:mt-1">{formatWeight(totalNetGold)}</div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">{activeItems.length} ornaments</div>
            </div>

            <div className="p-3 sm:p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-bold tracking-wider block truncate">
                {language === 'ta' ? 'பெட்டக மொத்த எடை' : 'Gross Weight'}
              </span>
              <div className="text-base sm:text-2xl font-black text-slate-900 font-mono mt-0.5 sm:mt-1">{formatWeight(totalGrossGold)}</div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">With stones/mountings</div>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3 sm:p-4 bg-white rounded-2xl border border-emerald-200/90 shadow-2xs">
              <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-bold tracking-wider block truncate">
                {language === 'ta' ? 'பெட்டக பாக்கெட்டுகள்' : 'Packets in Vault'}
              </span>
              <div className="text-base sm:text-2xl font-black text-emerald-700 font-mono mt-0.5 sm:mt-1">
                {branchPackets.filter(p => p.status === 'In Locker').length}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">Stored in lockers</div>
            </div>
          </div>
        </div>
      )}

      {/* GROUP 4: Collections Reports */}
      {activeGroup === 'Collections' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200/90 p-5 rounded-3xl shadow-2xs space-y-3">
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">
                {language === 'ta' ? 'கட்டண முறை விநியோகம்' : 'Payment Method Distribution'}
              </h4>
              <div className="space-y-2 text-xs">
                {Object.entries(methodBreakdown).map(([mode, amt]) => (
                  <div key={mode} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-800">{mode}</span>
                    <span className="font-mono font-black text-emerald-700">{formatCurrency(amt)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 p-5 rounded-3xl shadow-2xs space-y-3">
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">
                {language === 'ta' ? 'பணியாளர் வாரியான வசூல் சுருக்கம்' : 'Staff-Wise Collection Summary'}
              </h4>
              <div className="space-y-2 text-xs">
                {Object.entries(staffBreakdown).map(([name, amt]) => (
                  <div key={name} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-800">{name}</span>
                    <span className="font-mono font-black text-amber-900">{formatCurrency(amt)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GROUP 5: Finance Reports */}
      {activeGroup === 'Finance' && (
        <div className="space-y-4">
          <div className="p-6 bg-white border border-slate-200/90 rounded-3xl shadow-2xs space-y-4">
            <h3 className="font-black text-slate-900 text-sm">
              {language === 'ta' ? 'கிளை லாப-நஷ்ட சுருக்கம் (பிரிவு 18 & 35)' : 'Branch Profit & Loss Summary (Section 18 & 35)'}
            </h3>

            <div className="space-y-2 text-xs divide-y divide-slate-100">
              <div className="flex justify-between py-2 text-emerald-700 font-bold">
                <span>{language === 'ta' ? 'மொத்த வட்டி மற்றும் கட்டண வருவாய்:' : 'Total Interest & Fee Revenue:'}</span>
                <span className="font-mono font-black">{formatCurrency(totalInterestCollected)}</span>
              </div>
              <div className="flex justify-between py-2 text-rose-700 font-bold">
                <span>{language === 'ta' ? 'பதிவு செய்யப்பட்ட இயக்கச் செலவுகள்:' : 'Total Recorded Operating Expenses:'}</span>
                <span className="font-mono font-black">({formatCurrency(totalExpenses)})</span>
              </div>
              <div className="flex justify-between py-3.5 text-base font-black text-slate-900 border-t-2 border-slate-200">
                <span>{language === 'ta' ? 'நிகர இயக்க லாபம்:' : 'Net Operating Profit:'}</span>
                <span className={`font-mono font-black ${netOperatingProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {formatCurrency(netOperatingProfit)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
