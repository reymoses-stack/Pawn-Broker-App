import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GoldAppraisalItem } from '../../types';
import { X, Scale, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export const SellGoldModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { rates, branches, currentCustomer, createGoldPurchase } = useApp();

  const [selectedBranchId, setSelectedBranchId] = useState(branches[0].id);
  const [description, setDescription] = useState('Old Gold Bangles & Broken Chain');
  const [karat, setKarat] = useState<18 | 20 | 22 | 24>(22);
  const [grossWeight, setGrossWeight] = useState<number>(25.0);
  const [stoneWeight, setStoneWeight] = useState<number>(1.2);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'NEFT' | 'CASH'>('UPI');
  const [isSuccess, setIsSuccess] = useState(false);
  const [payoutResult, setPayoutResult] = useState<number>(0);

  if (!isOpen) return null;

  const netWeight = Math.max(0, grossWeight - stoneWeight);
  const meltLossPercent = 1.5;
  const payableWeight = Number((netWeight * (1 - meltLossPercent / 100)).toFixed(2));
  const buyRate = Math.round(rates.rate22kPerGram * (1 + rates.buyingMarginPercent / 100));
  const estimatedPayout = Math.round(payableWeight * buyRate);

  const handleSell = (e: React.FormEvent) => {
    e.preventDefault();
    const item: GoldAppraisalItem = {
      id: 'sell-item-' + Date.now(),
      itemType: 'OTHER',
      description,
      grossWeight,
      stoneWeight,
      netWeight,
      karat,
      purityPercentage: karat === 22 ? 91.6 : karat === 24 ? 99.9 : 75.0,
      rateApplied: buyRate,
      calculatedValue: estimatedPayout,
    };

    const res = createGoldPurchase(
      currentCustomer.id,
      selectedBranchId,
      [item],
      meltLossPercent,
      paymentMethod
    );

    setPayoutResult(res.finalPayout);
    confetti({ particleCount: 50, spread: 60 });
    setIsSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md overflow-y-auto">
      <div className="liquid-glass rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-white">
        <div className="flex items-center justify-between p-6 border-b border-slate-200/80 bg-white/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl p-2 liquid-glass-gold text-amber-700 flex items-center justify-center border border-amber-300 shadow-sm">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif-gold">
                Sell Old Gold / Instant Cash
              </h3>
              <p className="text-xs text-slate-500">
                Transparent assaying, instant bank payout, zero hidden cuts
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsSuccess(false);
              onClose();
            }}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-full liquid-glass-sub transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-6 sm:p-8 space-y-4 text-center">
            <div className="w-16 h-16 rounded-full liquid-glass-sub border border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h4 className="text-xl font-bold text-slate-900 font-serif-gold">Gold Purchase Voucher Generated!</h4>
            <p className="text-xs text-slate-600">
              Payout of <strong className="text-emerald-700 text-base font-mono">₹{payoutResult.toLocaleString('en-IN')}</strong> will be disbursed to your {paymentMethod} account upon physical verification.
            </p>
            <div className="liquid-glass-sub p-5 rounded-2xl text-left text-xs space-y-2 border border-slate-200/80">
              <div className="flex justify-between text-slate-600">
                <span>Customer:</span>
                <span className="text-slate-900 font-semibold">{currentCustomer.name}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Net Gold Weight:</span>
                <span className="text-slate-900 font-mono font-bold">{netWeight} grams</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Rate Applied:</span>
                <span className="text-amber-800 font-mono font-bold">₹{buyRate.toLocaleString('en-IN')}/g</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Refining Loss:</span>
                <span className="text-slate-700 font-medium">1.5%</span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsSuccess(false);
                onClose();
              }}
              className="w-full py-3 liquid-glass-btn-primary text-white font-bold text-xs rounded-full cursor-pointer transition shadow-xl"
            >
              Done & Return to Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleSell} className="p-6 sm:p-8 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Gold Item Details
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. 22K Broken Chain and Scrap Rings"
                className="w-full liquid-glass-sub rounded-2xl p-3.5 text-xs text-slate-900 border border-slate-200/80 outline-none focus:border-amber-500 bg-white/80"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Purity</label>
                <select
                  value={karat}
                  onChange={(e) => setKarat(Number(e.target.value) as any)}
                  className="w-full liquid-glass-sub rounded-2xl p-3 text-xs text-amber-800 font-bold border border-slate-200/80 outline-none bg-white"
                >
                  <option value={24} className="bg-white text-slate-900">24K (99.9%)</option>
                  <option value={22} className="bg-white text-slate-900">22K (91.6%)</option>
                  <option value={20} className="bg-white text-slate-900">20K (83.3%)</option>
                  <option value={18} className="bg-white text-slate-900">18K (75.0%)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Gross (g)</label>
                <input
                  type="number"
                  step="0.1"
                  value={grossWeight}
                  onChange={(e) => setGrossWeight(Number(e.target.value))}
                  className="w-full liquid-glass-sub rounded-2xl p-3 text-xs text-slate-900 border border-slate-200/80 font-mono outline-none focus:border-amber-500 bg-white/80"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Stone (g)</label>
                <input
                  type="number"
                  step="0.1"
                  value={stoneWeight}
                  onChange={(e) => setStoneWeight(Number(e.target.value))}
                  className="w-full liquid-glass-sub rounded-2xl p-3 text-xs text-slate-900 border border-slate-200/80 font-mono outline-none focus:border-amber-500 bg-white/80"
                  required
                />
              </div>
            </div>

            {/* Valuation breakdown card */}
            <div className="liquid-glass-sub p-4 rounded-2xl space-y-2 text-xs border border-slate-200/80">
              <div className="flex justify-between text-slate-600">
                <span>Net Gold Weight:</span>
                <span className="font-mono text-slate-900 font-bold">{netWeight.toFixed(2)} g</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Today's Buying Rate (22K):</span>
                <span className="font-mono text-amber-800 font-bold">
                  ₹{buyRate.toLocaleString('en-IN')}/g
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Melt / Assaying Deduction:</span>
                <span className="text-slate-700 font-mono font-medium">1.5%</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="font-bold text-amber-800">Estimated Instant Payout:</span>
                <span className="text-lg font-mono font-bold text-emerald-800">
                  ₹{estimatedPayout.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Branch and Payment Method */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Branch</label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full liquid-glass-sub rounded-2xl p-3 text-xs text-slate-900 border border-slate-200/80 outline-none bg-white"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id} className="bg-white text-slate-900">
                      {b.name.split(' ')[0]} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Payout Channel</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full liquid-glass-sub rounded-2xl p-3 text-xs text-slate-900 border border-slate-200/80 outline-none bg-white"
                >
                  <option value="UPI" className="bg-white text-slate-900">Instant UPI</option>
                  <option value="NEFT" className="bg-white text-slate-900">Bank NEFT/RTGS</option>
                  <option value="CASH" className="bg-white text-slate-900">Counter Cash</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/80">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="liquid-glass-btn-primary px-8 py-3 text-white font-bold text-xs rounded-full shadow-xl cursor-pointer"
              >
                Confirm Sell & Lock ₹{estimatedPayout.toLocaleString('en-IN')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
