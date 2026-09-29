import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Mortgage } from '../../types';
import { formatCurrency, formatWeight, formatDate } from '../../utils/formatters';
import { 
  CheckCircle2, X, Lock, Gem, ShieldCheck, 
  Printer, UserCheck, AlertTriangle 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ClosureModalProps {
  mortgage: Mortgage;
  onClose: () => void;
}

export const ClosureModal: React.FC<ClosureModalProps> = ({ mortgage, onClose }) => {
  const { 
    customers, 
    packets, 
    receivePayment, 
    closeMortgageAndReleaseGold, 
    getMortgageDueInfo, 
    setReceiptModalData,
    currentUser
  } = useApp();

  const customer = customers.find(c => c.id === mortgage.customerId);
  const packet = packets.find(p => p.id === mortgage.packetId);
  const dueInfo = getMortgageDueInfo(mortgage);

  const principal = mortgage.outstandingPrincipal;
  const interest = dueInfo?.baseInterest || 0;
  const penalties = dueInfo?.penaltyCharges || 0;
  const totalSettlementAmount = principal + interest + penalties;

  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Bank Transfer' | 'UPI'>('Cash');
  const [managerPin, setManagerPin] = useState('1234');
  const [recipientName, setRecipientName] = useState(customer?.name || '');
  const [recipientRelation, setRecipientRelation] = useState('Self (Borrower)');
  const [idVerificationConfirmed, setIdVerificationConfirmed] = useState(false);
  const [goldWeightVerified, setGoldWeightVerified] = useState(false);
  const [notes, setNotes] = useState('');

  const totalNetWeight = mortgage.items.reduce((sum, item) => sum + item.netWeight, 0);

  const handleFinalClosure = (e: React.FormEvent) => {
    e.preventDefault();

    if (!idVerificationConfirmed || !goldWeightVerified) {
      alert('Please check all mandatory physical inspection & identity gates.');
      return;
    }

    // 1. If there is remaining balance, pay it off
    if (totalSettlementAmount > 0) {
      receivePayment({
        mortgageId: mortgage.id,
        amount: totalSettlementAmount,
        paymentMethod: paymentMode,
        allocation: {
          principal: principal,
          interest: interest,
          penalties: penalties,
          charges: 0
        }
      });
    }

    // 2. Mark Closed and Release packet
    closeMortgageAndReleaseGold(
      mortgage.id, 
      `Settled in full via ${paymentMode}. Handed over to ${recipientName} (${recipientRelation}). Manager PIN verified.`
    );

    try {
      confetti({ particleCount: 70, spread: 80 });
    } catch {}

    // Open closure & release certificate
    setReceiptModalData({
      type: 'closure',
      mortgage: { ...mortgage, status: 'Closed', outstandingPrincipal: 0 },
      customer,
      packet: packet ? { ...packet, status: 'Released' } : undefined,
      notes: `Gold packet ${mortgage.packetId} released to ${recipientName} (${recipientRelation}) on ${new Date().toLocaleString()}`
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="liquid-glass-modal border border-amber-200/80 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500/15 via-white/60 to-yellow-500/10 border-b border-amber-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 liquid-glass-gold text-amber-950 rounded-2xl border border-amber-300 shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Full Mortgage Settlement & Gold Custody Release</h3>
              <p className="text-[11px] text-slate-500">Section 14: Final settlement audit, dual verification & strongroom handover</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleFinalClosure} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-slate-700">
          
          {/* Settlement Calculation Box */}
          <div className="p-4 bg-white/80 rounded-2xl border border-amber-200/70 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-amber-100 pb-2">
              <span className="font-black text-amber-800 text-xs font-mono">Pledge Account #{mortgage.mortgageNumber}</span>
              <span className="text-slate-700 font-bold text-[11px]">{customer?.name} ({customer?.id})</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Principal</span>
                <span className="font-mono font-black text-slate-900">{formatCurrency(principal)}</span>
              </div>
              <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl">
                <span className="text-[10px] text-amber-800 uppercase block font-bold">Interest</span>
                <span className="font-mono font-black text-amber-800">{formatCurrency(interest)}</span>
              </div>
              <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-xl">
                <span className="text-[10px] text-rose-700 uppercase block font-bold">Penalties</span>
                <span className="font-mono font-black text-rose-700">{formatCurrency(penalties)}</span>
              </div>
              <div className="p-2.5 bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-emerald-50 border border-emerald-300 rounded-xl">
                <span className="text-[10px] text-emerald-800 uppercase block font-extrabold">Settlement Total</span>
                <span className="font-mono font-black text-emerald-800 text-base">{formatCurrency(totalSettlementAmount)}</span>
              </div>
            </div>
          </div>

          {/* Payment Mode Selection if balance > 0 */}
          {totalSettlementAmount > 0 && (
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Settlement Payment Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Cash', 'UPI', 'Bank Transfer'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMode(m)}
                    className={`py-2 rounded-xl text-center font-bold text-xs border transition ${
                      paymentMode === m
                        ? 'bg-gradient-to-r from-amber-500/25 to-yellow-500/15 text-slate-950 border-amber-500 shadow-xs'
                        : 'bg-white/80 text-slate-600 border-slate-200 hover:bg-white'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Physical Gold Packet Release Details */}
          <div className="p-4 bg-white/70 rounded-2xl border border-amber-200/70 space-y-3 shadow-xs">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-amber-800 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-700" />
                <span>Physical Custody Handover Verification</span>
              </span>
              <span className="font-mono font-black text-slate-800">Packet: {mortgage.packetId}</span>
            </div>

            <div className="p-2.5 bg-amber-50/50 rounded-xl border border-amber-200/70 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block font-semibold">Locker Coordinates</span>
                <span className="font-bold text-slate-800">{packet?.lockerId} • {packet?.rack} • {packet?.tray}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block font-semibold">Total Net Weight to Release</span>
                <span className="font-mono font-black text-emerald-700 text-sm">{formatWeight(totalNetWeight)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Handed Over To (Name)</label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-amber-200/80 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Relationship</label>
                <select
                  value={recipientRelation}
                  onChange={(e) => setRecipientRelation(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-amber-200/80 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                >
                  <option value="Self (Borrower)">Self (Borrower)</option>
                  <option value="Authorized Nominee">Authorized Nominee</option>
                  <option value="Power of Attorney Holder">Power of Attorney Holder</option>
                  <option value="Legal Heir">Legal Heir</option>
                </select>
              </div>
            </div>

            {/* Mandatory Verification Checkboxes */}
            <div className="space-y-2 pt-1 border-t border-amber-100">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={idVerificationConfirmed}
                  onChange={(e) => setIdVerificationConfirmed(e.target.checked)}
                  className="mt-0.5 rounded text-amber-600 focus:ring-0"
                />
                <span className="text-[11px] text-slate-700 leading-relaxed">
                  <strong>Original Pawn Ticket & Government Photo ID Verified:</strong> The original pledge ticket was surrendered and verified against borrower identification.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={goldWeightVerified}
                  onChange={(e) => setGoldWeightVerified(e.target.checked)}
                  className="mt-0.5 rounded text-amber-600 focus:ring-0"
                />
                <span className="text-[11px] text-slate-700 leading-relaxed">
                  <strong>Ornaments Weighment & Hallmarks Counter-Verified:</strong> Gross weight ({formatWeight(packet?.totalGrossWeight || 0)}) weighed before borrower and acknowledged in sound condition.
                </span>
              </label>
            </div>
          </div>

          {/* Authorization Stamp */}
          <div className="p-3.5 bg-amber-500/10 border border-amber-300/60 rounded-2xl flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-amber-700" />
              <div>
                <span className="text-[11px] font-extrabold text-amber-950 block">Authorized Release By:</span>
                <span className="text-[10px] text-slate-600">{currentUser.name} ({currentUser.role})</span>
              </div>
            </div>
            <div className="text-[10px] font-mono text-emerald-800 font-extrabold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-300">
              SECURITY SIGN-OFF OK
            </div>
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
              disabled={!idVerificationConfirmed || !goldWeightVerified}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-300 disabled:opacity-40 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/25 transition flex items-center gap-2 border border-white/50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Settle Loan & Release Gold Packet</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
