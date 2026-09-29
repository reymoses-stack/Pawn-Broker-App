import React, { useState } from 'react';
import { Calculator, Sparkles, Scale, TrendingUp, ShieldCheck, ArrowRight, MessageCircle } from 'lucide-react';
import { GoldRate, Branch } from '../types';
import { Language, translations } from '../i18n/translations';

interface GoldLoanCalculatorProps {
  rates: GoldRate;
  branch: Branch;
  language: Language;
  onProceedToEnquiry?: (details: {
    weight: number;
    purity: string;
    estimatedValue: number;
    maxLoan: number;
  }) => void;
}

export const GoldLoanCalculator: React.FC<GoldLoanCalculatorProps> = ({
  rates,
  branch,
  language,
  onProceedToEnquiry
}) => {
  const t = translations[language];
  const [weight, setWeight] = useState<number>(16); // default 2 sovereigns (16 grams)
  const [purity, setPurity] = useState<'24K (999)' | '22K (916)' | '18K (750)'>('22K (916)');
  const [stoneDeduction, setStoneDeduction] = useState<number>(0);
  const [tenureMonths, setTenureMonths] = useState<number>(6);

  const getRatePerGram = () => {
    switch (purity) {
      case '24K (999)':
        return rates.purity24K;
      case '22K (916)':
        return rates.purity22K;
      case '18K (750)':
        return rates.purity18K;
      default:
        return rates.purity22K;
    }
  };

  const netWeight = Math.max(0, weight - stoneDeduction);
  const ratePerGram = getRatePerGram();
  const estimatedMarketValue = Math.round(netWeight * ratePerGram);
  // 75% RBI Loan-To-Value limit
  const maxEligibleLoan = Math.round(estimatedMarketValue * 0.75);
  // Standard monthly interest rate of 1.5% per month
  const monthlyInterest = Math.round(maxEligibleLoan * 0.015);
  const dailyInterest = Math.round((monthlyInterest / 30) * 10) / 10;
  const totalInterestForTenure = monthlyInterest * tenureMonths;
  const totalRepayment = maxEligibleLoan + totalInterestForTenure;

  const handleWhatsAppEnquiry = () => {
    const text = encodeURIComponent(
      `Hello ${branch.name},\nI would like to enquire about a Gold Loan:\n• Purity: ${purity}\n• Weight: ${netWeight}g\n• Est. Market Value: ₹${estimatedMarketValue.toLocaleString('en-IN')}\n• Eligible Loan: ₹${maxEligibleLoan.toLocaleString('en-IN')}\nPlease let me know the procedure to visit the shop.`
    );
    const cleanPhone = branch.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Live Benchmark Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 rounded-3xl p-6 text-slate-950 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-white/20 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/15 backdrop-blur-md text-slate-950 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>{rates.lastUpdated}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">
              {t.calculatorTitle}
            </h2>
            <p className="text-xs sm:text-sm text-amber-950/90 font-medium mt-1">
              {t.calculatorSubtitle}
            </p>
          </div>

          {/* Quick Rates Pill */}
          <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
            <div className="bg-slate-950/15 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 text-xs font-semibold flex items-center justify-between gap-3">
              <span className="font-mono text-amber-950">22K 916:</span>
              <span className="font-black text-slate-950 font-mono">₹{rates.purity22K.toLocaleString('en-IN')}/g</span>
            </div>
            <div className="bg-slate-950/15 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 text-xs font-semibold flex items-center justify-between gap-3">
              <span className="font-mono text-amber-950">24K Fine:</span>
              <span className="font-black text-slate-950 font-mono">₹{rates.purity24K.toLocaleString('en-IN')}/g</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Inputs Section */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-amber-200/80 shadow-sm space-y-5">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-600" />
              <span>{language === 'ta' ? 'நகையின் விவரங்கள்' : 'Gold Ornament Particulars'}</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">
              {language === 'ta' ? 'அரசு விதிப்படி 75% கடன்' : 'Max 75% LTV Cap'}
            </span>
          </div>

          {/* Gold Purity Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              {t.goldPurity}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['22K (916)', '24K (999)', '18K (750)'] as const).map(p => {
                const isSelected = purity === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPurity(p)}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition cursor-pointer flex flex-col items-center justify-center border ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs font-black'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-amber-50/50'
                    }`}
                  >
                    <span>{p}</span>
                    <span className="text-[10px] font-mono opacity-80 mt-0.5">
                      ₹{p === '22K (916)' ? rates.purity22K : p === '24K (999)' ? rates.purity24K : rates.purity18K}/g
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Gold Weight Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700">
                {t.weightGrams}
              </label>
              <div className="text-xs font-mono font-bold text-amber-700">
                {(weight / 8).toFixed(2)} {language === 'ta' ? 'சவரன்' : 'Sovereign (Pavan)'}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="0.5"
                  max="1000"
                  step="0.1"
                  value={weight || ''}
                  onChange={e => setWeight(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-slate-900 font-mono text-lg font-bold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                  placeholder="e.g. 16.0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 font-bold">
                  grams (கி)
                </span>
              </div>
            </div>

            {/* Quick Weight Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {[
                { label: '1 Sovereign (8g)', g: 8 },
                { label: '2 Sovereigns (16g)', g: 16 },
                { label: '4 Sovereigns (32g)', g: 32 },
                { label: '50g', g: 50 },
                { label: '100g', g: 100 }
              ].map(preset => (
                <button
                  key={preset.g}
                  type="button"
                  onClick={() => setWeight(preset.g)}
                  className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-semibold border border-amber-200 transition cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stone / Enamel Deduction */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                {language === 'ta' ? 'கல் / மெழுகு கழிவு (Stone/Wax Deduction)' : 'Stone / Wax Weight (Grams)'}
              </label>
              <span className="text-xs font-mono text-slate-500 font-semibold">{stoneDeduction} g</span>
            </div>
            <input
              type="number"
              min="0"
              max={weight}
              step="0.1"
              value={stoneDeduction || ''}
              onChange={e => setStoneDeduction(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono text-sm focus:border-amber-500 focus:outline-none"
              placeholder="0.0"
            />
          </div>

          {/* Loan Tenure Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                {language === 'ta' ? 'கடன் காலம் (Tenure)' : 'Expected Loan Tenure'}
              </label>
              <span className="text-xs font-bold text-amber-800 font-mono">{tenureMonths} Months</span>
            </div>
            <input
              type="range"
              min="1"
              max="12"
              value={tenureMonths}
              onChange={e => setTenureMonths(parseInt(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>1 Month</span>
              <span>6 Months (Standard)</span>
              <span>12 Months</span>
            </div>
          </div>

        </div>

        {/* Right Output Card */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          
          <div className="bg-gradient-to-b from-amber-50 to-white rounded-3xl p-6 border border-amber-200/90 shadow-md space-y-4">
            
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
              <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">
                {language === 'ta' ? 'கடன் தகுதி மதிப்பீடு' : 'Eligibility Summary'}
              </span>
              <div className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                {language === 'ta' ? 'உடனடி ஒப்புதல்' : 'Instant Counter Approval'}
              </div>
            </div>

            {/* Big Max Loan Number */}
            <div className="text-center py-3 bg-white rounded-2xl border border-amber-200/70 shadow-2xs">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                {t.maxLoanEligible}
              </div>
              <div className="text-3xl sm:text-4xl font-black font-mono text-amber-950 mt-1">
                ₹{maxEligibleLoan.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                75% of ₹{estimatedMarketValue.toLocaleString('en-IN')} Market Valuation
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">{language === 'ta' ? 'நிகர தங்கம் எடை:' : 'Net Gold Weight:'}</span>
                <span className="font-mono font-bold text-slate-900">{netWeight.toFixed(3)} grams</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">{language === 'ta' ? 'அன்றைய சந்தை மதிப்பு:' : 'Gross Market Value:'}</span>
                <span className="font-mono font-bold text-slate-900">₹{estimatedMarketValue.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">{language === 'ta' ? 'மாதாந்திர வட்டி (1.5%):' : 'Monthly Interest (1.5%):'}</span>
                <span className="font-mono font-bold text-emerald-700">₹{monthlyInterest.toLocaleString('en-IN')} / mo</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">{language === 'ta' ? 'தினசரி வட்டி செலவு:' : 'Daily Interest Cost:'}</span>
                <span className="font-mono font-medium text-slate-700">₹{dailyInterest} / day</span>
              </div>
              <div className="flex justify-between py-1.5 pt-2">
                <span className="font-bold text-slate-900">{language === 'ta' ? `${tenureMonths} மாதங்கள் மொத்த மீட்பு:` : `Total Release at ${tenureMonths} mo:`}</span>
                <span className="font-mono font-black text-amber-900">₹{totalRepayment.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Safety Guarantee */}
            <div className="bg-amber-100/50 rounded-xl p-3 border border-amber-200/80 flex items-start gap-2.5 text-[11px] text-amber-950">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                {language === 'ta'
                  ? 'உங்கள் தங்கம் 100% தீ மற்றும் திருட்டு காப்பீடு செய்யப்பட்ட வங்கித் தர பெட்டகத்தில் பாதுகாப்பாக வைக்கப்படும்.'
                  : 'Your pledged gold is stored in a 100% insured, bank-grade biometric fireproof locker safe.'}
              </span>
            </div>

          </div>

          {/* Action CTAs */}
          <div className="space-y-2">
            {onProceedToEnquiry && (
              <button
                type="button"
                onClick={() => onProceedToEnquiry({
                  weight: netWeight,
                  purity,
                  estimatedValue: estimatedMarketValue,
                  maxLoan: maxEligibleLoan
                })}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs tracking-wide shadow-md shadow-amber-500/20 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{language === 'ta' ? 'அடமான விசாரிப்பு படிவம் நிரப்புக' : 'Proceed to New Pawn Enquiry Form'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handleWhatsAppEnquiry}
              className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{t.sendWhatsAppEnquiry}</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
