import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RePledge } from '../../types';
import { formatCurrency, formatWeight, formatDate } from '../../utils/formatters';
import { 
  X, CheckCircle2, ShieldCheck, Landmark, AlertTriangle, 
  ArrowLeft, ArrowDownToLine, Lock 
} from 'lucide-react';

interface BankRetrievalModalProps {
  isOpen: boolean;
  onClose: () => void;
  rePledge: RePledge | null;
}

export const BankRetrievalModal: React.FC<BankRetrievalModalProps> = ({
  isOpen,
  onClose,
  rePledge
}) => {
  const { markRePledgeRetrieved, language } = useApp();

  const [settledAmount, setSettledAmount] = useState<string>(
    rePledge ? rePledge.bankReceivedAmount.toString() : ''
  );
  const [retrievalDate, setRetrievalDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !rePledge) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(settledAmount);
    if (!amountVal || amountVal <= 0) {
      setError(language === 'ta' ? 'செல்லுபடியாகும் தொகையை உள்ளிடவும்' : 'Please enter the valid amount paid to the bank.');
      return;
    }

    markRePledgeRetrieved(rePledge.id, amountVal, notes.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-amber-200/90 shadow-2xl w-full max-w-lg overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <ArrowDownToLine className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>{language === 'ta' ? 'வங்கியில் இருந்து நகை மீட்பு' : 'Retrieve Gold from Bank Vault'}</span>
              </h2>
              <p className="text-xs text-emerald-200/80">
                {rePledge.institutionName} • Ticket #{rePledge.bankLoanNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Context Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Retail Loan / Customer:</span>
              <span className="font-black text-slate-900">{rePledge.mortgageNumber} ({rePledge.customerName})</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Net Weight Pledged:</span>
              <span className="font-black font-mono text-amber-950">{formatWeight(rePledge.appraisedNetWeight)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Originally Borrowed from Bank:</span>
              <span className="font-bold font-mono text-emerald-800">{formatCurrency(rePledge.bankReceivedAmount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Bank Interest Rate:</span>
              <span className="font-bold font-mono text-slate-700">{rePledge.bankInterestRate}% p.a.</span>
            </div>
            {rePledge.scheduledPickupDate && (
              <div className="p-2 rounded-xl bg-amber-100 border border-amber-300 text-amber-950 font-bold flex items-center justify-between">
                <span>Customer Scheduled Pickup:</span>
                <span className="font-mono">{formatDate(rePledge.scheduledPickupDate)}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {language === 'ta' ? 'வங்கிக்கு செலுத்திய மொத்த தொகை (அசல் + வட்டி)' : 'Total Amount Paid to Bank to Settle & Close'}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">₹</span>
              <input
                type="number"
                value={settledAmount}
                onChange={e => setSettledAmount(e.target.value)}
                placeholder="e.g. 154500"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-emerald-50/70 border border-emerald-300 text-sm font-black font-mono text-emerald-950 focus:bg-white focus:border-emerald-500 outline-hidden"
                required
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Principal + bank interest charges paid at counter
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {language === 'ta' ? 'மீட்கப்பட்ட தேதி' : 'Date Retrieved from Bank'}
            </label>
            <input
              type="date"
              value={retrievalDate}
              onChange={e => setRetrievalDate(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-amber-500 outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {language === 'ta' ? 'வங்கி ரசீது எண் / குறிப்புகள்' : 'Bank Release Receipt No & Remarks'}
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Settle receipt #SB-9932; packet verified intact with seals"
              className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-800 focus:bg-white focus:border-amber-500 outline-hidden"
            />
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              Once confirmed, this gold packet will be marked <strong>Back in Shop Vault</strong>, clearing all customer redemption safety alerts.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
            >
              {language === 'ta' ? 'ரத்து செய்' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-600/25 transition active:scale-98 cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{language === 'ta' ? 'பெட்டகத்திற்கு திரும்பியது என உறுதிப்படுத்து' : 'Confirm Stored in Shop Vault'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
