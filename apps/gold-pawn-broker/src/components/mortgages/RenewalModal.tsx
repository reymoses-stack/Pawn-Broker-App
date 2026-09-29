import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Mortgage } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { RotateCcw, X, Calendar, CheckCircle2, History } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RenewalModalProps {
  mortgage: Mortgage;
  onClose: () => void;
}

export const RenewalModal: React.FC<RenewalModalProps> = ({ mortgage, onClose }) => {
  const { 
    customers, 
    renewMortgage, 
    receivePayment, 
    getMortgageDueInfo, 
    setReceiptModalData 
  } = useApp();

  const customer = customers.find(c => c.id === mortgage.customerId);
  const dueInfo = getMortgageDueInfo(mortgage);
  const interestDue = (dueInfo?.baseInterest || 0) + (dueInfo?.penaltyCharges || 0);

  const [extensionMonths, setExtensionMonths] = useState<number>(3);
  const [interestPaid, setInterestPaid] = useState<number>(interestDue);
  const [notes, setNotes] = useState('');

  const currentMaturity = new Date(mortgage.maturityDate);
  const newMaturityDate = new Date(currentMaturity.getTime() + extensionMonths * 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const handleConfirmRenewal = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Settle interest via payment
    if (interestPaid > 0) {
      receivePayment({
        mortgageId: mortgage.id,
        amount: interestPaid,
        paymentMethod: 'Cash',
        allocation: {
          principal: 0,
          interest: Math.min(interestPaid, dueInfo?.baseInterest || 0),
          penalties: Math.max(0, interestPaid - (dueInfo?.baseInterest || 0)),
          charges: 0
        }
      });
    }

    // 2. Extend maturity date & record renewal history
    renewMortgage(mortgage.id, newMaturityDate, interestPaid, notes);

    try {
      confetti({ particleCount: 50, spread: 60 });
    } catch {}

    // Open renewal receipt
    setReceiptModalData({
      type: 'renewal',
      mortgage: { ...mortgage, maturityDate: newMaturityDate },
      customer,
      notes: `Renewed for ${extensionMonths} months. Previous maturity: ${mortgage.maturityDate}`
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="liquid-glass-modal border border-amber-200/80 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-500/15 via-white/60 to-amber-500/10 border-b border-amber-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 liquid-glass-gold text-amber-950 rounded-2xl border border-amber-300 shadow-xs">
              <RotateCcw className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Mortgage Renewal & Extension (Section 13)</h3>
              <p className="text-[11px] text-slate-500">Settle accrued interest and extend pledge maturity date</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleConfirmRenewal} className="p-5 space-y-4 text-xs text-slate-700">
          
          {/* Summary Box */}
          <div className="p-3.5 bg-white/80 rounded-2xl border border-amber-200/70 space-y-1.5 shadow-xs">
            <div className="flex justify-between items-center">
              <span className="font-mono font-black text-amber-800 text-sm">{mortgage.mortgageNumber}</span>
              <span className="text-slate-900 font-bold">{customer?.name}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-100">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Principal Outstanding</span>
                <span className="font-mono font-black text-slate-900">{formatCurrency(mortgage.outstandingPrincipal)}</span>
              </div>
              <div>
                <span className="text-[10px] text-amber-800 uppercase block font-bold">Accrued Interest Due</span>
                <span className="font-mono font-black text-amber-800">{formatCurrency(interestDue)}</span>
              </div>
            </div>
          </div>

          {/* Interest Settlement Input */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Interest Amount Paid for Renewal (₹) *
            </label>
            <input
              type="number"
              required
              value={interestPaid}
              onChange={(e) => setInterestPaid(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white border border-amber-200/80 rounded-xl text-amber-800 font-mono font-black text-lg focus:outline-none focus:ring-2 focus:ring-amber-400/40"
            />
          </div>

          {/* Extension Term */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Extension Period</label>
              <select
                value={extensionMonths}
                onChange={(e) => setExtensionMonths(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-amber-200/80 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400/40"
              >
                <option value={1}>+1 Month (30 Days)</option>
                <option value={3}>+3 Months (90 Days)</option>
                <option value={6}>+6 Months (180 Days)</option>
                <option value={12}>+12 Months (360 Days)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">New Maturity Date</label>
              <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl font-mono text-emerald-800 font-black">
                {formatDate(newMaturityDate)}
              </div>
            </div>
          </div>

          {/* Previous Renewals Count */}
          {mortgage.renewalHistory.length > 0 && (
            <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-200 text-[11px] text-blue-900 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-700 shrink-0" />
              <span>This pledge has already been renewed {mortgage.renewalHistory.length} time(s).</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Renewal Notes / Remarks</label>
            <input
              type="text"
              placeholder="e.g. Borrower requested 90-day extension, interest cleared in cash"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-amber-200/80 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400/40"
            />
          </div>

          <div className="p-4 bg-gradient-to-r from-amber-500/10 via-white/80 to-yellow-500/10 border-t border-amber-200/60 flex items-center justify-between -mx-5 -mb-5 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white/80 hover:bg-white rounded-xl border border-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-500/25 transition flex items-center gap-1.5 border border-white/40"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Renewal & Issue Voucher</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
