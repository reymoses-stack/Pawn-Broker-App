import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
import { 
  Wallet, Landmark, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, 
  X, CheckCircle2, AlertCircle, Printer, FileText, Check, ShieldCheck 
} from 'lucide-react';

export const CashDrawerTransactionModal: React.FC = () => {
  const { 
    isDrawerModalOpen, 
    setIsDrawerModalOpen, 
    drawerModalInitialTab, 
    getCashBalance, 
    getBankBalance, 
    addDrawerTransaction,
    currentBranch,
    bankAccounts,
    language 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'CashIn' | 'Withdrawal' | 'Transfer'>('CashIn');
  const [selectedAccount, setSelectedAccount] = useState<'Cash' | 'Bank'>('Cash');
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [transferDirection, setTransferDirection] = useState<'ToBank' | 'ToCash'>('ToBank');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (drawerModalInitialTab) {
      setActiveTab(drawerModalInitialTab);
    }
  }, [drawerModalInitialTab, isDrawerModalOpen]);

  const cashBal = getCashBalance();
  const bankBal = getBankBalance();

  // Reset defaults when switching tabs
  useEffect(() => {
    setAmount('');
    setNotes('');
    setReferenceNumber('');
    setErrorMessage(null);
    setSuccessMessage(null);
    if (activeTab === 'CashIn') {
      setCategory('Owner Capital Inflow');
    } else if (activeTab === 'Withdrawal') {
      setCategory('Owner Drawings / Personal');
    } else {
      setCategory('Internal Fund Transfer');
    }
  }, [activeTab]);

  if (!isDrawerModalOpen) return null;

  const numAmount = Number(amount) || 0;

  // Calculate projected balance
  let projectedCash = cashBal;
  let projectedBank = bankBal;

  if (activeTab === 'CashIn') {
    if (selectedAccount === 'Cash') projectedCash += numAmount;
    else projectedBank += numAmount;
  } else if (activeTab === 'Withdrawal') {
    if (selectedAccount === 'Cash') projectedCash -= numAmount;
    else projectedBank -= numAmount;
  } else if (activeTab === 'Transfer') {
    if (transferDirection === 'ToBank') {
      projectedCash -= numAmount;
      projectedBank += numAmount;
    } else {
      projectedCash += numAmount;
      projectedBank -= numAmount;
    }
  }

  const handleQuickAmount = (val: number) => {
    setAmount(val.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (numAmount <= 0) {
      setErrorMessage(language === 'ta' ? 'செல்லுபடியாகும் தொகையை உள்ளிடவும்.' : 'Please enter a valid amount greater than 0.');
      return;
    }

    if (activeTab === 'Withdrawal') {
      const sourceBal = selectedAccount === 'Cash' ? cashBal : bankBal;
      if (numAmount > sourceBal) {
        setErrorMessage(
          language === 'ta' 
            ? `போதுமான இருப்பு இல்லை! தற்போதைய ${selectedAccount === 'Cash' ? 'கல்லா' : 'வங்கி'} இருப்பு: ${formatCurrency(sourceBal)}` 
            : `Insufficient balance! Current ${selectedAccount} balance is ${formatCurrency(sourceBal)}`
        );
        return;
      }
    }

    if (activeTab === 'Transfer') {
      const sourceBal = transferDirection === 'ToBank' ? cashBal : bankBal;
      if (numAmount > sourceBal) {
        setErrorMessage(
          language === 'ta' 
            ? `பரிமாற்றத்திற்கு போதுமான இருப்பு இல்லை! ${transferDirection === 'ToBank' ? 'கல்லா' : 'வங்கி'} இருப்பு: ${formatCurrency(sourceBal)}` 
            : `Insufficient source balance for transfer! Available: ${formatCurrency(sourceBal)}`
        );
        return;
      }
    }

    let actionToUse: 'CashIn' | 'Withdrawal' | 'TransferToBank' | 'TransferToCash' = 'CashIn';
    if (activeTab === 'CashIn') {
      actionToUse = 'CashIn';
    } else if (activeTab === 'Withdrawal') {
      actionToUse = 'Withdrawal';
    } else if (activeTab === 'Transfer') {
      actionToUse = transferDirection === 'ToBank' ? 'TransferToBank' : 'TransferToCash';
    }

    addDrawerTransaction({
      account: selectedAccount,
      action: actionToUse,
      amount: numAmount,
      category: category || (activeTab === 'CashIn' ? 'Cash Inflow' : 'Cash Outflow'),
      notes: notes || (activeTab === 'CashIn' ? 'Counter deposit' : 'Counter withdrawal'),
      referenceNumber: referenceNumber || undefined
    });

    setSuccessMessage(
      language === 'ta'
        ? `வெற்றிகரமாக பதிவு செய்யப்பட்டது: ${formatCurrency(numAmount)}`
        : `Transaction successfully recorded: ${formatCurrency(numAmount)}`
    );

    setTimeout(() => {
      setIsDrawerModalOpen(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="liquid-glass-modal border border-amber-200/90 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col bg-white">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500/15 via-white/50 to-yellow-500/10 border-b border-amber-200/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/30 font-bold">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {language === 'ta' ? 'கல்லா & வங்கி பணப் பரிவர்த்தனை' : 'Cash Drawer & Bank Operations'}
                </h3>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                  SECTION 16
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {language === 'ta' 
                  ? 'கல்லா அல்லது வங்கியில் பணம் வரவு மற்றும் எடுப்பது' 
                  : 'Cash in / capital injection, withdrawals & internal transfers'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsDrawerModalOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-white/80 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Balances Strip */}
        <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50/80 border-b border-slate-200 text-xs">
          <div className="p-2.5 rounded-2xl bg-white border border-emerald-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase">
              <span className="flex items-center gap-1">
                <Wallet className="w-3 h-3 text-emerald-600" />
                <span>{language === 'ta' ? 'கல்லா இருப்பு' : 'Cash Drawer'}</span>
              </span>
              <span className="text-emerald-700 font-mono text-[9px]">LIVE</span>
            </div>
            <div className="text-base font-black font-mono text-emerald-800 mt-0.5">
              {formatCurrency(cashBal)}
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-white border border-blue-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase">
              <span className="flex items-center gap-1">
                <Landmark className="w-3 h-3 text-blue-600" />
                <span>{language === 'ta' ? 'வங்கி இருப்பு' : 'Bank Account'}</span>
              </span>
              <span className="text-blue-700 font-mono text-[9px]">{currentBranch.code}</span>
            </div>
            <div className="text-base font-black font-mono text-blue-900 mt-0.5">
              {formatCurrency(bankBal)}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="p-3 bg-amber-50/50 border-b border-amber-200/50">
          <div className="grid grid-cols-3 gap-1 bg-white/80 p-1 rounded-2xl border border-amber-200/80 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('CashIn')}
              className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === 'CashIn'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>{language === 'ta' ? 'வரவு (Cash In)' : 'Cash In / Deposit'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('Withdrawal')}
              className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === 'Withdrawal'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{language === 'ta' ? 'பற்று (Withdraw)' : 'Withdrawal'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('Transfer')}
              className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === 'Transfer'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>{language === 'ta' ? 'பரிமாற்றம் (Transfer)' : 'Transfer'}</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          
          {/* Account Choice (for CashIn / Withdrawal) */}
          {activeTab !== 'Transfer' ? (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                {language === 'ta' ? 'கணக்கு தேர்வு செய்க:' : 'Target Account:'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAccount('Cash')}
                  className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                    selectedAccount === 'Cash'
                      ? 'bg-amber-50 border-amber-500 font-bold text-slate-900 ring-2 ring-amber-400/30'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Wallet className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="font-bold text-xs">{language === 'ta' ? 'கல்லா (Cash Drawer)' : 'Cash Drawer'}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{formatCurrency(cashBal)}</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedAccount('Bank')}
                  className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                    selectedAccount === 'Bank'
                      ? 'bg-amber-50 border-amber-500 font-bold text-slate-900 ring-2 ring-amber-400/30'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Landmark className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="font-bold text-xs">{language === 'ta' ? 'வங்கி கணக்கு (Bank)' : 'Bank Account'}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{formatCurrency(bankBal)}</div>
                  </div>
                </button>
              </div>

              {selectedAccount === 'Bank' && bankAccounts.length > 0 && (
                <div className="mt-2.5">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    {language === 'ta' ? 'குறிப்பிட்ட வங்கி கணக்கு:' : 'Select Commercial Bank Account:'}
                  </label>
                  <select
                    value={selectedBankAccountId}
                    onChange={(e) => setSelectedBankAccountId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none"
                  >
                    <option value="">{language === 'ta' ? '-- முதன்மை வங்கி கணக்கு --' : '-- Primary / Default Bank Account --'}</option>
                    {bankAccounts.map(ba => (
                      <option key={ba.id} value={ba.id}>
                        {ba.bankName} (••{ba.accountNumber.slice(-4)}) - {formatCurrency(ba.balance)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ) : (
            /* Transfer Direction Choice */
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                {language === 'ta' ? 'பரிமாற்ற திசை:' : 'Transfer Route:'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTransferDirection('ToBank')}
                  className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                    transferDirection === 'ToBank'
                      ? 'bg-amber-50 border-amber-500 font-bold text-slate-900 ring-2 ring-amber-400/30'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4 text-amber-700" />
                  <div>
                    <div className="font-bold text-xs">{language === 'ta' ? 'கல்லா ➜ வங்கி' : 'Drawer ➜ Bank Deposit'}</div>
                    <div className="text-[10px] text-slate-500">Deposit counter cash to bank</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTransferDirection('ToCash')}
                  className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                    transferDirection === 'ToCash'
                      ? 'bg-amber-50 border-amber-500 font-bold text-slate-900 ring-2 ring-amber-400/30'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4 text-emerald-700" />
                  <div>
                    <div className="font-bold text-xs">{language === 'ta' ? 'வங்கி ➜ கல்லா' : 'Bank ➜ Cash Drawer Float'}</div>
                    <div className="text-[10px] text-slate-500">ATM / Bank cash to drawer</div>
                  </div>
                </button>
              </div>

              {bankAccounts.length > 0 && (
                <div className="mt-2.5">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    {transferDirection === 'ToBank' 
                      ? (language === 'ta' ? 'டெபாசிட் செய்யும் வங்கி:' : 'Deposit Into Bank Account:')
                      : (language === 'ta' ? 'பணம் எடுக்கும் வங்கி:' : 'Withdraw From Bank Account:')}
                  </label>
                  <select
                    value={selectedBankAccountId}
                    onChange={(e) => setSelectedBankAccountId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none"
                  >
                    <option value="">{language === 'ta' ? '-- முதன்மை வங்கி கணக்கு --' : '-- Primary / Default Bank Account --'}</option>
                    {bankAccounts.map(ba => (
                      <option key={ba.id} value={ba.id}>
                        {ba.bankName} (••{ba.accountNumber.slice(-4)}) - {formatCurrency(ba.balance)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Amount Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                {language === 'ta' ? 'தொகை (INR) *:' : 'Transaction Amount (INR) *:'}
              </label>
              {numAmount > 0 && (
                <span className="text-[11px] font-mono font-bold text-amber-900">
                  {formatCurrency(numAmount)}
                </span>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-sm">
                ₹
              </span>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount (e.g. 50000)"
                className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-mono font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            {/* Quick Amount Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[5000, 10000, 25000, 50000, 100000, 200000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAmount(val)}
                  className="px-2 py-1 bg-white hover:bg-amber-50 hover:text-amber-900 text-slate-600 rounded-lg text-[10px] font-mono font-bold border border-slate-200 transition"
                >
                  +{formatCurrency(val)}
                </button>
              ))}
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
              {language === 'ta' ? 'பிரிவு / காரணம் (Category):' : 'Reason / Classification:'}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {activeTab === 'CashIn' && (
                <>
                  <option value="Owner Capital Inflow">Owner Capital Inflow (உரிமையாளர் மூலதனம்)</option>
                  <option value="Morning Drawer Float">Morning Counter Cash Float (காலை தொடக்க இருப்பு)</option>
                  <option value="Partner Capital Injection">Partner Capital Injection (பங்குதாரர் முதலீடு)</option>
                  <option value="Customer Refund / Recovery">Customer Return / Recovery (வாடிக்கையாளர் வரவு)</option>
                  <option value="Miscellaneous Cash In">Miscellaneous Cash In (இதர வரவு)</option>
                </>
              )}
              {activeTab === 'Withdrawal' && (
                <>
                  <option value="Owner Drawings / Personal">Owner Drawings / Personal (உரிமையாளர் தனிப்பட்ட செலவு)</option>
                  <option value="Bank Cash Deposit">Bank Cash Deposit (வங்கி டெபாசிட்)</option>
                  <option value="Vault Reserve Storage">Vault Reserve Storage (பெட்டக இருப்பு)</option>
                  <option value="Supplier / Vendor Settlement">Supplier / Bullion Settlement (நகை வணிகர் தீர்வு)</option>
                  <option value="Miscellaneous Withdrawal">Miscellaneous Withdrawal (இதர பற்று)</option>
                </>
              )}
              {activeTab === 'Transfer' && (
                <>
                  <option value="Bank Cash Deposit">Bank Cash Deposit (வங்கி டெபாசிட்)</option>
                  <option value="ATM Cash Float Withdrawal">ATM Cash Float Withdrawal (ATM பணம் எடுத்தல்)</option>
                  <option value="Internal Vault Rebalance">Internal Vault Rebalance (உள் பரிமாற்றம்)</option>
                </>
              )}
            </select>
          </div>

          {/* Notes & Voucher Reference */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">
                {language === 'ta' ? 'குறிப்பு (Notes):' : 'Narration / Notes:'}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Added cash for daily loan lending"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">
                {language === 'ta' ? 'ரசீது / சான்று எண்:' : 'Voucher / Ref No:'}
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. VCH-0042 / UTR"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          {/* Balance Projection Strip */}
          {numAmount > 0 && (
            <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-300/80 space-y-1 text-slate-800">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 block">
                {language === 'ta' ? 'இருப்பு கணக்கீடு (Balance Projection):' : 'Reconciliation Projection:'}
              </span>
              <div className="flex items-center justify-between text-xs font-mono">
                <span>Cash Drawer:</span>
                <span>
                  {formatCurrency(cashBal)} ➜ <strong className="text-emerald-800 font-black">{formatCurrency(projectedCash)}</strong>
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span>Bank Account:</span>
                <span>
                  {formatCurrency(bankBal)} ➜ <strong className="text-blue-900 font-black">{formatCurrency(projectedBank)}</strong>
                </span>
              </div>
            </div>
          )}

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Submit Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsDrawerModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
            >
              {language === 'ta' ? 'ரத்து' : 'Cancel'}
            </button>

            <button
              type="submit"
              className={`px-5 py-2.5 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 ${
                activeTab === 'CashIn' 
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                  : activeTab === 'Withdrawal'
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                  : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>
                {activeTab === 'CashIn' && (language === 'ta' ? 'பணம் வரவு வைக்க (+)' : 'Confirm Cash In (+)')}
                {activeTab === 'Withdrawal' && (language === 'ta' ? 'பணம் பற்று செய்க (-)' : 'Confirm Withdrawal (-)')}
                {activeTab === 'Transfer' && (language === 'ta' ? 'பரிமாற்றம் செய்க' : 'Execute Transfer')}
              </span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
