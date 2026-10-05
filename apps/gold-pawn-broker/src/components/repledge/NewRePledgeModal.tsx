import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Mortgage, RePledgeDestinationType } from '../../types';
import { formatCurrency, formatWeight, formatDate } from '../../utils/formatters';
import { 
  Building2, X, Landmark, Calculator, ArrowRight, 
  Sparkles, CheckCircle2, ShieldAlert, AlertTriangle, Gem 
} from 'lucide-react';

interface NewRePledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedMortgageId?: string;
}

export const NewRePledgeModal: React.FC<NewRePledgeModalProps> = ({
  isOpen,
  onClose,
  preSelectedMortgageId
}) => {
  const { 
    mortgages, 
    customers, 
    addRePledge, 
    currentBranch, 
    currentUser, 
    language 
  } = useApp();

  // Eligible active mortgages in this branch that are currently in shop vault
  const eligibleMortgages = useMemo(() => {
    return mortgages.filter(m => 
      m.branchId === currentBranch.id && 
      m.status !== 'Closed' &&
      (!m.rePledgeStatus || m.rePledgeStatus === 'IN_VAULT' || m.rePledgeStatus === 'BACK_IN_VAULT')
    );
  }, [mortgages, currentBranch.id]);

  const [selectedMortgageId, setSelectedMortgageId] = useState<string>(
    preSelectedMortgageId || eligibleMortgages[0]?.id || ''
  );

  const selectedMortgage = useMemo(() => {
    return mortgages.find(m => m.id === selectedMortgageId);
  }, [mortgages, selectedMortgageId]);

  const selectedCustomer = useMemo(() => {
    if (!selectedMortgage) return null;
    return customers.find(c => c.id === selectedMortgage.customerId);
  }, [customers, selectedMortgage]);

  const totalNetWeight = useMemo(() => {
    if (!selectedMortgage) return 0;
    return selectedMortgage.items.reduce((sum, item) => sum + item.netWeight, 0);
  }, [selectedMortgage]);

  const todayStr = new Date().toISOString().split('T')[0];
  const nextYearDate = new Date();
  nextYearDate.setFullYear(nextYearDate.getFullYear() + 1);
  const defaultDueDate = nextYearDate.toISOString().split('T')[0];

  // Form State
  const [destinationType, setDestinationType] = useState<RePledgeDestinationType>('Bank');
  const [institutionName, setInstitutionName] = useState('State Bank of India');
  const [bankLoanNumber, setBankLoanNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState(currentUser.name || 'Shop Owner');
  const [dateMoved, setDateMoved] = useState(todayStr);
  const [bankDueDate, setBankDueDate] = useState(defaultDueDate);
  const [appraisedNetWeight, setAppraisedNetWeight] = useState(totalNetWeight.toString());
  const [bankValuationPerGram, setBankValuationPerGram] = useState('6500');
  const [bankReceivedAmount, setBankReceivedAmount] = useState('');
  const [bankInterestRate, setBankInterestRate] = useState('9.5'); // % p.a.
  const [bankPacketReference, setBankPacketReference] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Sync weight when selected mortgage changes
  React.useEffect(() => {
    if (selectedMortgage) {
      const net = selectedMortgage.items.reduce((s, it) => s + it.netWeight, 0);
      setAppraisedNetWeight(net.toString());
      // Default bank received amount to ~principal or slightly higher
      if (!bankReceivedAmount) {
        setBankReceivedAmount((selectedMortgage.principalAmount * 1.1).toFixed(0));
      }
    }
  }, [selectedMortgage]);

  if (!isOpen) return null;

  // Financial Arbitrage Calculations
  const custAnnualRate = selectedMortgage ? (selectedMortgage.interestRate * 12) : 24; // % p.a.
  const bankAnnualRate = parseFloat(bankInterestRate) || 0;
  const netSpreadMargin = +(custAnnualRate - bankAnnualRate).toFixed(2);
  const receivedAmt = parseFloat(bankReceivedAmount) || 0;
  const lentAmt = selectedMortgage ? selectedMortgage.principalAmount : 0;
  const liquidityGain = receivedAmt - lentAmt;
  const monthlySpreadProfit = +((lentAmt * (netSpreadMargin / 100)) / 12).toFixed(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedMortgage) {
      setError(language === 'ta' ? 'அடமானத்தைத் தேர்ந்தெடுக்கவும்' : 'Please select a pledge loan to re-pledge.');
      return;
    }

    if (!institutionName.trim()) {
      setError(language === 'ta' ? 'வங்கி / நிதி நிறுவனத்தின் பெயரை உள்ளிடவும்' : 'Please enter the institution/bank name.');
      return;
    }

    if (!bankLoanNumber.trim()) {
      setError(language === 'ta' ? 'வங்கி கடன் கணக்கு எண்ணை உள்ளிடவும்' : 'Please enter the bank loan/ticket number.');
      return;
    }

    if (receivedAmt <= 0) {
      setError(language === 'ta' ? 'செல்லுபடியாகும் கடன் தொகையை உள்ளிடவும்' : 'Please enter the valid amount received from bank.');
      return;
    }

    const netWeightVal = parseFloat(appraisedNetWeight) || totalNetWeight;
    const valuationPerGramVal = parseFloat(bankValuationPerGram) || 0;

    addRePledge({
      mortgageId: selectedMortgage.id,
      mortgageNumber: selectedMortgage.mortgageNumber,
      customerId: selectedMortgage.customerId,
      customerName: selectedCustomer?.name || 'Customer',
      customerMobile: selectedCustomer?.mobile || '',
      branchId: currentBranch.id,
      destinationType,
      institutionName: institutionName.trim(),
      bankLoanNumber: bankLoanNumber.trim(),
      accountHolderName: accountHolderName.trim(),
      dateMoved,
      bankDueDate,
      appraisedNetWeight: netWeightVal,
      bankValuationPerGram: valuationPerGramVal,
      bankReceivedAmount: receivedAmt,
      retailLoanAmount: lentAmt,
      bankInterestRate: bankAnnualRate,
      customerInterestRate: custAnnualRate,
      netSpreadMargin,
      bankPacketReference: bankPacketReference.trim() || undefined,
      custodyStatus: 'Re-Pledged',
      notes: notes.trim() || undefined
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-amber-200/90 shadow-2xl w-full max-w-3xl my-6 overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-amber-950 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>{language === 'ta' ? 'புதிய மறு அடமானம் (வங்கி பரிமாற்றம்)' : 'New Re-Pledge (Forward Mortgage)'}</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 text-[10px] font-mono border border-amber-400/30">
                  TREASURY
                </span>
              </h2>
              <p className="text-xs text-amber-200/80">
                {language === 'ta'
                  ? 'கடை பெட்டகத்தில் உள்ள தங்கத்தை வங்கியில் மறு அடமானம் வைத்து கூடுதல் பணப்புழக்கம் மற்றும் வட்டி லாபம் பெறுங்கள்'
                  : 'Pledge customer ornaments with external banks or master brokers to gain liquidity and interest spread'}
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

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Select Active Pledge Loan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              1. {language === 'ta' ? 'மறு அடமானம் செய்ய வேண்டிய நகைக் கணக்கு' : 'Select Customer Pledge Loan (From Shop Vault)'}
            </label>
            {eligibleMortgages.length === 0 ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                {language === 'ta' 
                  ? 'கடை பெட்டகத்தில் தற்போது மறு அடமானம் செய்ய தகுதியான அடமானங்கள் இல்லை.' 
                  : 'No eligible active pledges currently in the shop safe locker.'}
              </div>
            ) : (
              <select
                value={selectedMortgageId}
                onChange={e => setSelectedMortgageId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-hidden transition cursor-pointer"
              >
                {eligibleMortgages.map(m => {
                  const cust = customers.find(c => c.id === m.customerId);
                  const net = m.items.reduce((s, it) => s + it.netWeight, 0);
                  return (
                    <option key={m.id} value={m.id}>
                      {m.mortgageNumber} — {cust?.name || 'Customer'} — {net}g Gold — Lent: ₹{m.principalAmount.toLocaleString('en-IN')} ({m.interestRate}%/mo)
                    </option>
                  );
                })}
              </select>
            )}

            {/* Selected Pledge Preview Banner */}
            {selectedMortgage && (
              <div className="mt-3 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/90 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">CUSTOMER</span>
                  <span className="font-extrabold text-slate-900 truncate">{selectedCustomer?.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">NET GOLD WEIGHT</span>
                  <span className="font-extrabold text-amber-950 font-mono">{formatWeight(totalNetWeight)} ({selectedMortgage.items.length} items)</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">RETAIL PRINCIPAL</span>
                  <span className="font-extrabold text-slate-900 font-mono">{formatCurrency(selectedMortgage.principalAmount)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">CUSTOMER INTEREST</span>
                  <span className="font-extrabold text-emerald-800 font-mono">{selectedMortgage.interestRate}%/mo ({custAnnualRate}% p.a.)</span>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Destination & Financier Details */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              2. {language === 'ta' ? 'வங்கி / நிதி நிறுவனம் விவரங்கள்' : 'Bank / Financier Destination Details'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[11px] text-slate-600 font-bold block mb-1">Destination Type</span>
                <select
                  value={destinationType}
                  onChange={e => setDestinationType(e.target.value as RePledgeDestinationType)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-800 focus:bg-white focus:border-amber-500 outline-hidden"
                >
                  <option value="Bank">Nationalized / Private Bank</option>
                  <option value="NBFC">NBFC Gold Financier</option>
                  <option value="Wholesale Broker">Wholesale Master Broker</option>
                  <option value="Other">Other Financier</option>
                </select>
              </div>

              <div>
                <span className="text-[11px] text-slate-600 font-bold block mb-1">Institution Name</span>
                <input
                  type="text"
                  value={institutionName}
                  onChange={e => setInstitutionName(e.target.value)}
                  placeholder="e.g. State Bank of India, Anna Nagar"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-800 focus:bg-white focus:border-amber-500 outline-hidden"
                  required
                />
              </div>

              <div>
                <span className="text-[11px] text-slate-600 font-bold block mb-1">Bank Loan / Ticket No</span>
                <input
                  type="text"
                  value={bankLoanNumber}
                  onChange={e => setBankLoanNumber(e.target.value)}
                  placeholder="e.g. SBI-GL-8849201"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-amber-500 outline-hidden"
                  required
                />
              </div>

              <div>
                <span className="text-[11px] text-slate-600 font-bold block mb-1">Pledged Under Account</span>
                <input
                  type="text"
                  value={accountHolderName}
                  onChange={e => setAccountHolderName(e.target.value)}
                  placeholder="Broker Name / Entity"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-800 focus:bg-white focus:border-amber-500 outline-hidden"
                />
              </div>

              <div>
                <span className="text-[11px] text-slate-600 font-bold block mb-1">Date Moved</span>
                <input
                  type="date"
                  value={dateMoved}
                  onChange={e => setDateMoved(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-amber-500 outline-hidden"
                  required
                />
              </div>

              <div>
                <span className="text-[11px] text-slate-600 font-bold block mb-1">Bank Due Date (Auction Risk)</span>
                <input
                  type="date"
                  value={bankDueDate}
                  onChange={e => setBankDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-amber-500 outline-hidden"
                  required
                />
              </div>
            </div>
          </div>

          {/* Step 3: Valuation, Financials & Spread Calculator */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              3. {language === 'ta' ? 'மதிப்பீடு மற்றும் வட்டி லாபக் கணக்கீடு' : 'Valuation & Interest Spread Arbitrage'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-[11px] text-slate-600 font-bold block mb-1">Bank Net Weight (g)</span>
                <input
                  type="number"
                  step="0.01"
                  value={appraisedNetWeight}
                  onChange={e => setAppraisedNetWeight(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-amber-500 outline-hidden"
                />
              </div>

              <div>
                <span className="text-[11px] text-slate-600 font-bold block mb-1">Bank Rate/Gram (₹)</span>
                <input
                  type="number"
                  value={bankValuationPerGram}
                  onChange={e => setBankValuationPerGram(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-amber-500 outline-hidden"
                />
              </div>

              <div>
                <span className="text-[11px] text-slate-600 font-bold block mb-1">Cash Received from Bank (₹)</span>
                <input
                  type="number"
                  value={bankReceivedAmount}
                  onChange={e => setBankReceivedAmount(e.target.value)}
                  placeholder="e.g. 150000"
                  className="w-full px-3 py-2 rounded-xl bg-emerald-50/70 border border-emerald-300 text-xs font-mono font-black text-emerald-950 focus:bg-white focus:border-emerald-600 outline-hidden"
                  required
                />
              </div>

              <div>
                <span className="text-[11px] text-slate-600 font-bold block mb-1">Bank Interest (% p.a.)</span>
                <input
                  type="number"
                  step="0.05"
                  value={bankInterestRate}
                  onChange={e => setBankInterestRate(e.target.value)}
                  placeholder="e.g. 9.5"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-amber-500 outline-hidden"
                  required
                />
              </div>
            </div>

            {/* Arbitrage Callout Card */}
            <div className="mt-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 border border-emerald-200/90 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">LIQUIDITY SURPLUS</span>
                <div className={`text-base font-black font-mono mt-0.5 ${liquidityGain >= 0 ? 'text-emerald-900' : 'text-slate-700'}`}>
                  {liquidityGain >= 0 ? `+ ₹${liquidityGain.toLocaleString('en-IN')}` : `- ₹${Math.abs(liquidityGain).toLocaleString('en-IN')}`}
                </div>
                <span className="text-[10px] text-slate-500">Bank cash minus retail loan</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">NET INTEREST SPREAD</span>
                <div className="text-base font-black font-mono text-teal-950 mt-0.5">
                  {netSpreadMargin}% <span className="text-xs font-semibold text-teal-700 font-sans">p.a.</span>
                </div>
                <span className="text-[10px] text-slate-500">Customer ({custAnnualRate}%) - Bank ({bankAnnualRate}%)</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">EST. MONTHLY PROFIT</span>
                <div className="text-base font-black font-mono text-amber-950 mt-0.5">
                  ₹{monthlySpreadProfit.toLocaleString('en-IN')} <span className="text-xs font-semibold text-amber-800 font-sans">/ mo</span>
                </div>
                <span className="text-[10px] text-slate-500">Pure arbitrage income spread</span>
              </div>
            </div>
          </div>

          {/* Step 4: Locker Reference & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] text-slate-600 font-bold block mb-1">Bank Packet / Bag Reference</span>
              <input
                type="text"
                value={bankPacketReference}
                onChange={e => setBankPacketReference(e.target.value)}
                placeholder="e.g. Locker Box #4, Packet Tag 22"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-800 focus:bg-white focus:border-amber-500 outline-hidden"
              />
            </div>

            <div>
              <span className="text-[11px] text-slate-600 font-bold block mb-1">Remarks / Internal Notes</span>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Gold Loan under Agri Scheme, 12 month renewal"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-800 focus:bg-white focus:border-amber-500 outline-hidden"
              />
            </div>
          </div>

          {/* Privacy & Safety Warning */}
          <div className="p-3.5 rounded-2xl bg-amber-100/60 border border-amber-300/80 flex items-start gap-2.5 text-xs text-amber-950">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-black">Confidential & Internal Only:</strong> External bank details, account numbers, and spread profits are strictly internal to the broker portal and will NEVER be disclosed or displayed on the customer app.
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
            >
              {language === 'ta' ? 'ரத்து செய்' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/25 transition active:scale-98 cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{language === 'ta' ? 'மறு அடமானம் பதிவு செய்க' : 'Confirm & Move to Bank'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
