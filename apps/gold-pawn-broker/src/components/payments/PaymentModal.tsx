import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Mortgage, PaymentMethod } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { 
  Receipt, X, Search, Wallet, CheckCircle2, 
  ArrowRight, ShieldCheck, Printer, AlertCircle 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PaymentModalProps {
  onClose: () => void;
  targetMortgage?: Mortgage;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ onClose, targetMortgage }) => {
  const { 
    mortgages, 
    customers, 
    receivePayment, 
    getMortgageDueInfo,
    setReceiptModalData 
  } = useApp();

  const [selectedMortgageId, setSelectedMortgageId] = useState<string>(
    targetMortgage?.id || mortgages.find(m => m.status !== 'Closed')?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [amountReceived, setAmountReceived] = useState<number>(0);

  const activeMortgages = mortgages.filter(m => m.status !== 'Closed');
  const mortgage = mortgages.find(m => m.id === selectedMortgageId);
  const customer = mortgage ? customers.find(c => c.id === mortgage.customerId) : null;
  const dueInfo = mortgage ? getMortgageDueInfo(mortgage) : null;

  // Total current due
  const principalDue = mortgage?.outstandingPrincipal || 0;
  const interestDue = dueInfo?.baseInterest || 0;
  const penaltiesDue = dueInfo?.penaltyCharges || 0;
  const totalDue = principalDue + interestDue + penaltiesDue;

  // Auto initialize amountReceived to interestDue or totalDue
  useEffect(() => {
    if (dueInfo && amountReceived === 0) {
      setAmountReceived(interestDue + penaltiesDue);
    }
  }, [selectedMortgageId, interestDue, penaltiesDue]);

  // Allocation Priority: Penalty -> Interest -> Principal
  let remaining = amountReceived || 0;
  const allocPenalty = Math.min(penaltiesDue, remaining);
  remaining -= allocPenalty;

  const allocInterest = Math.min(interestDue, remaining);
  remaining -= allocInterest;

  const allocPrincipal = Math.min(principalDue, remaining);

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mortgage || amountReceived <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    const payment = receivePayment({
      mortgageId: mortgage.id,
      amount: amountReceived,
      paymentMethod,
      referenceNumber,
      allocation: {
        principal: allocPrincipal,
        interest: allocInterest,
        penalties: allocPenalty,
        charges: 0
      }
    });

    try {
      confetti({ particleCount: 50, spread: 50 });
    } catch {}

    // Open printable receipt immediately
    setReceiptModalData({
      type: 'payment',
      mortgage,
      customer: customer || undefined,
      payment
    });

    onClose();
  };

  const filteredMortgages = activeMortgages.filter(m => {
    const cust = customers.find(c => c.id === m.customerId);
    return (
      m.mortgageNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.customerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cust && cust.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (cust && cust.mobile.includes(searchQuery))
    );
  });

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5">
      <div className="liquid-glass-modal border border-amber-200/80 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-500/15 via-white/60 to-amber-500/10 border-b border-amber-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 liquid-glass-gold text-amber-950 rounded-2xl border border-amber-300 shadow-xs">
              <Receipt className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Receive Payment & Statutory Allocation (Section 12)</h3>
              <p className="text-[11px] text-slate-500">Automated legal order: Penalties → Accrued Interest → Principal Reduction</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmitPayment} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-slate-700">
          
          {/* Mortgage Selection if not pre-locked */}
          {!targetMortgage && (
            <div className="space-y-2">
              <label className="block font-bold text-slate-700">Select Pledge Account</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter pledges by number or borrower name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-amber-200/70 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                {filteredMortgages.map(m => {
                  const cust = customers.find(c => c.id === m.customerId);
                  const isSel = m.id === selectedMortgageId;
                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        setSelectedMortgageId(m.id);
                        setAmountReceived(0);
                      }}
                      className={`p-2 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        isSel 
                          ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/15 border-amber-500 shadow-xs' 
                          : 'bg-white/80 border-slate-200 hover:bg-white'
                      }`}
                    >
                      <div>
                        <div className="font-mono font-black text-amber-800 text-xs">{m.mortgageNumber}</div>
                        <div className="text-[11px] text-slate-700 font-bold">{cust?.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-slate-900">{formatCurrency(m.outstandingPrincipal)}</div>
                        <span className="text-[10px] text-slate-500">{m.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Current Mortgage Overview Box */}
          {mortgage && (
            <div className="p-3.5 bg-white/80 rounded-2xl border border-amber-200/70 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-amber-800 text-sm">{mortgage.mortgageNumber}</span>
                  <span className="text-slate-600 font-semibold">({customer?.name} • {customer?.mobile})</span>
                </div>
                <span className="text-xs text-slate-500 font-mono">Pawn Date: {formatDate(mortgage.mortgageDate)}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Principal O/S</span>
                  <div className="font-mono font-black text-slate-900 mt-0.5">{formatCurrency(principalDue)}</div>
                </div>
                <div className="p-2 bg-amber-50/70 border border-amber-200 rounded-xl">
                  <span className="text-[10px] text-amber-800 uppercase font-bold">Interest Due</span>
                  <div className="font-mono font-black text-amber-800 mt-0.5">{formatCurrency(interestDue)}</div>
                </div>
                <div className="p-2 bg-rose-50/70 border border-rose-200 rounded-xl">
                  <span className="text-[10px] text-rose-700 uppercase font-bold">Penalties</span>
                  <div className="font-mono font-black text-rose-700 mt-0.5">{formatCurrency(penaltiesDue)}</div>
                </div>
                <div className="p-2 bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-emerald-50 border border-emerald-300 rounded-xl">
                  <span className="text-[10px] text-emerald-800 uppercase font-extrabold">Total Due</span>
                  <div className="font-mono font-black text-emerald-800 mt-0.5">{formatCurrency(totalDue)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Amount Entry & Fast Action Pills */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 text-xs">Amount to Collect (₹) *</label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAmountReceived(interestDue + penaltiesDue)}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-[11px] font-bold border border-amber-300 shadow-2xs transition"
                >
                  Interest Only ({formatCurrency(interestDue + penaltiesDue)})
                </button>
                <button
                  type="button"
                  onClick={() => setAmountReceived(totalDue)}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl text-[11px] font-bold border border-emerald-300 shadow-2xs transition"
                >
                  Full Settlement ({formatCurrency(totalDue)})
                </button>
              </div>
            </div>

            <input
              type="number"
              required
              min={1}
              value={amountReceived || ''}
              onChange={(e) => setAmountReceived(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-white border border-emerald-400 rounded-2xl text-emerald-800 font-mono font-black text-2xl focus:outline-none focus:ring-3 focus:ring-emerald-400/30 shadow-xs"
            />
          </div>

          {/* Allocation Breakdown Preview (Section 12 priority rule) */}
          <div className="p-3.5 bg-white/70 border border-amber-200/70 rounded-2xl space-y-1.5 shadow-xs">
            <div className="font-bold text-slate-800 text-[11px]">Statutory Allocation Breakdown:</div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 bg-rose-50/80 border border-rose-200 rounded-xl">
                <span className="text-[10px] text-rose-700 block font-bold">1. Penalty Clearance</span>
                <span className="font-mono font-black text-rose-800">{formatCurrency(allocPenalty)}</span>
              </div>
              <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl">
                <span className="text-[10px] text-amber-800 block font-bold">2. Interest Income</span>
                <span className="font-mono font-black text-amber-800">{formatCurrency(allocInterest)}</span>
              </div>
              <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl">
                <span className="text-[10px] text-emerald-800 block font-bold">3. Principal Recovery</span>
                <span className="font-mono font-black text-emerald-800">{formatCurrency(allocPrincipal)}</span>
              </div>
            </div>
            {mortgage && allocPrincipal > 0 && (
              <div className="text-[10px] text-slate-600 text-center pt-1 font-mono">
                Remaining Principal after payment: <strong className="text-amber-800 font-bold">{formatCurrency(Math.max(0, mortgage.outstandingPrincipal - allocPrincipal))}</strong>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Payment Method</label>
            <div className="grid grid-cols-4 gap-2">
              {(['Cash', 'UPI', 'Bank Transfer', 'Cheque'] as PaymentMethod[]).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`py-2 rounded-xl text-center font-bold text-xs border transition ${
                    paymentMethod === m
                      ? 'bg-gradient-to-r from-amber-500/25 to-yellow-500/15 text-slate-950 border-amber-500 shadow-xs'
                      : 'bg-white/80 text-slate-600 border-slate-200 hover:bg-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Reference No for UPI/Bank */}
          {paymentMethod !== 'Cash' && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {paymentMethod} Transaction Reference / UTR Number
              </label>
              <input
                type="text"
                placeholder="e.g. UPI/REF/9841029384/89102"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-amber-200/80 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-400/40"
              />
            </div>
          )}

          {/* Footer Actions */}
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
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition flex items-center gap-2 border border-white/40"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Record Payment & Print Receipt</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
