import React, { useState } from 'react';
import { useApp, PortalType } from '../../context/AppContext';
import { Role } from '../../types';
import {
  Coins,
  Building2,
  TrendingUp,
  RefreshCw,
  Bell,
  User,
  ShoppingBag,
  Sliders,
  ChevronDown,
} from 'lucide-react';

export const Header: React.FC<{ onOpenCart: () => void }> = ({ onOpenCart }) => {
  const {
    activePortal,
    setActivePortal,
    activeRole,
    setActiveRole,
    rates,
    simulateRateTick,
    fetchLiveRates,
    toggleLiveStream,
    activeBranch,
    setActiveBranch,
    branches,
    notifications,
    markNotificationRead,
    cart,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const cartItemCount = cart.reduce((total, it) => total + it.quantity, 0);

  const portalConfigs: { id: PortalType; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'CUSTOMER',
      label: 'Customer Portal',
      icon: <User className="w-4 h-4 text-amber-600" />,
      desc: 'Gold Loans, Instant Pledges & 24K Bullion',
    },
    {
      id: 'STAFF',
      label: 'Branch Operations',
      icon: <Building2 className="w-4 h-4 text-emerald-600" />,
      desc: 'XRF Assaying, Vault Packets & Instant Cash',
    },
    {
      id: 'ADMIN',
      label: 'Admin / CEO Centre',
      icon: <Sliders className="w-4 h-4 text-purple-600" />,
      desc: 'GoodReturns Feed, Accounting & Branch Vaults',
    },
  ];

  const roles: { role: Role; label: string; desc: string }[] = [
    { role: 'CUSTOMER', label: 'Customer', desc: 'Rajeswari Sundaram' },
    { role: 'LOAN_OFFICER', label: 'Valuer / Loan Officer', desc: 'XRF Assaying & Approvals' },
    { role: 'VAULT_MANAGER', label: 'Vault Custodian', desc: 'Packet custody & QR' },
    { role: 'BRANCH_MANAGER', label: 'Branch Manager', desc: 'Disbursement & Authority' },
    { role: 'ACCOUNTANT', label: 'Chief Accountant', desc: 'General Ledger & P&L' },
    { role: 'SUPER_ADMIN', label: 'CEO / Super Admin', desc: 'Full business control' },
  ];

  const handlePortalChange = (portal: PortalType) => {
    setActivePortal(portal);
    if (portal === 'CUSTOMER') {
      setActiveRole('CUSTOMER');
    } else if (portal === 'STAFF' && activeRole === 'CUSTOMER') {
      setActiveRole('LOAN_OFFICER');
    } else if (portal === 'ADMIN' && (activeRole === 'CUSTOMER' || activeRole === 'LOAN_OFFICER')) {
      setActiveRole('SUPER_ADMIN');
    }
  };

  const isUptick = (rates.changePercent24k || 0) >= 0;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 liquid-glass shadow-lg">
      {/* Top Bullion & Live Market Rates Ticker (GoodReturns & Metals Feed) */}
      <div className="border-b border-slate-200/60 px-4 py-1.5 text-xs text-slate-700 bg-white/60">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${rates.isLiveStreaming ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${rates.isLiveStreaming ? 'bg-emerald-600' : 'bg-amber-500'}`}></span>
            </span>
            <span className="font-semibold text-slate-900 tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
              <span>GOODMETALS / GOODRETURNS LIVE RATE:</span>
            </span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
              isUptick ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {isUptick ? '▲' : '▼'} {Math.abs(rates.changePercent24k || 0.6)}%
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
            <div className="flex items-center gap-1.5 liquid-glass-sub px-3 py-0.5 rounded-full border border-slate-200 shadow-xs">
              <span className="text-amber-800 font-semibold">24K:</span>
              <span className="text-slate-900 font-bold">₹{rates.rate24kPerGram.toLocaleString('en-IN')}/g</span>
            </div>
            <div className="flex items-center gap-1.5 liquid-glass-sub px-3 py-0.5 rounded-full border border-slate-200 shadow-xs">
              <span className="text-amber-800 font-semibold">22K 916:</span>
              <span className="text-slate-900 font-bold">₹{rates.rate22kPerGram.toLocaleString('en-IN')}/g</span>
            </div>
            <div className="flex items-center gap-1.5 liquid-glass-sub px-3 py-0.5 rounded-full border border-slate-200 shadow-xs hidden sm:flex">
              <span className="text-amber-700 font-semibold">1 Pavan (8g):</span>
              <span className="text-slate-900 font-bold">₹{(rates.ratePerSovereign22k || rates.rate22kPerGram * 8).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center gap-1.5 liquid-glass-sub px-2.5 py-0.5 rounded-full border border-slate-200 shadow-xs hidden md:flex">
              <span className="text-emerald-700 font-semibold">Loan 75% LTV:</span>
              <span className="text-slate-900 font-bold">₹{rates.loanValuationRate22k.toLocaleString('en-IN')}/g</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleLiveStream}
              className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full border transition cursor-pointer font-medium ${
                rates.isLiveStreaming
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                  : 'bg-slate-100 text-slate-600 border-slate-300'
              }`}
              title="Toggle automatic market fluctuation stream"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${rates.isLiveStreaming ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'}`}></span>
              <span>{rates.isLiveStreaming ? 'Live Auto-Stream' : 'Stream Paused'}</span>
            </button>

            <button
              onClick={fetchLiveRates}
              className="inline-flex items-center gap-1 text-[11px] liquid-glass-btn-secondary text-amber-900 px-3 py-0.5 rounded-full transition cursor-pointer shadow-xs border border-amber-200/80"
              title="Sync latest live market feed from GoodReturns"
            >
              <RefreshCw className="w-2.5 h-2.5 text-amber-700" />
              <span>Sync Feed</span>
            </button>
            <span className="text-[11px] text-slate-500 hidden lg:inline">{rates.lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* Main White Liquid Glass Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Riser Gold Brand Logo */}
          <div className="flex items-center gap-3">
            <a
              href="https://www.risergold.in"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 group"
              title="Visit official website: www.risergold.in"
            >
              <div className="w-10 h-10 rounded-2xl liquid-glass-gold p-0.5 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform border border-amber-300">
                <div className="w-full h-full rounded-[14px] flex items-center justify-center bg-white/80">
                  <Coins className="w-5 h-5 text-amber-700" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif-gold text-xl font-bold tracking-wider text-slate-900">
                    RISER<span className="gold-gradient-text">GOLD</span>
                  </span>
                  <span className="text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    www.risergold.in
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  A Clearer Way to Value, Pledge & Sell Gold • Powered by The Nexus Lab
                </p>
              </div>
            </a>
          </div>

          {/* Apple visionOS Style White Liquid Glass Pill Navigation */}
          <div className="flex items-center liquid-glass-sub p-1 rounded-full shadow-inner border border-slate-200">
            {portalConfigs.map((portal) => (
              <button
                key={portal.id}
                onClick={() => handlePortalChange(portal.id)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activePortal === portal.id
                    ? 'liquid-glass-btn-primary text-white font-bold shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                {portal.icon}
                <span>{portal.label}</span>
              </button>
            ))}
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            {/* Branch Selector (Staff & Admin) */}
            {activePortal !== 'CUSTOMER' && (
              <div className="relative">
                <button
                  onClick={() => setShowBranchMenu(!showBranchMenu)}
                  className="flex items-center gap-1.5 liquid-glass-sub hover:border-slate-300 text-xs px-3 py-1.5 rounded-full text-slate-700 cursor-pointer transition shadow-sm"
                >
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="max-w-[120px] truncate font-medium">{activeBranch.name.split(' ')[0]}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showBranchMenu && (
                  <div className="absolute right-0 mt-2 w-64 liquid-glass rounded-2xl shadow-2xl p-2 z-50 border border-slate-200">
                    <p className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">Active Branch</p>
                    {branches.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          setActiveBranch(b);
                          setShowBranchMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition ${
                          activeBranch.id === b.id ? 'bg-amber-50 text-amber-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <p className="font-semibold">{b.name}</p>
                          <p className="text-[10px] text-slate-500">{b.city} • Vault: {(b.currentVaultHoldingGrams / 1000).toFixed(1)}kg</p>
                        </div>
                        <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded-full text-slate-600">{b.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2 liquid-glass-sub hover:border-amber-300 text-xs px-3 py-1.5 rounded-full text-slate-700 cursor-pointer transition shadow-sm"
              >
                <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[10px] border border-amber-300">
                  {activeRole[0]}
                </div>
                <div className="text-left hidden md:block">
                  <span className="block text-[11px] font-semibold leading-tight text-slate-900">
                    {roles.find((r) => r.role === activeRole)?.label || activeRole}
                  </span>
                  <span className="block text-[9px] text-amber-700 leading-none">Role</span>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-56 liquid-glass rounded-2xl shadow-2xl p-2 z-50 border border-slate-200">
                  <p className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">Simulate User Role</p>
                  {roles.map((r) => (
                    <button
                      key={r.role}
                      onClick={() => {
                        setActiveRole(r.role);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs transition ${
                        activeRole === r.role ? 'bg-amber-50 text-amber-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <p className="font-semibold">{r.label}</p>
                      <p className="text-[10px] text-slate-500">{r.desc}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bullion Cart Button (Customer Portal) */}
            {activePortal === 'CUSTOMER' && (
              <button
                onClick={onOpenCart}
                className="relative liquid-glass-btn-primary p-2.5 rounded-full cursor-pointer transition shadow-md"
                title="View Bullion Cart"
              >
                <ShoppingBag className="w-4 h-4 text-white" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white font-mono text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow">
                    {cartItemCount}
                  </span>
                )}
              </button>
            )}

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative liquid-glass-sub hover:bg-slate-50 text-slate-600 p-2 rounded-full transition cursor-pointer shadow-sm"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 liquid-glass rounded-2xl shadow-2xl p-3 z-50 border border-slate-200">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-amber-600" /> Notifications
                    </span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                      {unreadCount} Unread
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto mt-2">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={`py-2 text-xs cursor-pointer transition ${
                          n.read ? 'text-slate-400' : 'text-slate-800 font-medium'
                        }`}
                      >
                        <p className="font-semibold text-amber-800">{n.title}</p>
                        <p className="text-[11px] text-slate-600 mt-0.5">{n.message}</p>
                        <span className="text-[9px] text-slate-400 mt-1 block">{n.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
