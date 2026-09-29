import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
import { Plus, X, DollarSign, Calendar, FileText, CheckCircle2 } from 'lucide-react';

interface ExpenseModalProps {
  onClose: () => void;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({ onClose }) => {
  const { addExpense, getCashBalance, getBankBalance, currentBranch } = useApp();

  const [category, setCategory] = useState<any>('Office Supplies');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Bank'>('Cash');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [receiptRef, setReceiptRef] = useState('');

  const cashBal = getCashBalance();
  const bankBal = getBankBalance();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || !description.trim()) {
      alert('Please enter amount and description');
      return;
    }

    addExpense({
      category,
      amount: Number(amount),
      paymentMode,
      date,
      description,
      receiptRef
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="liquid-glass-modal w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-amber-200/80">
        
        {/* Header */}
        <div className="p-4 bg-white/70 border-b border-amber-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-500/10 text-rose-600 rounded-xl border border-rose-500/20">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Record Branch Expense (Section 17)</h3>
              <p className="text-[11px] text-slate-500">Posts automatically to the Khatabook {paymentMode} ledger</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-amber-100/50 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-slate-700">
          
          {/* Balance Indicator */}
          <div className="p-2.5 bg-amber-50/70 rounded-xl border border-amber-200/70 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Available {paymentMode} Balance:</span>
            <span className="font-mono font-bold text-emerald-700">
              {formatCurrency(paymentMode === 'Cash' ? cashBal : bankBal)}
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Expense Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white/90 border border-amber-200/80 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
            >
              {[
                'Rent',
                'Salary',
                'Electricity',
                'Internet',
                'Transport',
                'Maintenance',
                'Marketing',
                'Bank Charges',
                'Office Supplies',
                'Tea & Refreshments',
                'Other'
              ].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Amount (₹) *</label>
            <input
              type="number"
              required
              min={1}
              placeholder="e.g. 850"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white/90 border border-rose-300 rounded-xl text-rose-700 font-mono font-bold text-base focus:ring-2 focus:ring-rose-400/20 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Account</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['Cash', 'Bank'] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    className={`py-1.5 rounded-lg font-bold border transition ${
                      paymentMode === mode
                        ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-sm'
                        : 'bg-white/80 text-slate-600 border-amber-200/80 hover:bg-amber-50/50'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Expense Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-white/90 border border-amber-200/80 rounded-xl text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description / Bill Purpose *</label>
            <textarea
              rows={2}
              required
              placeholder="e.g. Thermal paper rolls 20 units and stationery bills"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-white/90 border border-amber-200/80 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Receipt / Invoice Voucher Ref</label>
            <input
              type="text"
              placeholder="e.g. BILL-9821 or Cash Voucher #40"
              value={receiptRef}
              onChange={(e) => setReceiptRef(e.target.value)}
              className="w-full px-3 py-2 bg-white/90 border border-amber-200/80 rounded-xl text-slate-800 font-mono focus:outline-none"
            />
          </div>

          <div className="p-4 bg-amber-50/60 border-t border-amber-200/60 flex items-center justify-between -mx-5 -mb-5 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/20 transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Post to Khatabook</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
