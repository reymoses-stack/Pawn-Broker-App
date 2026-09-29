import React, { useState } from 'react';
import { Mortgage, Payment } from '../types';
import { formatCurrency, formatDate, calculateInterestBreakdown } from '../utils/formatters';
import { 
  Calculator, Calendar, AlertCircle, 
  Receipt, ArrowRight, ShieldCheck, Clock 
} from 'lucide-react';
import { Language, translations } from '../i18n/translations';

interface InterestCalculatorViewProps {
  mortgages: Mortgage[];
  payments: Payment[];
  language: Language;
  onOpenReceipt: (mortgage: Mortgage, payment?: Payment) => void;
}

export const InterestCalculatorView: React.FC<InterestCalculatorViewProps> = ({
  mortgages,
  payments,
  language,
  onOpenReceipt
}) => {
  const t = translations[language];
  const activeMortgages = mortgages.filter(m => m.status !== 'Closed');

  const [selectedMortgageId, setSelectedMortgageId] = useState<string>(
    activeMortgages[0]?.id || mortgages[0]?.id || ''
  );

  const selectedMortgage = mortgages.find(m => m.id === selectedMortgageId) || mortgages[0];

  const [simulationDate, setSimulationDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const breakdown = selectedMortgage
    ? calculateInterestBreakdown(selectedMortgage, payments, new Date(simulationDate))
    : null;

  const mortgagePayments = payments.filter(p => p.mortgageId === selectedMortgage?.id);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Calculator className="w-4 h-4 text-amber-600" />
          <span>{t.tabInterest}</span>
        </h3>
        <p className="text-xs text-slate-500">
          {language === 'ta'
            ? 'அடமான வட்டி கணக்கீட்டு சூத்திரம் மற்றும் முந்தைய கட்டண ரசீதுகள்'
            : 'Section 25 pawn interest calculations, daily rates, and verified payment vouchers'}
        </p>
      </div>

      {/* Loan Selector Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {mortgages.map(m => (
          <button
            key={m.id}
            type="button"
            onClick={() => setSelectedMortgageId(m.id)}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition cursor-pointer border ${
              selectedMortgageId === m.id
                ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300 hover:text-slate-900 shadow-2xs'
            }`}
          >
            <span>{m.mortgageNumber}</span>
            <span className="ml-2 text-[10px] opacity-80">({formatCurrency(m.principalAmount)})</span>
          </button>
        ))}
      </div>

      {selectedMortgage && breakdown && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* Left 2 Cols: Calculation Engine */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-5 sm:p-6 border border-amber-200/90 shadow-md space-y-5">
            
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  {t.loanNumber}
                </span>
                <span className="text-lg font-black font-mono text-amber-950">
                  {selectedMortgage.mortgageNumber}
                </span>
              </div>

              {/* Simulation Date Picker */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 shadow-2xs">
                <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="text-left">
                  <label className="text-[9px] uppercase font-bold text-slate-500 block">
                    {language === 'ta' ? 'கணக்கீட்டு நாள் (Simulate Date)' : 'Calculation Date'}
                  </label>
                  <input
                    type="date"
                    value={simulationDate}
                    onChange={e => setSimulationDate(e.target.value)}
                    className="bg-transparent text-xs font-mono font-bold text-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Formula Explanation Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[9px] uppercase text-slate-500 block font-semibold">{t.principalAmount}</span>
                <span className="text-sm font-black font-mono text-slate-900 mt-0.5 block">{formatCurrency(selectedMortgage.principalAmount)}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[9px] uppercase text-slate-500 block font-semibold">{t.monthlyRate}</span>
                <span className="text-sm font-black font-mono text-amber-900 mt-0.5 block">{selectedMortgage.interestRate}% / mo</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[9px] uppercase text-slate-500 block font-semibold">{t.daysElapsed}</span>
                <span className="text-sm font-black font-mono text-slate-900 mt-0.5 block">{breakdown.daysElapsed} days</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[9px] uppercase text-slate-500 block font-semibold">{t.monthsElapsed}</span>
                <span className="text-sm font-black font-mono text-amber-900 mt-0.5 block">{breakdown.monthsElapsed} mo</span>
              </div>
            </div>

            {/* Itemized Calculation Summary */}
            <div className="space-y-2.5 pt-2">
              <div className="flex justify-between items-center text-xs text-slate-700">
                <span>{language === 'ta' ? 'அசல் தொகை (Principal Asal):' : 'Sanctioned Principal:'}</span>
                <strong className="font-mono text-slate-950">{formatCurrency(selectedMortgage.principalAmount)}</strong>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-700">
                <span>
                  {language === 'ta' ? 'வழக்கமான வட்டி (Regular Vaddi):' : 'Regular Monthly Interest:'}
                  <span className="text-[10px] text-slate-500 ml-1">({selectedMortgage.interestRate}% × {breakdown.monthsElapsed} mo)</span>
                </span>
                <strong className="font-mono text-amber-900">{formatCurrency(breakdown.regularInterest)}</strong>
              </div>

              {breakdown.penaltyInterest > 0 && (
                <div className="flex justify-between items-center text-xs text-rose-700">
                  <span className="flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>{t.penaltyInterest}:</span>
                    <span className="text-[10px] text-rose-600">({selectedMortgage.penaltyRateMonthly}% / mo after grace)</span>
                  </span>
                  <strong className="font-mono text-rose-700">+ {formatCurrency(breakdown.penaltyInterest)}</strong>
                </div>
              )}

              {/* Already Paid Deduction */}
              {mortgagePayments.length > 0 && (
                <div className="flex justify-between items-center text-xs text-emerald-800 border-t border-slate-100 pt-2">
                  <span>{language === 'ta' ? 'முந்தைய ரசீதுகளில் செலுத்திய வட்டி:' : 'Interest Already Cleared:'}</span>
                  <strong className="font-mono">- {formatCurrency(mortgagePayments.reduce((s, p) => s + p.interestPaid, 0))}</strong>
                </div>
              )}

              {/* Net Interest Due */}
              <div className="flex justify-between items-center text-sm font-bold text-amber-950 border-t border-slate-200 pt-2.5">
                <span>{t.accruedInterest} {language === 'ta' ? 'இன்றைய நிலை:' : 'Remaining Due:'}</span>
                <span className="font-mono text-base">{formatCurrency(breakdown.totalInterestDue)}</span>
              </div>
            </div>

            {/* Total Settlement Release Callout */}
            <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 flex items-center justify-between gap-4 shadow-2xs">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block">
                  {t.totalSettlement}
                </span>
                <span className="text-[11px] text-slate-600">
                  {language === 'ta' ? 'நகையை மீட்க தேவையான மொத்த தொகை' : 'Principal + Remaining Interest'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xl sm:text-2xl font-black font-mono text-slate-950 block">
                  {formatCurrency(breakdown.totalSettlementAmount)}
                </span>
              </div>
            </div>

          </div>

          {/* Right Col: Payment History Receipts */}
          <div className="bg-white rounded-3xl p-5 border border-amber-200/90 shadow-md flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-amber-600" />
                <span>{t.interestHistory}</span>
              </h4>

              {mortgagePayments.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs space-y-1">
                  <Clock className="w-6 h-6 mx-auto mb-1 opacity-50" />
                  <p>{t.noPayments}</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {mortgagePayments.map(p => (
                    <div
                      key={p.id}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-amber-300 transition text-left"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono font-bold text-xs text-slate-900">
                            {p.receiptNumber}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {formatDate(p.paymentDate)} • {p.paymentMethod}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-black text-xs text-emerald-800 block">
                            {formatCurrency(p.amount)}
                          </span>
                          <button
                            type="button"
                            onClick={() => onOpenReceipt(selectedMortgage, p)}
                            className="text-[10px] text-amber-700 hover:underline font-bold mt-0.5 inline-flex items-center gap-0.5"
                          >
                            <span>Receipt</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                      {p.notes && (
                        <p className="text-[10px] text-slate-500 mt-1 italic">
                          "{p.notes}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{t.gracePeriodNotice}</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
