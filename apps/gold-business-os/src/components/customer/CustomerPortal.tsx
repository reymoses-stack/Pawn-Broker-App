import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GoldLoan } from '../../types';
import {
  ShieldCheck,
  Coins,
  Scale,
  PlusCircle,
  TrendingUp,
  PackageCheck,
  Clock,
  QrCode,
  ShoppingBag,
  Activity,
  Calculator,
  Sparkles,
  ArrowUpRight,
  PhoneCall,
} from 'lucide-react';
import { LoanApplyModal } from './LoanApplyModal';
import { RepaymentModal } from './RepaymentModal';
import { SellGoldModal } from './SellGoldModal';

export const CustomerPortal: React.FC<{ onOpenCart: () => void }> = ({ onOpenCart }) => {
  const { currentCustomer, loans, coinProducts, addToCart, rates, orders, simulateRateTick, fetchLiveRates } = useApp();

  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [isSellOpen, setIsSellOpen] = useState(false);
  const [selectedLoanForRepay, setSelectedLoanForRepay] = useState<GoldLoan | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'RATES' | 'STORE' | 'ORDERS'>('OVERVIEW');

  // Instant Calculator State (as featured on risergold.in)
  const [calcGrams, setCalcGrams] = useState<number>(10);
  const [calcPurity, setCalcPurity] = useState<'24K' | '22K' | '18K' | '14K'>('22K');

  // Customer specific loans
  const myLoans = loans.filter((l) => l.customerId === currentCustomer.id);
  const totalPrincipal = myLoans
    .filter((l) => l.status === 'ACTIVE' || l.status === 'DUE')
    .reduce((sum, l) => sum + l.outstandingPrincipal, 0);
  const totalPledgedGrams = myLoans
    .filter((l) => l.status === 'ACTIVE' || l.status === 'DUE')
    .reduce((sum, l) => sum + l.totalNetWeight, 0);

  const customerOrders = orders.filter((o) => o.customerId === currentCustomer.id);

  // Calculate live estimate for instant calculator
  const selectedRate =
    calcPurity === '24K'
      ? rates.rate24kPerGram
      : calcPurity === '22K'
      ? rates.rate22kPerGram
      : calcPurity === '18K'
      ? rates.rate18kPerGram
      : rates.rate14kPerGram;

  const grossValuation = calcGrams * selectedRate;
  const scrapCashPayout = Math.round(grossValuation * (1 - 0.015)); // 1.5% refining loss
  const maxLoanDisbursal = Math.round(grossValuation * 0.75); // 75% LTV

  return (
    <div className="space-y-8 pb-16">
      {/* Apple White Liquid Glass Hero Card — Riser Gold Edition */}
      <div className="relative overflow-hidden rounded-3xl liquid-glass-gold p-6 md:p-8 shadow-xl border border-amber-300">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full liquid-glass-sub text-emerald-800 border border-emerald-300 text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> KYC Verified Customer
              </span>
              <span className="px-3 py-1 rounded-full liquid-glass-sub text-amber-800 border border-amber-300 text-xs font-mono font-semibold shadow-sm">
                CIBIL Score: {currentCustomer.cibilScore}
              </span>
              <a
                href="tel:+919150047900"
                className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-white/80 border border-slate-200 px-2.5 py-1 rounded-full hover:text-amber-800"
              >
                <PhoneCall className="w-3 h-3 text-amber-700" /> 91500 47900
              </a>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold font-serif-gold text-slate-900 tracking-wide">
              Namaste, <span className="gold-gradient-text">{currentCustomer.name}</span>
            </h1>
            <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
              Welcome to <strong className="text-slate-900">RISERGOLD</strong>. Experience transparent non-destructive XRF valuation, instant 75% LTV pledges, old gold selling, and certified 24K bullion delivery.
            </p>
          </div>

          {/* Quick Stats Glass Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="liquid-glass-sub p-4 rounded-2xl border border-slate-200/80">
              <span className="text-[11px] text-slate-500 block font-medium">Gold in Vault:</span>
              <span className="text-xl font-mono font-bold text-amber-800">
                {totalPledgedGrams.toFixed(1)} g
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">100% Insured Custody</span>
            </div>

            <div className="liquid-glass-sub p-4 rounded-2xl border border-slate-200/80">
              <span className="text-[11px] text-slate-500 block font-medium">Active Borrowing:</span>
              <span className="text-xl font-mono font-bold text-slate-900">
                ₹{totalPrincipal.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{myLoans.length} active loans</span>
            </div>

            <div className="liquid-glass-sub p-4 rounded-2xl col-span-2 sm:col-span-1 border border-slate-200/80">
              <span className="text-[11px] text-slate-500 block font-medium">Live 22K (916):</span>
              <span className="text-xl font-mono font-bold text-emerald-700">
                ₹{rates.rate22kPerGram.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">GoodReturns Feed</span>
            </div>
          </div>
        </div>

        {/* Quick Action Navigation Buttons */}
        <div className="mt-6 pt-6 border-t border-amber-900/10 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsApplyOpen(true)}
            className="flex items-center gap-2 liquid-glass-btn-primary px-5 py-2.5 rounded-full text-xs font-bold cursor-pointer shadow-md"
          >
            <PlusCircle className="w-4 h-4" />
            Apply for Gold Loan (Instant 75% LTV)
          </button>

          <button
            onClick={() => setIsSellOpen(true)}
            className="flex items-center gap-2 liquid-glass-btn-secondary text-amber-900 font-bold px-5 py-2.5 rounded-full text-xs cursor-pointer shadow-sm border border-amber-200"
          >
            <Scale className="w-4 h-4 text-amber-700" />
            Sell Old Gold Scrap (Instant Payout)
          </button>

          <button
            onClick={() => setActiveTab('RATES')}
            className="flex items-center gap-2 liquid-glass-btn-secondary text-slate-800 font-bold px-5 py-2.5 rounded-full text-xs cursor-pointer shadow-sm"
          >
            <Activity className="w-4 h-4 text-emerald-600" />
            Live Gold Rates (Tamil Nadu)
          </button>

          <button
            onClick={() => setActiveTab('STORE')}
            className="flex items-center gap-2 liquid-glass-btn-secondary text-slate-800 font-semibold px-5 py-2.5 rounded-full text-xs cursor-pointer shadow-sm"
          >
            <Coins className="w-4 h-4 text-amber-700" />
            Buy 24K Gold Coins
          </button>
        </div>
      </div>

      {/* Apple Style White Segmented Glass Pills */}
      <div className="flex liquid-glass-sub p-1.5 rounded-full max-w-fit space-x-1 text-xs font-semibold shadow-sm border border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'OVERVIEW'
              ? 'liquid-glass-btn-primary text-white font-bold shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> My Active Loans ({myLoans.length})
        </button>

        <button
          onClick={() => setActiveTab('RATES')}
          className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'RATES'
              ? 'liquid-glass-btn-primary text-white font-bold shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" /> Live Market Rates
        </button>

        <button
          onClick={() => setActiveTab('STORE')}
          className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'STORE'
              ? 'liquid-glass-btn-primary text-white font-bold shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Coins className="w-4 h-4" /> 24K Mint Store
        </button>

        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'ORDERS'
              ? 'liquid-glass-btn-primary text-white font-bold shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <PackageCheck className="w-4 h-4" /> Order Tracking ({customerOrders.length})
        </button>
      </div>

      {/* Tab Content: Live Market Rates & Instant Valuation Calculator */}
      {activeTab === 'RATES' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 font-serif-gold">
                  Live Gold Rates in Tamil Nadu
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  {rates.marketStatus}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Real-time bullion feed synced with GoodReturns & Riser Gold official benchmark. Rates updated at {rates.lastUpdated}.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => simulateRateTick()}
                className="liquid-glass-btn-secondary text-amber-900 px-4 py-2 rounded-full text-xs font-semibold cursor-pointer border border-amber-200 shadow-sm flex items-center gap-1.5 hover:bg-amber-50"
              >
                <Activity className="w-3.5 h-3.5 text-amber-700" />
                Simulate Market Tick
              </button>
              <button
                onClick={fetchLiveRates}
                className="liquid-glass-btn-primary px-4 py-2 rounded-full text-xs font-bold cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Sync Live Feed
              </button>
            </div>
          </div>

          {/* 4 Karat Rate Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 24 Karat */}
            <div className="liquid-glass rounded-3xl p-5 border border-amber-200/80 shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-mono">
                  24K (999 PURE)
                </span>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                    rates.changePercent24k >= 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {rates.changePercent24k >= 0 ? '▲ +' : '▼ '}
                  {rates.changePercent24k.toFixed(2)}%
                </span>
              </div>

              <div className="space-y-1 mb-4">
                <span className="text-[11px] text-slate-500 font-medium block">Rate Per Gram:</span>
                <div className="text-2xl font-mono font-bold text-slate-900">
                  ₹{rates.rate24kPerGram.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="liquid-glass-sub p-3 rounded-2xl space-y-2 text-xs divide-y divide-slate-100">
                <div className="flex justify-between items-center text-slate-600">
                  <span>1 Sovereign (8g):</span>
                  <span className="font-mono font-bold text-amber-800">
                    ₹{rates.ratePerSovereign24k.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600 pt-1.5">
                  <span>10 Grams:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    ₹{(rates.rate24kPerGram * 10).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1.5">
                  <span>Day High / Low:</span>
                  <span className="font-mono">
                    ₹{rates.highToday24k} / ₹{rates.lowToday24k}
                  </span>
                </div>
              </div>
            </div>

            {/* 22 Karat */}
            <div className="liquid-glass rounded-3xl p-5 border-2 border-amber-400 shadow-lg relative overflow-hidden bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500 text-white font-mono shadow-sm">
                  22K (916 HALLMARK)
                </span>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                    rates.changePercent22k >= 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {rates.changePercent22k >= 0 ? '▲ +' : '▼ '}
                  {rates.changePercent22k.toFixed(2)}%
                </span>
              </div>

              <div className="space-y-1 mb-4">
                <span className="text-[11px] text-amber-900 font-bold block">Rate Per Gram (Standard):</span>
                <div className="text-2xl font-mono font-bold text-amber-900">
                  ₹{rates.rate22kPerGram.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="liquid-glass-sub p-3 rounded-2xl space-y-2 text-xs divide-y divide-slate-100">
                <div className="flex justify-between items-center text-slate-800 font-medium">
                  <span className="text-amber-800 font-bold">1 Pavan (8g Sovereign):</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    ₹{rates.ratePerSovereign22k.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600 pt-1.5">
                  <span>10 Grams:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    ₹{(rates.rate22kPerGram * 10).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1.5">
                  <span>Day High / Low:</span>
                  <span className="font-mono">
                    ₹{rates.highToday22k} / ₹{rates.lowToday22k}
                  </span>
                </div>
              </div>
            </div>

            {/* 18 Karat */}
            <div className="liquid-glass rounded-3xl p-5 border border-slate-200/80 shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-mono">
                  18K (750 JEWELLERY)
                </span>
                <span className="text-[10px] text-slate-500 font-medium">75.0% Purity</span>
              </div>

              <div className="space-y-1 mb-4">
                <span className="text-[11px] text-slate-500 font-medium block">Rate Per Gram:</span>
                <div className="text-2xl font-mono font-bold text-slate-900">
                  ₹{rates.rate18kPerGram.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="liquid-glass-sub p-3 rounded-2xl space-y-2 text-xs divide-y divide-slate-100">
                <div className="flex justify-between items-center text-slate-600">
                  <span>1 Sovereign (8g):</span>
                  <span className="font-mono font-bold text-amber-800">
                    ₹{(rates.rate18kPerGram * 8).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600 pt-1.5">
                  <span>10 Grams:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    ₹{(rates.rate18kPerGram * 10).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1.5">
                  <span>Benchmark:</span>
                  <span className="font-mono">750 Hallmarked</span>
                </div>
              </div>
            </div>

            {/* 14 Karat */}
            <div className="liquid-glass rounded-3xl p-5 border border-slate-200/80 shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-mono">
                  14K (585 FASHION)
                </span>
                <span className="text-[10px] text-slate-500 font-medium">58.3% Purity</span>
              </div>

              <div className="space-y-1 mb-4">
                <span className="text-[11px] text-slate-500 font-medium block">Rate Per Gram:</span>
                <div className="text-2xl font-mono font-bold text-slate-900">
                  ₹{rates.rate14kPerGram.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="liquid-glass-sub p-3 rounded-2xl space-y-2 text-xs divide-y divide-slate-100">
                <div className="flex justify-between items-center text-slate-600">
                  <span>1 Sovereign (8g):</span>
                  <span className="font-mono font-bold text-amber-800">
                    ₹{(rates.rate14kPerGram * 8).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600 pt-1.5">
                  <span>10 Grams:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    ₹{(rates.rate14kPerGram * 10).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1.5">
                  <span>Benchmark:</span>
                  <span className="font-mono">585 Studded / Light</span>
                </div>
              </div>
            </div>
          </div>

          {/* "Know Your Value Before You Visit" Interactive Calculator */}
          <div className="liquid-glass rounded-3xl p-6 md:p-8 border border-amber-200 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-amber-700" />
                  <h3 className="text-lg font-bold font-serif-gold text-slate-900">
                    Know Your Value Before You Visit
                  </h3>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Featured calculator from Riser Gold. Calculate your exact pledge credit or cash payout with zero hidden deductions.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {(['24K', '22K', '18K', '14K'] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setCalcPurity(k)}
                    className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold transition cursor-pointer ${
                      calcPurity === k
                        ? 'liquid-glass-btn-primary text-white shadow'
                        : 'liquid-glass-sub text-slate-700 hover:text-amber-800'
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Gram Weight Controls */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-700">
                    Weight of Gold (Grams):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={calcGrams}
                      onChange={(e) => setCalcGrams(Math.max(0.1, parseFloat(e.target.value) || 0))}
                      className="w-24 px-3 py-1.5 rounded-xl border border-slate-300 text-right font-mono font-bold text-slate-900 bg-white/90 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                    />
                    <span className="text-xs font-mono text-slate-500">g</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="1"
                  max="120"
                  step="0.5"
                  value={calcGrams}
                  onChange={(e) => setCalcGrams(parseFloat(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />

                {/* Quick Presets (1 Pavan, 2 Pavans, etc.) */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-[11px] text-slate-500 self-center">Presets:</span>
                  {[
                    { label: '1g Coin', grams: 1 },
                    { label: '1 Pavan (8g)', grams: 8 },
                    { label: '2 Pavans (16g)', grams: 16 },
                    { label: '5 Pavans (40g)', grams: 40 },
                    { label: '10 Pavans (80g)', grams: 80 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => setCalcGrams(preset.grams)}
                      className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition cursor-pointer ${
                        calcGrams === preset.grams
                          ? 'bg-amber-600 text-white font-bold'
                          : 'liquid-glass-sub text-slate-600 hover:bg-amber-50'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="p-3.5 rounded-2xl liquid-glass-sub text-[11px] text-slate-600 space-y-1 border border-slate-200/80">
                  <p className="flex items-center gap-1.5 font-medium text-slate-800">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Tested using non-destructive German XRF Karatmeter
                  </p>
                  <p>
                    No stone weight counted • Pure gold net weight computed on calibrated Mettler Toledo scales.
                  </p>
                </div>
              </div>

              {/* Instant Valuation Results Glass Card */}
              <div className="liquid-glass-sub p-5 rounded-3xl border border-amber-200/80 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Gross Bullion Valuation:</span>
                    <span className="text-xl font-mono font-bold text-slate-900">
                      ₹{grossValuation.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-bold">
                    {calcGrams}g @ ₹{selectedRate}/g
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Option 1: Loan Disbursal */}
                  <div className="p-3.5 rounded-2xl bg-white/90 border border-emerald-200 shadow-sm space-y-2">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Max 75% Gold Loan LTV
                    </span>
                    <div className="text-lg font-mono font-bold text-emerald-700">
                      ₹{maxLoanDisbursal.toLocaleString('en-IN')}
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Retain ownership. Gold stays safely sealed in Riser Gold vault.
                    </p>
                    <button
                      onClick={() => setIsApplyOpen(true)}
                      className="w-full py-1.5 liquid-glass-btn-primary text-[11px] font-bold rounded-xl cursor-pointer shadow-sm flex items-center justify-center gap-1"
                    >
                      Pledge for Loan <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Option 2: Scrap Sale */}
                  <div className="p-3.5 rounded-2xl bg-white/90 border border-amber-200 shadow-sm space-y-2">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                      Instant Cash Payout (98.5%)
                    </span>
                    <div className="text-lg font-mono font-bold text-amber-900">
                      ₹{scrapCashPayout.toLocaleString('en-IN')}
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Transparent 1.5% refining margin. Direct IMPS/Cash payout.
                    </p>
                    <button
                      onClick={() => setIsSellOpen(true)}
                      className="w-full py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-[11px] font-bold rounded-xl cursor-pointer shadow-sm flex items-center justify-center gap-1"
                    >
                      Sell Scrap Gold <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Regional Store Locations */}
          <div className="liquid-glass rounded-3xl p-6 border border-slate-200/80 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h4 className="font-bold text-sm text-slate-900 font-serif-gold">
                  Riser Gold Branches & Assaying Centers
                </h4>
                <p className="text-xs text-slate-500">
                  Walk in for instant valuation, loan disbursal, and bullion delivery across Tamil Nadu.
                </p>
              </div>
              <a
                href="https://www.risergold.in"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-amber-800 hover:underline flex items-center gap-1"
              >
                Visit risergold.in <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="liquid-glass-sub p-3.5 rounded-2xl border border-amber-200">
                <span className="font-bold text-amber-900 block font-serif-gold">Tirunelveli (Head Office)</span>
                <p className="text-[11px] text-slate-600 mt-1">
                  5A/1, PVM Swamy, SH 40 7th St, Overhead Tank, Pattamadai - 627453
                </p>
                <a href="tel:+919150047900" className="text-[11px] text-amber-800 font-bold block mt-2 hover:underline">
                  +91 91500 47900
                </a>
              </div>

              <div className="liquid-glass-sub p-3.5 rounded-2xl border border-slate-200/80">
                <span className="font-bold text-slate-800 block font-serif-gold">Chennai Flagship</span>
                <p className="text-[11px] text-slate-600 mt-1">
                  T. Nagar Bullion Exchange & Loan Vault Center, Chennai
                </p>
                <a href="tel:+919150047900" className="text-[11px] text-slate-700 font-bold block mt-2 hover:underline">
                  +91 91500 47900
                </a>
              </div>

              <div className="liquid-glass-sub p-3.5 rounded-2xl border border-slate-200/80">
                <span className="font-bold text-slate-800 block font-serif-gold">Madurai Regional</span>
                <p className="text-[11px] text-slate-600 mt-1">
                  West Masi Street Branch & XRF Assaying Station, Madurai
                </p>
                <a href="tel:+919150047900" className="text-[11px] text-slate-700 font-bold block mt-2 hover:underline">
                  +91 91500 47900
                </a>
              </div>

              <div className="liquid-glass-sub p-3.5 rounded-2xl border border-slate-200/80">
                <span className="font-bold text-slate-800 block font-serif-gold">Coimbatore Hub</span>
                <p className="text-[11px] text-slate-600 mt-1">
                  Cross Cut Road Commercial Exchange, Coimbatore
                </p>
                <a href="tel:+919150047900" className="text-[11px] text-slate-700 font-bold block mt-2 hover:underline">
                  +91 91500 47900
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: 24K Gold Coin Store */}
      {activeTab === 'STORE' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-serif-gold">
                Riser Gold Mint — 24K 999 Pure Bullion
              </h2>
              <p className="text-xs text-slate-500">
                Swiss-standard certified bullion bars and coins with tamper-evident serial blister packaging.
              </p>
            </div>
            <button
              onClick={onOpenCart}
              className="inline-flex items-center gap-2 liquid-glass-btn-primary px-5 py-2.5 rounded-full text-xs font-bold cursor-pointer shadow-md"
            >
              <ShoppingBag className="w-4 h-4" />
              Open Bullion Cart
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {coinProducts.map((coin) => {
              const liveGoldPrice = coin.weightGrams * rates.rate24kPerGram;
              const subtotal = liveGoldPrice + coin.makingCharges;
              const tax = Math.round(subtotal * (rates.taxGstPercent / 100));
              const totalPrice = subtotal + tax;

              return (
                <div
                  key={coin.id}
                  className="liquid-glass liquid-interactive rounded-3xl overflow-hidden flex flex-col group shadow-lg"
                >
                  <div className="relative h-48 bg-slate-100 overflow-hidden">
                    <img
                      src={coin.image}
                      alt={coin.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute top-3 left-3 liquid-glass-btn-primary font-mono font-bold text-[10px] px-2.5 py-0.5 rounded-full shadow">
                      {coin.weightGrams}G • 999 PURE
                    </div>
                    {coin.hallmarkCertified && (
                      <div className="absolute top-3 right-3 liquid-glass-sub text-emerald-800 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1 shadow-sm">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" /> BIS Hallmarked
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{coin.name}</h4>
                      <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {coin.description}
                      </p>
                    </div>

                    <div className="liquid-glass-sub p-3 rounded-2xl space-y-1 text-xs">
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>Live Metal Value:</span>
                        <span className="font-mono text-slate-800 font-semibold">₹{liveGoldPrice.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>Making + GST:</span>
                        <span className="font-mono text-slate-800 font-semibold">₹{(coin.makingCharges + tax).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="pt-1.5 border-t border-slate-200/60 flex justify-between items-baseline">
                        <span className="text-[11px] font-bold text-amber-800">All-Inclusive:</span>
                        <span className="text-base font-mono font-bold text-emerald-700">
                          ₹{totalPrice.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => addToCart(coin)}
                      className="w-full py-2.5 liquid-glass-btn-primary font-bold text-xs rounded-full transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" /> Add to Cart
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab Content: Orders Tracking */}
      {activeTab === 'ORDERS' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-serif-gold">Bullion Orders & Armored Shipment</h2>
            <p className="text-xs text-slate-500">
              Track the end-to-end progress of your minted coin and bullion purchases.
            </p>
          </div>

          <div className="space-y-4">
            {customerOrders.map((ord) => (
              <div
                key={ord.id}
                className="liquid-glass rounded-3xl p-6 space-y-4 shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-sm font-mono font-bold text-amber-700">{ord.orderNumber}</span>
                    <span className="text-xs text-slate-500 ml-3">Placed on {ord.createdAt}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-800 liquid-glass-sub px-3.5 py-1 rounded-full self-start">
                    ₹{ord.totalAmount.toLocaleString('en-IN')} • PAID ({ord.paymentMethod})
                  </span>
                </div>

                {/* Items in order */}
                <div className="liquid-glass-sub p-3.5 rounded-2xl text-xs divide-y divide-slate-100">
                  {ord.items.map((it, idx) => (
                    <div key={idx} className="py-2 flex justify-between items-center text-slate-800">
                      <span className="font-medium">
                        {it.product.name} × {it.quantity}
                      </span>
                      <span className="font-mono text-slate-900 font-bold">₹{it.unitPrice * it.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Order Lifecycle Progress Bar */}
                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-slate-500 mb-2 block">
                    Shipment Status: <strong className="text-amber-700 uppercase">{ord.orderStatus.replace('_', ' ')}</strong> (Tracking: {ord.trackingNumber})
                  </span>

                  <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                    <div className="p-2.5 rounded-2xl liquid-glass-sub border border-emerald-300 text-emerald-800 font-bold bg-emerald-50/50">
                      1. Payment Verified
                    </div>
                    <div className={`p-2.5 rounded-2xl liquid-glass-sub font-bold ${
                      ord.orderStatus !== 'PENDING_PAYMENT' && ord.orderStatus !== 'PAID'
                        ? 'border border-emerald-300 text-emerald-800 bg-emerald-50/50'
                        : 'text-slate-400'
                    }`}>
                      2. Sealed in Vault
                    </div>
                    <div className={`p-2.5 rounded-2xl liquid-glass-sub font-bold ${
                      ord.orderStatus === 'SHIPPED' || ord.orderStatus === 'OUT_FOR_DELIVERY' || ord.orderStatus === 'DELIVERED'
                        ? 'border border-emerald-300 text-emerald-800 bg-emerald-50/50'
                        : 'text-slate-400'
                    }`}>
                      3. Armored Transit
                    </div>
                    <div className={`p-2.5 rounded-2xl liquid-glass-sub font-bold ${
                      ord.orderStatus === 'DELIVERED'
                        ? 'border border-emerald-300 text-emerald-800 bg-emerald-50/50'
                        : 'text-slate-400'
                    }`}>
                      4. Delivered
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals with White Liquid Glass */}
      <LoanApplyModal isOpen={isApplyOpen} onClose={() => setIsApplyOpen(false)} />
      <SellGoldModal isOpen={isSellOpen} onClose={() => setIsSellOpen(false)} />
      <RepaymentModal
        isOpen={!!selectedLoanForRepay}
        loan={selectedLoanForRepay}
        onClose={() => setSelectedLoanForRepay(null)}
      />
    </div>
  );
};
