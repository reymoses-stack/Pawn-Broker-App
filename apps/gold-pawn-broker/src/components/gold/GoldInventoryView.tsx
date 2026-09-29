import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { GoldPacket, PacketStatus } from '../../types';
import { formatCurrency, formatWeight, formatDate } from '../../utils/formatters';
import { 
  Gem, Lock, Search, QrCode, Printer, 
  ArrowRightLeft, CheckCircle2, AlertTriangle, Eye,
  Filter, X, SlidersHorizontal, ArrowUpDown, Scale
} from 'lucide-react';

export const GoldInventoryView: React.FC = () => {
  const { 
    packets, 
    mortgages, 
    customers, 
    lockers,
    movePacketLocation, 
    setReceiptModalData,
    setIsScannerModalOpen,
    setSelectedMortgage,
    currentBranch,
    language
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [lockerFilter, setLockerFilter] = useState<string>('all');
  const [weightRange, setWeightRange] = useState<string>('all');
  const [itemCountFilter, setItemCountFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [movingPacket, setMovingPacket] = useState<GoldPacket | null>(null);
  const [newLocation, setNewLocation] = useState('');
  const [moveReason, setMoveReason] = useState('');

  const branchPackets = useMemo(() => {
    return packets.filter(p => p.branchId === currentBranch.id);
  }, [packets, currentBranch.id]);

  const branchLockers = useMemo(() => {
    return lockers.filter(l => l.branchId === currentBranch.id);
  }, [lockers, currentBranch.id]);

  // Purity breakdown
  const branchMortgages = mortgages.filter(m => m.branchId === currentBranch.id && m.status !== 'Closed');
  const allActiveItems = branchMortgages.flatMap(m => m.items);

  const purityStats: Record<string, { weight: number; count: number; value: number }> = {
    '24K': { weight: 0, count: 0, value: 0 },
    '22K': { weight: 0, count: 0, value: 0 },
    '20K': { weight: 0, count: 0, value: 0 },
    '18K': { weight: 0, count: 0, value: 0 }
  };

  allActiveItems.forEach(item => {
    if (purityStats[item.purity]) {
      purityStats[item.purity].weight += item.netWeight;
      purityStats[item.purity].count += 1;
      purityStats[item.purity].value += item.marketValue;
    }
  });

  const totalVaultNetWeight = branchPackets
    .filter(p => p.status === 'In Locker')
    .reduce((sum, p) => sum + p.totalNetWeight, 0);

  const totalVaultGrossWeight = branchPackets
    .filter(p => p.status === 'In Locker')
    .reduce((sum, p) => sum + p.totalGrossWeight, 0);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (lockerFilter !== 'all') count++;
    if (weightRange !== 'all') count++;
    if (itemCountFilter !== 'all') count++;
    if (sortBy !== 'newest') count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [statusFilter, lockerFilter, weightRange, itemCountFilter, sortBy, searchQuery]);

  const resetAllFilters = () => {
    setStatusFilter('all');
    setLockerFilter('all');
    setWeightRange('all');
    setItemCountFilter('all');
    setSortBy('newest');
    setSearchQuery('');
  };

  const filteredPackets = useMemo(() => {
    return branchPackets.filter(p => {
      const cust = customers.find(c => c.id === p.customerId);
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        p.id.toLowerCase().includes(q) ||
        p.mortgageId.toLowerCase().includes(q) ||
        p.lockerId.toLowerCase().includes(q) ||
        (cust && cust.name.toLowerCase().includes(q)) ||
        (cust && cust.mobile.includes(q));

      if (!matchesSearch) return false;

      // Status
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;

      // Locker
      if (lockerFilter !== 'all' && p.lockerId !== lockerFilter) return false;

      // Weight range
      if (weightRange !== 'all') {
        const net = p.totalNetWeight;
        if (weightRange === 'under10g' && net >= 10) return false;
        if (weightRange === '10to25g' && (net < 10 || net > 25)) return false;
        if (weightRange === '25to50g' && (net <= 25 || net > 50)) return false;
        if (weightRange === 'above50g' && net <= 50) return false;
      }

      // Item count
      if (itemCountFilter === 'single' && p.itemCount !== 1) return false;
      if (itemCountFilter === 'multiple' && p.itemCount <= 1) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'netWeightDesc') {
        return b.totalNetWeight - a.totalNetWeight;
      }
      if (sortBy === 'netWeightAsc') {
        return a.totalNetWeight - b.totalNetWeight;
      }
      if (sortBy === 'packetId') {
        return a.id.localeCompare(b.id);
      }
      return 0;
    });
  }, [branchPackets, customers, searchQuery, statusFilter, lockerFilter, weightRange, itemCountFilter, sortBy]);

  const handleExecuteMove = () => {
    if (!movingPacket || !newLocation.trim() || !moveReason.trim()) {
      alert('Please fill in new location and reason');
      return;
    }
    movePacketLocation(movingPacket.id, newLocation, moveReason);
    setMovingPacket(null);
    setNewLocation('');
    setMoveReason('');
  };

  return (
    <div className="space-y-5 text-slate-800">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 liquid-glass-card p-5 rounded-3xl border border-amber-200/70 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-700" />
            <span>
              {language === 'ta' ? 'தங்க நகை பாதுகாப்பு பெட்டக கையிருப்பு' : 'Gold Custody, Vault & Packet Management'}
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            {language === 'ta'
              ? 'பாதுகாப்பு பெட்டகம், சீல் வைக்கப்பட்ட பாக்கெட்டுகள் மற்றும் இருப்பிட தணிக்கை வரலாறு.'
              : 'Physical safe inventory, tamper-evident security packets, and movement audit history.'}
          </p>
        </div>

        <button
          onClick={() => setIsScannerModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-300 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/25 transition self-start sm:self-auto border border-white/50"
        >
          <QrCode className="w-4 h-4" />
          <span>{language === 'ta' ? 'QR ஸ்கேனரை திற' : 'Open Packet Scanner'}</span>
        </button>
      </div>

      {/* Vault Weight & Purity Metrics Cards (Fitted into 2-column rows on mobile) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3.5">
        <div className="liquid-glass-card border border-amber-200/70 p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-xs">
          <div className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-bold truncate">
            {language === 'ta' ? 'அடகு நிகர எடை' : 'Total Net Gold'}
          </div>
          <div className="text-base sm:text-xl font-black text-amber-800 font-mono mt-0.5 sm:mt-1">
            {formatWeight(totalVaultNetWeight)}
          </div>
          <div className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 truncate">
            {language === 'ta' ? 'மொத்தம்:' : 'Gross:'} <strong className="text-slate-800">{formatWeight(totalVaultGrossWeight)}</strong>
          </div>
        </div>

        {Object.entries(purityStats).map(([purity, data]) => (
          <div key={purity} className="liquid-glass-card border border-amber-200/70 p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-xs">
            <div className="flex justify-between items-center text-[9px] sm:text-[10px] text-slate-500 uppercase font-bold">
              <span>{purity}</span>
              <span className="text-amber-800 font-bold bg-amber-500/15 px-1.5 py-0.2 rounded-full border border-amber-300/50 text-[9px] sm:text-[10px]">{data.count}</span>
            </div>
            <div className="text-sm sm:text-lg font-black text-slate-900 font-mono mt-0.5 sm:mt-1">
              {formatWeight(data.weight)}
            </div>
            <div className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 truncate">
              {language === 'ta' ? 'மதிப்பு:' : 'Est:'} <strong className="text-amber-800">{formatCurrency(data.value)}</strong>
            </div>
          </div>
        ))}
      </div>

      {/* COMPREHENSIVE FILTER TOOLBAR */}
      <div className="liquid-glass-card p-4 rounded-3xl border border-amber-200/70 shadow-xs space-y-3">
        {/* Row 1: Search & Status Pills */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={language === 'ta' ? 'பாக்கெட் எண், பெட்டகம், வாடிக்கையாளர்...' : 'Search packet ID, locker, customer, mortgage...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/90 border border-amber-200/70 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 shadow-xs font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto text-xs">
            {(['all', 'In Locker', 'Temporarily Removed', 'Released'] as const).map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-xl font-bold transition text-xs ${
                  statusFilter === f
                    ? 'liquid-glass-gold text-amber-950 border border-amber-400/80 shadow-xs'
                    : 'bg-white/80 text-slate-600 border border-slate-200 hover:bg-white'
                }`}
              >
                {f === 'all' 
                  ? (language === 'ta' ? 'அனைத்து பாக்கெட்டுகள்' : 'All Packets')
                  : f === 'In Locker' 
                  ? (language === 'ta' ? 'பெட்டகத்தில்' : 'In Locker')
                  : f === 'Temporarily Removed'
                  ? (language === 'ta' ? 'தற்காலிகமாக வெளியே' : 'Temporarily Removed')
                  : (language === 'ta' ? 'விடுவிக்கப்பட்டது' : 'Released')}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Secondary Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-amber-100 text-xs">
          
          {/* Locker Location Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500">
              {language === 'ta' ? 'பெட்டகம்:' : 'Locker:'}
            </span>
            <select
              value={lockerFilter}
              onChange={(e) => setLockerFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-amber-200/80 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400/30"
            >
              <option value="all">{language === 'ta' ? 'அனைத்து பெட்டகங்கள்' : 'All Lockers'}</option>
              {branchLockers.map(l => (
                <option key={l.id} value={l.lockerCode}>{l.name} ({l.lockerCode})</option>
              ))}
            </select>
          </div>

          {/* Weight Range Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500">
              {language === 'ta' ? 'எடை வரம்பு:' : 'Weight Range:'}
            </span>
            <select
              value={weightRange}
              onChange={(e) => setWeightRange(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-amber-200/80 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400/30"
            >
              <option value="all">{language === 'ta' ? 'அனைத்து எடைகளும்' : 'All Weights'}</option>
              <option value="under10g">{language === 'ta' ? '< 10 கிராம்' : '< 10 grams'}</option>
              <option value="10to25g">{language === 'ta' ? '10g - 25 கிராம்' : '10g - 25g'}</option>
              <option value="25to50g">{language === 'ta' ? '25g - 50 கிராம்' : '25g - 50g'}</option>
              <option value="above50g">{language === 'ta' ? '> 50 கிராம்' : '> 50 grams'}</option>
            </select>
          </div>

          {/* Item Count Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500">
              {language === 'ta' ? 'நகைகள் எண்ணிக்கை:' : 'Item Count:'}
            </span>
            <select
              value={itemCountFilter}
              onChange={(e) => setItemCountFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-amber-200/80 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400/30"
            >
              <option value="all">{language === 'ta' ? 'அனைத்தும்' : 'All Counts'}</option>
              <option value="single">{language === 'ta' ? 'ஒற்றை நகை (1)' : 'Single Item (1)'}</option>
              <option value="multiple">{language === 'ta' ? 'பல நகைகள் (2+)' : 'Multiple Items (2+)'}</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-amber-200/80 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400/30"
            >
              <option value="newest">{language === 'ta' ? 'புதியது முதலில்' : 'Newest First'}</option>
              <option value="oldest">{language === 'ta' ? 'பழையது முதலில்' : 'Oldest First'}</option>
              <option value="netWeightDesc">{language === 'ta' ? 'அதிக எடை முதலில்' : 'Highest Net Weight'}</option>
              <option value="netWeightAsc">{language === 'ta' ? 'குறைந்த எடை முதலில்' : 'Lowest Net Weight'}</option>
              <option value="packetId">{language === 'ta' ? 'பாக்கெட் வரிசை' : 'Packet ID (A-Z)'}</option>
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

      {/* Packets Inventory: Mobile 2-Column Cards + Desktop Table */}
      
      {/* Mobile 2-Column Grid (md:hidden) */}
      <div className="grid grid-cols-2 gap-2 md:hidden">
        {filteredPackets.map(pkt => {
          const mort = mortgages.find(m => m.id === pkt.mortgageId);
          const cust = customers.find(c => c.id === pkt.customerId);

          return (
            <div 
              key={pkt.id} 
              className="liquid-glass-card rounded-2xl p-2.5 border border-amber-200/80 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-1 mb-1">
                  <span className="font-mono font-black text-amber-800 text-[11px] truncate">
                    {pkt.id}
                  </span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold border shrink-0 ${
                    pkt.status === 'In Locker'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : pkt.status === 'Temporarily Removed'
                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}>
                    {pkt.status === 'In Locker' ? 'Vault' : pkt.status}
                  </span>
                </div>

                <div className="text-[10px] font-bold text-slate-900 truncate">
                  {pkt.lockerId} • {pkt.tray}
                </div>
                <div className="text-[10px] text-slate-600 truncate mt-0.5">
                  {cust?.name || pkt.customerId}
                </div>
                
                <div className="mt-1.5 pt-1 border-t border-amber-100 flex items-center justify-between">
                  <span className="text-[9px] text-slate-400 font-semibold">{pkt.itemCount} items</span>
                  <span className="font-mono font-bold text-emerald-700 text-xs">{formatWeight(pkt.totalNetWeight)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-1 mt-2 pt-1.5 border-t border-amber-100">
                <button
                  type="button"
                  onClick={() => setReceiptModalData({ type: 'packet_tag', packet: pkt, mortgage: mort, customer: cust })}
                  className="p-1 bg-white hover:bg-slate-50 text-amber-800 rounded-lg text-xs font-bold border border-slate-200 shadow-xs transition flex-1 flex justify-center"
                  title="Print Tag"
                >
                  <Printer className="w-3 h-3" />
                </button>

                {pkt.status === 'In Locker' && (
                  <button
                    type="button"
                    onClick={() => setMovingPacket(pkt)}
                    className="p-1 bg-white hover:bg-slate-50 text-blue-700 rounded-lg text-xs font-bold border border-slate-200 shadow-xs transition flex-1 flex justify-center"
                    title="Move"
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                  </button>
                )}

                {mort && (
                  <button
                    type="button"
                    onClick={() => setSelectedMortgage(mort)}
                    className="p-1 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 shadow-xs transition flex-1 flex justify-center"
                    title="View"
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table (hidden md:block) */}
      <div className="hidden md:block liquid-glass-card rounded-3xl border border-amber-200/70 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-amber-500/10 text-slate-700 uppercase text-[10px] tracking-wider font-extrabold border-b border-amber-200/60">
              <tr>
                <th className="py-3 px-4">Packet ID</th>
                <th className="py-3 px-4">Locker & Tray</th>
                <th className="py-3 px-4">Pledge Ref</th>
                <th className="py-3 px-4">Borrower</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Gross Wt</th>
                <th className="py-3 px-4">Net Wt</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {filteredPackets.map(pkt => {
                const mort = mortgages.find(m => m.id === pkt.mortgageId);
                const cust = customers.find(c => c.id === pkt.customerId);

                return (
                  <tr key={pkt.id} className="hover:bg-amber-50/50 transition">
                    <td className="py-3.5 px-4 font-mono font-black text-amber-800">
                      {pkt.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{pkt.lockerId}</div>
                      <div className="text-[10px] text-slate-500">{pkt.rack} • {pkt.tray} {pkt.bin ? `• ${pkt.bin}` : ''}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {pkt.mortgageId}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{cust?.name || pkt.customerId}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-700">
                      {pkt.itemCount} ornaments
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {formatWeight(pkt.totalGrossWeight)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                      {formatWeight(pkt.totalNetWeight)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        pkt.status === 'In Locker'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : pkt.status === 'Temporarily Removed'
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}>
                        {pkt.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setReceiptModalData({ type: 'packet_tag', packet: pkt, mortgage: mort, customer: cust })}
                          className="p-1.5 bg-white hover:bg-slate-50 text-amber-800 rounded-xl text-xs font-bold border border-slate-200 shadow-xs transition"
                          title="Print QR Sticker Tag"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {pkt.status === 'In Locker' && (
                          <button
                            onClick={() => setMovingPacket(pkt)}
                            className="p-1.5 bg-white hover:bg-slate-50 text-blue-700 rounded-xl text-xs font-bold border border-slate-200 shadow-xs transition"
                            title="Move Location / Audit"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {mort && (
                          <button
                            onClick={() => setSelectedMortgage(mort)}
                            className="p-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-xs transition"
                            title="View Pledge"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Move Packet Modal */}
      {movingPacket && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="liquid-glass-modal border border-amber-200/80 w-full max-w-md rounded-3xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">Relocate Gold Packet</h3>
              </div>
              <span className="font-mono font-black text-amber-800 text-xs">{movingPacket.id}</span>
            </div>

            <div className="p-3.5 bg-white/80 rounded-2xl border border-amber-200/70 text-xs space-y-1 shadow-xs">
              <div>Current Location: <strong className="text-slate-800">{movingPacket.lockerId} / {movingPacket.rack} / {movingPacket.tray}</strong></div>
              <div>Net Weight: <strong className="font-mono font-bold text-emerald-700">{formatWeight(movingPacket.totalNetWeight)}</strong></div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">New Locker Coordinates *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SAFE-A / Rack 4 / Tray 03"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-amber-200/80 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400/40 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Audit Reason for Relocation *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual audit reorganization / Tray capacity adjustment"
                  value={moveReason}
                  onChange={(e) => setMoveReason(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-amber-200/80 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400/40 font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMovingPacket(null)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-bold bg-white rounded-xl border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteMove}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition"
              >
                Record Movement & Update Audit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
