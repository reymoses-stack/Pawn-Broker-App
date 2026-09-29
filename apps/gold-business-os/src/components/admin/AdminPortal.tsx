import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LoanProduct } from '../../types';
import {
  TrendingUp,
  Sliders,
  Building2,
  FileSpreadsheet,
  History,
  Coins,
  Gavel,
  PieChart,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const AdminPortal: React.FC = () => {
  const {
    rates,
    updateRates,
    fetchLiveRates,
    simulateRateTick,
    toggleLiveStream,
    branches,
    loans,
    loanProducts,
    addLoanProduct,
    chartOfAccounts,
    journalEntries,
    auditLogs,
    purchases,
    orders,
  } = useApp();

  const [adminTab, setAdminTab] = useState<
    'DASHBOARD' | 'PRICING' | 'PRODUCTS' | 'ACCOUNTING' | 'BRANCHES' | 'AUCTION' | 'AUDIT'
  >('DASHBOARD');

  // Pricing Engine local form
  const [pricingForm, setPricingForm] = useState({ ...rates });

  // Sync pricingForm when rates update
  React.useEffect(() => {
    setPricingForm({ ...rates });
  }, [rates]);

  // New Loan Product form
  const [newProdName, setNewProdName] = useState('');
  const [newProdTenure, setNewProdTenure] = useState(12);
  const [newProdRate, setNewProdRate] = useState(10.5);
  const [newProdLtv, setNewProdLtv] = useState(75);
  const [newProdRepayment, setNewProdRepayment] = useState<'BULLET' | 'MONTHLY_INTEREST' | 'EMI'>('BULLET');

  // Aggregates for CEO Dashboard
  const totalLoanBook = loans.reduce((sum, l) => sum + l.outstandingPrincipal, 0);
  const totalGoldVaultGrams = branches.reduce((sum, b) => sum + b.currentVaultHoldingGrams, 0);
  const totalCoinRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  const overdueLoans = loans.filter((l) => l.status === 'DUE' || l.status === 'OVERDUE');

  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    updateRates(pricingForm);
    confetti({ particleCount: 40 });
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName) return;
    const prod: LoanProduct = {
      id: 'prod-' + Date.now(),
      name: newProdName,
      tenureMonths: newProdTenure,
      interestRatePerAnnum: newProdRate,
      maxLtvPercent: newProdLtv,
      processingFeePercent: 0.5,
      repaymentType: newProdRepayment,
      gracePeriodDays: 7,
      penalInterestPercent: 2.0,
    };
    addLoanProduct(prod);
    setNewProdName('');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Apple Style Segmented White Liquid Glass Navigation */}
      <div className="flex liquid-glass-sub p-1.5 rounded-full space-x-1 text-xs font-semibold overflow-x-auto shadow-sm border border-slate-200">
        <button
          onClick={() => setAdminTab('DASHBOARD')}
          className={`px-4 py-2 rounded-full transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            adminTab === 'DASHBOARD'
              ? 'liquid-glass-btn-primary text-white font-bold shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <PieChart className="w-4 h-4" /> CEO Command Center
        </button>

        <button
          onClick={() => setAdminTab('PRICING')}
          className={`px-4 py-2 rounded-full transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            adminTab === 'PRICING'
              ? 'liquid-glass-btn-primary text-white font-bold shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" /> Gold Pricing Engine
        </button>

        <button
          onClick={() => setAdminTab('ACCOUNTING')}
          className={`px-4 py-2 rounded-full transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            adminTab === 'ACCOUNTING'
              ? 'liquid-glass-btn-primary text-white font-bold shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" /> General Ledger & P&L
        </button>

        <button
          onClick={() => setAdminTab('PRODUCTS')}
          className={`px-4 py-2 rounded-full transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            adminTab === 'PRODUCTS'
              ? 'liquid-glass-btn-primary text-white font-bold shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Coins className="w-4 h-4" /> Loan Products & LTV
        </button>

        <button
          onClick={() => setAdminTab('BRANCHES')}
          className={`px-4 py-2 rounded-full transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            adminTab === 'BRANCHES'
              ? 'liquid-glass-btn-primary text-white font-bold shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" /> Branches & Vault Safes
        </button>

        <button
          onClick={() => setAdminTab('AUCTION')}
          className={`px-4 py-2 rounded-full transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            adminTab === 'AUCTION'
              ? 'liquid-glass-btn-primary text-white font-bold shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Gavel className="w-4 h-4" /> Overdue & Default Auction
        </button>

        <button
          onClick={() => setAdminTab('AUDIT')}
          className={`px-4 py-2 rounded-full transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            adminTab === 'AUDIT'
              ? 'liquid-glass-btn-primary text-white font-bold shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" /> Immutable Audit Trail
        </button>
      </div>

      {/* TAB 1: CEO Executive Dashboard */}
      {adminTab === 'DASHBOARD' && (
        <div className="space-y-6">
          {/* Top Macro Metric Cards with White Liquid Glass */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="liquid-glass liquid-interactive rounded-3xl p-6 space-y-2 shadow-md">
              <span className="text-xs font-semibold text-slate-500 block">Total Active Loan Book</span>
              <div className="text-3xl font-mono font-bold text-slate-900">
                ₹{(totalLoanBook / 100000).toFixed(2)} Lakhs
              </div>
              <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> +14.2% MoM Portfolio Growth
              </p>
            </div>

            <div className="liquid-glass-gold liquid-interactive rounded-3xl p-6 space-y-2 shadow-md">
              <span className="text-xs font-semibold text-amber-900/80 block">Physical Vault Holdings</span>
              <div className="text-3xl font-mono font-bold text-amber-800">
                {(totalGoldVaultGrams / 1000).toFixed(2)} kg Gold
              </div>
              <p className="text-[11px] text-slate-600 font-medium">
                Insured at ₹{((totalGoldVaultGrams * rates.rate24kPerGram) / 10000000).toFixed(2)} Cr market value
              </p>
            </div>

            <div className="liquid-glass liquid-interactive rounded-3xl p-6 space-y-2 shadow-md">
              <span className="text-xs font-semibold text-slate-500 block">Bullion Store Revenue</span>
              <div className="text-3xl font-mono font-bold text-emerald-700">
                ₹{(totalCoinRevenue / 100000).toFixed(2)} Lakhs
              </div>
              <p className="text-[11px] text-slate-500">{orders.length} online orders fulfilled</p>
            </div>

            <div className="liquid-glass liquid-interactive rounded-3xl p-6 space-y-2 shadow-md">
              <span className="text-xs font-semibold text-slate-500 block">Overdue / NPA Risk Exposure</span>
              <div className="text-3xl font-mono font-bold text-red-600">
                ₹{overdueLoans.reduce((sum, l) => sum + l.outstandingPrincipal, 0).toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-amber-700 font-medium">{overdueLoans.length} accounts in watch state</p>
            </div>
          </div>

          {/* Branch Performance Comparison in White Liquid Glass */}
          <div className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 font-serif-gold">
              Multi-Branch Operational Performance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {branches.map((b) => (
                <div key={b.id} className="liquid-glass-sub p-5 rounded-2xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{b.name}</h4>
                      <p className="text-[11px] text-slate-500">{b.city}</p>
                    </div>
                    <span className="text-[10px] font-mono liquid-glass px-2.5 py-0.5 rounded-full text-amber-800 font-bold">
                      {b.code}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Vault Holding:</span>
                      <span className="font-mono text-amber-800 font-bold">
                        {(b.currentVaultHoldingGrams / 1000).toFixed(1)} kg
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Counter Cash:</span>
                      <span className="font-mono text-emerald-700 font-bold">
                        ₹{(b.currentCashBalance / 100000).toFixed(1)}L
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Staff On Duty:</span>
                      <span className="text-slate-800 font-medium">{b.activeStaffCount} officers</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Gold Pricing Engine */}
      {adminTab === 'PRICING' && (
        <form onSubmit={handleSaveRates} className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/60">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 font-serif-gold">
                  Riser Gold & GoodReturns Pricing Engine
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {rates.marketStatus}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Benchmark feed: {rates.source}. Synchronized at {rates.lastUpdated}. Changes propagate instantly across portals.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={toggleLiveStream}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition flex items-center gap-1.5 ${
                  rates.isLiveStreaming
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'liquid-glass-sub text-slate-700 border-slate-300'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${rates.isLiveStreaming ? 'bg-white animate-ping' : 'bg-slate-400'}`} />
                {rates.isLiveStreaming ? 'Live Streaming: ON' : 'Live Streaming: OFF'}
              </button>

              <button
                type="button"
                onClick={() => simulateRateTick()}
                className="liquid-glass-btn-secondary text-amber-900 px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer border border-amber-300 shadow-sm flex items-center gap-1"
              >
                <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
                Simulate Fluctuation
              </button>

              <button
                type="button"
                onClick={fetchLiveRates}
                className="liquid-glass-btn-primary text-white px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer shadow-md flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Sync GoodReturns
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                24K Pure Gold (₹/gram)
              </label>
              <input
                type="number"
                value={pricingForm.rate24kPerGram}
                onChange={(e) => {
                  const val24 = Number(e.target.value);
                  setPricingForm({
                    ...pricingForm,
                    rate24kPerGram: val24,
                    rate22kPerGram: Math.round(val24 * 0.9166),
                    rate18kPerGram: Math.round(val24 * 0.7725),
                    rate14kPerGram: Math.round(val24 * 0.5833),
                    loanValuationRate22k: Math.round(val24 * 0.9166 * 0.75),
                    ratePerSovereign24k: Math.round(val24 * 8),
                    ratePerSovereign22k: Math.round(val24 * 0.9166 * 8),
                  });
                }}
                className="w-full liquid-glass-sub rounded-2xl p-3.5 text-sm font-mono font-bold text-slate-900 outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Sovereign (8g): ₹{(pricingForm.rate24kPerGram * 8).toLocaleString('en-IN')}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                22K 916 Hallmark (₹/gram)
              </label>
              <input
                type="number"
                value={pricingForm.rate22kPerGram}
                onChange={(e) => setPricingForm({ ...pricingForm, rate22kPerGram: Number(e.target.value) })}
                className="w-full liquid-glass-sub rounded-2xl p-3.5 text-sm font-mono font-bold text-amber-800 outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                1 Pavan (8g): ₹{(pricingForm.rate22kPerGram * 8).toLocaleString('en-IN')}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                18K 750 Jewellery (₹/gram)
              </label>
              <input
                type="number"
                value={pricingForm.rate18kPerGram}
                onChange={(e) => setPricingForm({ ...pricingForm, rate18kPerGram: Number(e.target.value) })}
                className="w-full liquid-glass-sub rounded-2xl p-3.5 text-sm font-mono font-semibold text-slate-800 outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Sovereign (8g): ₹{(pricingForm.rate18kPerGram * 8).toLocaleString('en-IN')}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                14K 585 Fashion (₹/gram)
              </label>
              <input
                type="number"
                value={pricingForm.rate14kPerGram}
                onChange={(e) => setPricingForm({ ...pricingForm, rate14kPerGram: Number(e.target.value) })}
                className="w-full liquid-glass-sub rounded-2xl p-3.5 text-sm font-mono font-semibold text-slate-800 outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Sovereign (8g): ₹{(pricingForm.rate14kPerGram * 8).toLocaleString('en-IN')}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                RBI Loan Valuation Benchmark (₹/gram)
              </label>
              <input
                type="number"
                value={pricingForm.loanValuationRate22k}
                onChange={(e) => setPricingForm({ ...pricingForm, loanValuationRate22k: Number(e.target.value) })}
                className="w-full liquid-glass-sub rounded-2xl p-3.5 text-sm font-mono font-bold text-emerald-700 outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Max 75% LTV Cap</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Scrap Gold Buying Margin (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={pricingForm.buyingMarginPercent}
                onChange={(e) => setPricingForm({ ...pricingForm, buyingMarginPercent: Number(e.target.value) })}
                className="w-full liquid-glass-sub rounded-2xl p-3.5 text-sm font-mono text-slate-900 outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Riser Gold standard: -1.5% refining loss</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Bullion Minting Fee (₹/gram)
              </label>
              <input
                type="number"
                value={pricingForm.coinMakingChargesPerGram}
                onChange={(e) => setPricingForm({ ...pricingForm, coinMakingChargesPerGram: Number(e.target.value) })}
                className="w-full liquid-glass-sub rounded-2xl p-3.5 text-sm font-mono text-slate-900 outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Tamper blister packaging fee</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Statutory Bullion GST (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={pricingForm.taxGstPercent}
                onChange={(e) => setPricingForm({ ...pricingForm, taxGstPercent: Number(e.target.value) })}
                className="w-full liquid-glass-sub rounded-2xl p-3.5 text-sm font-mono text-slate-900 outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">3.0% GST</span>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200/60">
            <button
              type="submit"
              className="liquid-glass-btn-primary px-8 py-3 text-white font-bold text-xs rounded-full cursor-pointer shadow-lg"
            >
              Publish New Rates System-Wide
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: General Ledger & P&L */}
      {adminTab === 'ACCOUNTING' && (
        <div className="space-y-6">
          {/* Chart of Accounts */}
          <div className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 font-serif-gold">
              Double-Entry Chart of Accounts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {chartOfAccounts.map((acc) => (
                <div key={acc.code} className="liquid-glass-sub p-4 rounded-2xl text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="font-mono text-slate-400">{acc.code}</span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        acc.type === 'ASSET'
                          ? 'bg-blue-100 text-blue-800'
                          : acc.type === 'REVENUE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : acc.type === 'LIABILITY'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {acc.type}
                    </span>
                  </div>
                  <h5 className="font-semibold text-slate-900 mt-1.5">{acc.name}</h5>
                  <p className="text-base font-mono font-bold text-emerald-700 mt-1">
                    ₹{(acc.balance / 100000).toFixed(2)} Lakhs
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Journal Stream */}
          <div className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 font-serif-gold">
              Real-time Financial Journal Entries
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="liquid-glass-sub text-slate-500 uppercase text-[10px] font-mono">
                  <tr>
                    <th className="p-3.5 rounded-l-2xl">Entry #</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Debit Account</th>
                    <th className="p-3.5">Credit Account</th>
                    <th className="p-3.5 font-mono">Amount (₹)</th>
                    <th className="p-3.5 rounded-r-2xl">Narration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {journalEntries.map((j) => (
                    <tr key={j.id} className="hover:bg-slate-50/60 transition">
                      <td className="p-3.5 font-mono font-bold text-amber-800">{j.entryNumber}</td>
                      <td className="p-3.5 text-slate-500">{j.date}</td>
                      <td className="p-3.5 text-blue-800 font-semibold">{j.debitAccount}</td>
                      <td className="p-3.5 text-emerald-800 font-semibold">{j.creditAccount}</td>
                      <td className="p-3.5 font-mono font-bold text-slate-900">₹{j.amount.toLocaleString('en-IN')}</td>
                      <td className="p-3.5 text-slate-600 max-w-xs truncate">{j.narration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Loan Products */}
      {adminTab === 'PRODUCTS' && (
        <div className="space-y-6">
          <div className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 font-serif-gold">
              Configure New Loan Product Scheme
            </h3>
            <form onSubmit={handleCreateProduct} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              <div className="col-span-2">
                <label className="block text-slate-700 mb-1 font-semibold">Scheme Name</label>
                <input
                  type="text"
                  placeholder="e.g. Riser Agri Gold Special"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full liquid-glass-sub rounded-2xl p-3 text-slate-900 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Tenure (Months)</label>
                <input
                  type="number"
                  value={newProdTenure}
                  onChange={(e) => setNewProdTenure(Number(e.target.value))}
                  className="w-full liquid-glass-sub rounded-2xl p-3 text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Interest (% p.a.)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newProdRate}
                  onChange={(e) => setNewProdRate(Number(e.target.value))}
                  className="w-full liquid-glass-sub rounded-2xl p-3 text-slate-900 outline-none"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-3 liquid-glass-btn-primary font-bold rounded-full cursor-pointer shadow-md"
                >
                  + Add Scheme
                </button>
              </div>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {loanProducts.map((p) => (
              <div key={p.id} className="liquid-glass liquid-interactive rounded-3xl p-5 space-y-2.5 text-xs shadow-md">
                <h4 className="font-bold text-slate-900 text-sm">{p.name}</h4>
                <p className="text-amber-800 font-mono font-bold text-lg">{p.interestRatePerAnnum}% per annum</p>
                <div className="space-y-1 text-slate-600">
                  <p>Tenure: {p.tenureMonths} Months</p>
                  <p>Max LTV: {p.maxLtvPercent}% (RBI Cap)</p>
                  <p>Repayment Type: {p.repaymentType}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Branches */}
      {adminTab === 'BRANCHES' && (
        <div className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-slate-900 font-serif-gold">
            Authorized Branch Hierarchy & Vault Safes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {branches.map((b) => (
              <div key={b.id} className="liquid-glass-sub p-6 rounded-3xl space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{b.name}</h4>
                    <p className="text-xs text-slate-500">{b.address}</p>
                  </div>
                  <span className="font-mono text-xs liquid-glass px-2.5 py-0.5 rounded-full text-amber-800 font-bold">
                    {b.code}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <span>Vault Fill Ratio:</span>
                      <span className="font-mono text-slate-900 font-semibold">
                        {(b.currentVaultHoldingGrams / 1000).toFixed(1)} / {b.vaultCapacityKg} kg (
                        {Math.round(((b.currentVaultHoldingGrams / 1000) / b.vaultCapacityKg) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full"
                        style={{
                          width: `${Math.min(100, ((b.currentVaultHoldingGrams / 1000) / b.vaultCapacityKg) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-200">
                    <span>Counter Cash Balance:</span>
                    <span className="font-mono text-emerald-700 font-bold">
                      ₹{(b.currentCashBalance / 100000).toFixed(2)}L
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: Overdue & Auction Engine */}
      {adminTab === 'AUCTION' && (
        <div className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/60">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif-gold">
                Statutory Default & Auction Engine
              </h3>
              <p className="text-xs text-slate-500">
                RBI 90-day delinquency escalation, legal auction demand notices, public tender lots.
              </p>
            </div>
            <span className="text-xs liquid-glass-sub text-amber-800 border border-amber-300 px-3.5 py-1 rounded-full font-semibold">
              Compliance Mode: STRICT
            </span>
          </div>

          <div className="space-y-3">
            {overdueLoans.map((l) => (
              <div
                key={l.id}
                className="liquid-glass-sub p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-800">{l.loanNumber}</span>
                    <span className="bg-red-100 text-red-700 border border-red-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                      OVERDUE / DUE
                    </span>
                  </div>
                  <p className="text-slate-900 font-semibold mt-1">{l.customerName} ({l.customerPhone})</p>
                  <p className="text-slate-500 text-[11px]">
                    Packet: {l.packetId} • {l.totalNetWeight}g 22K pledged
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-slate-500 text-[11px]">Principal + Interest:</p>
                  <p className="text-base font-mono font-bold text-red-600">
                    ₹{(l.outstandingPrincipal + l.accruedInterest).toLocaleString('en-IN')}
                  </p>
                  <button
                    onClick={() => confetti({ particleCount: 30 })}
                    className="mt-2 text-xs liquid-glass-btn-primary px-4 py-1.5 rounded-full font-bold cursor-pointer shadow-md"
                  >
                    Generate Statutory Notice
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: Immutable Audit Trail */}
      {adminTab === 'AUDIT' && (
        <div className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/60">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif-gold">
                Immutable Regulatory Audit Trail
              </h3>
              <p className="text-xs text-slate-500">
                Append-only log capturing WHO, WHAT, WHEN, WHERE, BEFORE, AFTER, IP/Device context.
              </p>
            </div>
            <span className="text-xs liquid-glass-sub text-emerald-800 border border-emerald-300 px-3.5 py-1 rounded-full font-mono font-semibold">
              Tamper-Evident SHA-256
            </span>
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="liquid-glass-sub p-3.5 rounded-2xl text-xs space-y-1 hover:border-slate-300 transition"
              >
                <div className="flex justify-between text-[11px]">
                  <span className="text-amber-800 font-bold">{log.what}</span>
                  <span className="text-slate-400 font-mono">{log.timestamp}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 text-[11px] text-slate-600">
                  <span>Actor: <strong className="text-slate-900">{log.who}</strong> ({log.role})</span>
                  <span>Branch: <strong className="text-slate-900">{log.branch}</strong></span>
                  <span>Ref: <strong className="text-amber-800 font-mono">{log.approvalRef}</strong></span>
                </div>
                {log.afterValue && (
                  <p className="text-[10px] font-mono text-emerald-800 liquid-glass-sub p-1.5 rounded-xl border border-emerald-200">
                    Result: {log.afterValue}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
