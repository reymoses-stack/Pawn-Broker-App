import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GoldLoan, GoldAppraisalItem } from '../../types';
import {
  Building2,
  Scale,
  QrCode,
  CheckCircle2,
  Plus,
  Trash2,
  Search,
  FileText,
  IndianRupee,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const StaffPortal: React.FC = () => {
  const {
    activeBranch,
    loans,
    customers,
    rates,
    loanProducts,
    createLoan,
    vaultPackets,
    verifyPacketSeal,
    createGoldPurchase,
    repayLoan,
    closeLoanAndReleaseVault,
  } = useApp();

  const [activeStaffTab, setActiveStaffTab] = useState<
    'APPRAISAL' | 'VAULT' | 'PURCHASE' | 'COLLECTIONS' | 'RECONCILIATION'
  >('APPRAISAL');

  // Customer search & selection
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0].id);
  const [selectedProductId, setSelectedProductId] = useState(loanProducts[0].id);
  const [disbursementMethod, setDisbursementMethod] = useState<'CASH' | 'NEFT' | 'UPI'>('NEFT');

  // Appraisal items state
  const [appraisalItems, setAppraisalItems] = useState<GoldAppraisalItem[]>([
    {
      id: 'app-item-1',
      itemType: 'NECKLACE',
      description: '22K Traditional Bridal Haran (Hallmarked)',
      grossWeight: 46.5,
      stoneWeight: 2.5,
      netWeight: 44.0,
      karat: 22,
      purityPercentage: 91.6,
      rateApplied: rates.loanValuationRate22k,
      calculatedValue: Math.round(44.0 * rates.loanValuationRate22k),
    },
  ]);

  // Direct Gold Buying state
  const [buyItems, setBuyItems] = useState<GoldAppraisalItem[]>([
    {
      id: 'buy-item-1',
      itemType: 'OTHER',
      description: 'Scrap 22K Rings and Broken Chains',
      grossWeight: 18.5,
      stoneWeight: 0.5,
      netWeight: 18.0,
      karat: 22,
      purityPercentage: 91.6,
      rateApplied: Math.round(rates.rate22kPerGram * (1 + rates.buyingMarginPercent / 100)),
      calculatedValue: Math.round(
        18.0 * Math.round(rates.rate22kPerGram * (1 + rates.buyingMarginPercent / 100))
      ),
    },
  ]);
  const [meltLoss, setMeltLoss] = useState(1.5);
  const [buyPayoutMode, setBuyPayoutMode] = useState<'UPI' | 'NEFT' | 'CASH'>('NEFT');

  // Filter branch specific loans
  const branchLoans = loans.filter((l) => l.branchId === activeBranch.id);
  const branchPackets = vaultPackets.filter((p) => p.branchCode === activeBranch.code);

  // Appraisal calculations
  const totalNetGrams = appraisalItems.reduce((sum, it) => sum + it.netWeight, 0);
  const totalValuation = appraisalItems.reduce((sum, it) => sum + it.calculatedValue, 0);
  const selectedProduct = loanProducts.find((p) => p.id === selectedProductId) || loanProducts[0];
  const maxEligibleLoan = Math.floor(totalValuation * (selectedProduct.maxLtvPercent / 100));
  const [requestedLoanAmount, setRequestedLoanAmount] = useState(maxEligibleLoan);

  // Search in collections
  const [collectionSearch, setCollectionSearch] = useState('');
  const filteredLoans = loans.filter(
    (l) =>
      l.loanNumber.toLowerCase().includes(collectionSearch.toLowerCase()) ||
      l.customerName.toLowerCase().includes(collectionSearch.toLowerCase()) ||
      l.packetId.toLowerCase().includes(collectionSearch.toLowerCase())
  );

  const handleAddAppraisalItem = () => {
    const newItem: GoldAppraisalItem = {
      id: 'app-item-' + Date.now(),
      itemType: 'BANGLE',
      description: '22K Bangles (Pair)',
      grossWeight: 20.0,
      stoneWeight: 0,
      netWeight: 20.0,
      karat: 22,
      purityPercentage: 91.6,
      rateApplied: rates.loanValuationRate22k,
      calculatedValue: Math.round(20.0 * rates.loanValuationRate22k),
    };
    setAppraisalItems([...appraisalItems, newItem]);
  };

  const handleAppraisalChange = (id: string, field: keyof GoldAppraisalItem, val: any) => {
    setAppraisalItems(
      appraisalItems.map((it) => {
        if (it.id !== id) return it;
        const copy = { ...it, [field]: val };
        const gross = field === 'grossWeight' ? Number(val) : it.grossWeight;
        const stone = field === 'stoneWeight' ? Number(val) : it.stoneWeight;
        const net = Math.max(0, gross - stone);
        const karat = field === 'karat' ? Number(val) : it.karat;
        const factor = karat === 24 ? 1 : karat === 22 ? 0.916 : karat === 20 ? 0.833 : 0.75;
        const rate = Math.round(rates.loanValuationRate22k * (factor / 0.916));
        copy.grossWeight = gross;
        copy.stoneWeight = stone;
        copy.netWeight = Number(net.toFixed(2));
        copy.rateApplied = rate;
        copy.calculatedValue = Math.round(net * rate);
        return copy;
      })
    );
  };

  const handleDisburseLoan = (e: React.FormEvent) => {
    e.preventDefault();
    createLoan(
      selectedCustomerId,
      activeBranch.id,
      appraisalItems,
      requestedLoanAmount || maxEligibleLoan,
      selectedProductId,
      disbursementMethod
    );
    confetti({ particleCount: 60, spread: 60 });
    setActiveStaffTab('VAULT');
  };

  const handleProcessPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    createGoldPurchase(
      selectedCustomerId,
      activeBranch.id,
      buyItems,
      meltLoss,
      buyPayoutMode
    );
    confetti({ particleCount: 50, spread: 60 });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Branch Operational Status White Liquid Glass Header */}
      <div className="liquid-glass rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full liquid-glass-sub text-emerald-800 border border-emerald-300 text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" /> Branch Code: {activeBranch.code}
              </span>
              <span className="text-xs text-slate-500">
                Staff On Duty: <strong className="text-slate-900">{activeBranch.activeStaffCount} Officers</strong>
              </span>
            </div>
            <h2 className="text-2xl font-bold font-serif-gold text-slate-900 tracking-wide">{activeBranch.name}</h2>
            <p className="text-xs text-slate-500">{activeBranch.address}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="liquid-glass-sub p-3.5 rounded-2xl">
              <span className="text-[10px] text-slate-500 block font-medium">Cash Drawer Balance</span>
              <span className="text-base font-mono font-bold text-emerald-700">
                ₹{(activeBranch.currentCashBalance / 100000).toFixed(2)}L
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Limit: ₹{(activeBranch.cashLimit / 100000).toFixed(1)}L</span>
            </div>

            <div className="liquid-glass-sub p-3.5 rounded-2xl">
              <span className="text-[10px] text-slate-500 block font-medium">Vault Physical Gold</span>
              <span className="text-base font-mono font-bold text-amber-700">
                {(activeBranch.currentVaultHoldingGrams / 1000).toFixed(2)} kg
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Cap: {activeBranch.vaultCapacityKg} kg</span>
            </div>

            <div className="liquid-glass-sub p-3.5 rounded-2xl">
              <span className="text-[10px] text-slate-500 block font-medium">Active Branch Loans</span>
              <span className="text-base font-mono font-bold text-slate-900">{branchLoans.length}</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Under custody</span>
            </div>

            <div className="liquid-glass-sub p-3.5 rounded-2xl">
              <span className="text-[10px] text-slate-500 block font-medium">Sealed Packets</span>
              <span className="text-base font-mono font-bold text-sky-700">{branchPackets.length}</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">QR verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Apple Style Segmented White Glass Pills Navigation */}
      <div className="flex liquid-glass-sub p-1.5 rounded-full space-x-1 text-xs font-semibold overflow-x-auto shadow-sm border border-slate-200">
        <button
          onClick={() => setActiveStaffTab('APPRAISAL')}
          className={`px-4 py-2 rounded-full transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeStaffTab === 'APPRAISAL'
              ? 'liquid-glass-btn-primary text-white font-bold shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Scale className="w-4 h-4" /> Gold Appraisal & Loan Origination
        </button>

        <button
          onClick={() => setActiveStaffTab('VAULT')}
          className={`px-4 py-2 rounded-full transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeStaffTab === 'VAULT'
              ? 'liquid-glass-btn-primary text-white font-bold shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Lock className="w-4 h-4" /> Vault & QR Packet Custody
        </button>

        <button
          onClick={() => setActiveStaffTab('PURCHASE')}
          className={`px-4 py-2 rounded-full transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeStaffTab === 'PURCHASE'
              ? 'liquid-glass-btn-primary text-white font-bold shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <IndianRupee className="w-4 h-4" /> Direct Gold Buying / Scrap
        </button>

        <button
          onClick={() => setActiveStaffTab('COLLECTIONS')}
          className={`px-4 py-2 rounded-full transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeStaffTab === 'COLLECTIONS'
              ? 'liquid-glass-btn-primary text-white font-bold shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" /> Collections & Settlement Register
        </button>

        <button
          onClick={() => setActiveStaffTab('RECONCILIATION')}
          className={`px-4 py-2 rounded-full transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeStaffTab === 'RECONCILIATION'
              ? 'liquid-glass-btn-primary text-white font-bold shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" /> Day-End Reconciliation
        </button>
      </div>

      {/* TAB 1: Gold Appraisal & Loan Origination */}
      {activeStaffTab === 'APPRAISAL' && (
        <form onSubmit={handleDisburseLoan} className="space-y-6">
          <div className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/60">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-serif-gold">
                  Gold Appraisal & Maker-Checker Processing
                </h3>
                <p className="text-xs text-slate-500">
                  Dual-signoff: Certified Assayer appraisal followed by Branch Manager approval & disbursement.
                </p>
              </div>
              <span className="text-xs liquid-glass-sub text-amber-800 px-3.5 py-1 rounded-full font-mono border border-amber-200">
                Benchmark: ₹{rates.loanValuationRate22k}/g (22K)
              </span>
            </div>

            {/* Select Customer & Loan Scheme */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Walk-in Borrower / KYC Customer
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full liquid-glass-sub rounded-2xl p-3.5 text-xs text-slate-900 outline-none focus:border-amber-400"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) • CIBIL {c.cibilScore} • {c.kycStatus}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Loan Product Scheme
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full liquid-glass-sub rounded-2xl p-3.5 text-xs text-amber-800 font-semibold outline-none focus:border-amber-400"
                >
                  {loanProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.interestRatePerAnnum}% p.a. (Max LTV {p.maxLtvPercent}%)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Item-by-item Appraisal Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Assayer Item Evaluation Sheet
                </span>
                <button
                  type="button"
                  onClick={handleAddAppraisalItem}
                  className="text-xs liquid-glass-btn-secondary text-amber-800 px-4 py-1.5 rounded-full transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-600" /> Add Ornament
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {appraisalItems.map((it, idx) => (
                  <div
                    key={it.id}
                    className="liquid-glass-sub p-3.5 rounded-2xl grid grid-cols-12 gap-2 items-center text-xs"
                  >
                    <div className="col-span-1 font-mono text-slate-400">#{idx + 1}</div>
                    <div className="col-span-3">
                      <input
                        type="text"
                        value={it.description}
                        onChange={(e) => handleAppraisalChange(it.id, 'description', e.target.value)}
                        className="w-full bg-transparent border-b border-slate-300 px-2 py-1 text-slate-900 focus:border-amber-600 outline-none"
                        placeholder="Item Description"
                      />
                    </div>
                    <div className="col-span-2">
                      <select
                        value={it.karat}
                        onChange={(e) => handleAppraisalChange(it.id, 'karat', Number(e.target.value))}
                        className="w-full liquid-glass-sub rounded-xl px-2 py-1 text-amber-800 font-bold"
                      >
                        <option value={24}>24K (99.9%)</option>
                        <option value={22}>22K (91.6%)</option>
                        <option value={20}>20K (83.3%)</option>
                        <option value={18}>18K (75.0%)</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        step="0.1"
                        value={it.grossWeight}
                        onChange={(e) => handleAppraisalChange(it.id, 'grossWeight', e.target.value)}
                        className="w-full bg-transparent border-b border-slate-300 px-2 py-1 text-slate-900 font-mono focus:border-amber-600 outline-none"
                        placeholder="Gross"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        step="0.1"
                        value={it.stoneWeight}
                        onChange={(e) => handleAppraisalChange(it.id, 'stoneWeight', e.target.value)}
                        className="w-full bg-transparent border-b border-slate-300 px-2 py-1 text-slate-700 font-mono focus:border-amber-600 outline-none"
                        placeholder="Stone"
                      />
                    </div>
                    <div className="col-span-1 font-mono font-bold text-amber-800 text-right">
                      ₹{Math.round(it.calculatedValue / 1000)}k
                    </div>
                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => setAppraisalItems(appraisalItems.filter((x) => x.id !== it.id))}
                        disabled={appraisalItems.length <= 1}
                        className="text-slate-400 hover:text-red-600 disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculations & LTV Assessment */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 liquid-glass-sub p-4 rounded-2xl text-xs">
              <div>
                <span className="text-slate-500 block font-medium">Total Net Gold:</span>
                <span className="text-lg font-mono font-bold text-slate-900">{totalNetGrams.toFixed(2)} g</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Assayed Gold Value:</span>
                <span className="text-lg font-mono font-bold text-amber-700">
                  ₹{totalValuation.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Max 75% LTV Allowed:</span>
                <span className="text-lg font-mono font-bold text-emerald-700">
                  ₹{maxEligibleLoan.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Monthly Interest Est:</span>
                <span className="text-lg font-mono font-bold text-slate-800">
                  ₹{Math.round((maxEligibleLoan * (selectedProduct.interestRatePerAnnum / 100)) / 12)}
                </span>
              </div>
            </div>

            {/* Disbursement Details & Maker-Checker */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sanctioned Loan Amount (₹)
                </label>
                <input
                  type="number"
                  value={requestedLoanAmount || maxEligibleLoan}
                  max={maxEligibleLoan}
                  onChange={(e) => setRequestedLoanAmount(Number(e.target.value))}
                  className="w-full liquid-glass-sub rounded-2xl p-3.5 text-sm font-mono font-bold text-emerald-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Disbursement Mode
                </label>
                <select
                  value={disbursementMethod}
                  onChange={(e) => setDisbursementMethod(e.target.value as any)}
                  className="w-full liquid-glass-sub rounded-2xl p-3.5 text-xs text-slate-900 outline-none"
                >
                  <option value="NEFT">Bank NEFT/RTGS Account Credit</option>
                  <option value="UPI">Instant UPI Direct Credit</option>
                  <option value="CASH">Counter Vault Cash (Max ₹20k)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dual Signoff Authority
                </label>
                <div className="liquid-glass-sub rounded-2xl p-3 text-[11px] text-slate-600">
                  <p>Appraiser: S. Narain (Assayer)</p>
                  <p className="text-emerald-700 font-semibold">Checker: M. Senthil (Branch Mgr)</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200/60">
              <button
                type="submit"
                className="liquid-glass-btn-primary px-8 py-3 text-white font-bold text-xs rounded-full flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <CheckCircle2 className="w-4 h-4" />
                Sanction, Seal Vault Packet & Disburse Loan
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: Vault & QR Packet Management */}
      {activeStaffTab === 'VAULT' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif-gold">
                Vault Packet Inventory & Tamper Verification
              </h3>
              <p className="text-xs text-slate-500">
                Company → Branch ({activeBranch.code}) → Vault → Locker/Rack → Tray → Packet → Position
              </p>
            </div>
            <span className="text-xs liquid-glass-sub text-emerald-800 px-3.5 py-1 rounded-full font-mono border border-emerald-300">
              Biometric Vault Lock: ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vaultPackets.map((pkt) => (
              <div
                key={pkt.id}
                className="liquid-glass liquid-interactive rounded-3xl p-5 space-y-3 shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-amber-100 text-amber-800 rounded-2xl border border-amber-300">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-mono font-bold text-slate-900 text-sm">{pkt.packetCode}</h4>
                      <p className="text-[11px] text-amber-800 font-mono font-medium">{pkt.loanNumber}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                      pkt.sealStatus === 'SEALED_IN_VAULT'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {pkt.sealStatus.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Vault Location Coordinates */}
                <div className="liquid-glass-sub p-3.5 rounded-2xl text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-500">
                    <span>Borrower:</span>
                    <span className="text-slate-900 font-semibold">{pkt.customerName}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Vault Location:</span>
                    <span className="font-mono text-amber-800 font-bold">
                      {pkt.rack} • {pkt.tray} • {pkt.slot}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Net Gold Weight:</span>
                    <span className="font-mono text-slate-900 font-bold">{pkt.netWeight} grams</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Sealed At:</span>
                    <span className="text-slate-700">{pkt.sealedAt}</span>
                  </div>
                </div>

                {/* Scannable Barcode simulation */}
                <div className="liquid-glass-sub p-2.5 rounded-xl flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span className="truncate max-w-[170px]">{pkt.qrPayload}</span>
                  <button
                    onClick={() => verifyPacketSeal(pkt.packetCode)}
                    className="text-amber-800 hover:text-amber-900 font-sans font-bold cursor-pointer"
                  >
                    Verify Seal
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Direct Gold Buying */}
      {activeStaffTab === 'PURCHASE' && (
        <div className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/60">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif-gold">
                Direct Gold Buying & Scrap Purchase Engine
              </h3>
              <p className="text-xs text-slate-500">
                Purchase old gold jewellery, verify purity via XRF/Touchstone, deduct melting margin, disburse payout.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">Today's Buying Rate (22K):</span>
              <span className="text-base font-mono font-bold text-emerald-700">
                ₹{Math.round(rates.rate22kPerGram * (1 + rates.buyingMarginPercent / 100)).toLocaleString('en-IN')}/g
              </span>
            </div>
          </div>

          <form onSubmit={handleProcessPurchase} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Selling Customer
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full liquid-glass-sub rounded-2xl p-3.5 text-xs text-slate-900 outline-none"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Payout Channel
                </label>
                <select
                  value={buyPayoutMode}
                  onChange={(e) => setBuyPayoutMode(e.target.value as any)}
                  className="w-full liquid-glass-sub rounded-2xl p-3.5 text-xs text-slate-900 outline-none"
                >
                  <option value="NEFT">Bank NEFT/RTGS</option>
                  <option value="UPI">Instant UPI</option>
                  <option value="CASH">Cash Voucher (Under ₹20,000)</option>
                </select>
              </div>
            </div>

            {/* Scrap Weight & Loss */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gross Weight (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={buyItems[0].grossWeight}
                  onChange={(e) => {
                    const g = Number(e.target.value);
                    setBuyItems([{ ...buyItems[0], grossWeight: g, netWeight: g - buyItems[0].stoneWeight }]);
                  }}
                  className="w-full liquid-glass-sub rounded-2xl p-3 text-xs text-slate-900 font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Stone Deduction (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={buyItems[0].stoneWeight}
                  onChange={(e) => {
                    const s = Number(e.target.value);
                    setBuyItems([{ ...buyItems[0], stoneWeight: s, netWeight: buyItems[0].grossWeight - s }]);
                  }}
                  className="w-full liquid-glass-sub rounded-2xl p-3 text-xs text-slate-900 font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Melting Loss (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={meltLoss}
                  onChange={(e) => setMeltLoss(Number(e.target.value))}
                  className="w-full liquid-glass-sub rounded-2xl p-3 text-xs text-slate-900 font-mono outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="liquid-glass-btn-primary px-8 py-3 text-white font-bold text-xs rounded-full cursor-pointer shadow-lg"
              >
                Approve & Execute Instant Payout
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: Repayments & Settlement Register */}
      {activeStaffTab === 'COLLECTIONS' && (
        <div className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif-gold">
                Collections & Settlement Register
              </h3>
              <p className="text-xs text-slate-500">
                Collect interest, part payments, or full loan settlement and trigger gold release.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search Loan #, Customer..."
                value={collectionSearch}
                onChange={(e) => setCollectionSearch(e.target.value)}
                className="w-full liquid-glass-sub rounded-full pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="liquid-glass-sub text-slate-500 uppercase text-[10px] font-mono">
                <tr>
                  <th className="p-3.5 rounded-l-2xl">Loan Number</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Pledged Gold</th>
                  <th className="p-3.5">Principal Out</th>
                  <th className="p-3.5">Accrued Interest</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right rounded-r-2xl">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-3.5 font-mono font-bold text-amber-800">{loan.loanNumber}</td>
                    <td className="p-3.5">
                      <p className="font-semibold text-slate-900">{loan.customerName}</p>
                      <p className="text-[10px] text-slate-500">{loan.customerPhone}</p>
                    </td>
                    <td className="p-3.5 font-mono font-medium">{loan.totalNetWeight}g (22K)</td>
                    <td className="p-3.5 font-mono font-bold text-slate-900">
                      ₹{loan.outstandingPrincipal.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 font-mono text-amber-800 font-semibold">
                      ₹{loan.accruedInterest.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          loan.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : loan.status === 'DUE'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {loan.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {loan.status !== 'CLOSED' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => repayLoan(loan.id, loan.accruedInterest, 'INTEREST')}
                            className="liquid-glass-sub hover:bg-slate-100 px-3 py-1.5 rounded-full text-[11px] text-amber-800 font-semibold cursor-pointer shadow-sm"
                          >
                            Collect Interest
                          </button>
                          <button
                            onClick={() => {
                              repayLoan(
                                loan.id,
                                loan.outstandingPrincipal + loan.accruedInterest,
                                'FULL_SETTLEMENT'
                              );
                              closeLoanAndReleaseVault(loan.id);
                            }}
                            className="liquid-glass-btn-primary px-3.5 py-1.5 rounded-full text-[11px] font-bold cursor-pointer shadow-md"
                          >
                            Settle & Release
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">Released</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: Daily Day-End Reconciliation */}
      {activeStaffTab === 'RECONCILIATION' && (
        <div className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/60">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif-gold">
                Daily Branch Opening/Closing Reconciliation
              </h3>
              <p className="text-xs text-slate-500">
                End-of-day tally between physical vault custody, counter cash drawers, and general ledger.
              </p>
            </div>
            <span className="text-xs liquid-glass-sub text-emerald-800 border border-emerald-300 px-3.5 py-1 rounded-full font-semibold">
              Status: BALANCED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="liquid-glass-sub p-5 rounded-2xl space-y-2.5 text-xs">
              <h4 className="font-bold text-amber-800 text-sm">Cash Drawer Reconciliation</h4>
              <div className="flex justify-between text-slate-600">
                <span>Opening Cash:</span>
                <span className="font-mono text-slate-900 font-bold">₹12,50,000</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Collections Received Today:</span>
                <span className="font-mono text-emerald-700 font-bold">+₹4,80,000</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Disbursements / Payouts:</span>
                <span className="font-mono text-red-600 font-bold">-₹2,50,000</span>
              </div>
              <div className="pt-2 border-t border-slate-200/80 flex justify-between font-bold text-sm">
                <span className="text-slate-900">Closing Cash Count:</span>
                <span className="font-mono text-emerald-700">₹14,80,000</span>
              </div>
            </div>

            <div className="liquid-glass-sub p-5 rounded-2xl space-y-2.5 text-xs">
              <h4 className="font-bold text-amber-800 text-sm">Physical Gold Vault Tally</h4>
              <div className="flex justify-between text-slate-600">
                <span>Opening Pledged Packets:</span>
                <span className="font-mono text-slate-900 font-bold">142 Packets (32.1 kg)</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>New Pledged Packets Today:</span>
                <span className="font-mono text-emerald-700 font-bold">+3 Packets (2.15 kg)</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Packets Released to Borrowers:</span>
                <span className="font-mono text-amber-700 font-bold">-1 Packet (0.45 kg)</span>
              </div>
              <div className="pt-2 border-t border-slate-200/80 flex justify-between font-bold text-sm">
                <span className="text-slate-900">Closing Vault Weight:</span>
                <span className="font-mono text-amber-700">34.25 kg</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => confetti({ particleCount: 40 })}
              className="liquid-glass-btn-primary px-8 py-3 font-bold text-xs rounded-full cursor-pointer shadow-lg"
            >
              Sign & Seal Day-End Ledger
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
