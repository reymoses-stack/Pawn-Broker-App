import React, { useState } from 'react';
import { Mortgage, Payment } from '../types';
import { formatCurrency, formatWeight, formatDate, calculateInterestBreakdown } from '../utils/formatters';
import { 
  ShieldCheck, Eye, Printer, ChevronDown, 
  ChevronUp, Sparkles, Layers, Gem, Clock, Lock 
} from 'lucide-react';
import { Language, translations } from '../i18n/translations';
import { ScheduleReleaseModal } from './ScheduleReleaseModal';

interface PledgesViewProps {
  mortgages: Mortgage[];
  payments: Payment[];
  language: Language;
  onOpenReceipt: (mortgage: Mortgage) => void;
  onRequestRelease?: (mortgageId: string, pickupDate: string, notes?: string) => void;
}

export const PledgesView: React.FC<PledgesViewProps> = ({
  mortgages,
  payments,
  language,
  onOpenReceipt,
  onRequestRelease
}) => {
  const t = translations[language];
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(mortgages[0]?.id || null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [schedulingMortgage, setSchedulingMortgage] = useState<Mortgage | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedLoanId(expandedLoanId === id ? null : id);
  };

  return (
    <div className="space-y-4">
      
      {/* Section Title */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Gem className="w-4 h-4 text-amber-600" />
            <span>{t.tabLoans}</span>
          </h3>
          <p className="text-xs text-slate-500">
            {language === 'ta'
              ? 'உங்கள் பெயரில் உள்ள அனைத்து அடமான தங்க நகைகளின் முழு விவரங்கள்'
              : 'Complete breakdown of all pledged gold ornaments and loan contracts'}
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-mono font-bold">
          {mortgages.length} {language === 'ta' ? 'அடமானங்கள்' : 'Loans'}
        </span>
      </div>

      {/* Loan Cards List (Matching Original Portal Design) */}
      <div className="space-y-3.5">
        {mortgages.map(mortgage => {
          const breakdown = calculateInterestBreakdown(mortgage, payments);
          const isExpanded = expandedLoanId === mortgage.id;
          const totalNet = mortgage.items.reduce((s, it) => s + it.netWeight, 0);

          return (
            <div
              key={mortgage.id}
              className={`rounded-2xl border transition-all ${
                mortgage.status === 'Overdue'
                  ? 'bg-rose-50/60 border-rose-300 shadow-2xs'
                  : mortgage.status === 'Due'
                    ? 'bg-amber-50/60 border-amber-300 shadow-2xs'
                    : 'bg-white border-slate-200 shadow-2xs hover:border-amber-400'
              }`}
            >
              {/* Card Header Strip */}
              <div
                onClick={() => toggleExpand(mortgage.id)}
                className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center font-bold shrink-0">
                    <Gem className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black text-amber-950">
                        {mortgage.mortgageNumber}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        ({mortgage.tokenNumber})
                      </span>
                      {mortgage.status === 'Overdue' ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-bold">
                          {language === 'ta' ? 'காலாவதி' : 'OVERDUE'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                          {language === 'ta' ? 'நடைமுறையில்' : 'ACTIVE'}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                      <span>{t.loanDate}: <strong className="text-slate-700">{formatDate(mortgage.mortgageDate)}</strong></span>
                      <span>•</span>
                      <span>{t.maturityDate}: <strong className={mortgage.status === 'Overdue' ? 'text-rose-700' : 'text-slate-700'}>{formatDate(mortgage.maturityDate)}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Amounts and Expand Toggle */}
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      {t.principalAmount}
                    </span>
                    <span className="text-base font-black font-mono text-slate-900">
                      {formatCurrency(mortgage.principalAmount)}
                    </span>
                  </div>

                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      {t.totalGoldPledged}
                    </span>
                    <span className="text-sm font-black font-mono text-amber-900">
                      {formatWeight(totalNet)}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="p-1.5 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900"
                  >
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Expanded Details Body */}
              {isExpanded && (
                <div className="px-4 pb-5 sm:px-6 sm:pb-6 pt-2 border-t border-slate-200/80 space-y-4">
                  
                  {/* Ornaments Showcase Header */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>{t.ornamentsTitle} ({mortgage.items.length})</span>
                      </span>
                      <span className="text-[11px] text-slate-600 font-mono">
                        Safe Vault: <strong className="text-slate-900">{mortgage.vaultLocation}</strong>
                      </span>
                    </div>

                    {/* Ornaments Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {mortgage.items.map(item => (
                        <div
                          key={item.id}
                          className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-amber-300 transition flex gap-3.5 items-start"
                        >
                          {/* Ornament Photo */}
                          <div className="relative shrink-0 group/img">
                            {item.photoReference ? (
                              <img
                                src={item.photoReference}
                                alt={item.itemType}
                                onClick={() => setSelectedImage(item.photoReference || null)}
                                className="w-18 h-18 rounded-xl object-cover border border-slate-300 cursor-pointer group-hover/img:scale-102 transition"
                              />
                            ) : (
                              <div className="w-18 h-18 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400 text-[10px]">
                                <Gem className="w-5 h-5 mb-1 text-slate-400" />
                                <span>No Photo</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-slate-900/30 rounded-xl opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center pointer-events-none">
                              <Eye className="w-4 h-4 text-white" />
                            </div>
                          </div>

                          {/* Ornament Particulars */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <h4 className="text-xs font-bold text-slate-900 truncate">
                                {item.itemType}
                              </h4>
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-900 font-mono text-[9px] font-bold shrink-0">
                                {item.purity}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                              {item.description}
                            </p>

                            {/* Weight Breakdown */}
                            <div className="mt-2 grid grid-cols-3 gap-1 p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-center font-mono text-[10px]">
                              <div>
                                <span className="text-[8px] uppercase text-slate-500 block">{t.grossWeight}</span>
                                <span className="text-slate-700 font-bold">{formatWeight(item.grossWeight)}</span>
                              </div>
                              <div>
                                <span className="text-[8px] uppercase text-slate-500 block">{t.stoneWeight}</span>
                                <span className="text-slate-500">{formatWeight(item.stoneWeight)}</span>
                              </div>
                              <div>
                                <span className="text-[8px] uppercase text-amber-900 block font-bold">{t.netWeight}</span>
                                <span className="text-amber-950 font-black">{formatWeight(item.netWeight)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Financial Settlement & Interest Status Box */}
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-600 block">
                        {t.monthlyRate}
                      </span>
                      <div className="text-sm font-black font-mono text-amber-950">
                        {mortgage.interestRate}% / {language === 'ta' ? 'மாதம்' : 'month'}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {breakdown.monthsElapsed} {language === 'ta' ? 'மாதங்கள் முடிவுற்றன' : 'months elapsed'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-600 block">
                        {t.accruedInterest}
                      </span>
                      <div className="text-sm font-black font-mono text-slate-900">
                        {formatCurrency(breakdown.totalInterestDue)}
                      </div>
                      {breakdown.penaltyInterest > 0 && (
                        <span className="text-[10px] font-mono text-rose-700 font-bold">
                          + {formatCurrency(breakdown.penaltyInterest)} penalty
                        </span>
                      )}
                    </div>

                    <div className="sm:text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-600 block">
                        {t.totalSettlement}
                      </span>
                      <div className="text-base font-black font-mono text-amber-950">
                        {formatCurrency(breakdown.totalSettlementAmount)}
                      </div>
                      <span className="text-[9.5px] text-slate-500">
                        (Principal + All Interest)
                      </span>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>{t.insuredVault}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {mortgage.releaseRequest ? (
                        <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 font-bold text-xs flex items-center gap-1.5 shadow-2xs">
                          <Clock className="w-3.5 h-3.5 text-emerald-700" />
                          <span>
                            {language === 'ta'
                              ? `மீட்பு பதிவு: ${formatDate(mortgage.releaseRequest.scheduledPickupDate)}`
                              : `Collection Booked: ${formatDate(mortgage.releaseRequest.scheduledPickupDate)}`}
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSchedulingMortgage(mortgage)}
                          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          <span>{language === 'ta' ? 'நகைகள் மீட்பு கோரிக்கை' : 'Schedule Jewel Release'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onOpenReceipt(mortgage)}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition flex items-center gap-2 cursor-pointer active:scale-95"
                      >
                        <Printer className="w-4 h-4" />
                        <span>{t.viewReceipt}</span>
                      </button>
                    </div>
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Image Lightbox Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="max-w-2xl w-full bg-white p-2 rounded-3xl border border-amber-300 overflow-hidden shadow-2xl relative">
            <img
              src={selectedImage}
              alt="Ornament View"
              className="w-full h-auto max-h-[80vh] object-contain rounded-2xl"
            />
            <div className="text-center p-2 text-xs text-slate-500 font-medium">
              Click anywhere to close
            </div>
          </div>
        </div>
      )}

      {/* Schedule Release Modal */}
      {schedulingMortgage && (
        <ScheduleReleaseModal
          isOpen={!!schedulingMortgage}
          onClose={() => setSchedulingMortgage(null)}
          mortgage={schedulingMortgage}
          language={language}
          onConfirm={(date, notes) => {
            if (onRequestRelease) {
              onRequestRelease(schedulingMortgage.id, date, notes);
            }
          }}
        />
      )}
    </div>
  );
};
