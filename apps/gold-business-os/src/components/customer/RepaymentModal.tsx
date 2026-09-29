import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GoldLoan } from '../../types';
import { X, CheckCircle2, CreditCard } from 'lucide-react';
import confetti from 'canvas-confetti';

export const RepaymentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  loan: GoldLoan | null;
}> = ({ isOpen, onClose, loan }) => {
  const { repayLoan, closeLoanAndReleaseVault } = useApp();

  const [paymentType, setPaymentType] = useState<'INTEREST' | 'PRINCIPAL' | 'FULL_SETTLEMENT'>('INTEREST');
  const [customAmount, setCustomAmount] = useState<number>(0);
  const [showReceipt, setShowReceipt] = useState(false);

  if (!isOpen || !loan) return null;

  const totalSettlementAmount = loan.outstandingPrincipal + loan.accruedInterest;

  const defaultPayAmount =
    paymentType === 'INTEREST'
      ? loan.accruedInterest
      : paymentType === 'FULL_SETTLEMENT'
      ? totalSettlementAmount
      : customAmount > 0
      ? customAmount
      : Math.min(10000, loan.outstandingPrincipal);

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentType === 'FULL_SETTLEMENT') {
      repayLoan(loan.id, totalSettlementAmount, 'FULL_SETTLEMENT');
      closeLoanAndReleaseVault(loan.id);
    } else {
      repayLoan(loan.id, defaultPayAmount, paymentType);
    }
    confetti({ particleCount: 50, spread: 70 });
    setShowReceipt(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md">
      <div className="liquid-glass rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200/80 bg-white/40">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-serif-gold">
              Loan Repayment & Settlement
            </h3>
            <p className="text-xs text-slate-500">
              Loan Ref: <span className="text-amber-800 font-mono font-bold">{loan.loanNumber}</span>
            </p>
          </div>
          <button
            onClick={() => {
              setShowReceipt(false);
              onClose();
            }}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-full liquid-glass-sub transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {showReceipt ? (
          /* Receipt Screen */
          <div className="p-6 sm:p-8 space-y-4">
            <div className="text-center py-5 liquid-glass-sub rounded-2xl border border-emerald-300">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              <h4 className="text-base font-bold text-slate-900">Payment Received Successfully</h4>
              <p className="text-xs text-emerald-700 font-mono mt-0.5">Txn: TXN-{Date.now().toString().slice(-8)}</p>
            </div>

            <div className="liquid-glass-sub p-5 rounded-2xl space-y-2 text-xs border border-slate-200/80">
              <div className="flex justify-between text-slate-600">
                <span>Customer:</span>
                <span className="text-slate-900 font-semibold">{loan.customerName}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Loan Number:</span>
                <span className="font-mono text-amber-800 font-bold">{loan.loanNumber}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Amount Paid:</span>
                <span className="text-base font-mono font-bold text-emerald-700">
                  ₹{defaultPayAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Type:</span>
                <span className="font-semibold text-slate-900">{paymentType.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Vault Packet ID:</span>
                <span className="font-mono text-amber-800 font-bold">{loan.packetId}</span>
              </div>
              {paymentType === 'FULL_SETTLEMENT' && (
                <div className="mt-3 p-3 liquid-glass-gold rounded-2xl text-amber-900 border border-amber-300 text-center font-bold">
                  Gold Packet Released! Handover authorized at branch counter.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setShowReceipt(false);
                  onClose();
                }}
                className="w-full py-3 liquid-glass-btn-primary text-white font-bold text-xs rounded-full cursor-pointer shadow-xl"
              >
                Close & Print Receipt
              </button>
            </div>
          </div>
        ) : (
          /* Payment Form */
          <form onSubmit={handlePay} className="p-6 sm:p-8 space-y-5">
            {/* Outstanding Summary */}
            <div className="grid grid-cols-2 gap-3 liquid-glass-sub p-4 rounded-2xl text-xs border border-slate-200/80">
              <div>
                <span className="text-slate-500 block">Principal Outstanding:</span>
                <span className="text-base font-mono font-bold text-slate-900">
                  ₹{loan.outstandingPrincipal.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Accrued Interest:</span>
                <span className="text-base font-mono font-bold text-amber-700">
                  ₹{loan.accruedInterest.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Payment Options */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Select Repayment Option
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentType('INTEREST')}
                  className={`p-3 rounded-2xl text-xs font-semibold text-left transition cursor-pointer border ${
                    paymentType === 'INTEREST'
                      ? 'liquid-glass-gold border-amber-400 text-amber-900 ring-2 ring-amber-400/30 shadow-sm'
                      : 'liquid-glass-sub text-slate-600 border-slate-200/80 hover:bg-white'
                  }`}
                >
                  <p className="font-bold text-slate-900">Pay Interest</p>
                  <p className="text-[10px] mt-0.5 text-slate-500">₹{loan.accruedInterest}</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentType('PRINCIPAL')}
                  className={`p-3 rounded-2xl text-xs font-semibold text-left transition cursor-pointer border ${
                    paymentType === 'PRINCIPAL'
                      ? 'liquid-glass-gold border-amber-400 text-amber-900 ring-2 ring-amber-400/30 shadow-sm'
                      : 'liquid-glass-sub text-slate-600 border-slate-200/80 hover:bg-white'
                  }`}
                >
                  <p className="font-bold text-slate-900">Part Principal</p>
                  <p className="text-[10px] mt-0.5 text-slate-500">Custom</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentType('FULL_SETTLEMENT')}
                  className={`p-3 rounded-2xl text-xs font-semibold text-left transition cursor-pointer border ${
                    paymentType === 'FULL_SETTLEMENT'
                      ? 'liquid-glass-sub border-emerald-400 text-emerald-800 ring-2 ring-emerald-400/30 shadow-sm bg-emerald-50/50'
                      : 'liquid-glass-sub text-slate-600 border-slate-200/80 hover:bg-white'
                  }`}
                >
                  <p className="font-bold text-slate-900">Full Closure</p>
                  <p className="text-[10px] mt-0.5 text-slate-500">₹{totalSettlementAmount}</p>
                </button>
              </div>
            </div>

            {paymentType === 'PRINCIPAL' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enter Principal Repayment Amount (₹)
                </label>
                <input
                  type="number"
                  min="1000"
                  max={loan.outstandingPrincipal}
                  value={customAmount || ''}
                  placeholder={`Min ₹1,000, Max ₹${loan.outstandingPrincipal}`}
                  onChange={(e) => setCustomAmount(Number(e.target.value))}
                  className="w-full liquid-glass-sub rounded-2xl p-3.5 text-sm font-mono text-slate-900 border border-slate-200/80 outline-none focus:border-amber-500 bg-white/80"
                  required
                />
              </div>
            )}

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Payment Channel
              </label>
              <div className="liquid-glass-sub rounded-2xl p-3.5 flex items-center justify-between text-xs border border-slate-200/80">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                  <span className="text-slate-700 font-medium">Instant UPI / Net Banking Gateway</span>
                </div>
                <span className="text-emerald-700 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Zero Surcharge</span>
              </div>
            </div>

            {/* Action Buttons */}
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
                Confirm Payment of ₹{defaultPayAmount.toLocaleString('en-IN')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
