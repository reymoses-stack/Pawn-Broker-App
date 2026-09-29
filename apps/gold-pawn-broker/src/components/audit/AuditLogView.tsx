import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDateTime } from '../../utils/formatters';
import { ShieldCheck, Search, Filter, Lock, Terminal, Download, CheckCircle2, ShieldAlert, FileText, ArrowRight, Calendar, X } from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const { auditLogs, currentBranch, language } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [staffFilter, setStaffFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const uniqueStaff = useMemo(() => {
    const set = new Set<string>();
    auditLogs.forEach(l => {
      if (l.userName) set.add(l.userName);
    });
    return Array.from(set).sort();
  }, [auditLogs]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (actionFilter !== 'ALL') count++;
    if (staffFilter !== 'ALL') count++;
    if (startDate) count++;
    if (endDate) count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [actionFilter, staffFilter, startDate, endDate, searchQuery]);

  const resetAllFilters = () => {
    setActionFilter('ALL');
    setStaffFilter('ALL');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
  };

  const setDatePreset = (preset: 'today' | 'last7d' | 'last30d' | 'all') => {
    const today = new Date();
    const todayFormatted = today.toISOString().split('T')[0];

    if (preset === 'today') {
      setStartDate(todayFormatted);
      setEndDate(todayFormatted);
    } else if (preset === 'last7d') {
      const past7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setStartDate(past7);
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

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        log.id.toLowerCase().includes(q) ||
        log.userName.toLowerCase().includes(q) ||
        log.entityId.toLowerCase().includes(q) ||
        (log.reason && log.reason.toLowerCase().includes(q));

      const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
      const matchesStaff = staffFilter === 'ALL' || log.userName === staffFilter;

      // Date check
      if (startDate && log.timestamp.split('T')[0] < startDate) return false;
      if (endDate && log.timestamp.split('T')[0] > endDate) return false;

      return matchesSearch && matchesAction && matchesStaff;
    });
  }, [auditLogs, searchQuery, actionFilter, staffFilter, startDate, endDate]);

  // Calculate statistics
  const financialEvents = auditLogs.filter(l => ['PAYMENT', 'REVERSAL', 'RENEWAL', 'CLOSURE'].includes(l.action)).length;
  const securityEvents = auditLogs.filter(l => ['CREATE', 'KYC_VERIFY', 'SETTINGS_CHANGE', 'RELEASE'].includes(l.action)).length;

  const exportAuditCsv = () => {
    const headers = ['Event ID', 'Timestamp', 'Staff User', 'Role', 'Action', 'Entity ID', 'Entity Type', 'Reason', 'Old Value', 'New Value', 'Device IP'];
    const rows = filteredLogs.map(l => [
      l.id,
      l.timestamp,
      `"${l.userName.replace(/"/g, '""')}"`,
      l.userRole,
      l.action,
      l.entityId,
      l.entityType,
      `"${(l.reason || '').replace(/"/g, '""')}"`,
      `"${(l.oldValue || '').replace(/"/g, '""')}"`,
      `"${(l.newValue || '').replace(/"/g, '""')}"`,
      l.deviceIp
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Audit_Trail_${currentBranch.code}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const actionBadgeStyles: Record<string, string> = {
    CREATE: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    UPDATE: 'bg-blue-50 text-blue-800 border-blue-200',
    APPROVE: 'bg-teal-50 text-teal-800 border-teal-200',
    PAYMENT: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-black',
    REVERSAL: 'bg-rose-50 text-rose-800 border-rose-200',
    RENEWAL: 'bg-amber-100 text-amber-950 border-amber-300',
    CLOSURE: 'bg-purple-50 text-purple-800 border-purple-200',
    RELEASE: 'bg-yellow-50 text-yellow-900 border-yellow-300',
    KYC_VERIFY: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    SETTINGS_CHANGE: 'bg-slate-100 text-slate-700 border-slate-300'
  };

  return (
    <div className="space-y-5 text-slate-800">
      
      {/* Top Header Card in Liquid Glass Aesthetic */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 liquid-glass-card p-5 rounded-3xl border border-amber-200/70 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-700" />
            <span>
              {language === 'ta' ? 'கணினி தணிக்கை & வணிக பதிவு' : 'Immutable Business & Security Audit Trail'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'ta' 
              ? 'பிரிவு 28 சட்ட அமலாக்கம்: அனைத்து அடகு, வட்டி வசூல், தங்க நகைகள் விடுவிப்பு மற்றும் கணினி மாற்றங்களின் மாற்ற இயலாத பதிவு.' 
              : 'Section 28 Compliance: Cryptographically verified immutable event ledger tracking every mutation, approval, and release.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={exportAuditCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/90 hover:bg-white text-slate-700 text-xs font-bold rounded-xl border border-amber-200/70 shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-amber-700" />
            <span>{language === 'ta' ? 'பதிவிறக்கு CSV' : 'Export CSV'}</span>
          </button>

          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 font-mono text-[11px] rounded-xl border border-emerald-200 font-black shadow-2xs flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>NO HARD DELETE</span>
          </span>
        </div>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white/90 border border-amber-200/60 shadow-2xs">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
            {language === 'ta' ? 'மொத்த தணிக்கை பதிவுகள்' : 'Total Audit Events'}
          </span>
          <div className="text-xl font-black text-slate-900 font-mono mt-1">
            {auditLogs.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 font-medium">100% Immutable trail</div>
        </div>

        <div className="p-4 rounded-2xl bg-white/90 border border-emerald-200/60 shadow-2xs">
          <span className="text-[10px] text-emerald-800 uppercase font-bold tracking-wider block">
            {language === 'ta' ? 'நிதி பதிவுகள்' : 'Financial Mutations'}
          </span>
          <div className="text-xl font-black text-emerald-700 font-mono mt-1">
            {financialEvents}
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5 font-medium">Payments, Renewals, Closures</div>
        </div>

        <div className="p-4 rounded-2xl bg-white/90 border border-blue-200/60 shadow-2xs">
          <span className="text-[10px] text-blue-800 uppercase font-bold tracking-wider block">
            {language === 'ta' ? 'பாதுகாப்பு & KYC' : 'Security & KYC'}
          </span>
          <div className="text-xl font-black text-blue-700 font-mono mt-1">
            {securityEvents}
          </div>
          <div className="text-[10px] text-blue-600 mt-0.5 font-medium">Aadhaar, Staff, Gold Release</div>
        </div>

        <div className="p-4 rounded-2xl bg-white/90 border border-amber-200/60 shadow-2xs">
          <span className="text-[10px] text-amber-900 uppercase font-bold tracking-wider block">
            {language === 'ta' ? 'செயல்பாட்டு கிளை' : 'Branch Scope'}
          </span>
          <div className="text-sm font-black text-slate-800 mt-1 truncate">
            {currentBranch.name}
          </div>
          <div className="text-[10px] text-amber-800/80 font-mono mt-0.5">{currentBranch.code} • Vault Online</div>
        </div>
      </div>

      {/* Search and Action Filter Bar */}
      <div className="liquid-glass-card p-4 rounded-3xl border border-amber-200/70 shadow-xs space-y-3">
        {/* Row 1: Search & Action Filter Pills */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={language === 'ta' ? 'தேடு: நிகழ்வு ID, பயனர், குறிப்பு...' : 'Search event ID, staff, entity, reason...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white/90 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-400 shadow-2xs font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {['ALL', 'CREATE', 'PAYMENT', 'REVERSAL', 'RENEWAL', 'CLOSURE', 'RELEASE', 'KYC_VERIFY', 'SETTINGS_CHANGE'].map(a => (
              <button
                key={a}
                onClick={() => setActionFilter(a)}
                className={`px-3 py-1.5 rounded-xl font-bold transition text-[11px] shadow-2xs ${
                  actionFilter === a
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black border border-amber-400 shadow-xs'
                    : 'bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {a === 'ALL' ? (language === 'ta' ? 'அனைத்தும்' : 'ALL') : a}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Date Filters, Presets, Staff Dropdown */}
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
              onClick={() => setDatePreset('last7d')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition"
            >
              {language === 'ta' ? 'கடந்த 7 நாட்கள்' : 'Last 7d'}
            </button>
            <button
              onClick={() => setDatePreset('last30d')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition"
            >
              {language === 'ta' ? 'கடந்த 30 நாட்கள்' : 'Last 30d'}
            </button>
          </div>

          {/* Staff User Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500">
              {language === 'ta' ? 'பணியாளர்:' : 'Staff:'}
            </span>
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-amber-200/80 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400/30"
            >
              <option value="ALL">{language === 'ta' ? 'அனைத்து பணியாளர்கள்' : 'All Staff Members'}</option>
              {uniqueStaff.map(st => (
                <option key={st} value={st}>{st}</option>
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
      </div>

      {/* Audit Log Table Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">{language === 'ta' ? 'நிகழ்வு ID' : 'Event ID'}</th>
                <th className="py-3 px-4">{language === 'ta' ? 'நேரம்' : 'Timestamp'}</th>
                <th className="py-3 px-4">{language === 'ta' ? 'பணியாளர் & பங்கு' : 'Staff User & Role'}</th>
                <th className="py-3 px-4">{language === 'ta' ? 'செயல்பாடு' : 'Action'}</th>
                <th className="py-3 px-4">{language === 'ta' ? 'குறிப்பு எண்' : 'Entity Ref'}</th>
                <th className="py-3 px-4">{language === 'ta' ? 'காரணம் & மாற்றப்பட்ட மதிப்பு' : 'Audit Reason & Value Delta'}</th>
                <th className="py-3 px-4 text-right">{language === 'ta' ? 'சாதன ஐபி' : 'Device IP'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-500 font-sans">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="font-bold text-slate-700">{language === 'ta' ? 'தணிக்கை பதிவுகள் எதுவும் பொருந்தவில்லை' : 'No matching audit events found'}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{language === 'ta' ? 'தேடல் அல்லது வடிப்பான்களை மாற்றவும்' : 'Try adjusting your search query or action filter'}</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  return (
                    <tr key={log.id} className="hover:bg-amber-50/40 transition">
                      <td className="py-3 px-4 text-amber-900 font-black">{log.id}</td>
                      <td className="py-3 px-4 text-slate-500 font-sans text-[11px] whitespace-nowrap">
                        {formatDateTime(log.timestamp)}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <div className="font-bold text-slate-900">{log.userName}</div>
                        <div className="text-[10px] text-slate-500 font-medium">{log.userRole}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${actionBadgeStyles[log.action] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div>{log.entityId}</div>
                        <div className="text-[9px] text-slate-400 font-sans">{log.entityType}</div>
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-700 max-w-sm">
                        <div className="font-medium text-slate-900">{log.reason}</div>
                        {(log.oldValue || log.newValue) && (
                          <div className="text-[10px] text-slate-500 mt-0.5 font-mono truncate">
                            {log.oldValue && <span className="text-rose-600 line-through mr-1 font-bold">{log.oldValue}</span>}
                            {log.newValue && <span className="text-emerald-700 font-bold">{log.newValue}</span>}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400 text-[11px]">
                        {log.deviceIp}
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
