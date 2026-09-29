import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GoldAppraisalItem } from '../../types';
import { X, Plus, Trash2, Calculator, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export const LoanApplyModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { rates, loanProducts, branches, currentCustomer, createLoan } = useApp();

  const [selectedBranchId, setSelectedBranchId] = useState(branches[0].id);
  const [selectedProductId, setSelectedProductId] = useState(loanProducts[0].id);
  const [disbursementMethod, setDisbursementMethod] = useState<'UPI' | 'NEFT' | 'CASH'>('UPI');

  const [items, setItems] = useState<GoldAppraisalItem[]>([
    {
      id: 'item-1',
      itemType: 'NECKLACE',
      description: '22K Traditional Gold Necklace',
      grossWeight: 32.5,
      stoneWeight: 1.5,
      netWeight: 31.0,
      karat: 22,
      purityPercentage: 91.6,
      rateApplied: rates.loanValuationRate22k,
      calculatedValue: Math.round(31.0 * rates.loanValuationRate22k),
    },
  ]);

  const [customLoanAmount, setCustomLoanAmount] = useState<number>(0);

  if (!isOpen) return null;

  const totalNetWeight = items.reduce((sum, it) => sum + it.netWeight, 0);
  const totalValuation = items.reduce((sum, it) => sum + it.calculatedValue, 0);
  const selectedProduct = loanProducts.find((p) => p.id === selectedProductId) || loanProducts[0];
  const maxEligibleLoan = Math.floor(totalValuation * (selectedProduct.maxLtvPercent / 100));

  const effectiveLoanAmount = customLoanAmount > 0 ? Math.min(customLoanAmount, maxEligibleLoan) : maxEligibleLoan;
  const currentLTV = totalValuation > 0 ? Number(((effectiveLoanAmount / totalValuation) * 100).toFixed(1)) : 0;

  const handleAddItem = () => {
    const newItem: GoldAppraisalItem = {
      id: 'item-' + Date.now(),
      itemType: 'BANGLE',
      description: '22K Gold Bangle Set',
      grossWeight: 16.0,
      stoneWeight: 0,
      netWeight: 16.0,
      karat: 22,
      purityPercentage: 91.6,
      rateApplied: rates.loanValuationRate22k,
      calculatedValue: Math.round(16.0 * rates.loanValuationRate22k),
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((it) => it.id !== id));
  };

  const handleItemChange = (
    id: string,
    field: keyof GoldAppraisalItem,
    value: string | number
  ) => {
    setItems(
      items.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: value };
        if (field === 'grossWeight' || field === 'stoneWeight' || field === 'karat') {
          const gross = field === 'grossWeight' ? Number(value) : it.grossWeight;
          const stone = field === 'stoneWeight' ? Number(value) : it.stoneWeight;
          const net = Math.max(0, gross - stone);
          const karat = field === 'karat' ? Number(value) : it.karat;
          const karatFactor = karat === 24 ? 1 : karat === 22 ? 0.916 : karat === 20 ? 0.833 : 0.75;
          const rate = Math.round(rates.loanValuationRate22k * (karatFactor / 0.916));
          const val = Math.round(net * rate);

          updated.grossWeight = gross;
          updated.stoneWeight = stone;
          updated.netWeight = Number(net.toFixed(2));
          updated.rateApplied = rate;
          updated.calculatedValue = val;
        }
        return updated;
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createLoan(
      currentCustomer.id,
      selectedBranchId,
      items,
      effectiveLoanAmount,
      selectedProductId,
      disbursementMethod
    );
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md overflow-y-auto">
      <div className="liquid-glass rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl my-8 border border-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200/80 bg-white/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl p-2 liquid-glass-gold text-amber-700 flex items-center justify-center border border-amber-300 shadow-sm">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-serif-gold">
                Gold Loan Application & Appraisal
              </h3>
              <p className="text-xs text-slate-500">
                Pledge gold items for instant evaluation & disbursement (RBI 75% LTV compliant)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 p-2 rounded-full liquid-glass-sub transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* Customer & Branch Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Pledging Customer
              </label>
              <div className="liquid-glass-sub rounded-2xl p-3.5 text-xs flex items-center justify-between border border-slate-200/80">
                <div>
                  <p className="font-bold text-slate-900">{currentCustomer.name}</p>
                  <p className="text-slate-500">{currentCustomer.phone} • KYC Verified</p>
                </div>
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-semibold">
                  CIBIL {currentCustomer.cibilScore}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Designated Branch for Vault Custody
              </label>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full liquid-glass-sub rounded-2xl p-3.5 text-xs text-slate-900 border border-slate-200/80 outline-none focus:border-amber-500 bg-white/80"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id} className="bg-white text-slate-900">
                    {b.name} ({b.city})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Gold Items Appraisal Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Pledged Gold Ornaments / Items
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 text-xs liquid-glass-btn-secondary text-amber-800 px-4 py-1.5 rounded-full transition cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 text-amber-600" /> Add Item
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {items.map((it, idx) => (
                <div
                  key={it.id}
                  className="liquid-glass-sub p-3 rounded-2xl grid grid-cols-12 gap-2 items-center text-xs border border-slate-200/80"
                >
                  <div className="col-span-1 text-slate-400 font-mono font-bold">#{idx + 1}</div>

                  <div className="col-span-3">
                    <input
                      type="text"
                      value={it.description}
                      onChange={(e) => handleItemChange(it.id, 'description', e.target.value)}
                      placeholder="Item Description"
                      className="w-full bg-white/70 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-900 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="col-span-2">
                    <select
                      value={it.karat}
                      onChange={(e) => handleItemChange(it.id, 'karat', Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-amber-800 font-semibold"
                    >
                      <option value={24}>24K (99.9%)</option>
                      <option value={22}>22K (91.6%)</option>
                      <option value={20}>20K (83.3%)</option>
                      <option value={18}>18K (75.0%)</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.1"
                        value={it.grossWeight}
                        onChange={(e) => handleItemChange(it.id, 'grossWeight', e.target.value)}
                        className="w-full bg-white/70 border border-slate-200 rounded-xl px-2 py-1.5 text-slate-900 font-mono outline-none"
                      />
                      <span className="text-slate-400 text-[10px]">g gross</span>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.1"
                        value={it.stoneWeight}
                        onChange={(e) => handleItemChange(it.id, 'stoneWeight', e.target.value)}
                        className="w-full bg-white/70 border border-slate-200 rounded-xl px-2 py-1.5 text-slate-600 font-mono outline-none"
                      />
                      <span className="text-slate-400 text-[10px]">g stone</span>
                    </div>
                  </div>

                  <div className="col-span-1 text-right font-mono font-bold text-amber-700">
                    ₹{Math.round(it.calculatedValue / 1000)}k
                  </div>

                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(it.id)}
                      disabled={items.length <= 1}
                      className="text-slate-400 hover:text-red-600 disabled:opacity-30 cursor-pointer p-1 rounded-full hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scheme & Valuation Calculation Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="liquid-glass-sub p-4 rounded-2xl border border-slate-200/80">
              <span className="text-[11px] text-slate-500 block">Total Net Weight:</span>
              <span className="text-xl font-mono font-bold text-slate-900">{totalNetWeight.toFixed(1)} g</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Excludes stones & wax</span>
            </div>

            <div className="liquid-glass-sub p-4 rounded-2xl border border-slate-200/80">
              <span className="text-[11px] text-slate-500 block">Total Assayed Valuation:</span>
              <span className="text-xl font-mono font-bold text-amber-700">
                ₹{totalValuation.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Benchmark: ₹{rates.loanValuationRate22k}/g (22K)
              </span>
            </div>

            <div className="liquid-glass-gold p-4 rounded-2xl border border-amber-300">
              <span className="text-[11px] text-amber-800 block font-semibold">
                Max Eligible Loan (75% LTV):
              </span>
              <span className="text-xl font-mono font-bold text-emerald-800">
                ₹{maxEligibleLoan.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-amber-700 block mt-0.5">Statutory RBI limit</span>
            </div>
          </div>

          {/* Loan Scheme Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Select Loan Product Scheme
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {loanProducts.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => setSelectedProductId(prod.id)}
                  className={`p-4 rounded-2xl cursor-pointer transition border ${
                    selectedProductId === prod.id
                      ? 'liquid-glass-gold border-amber-400 text-slate-900 shadow-md ring-2 ring-amber-400/30'
                      : 'liquid-glass-sub text-slate-600 border-slate-200/80 hover:border-amber-300'
                  }`}
                >
                  <p className="font-bold text-xs text-slate-900">{prod.name}</p>
                  <p className="text-amber-700 font-mono text-sm font-semibold mt-1">
                    {prod.interestRatePerAnnum}% p.a.
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Tenure: {prod.tenureMonths}m • {prod.repaymentType}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Desired Disbursement Amount & Method */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Requested Loan Amount (₹)
              </label>
              <input
                type="number"
                placeholder={`Max ₹${maxEligibleLoan.toLocaleString('en-IN')}`}
                onChange={(e) => setCustomLoanAmount(Number(e.target.value))}
                className="w-full liquid-glass-sub rounded-2xl p-3.5 text-sm font-mono text-slate-900 border border-slate-200/80 outline-none focus:border-amber-500 bg-white/80"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Calculated LTV: <strong className="text-slate-900">{currentLTV}%</strong> (Max 75%)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Disbursement Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['UPI', 'NEFT', 'CASH'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setDisbursementMethod(mode)}
                    className={`py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer border ${
                      disbursementMethod === mode
                        ? 'liquid-glass-btn-primary text-white shadow-sm'
                        : 'liquid-glass-sub text-slate-600 border-slate-200/80 hover:bg-white'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/80">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-900 rounded-full cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="liquid-glass-btn-primary px-8 py-3 text-white font-bold text-xs rounded-full flex items-center gap-2 cursor-pointer shadow-xl"
            >
              <CheckCircle2 className="w-4 h-4" />
              Appraise, Pledge & Disburse ₹{effectiveLoanAmount.toLocaleString('en-IN')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
