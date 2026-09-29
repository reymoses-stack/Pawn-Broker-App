import React, { useState, useEffect } from 'react';
import { Mortgage, Payment, Customer, Branch } from '../types';
import { formatCurrency, formatWeight, formatDate, calculateInterestBreakdown } from '../utils/formatters';
import { Coins, CircleDollarSign, Scale, Calendar, ShieldCheck, Sparkles, Building2, QrCode } from 'lucide-react';
import { Language, translations } from '../i18n/translations';
import QRCode from 'qrcode';

interface DashboardOverviewProps {
  mortgages: Mortgage[];
  payments: Payment[];
  customer: Customer;
  branch: Branch;
  language: Language;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  mortgages,
  payments,
  customer,
  branch,
  language
}) => {
  const t = translations[language];
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const activeMortgages = mortgages.filter(m => m.status !== 'Closed');

  const totalPrincipal = activeMortgages.reduce((sum, m) => sum + m.principalAmount, 0);

  const totalNetWeight = activeMortgages.reduce(
    (sum, m) => sum + m.items.reduce((iSum, item) => iSum + item.netWeight, 0),
    0
  );

  const totalItemsCount = activeMortgages.reduce((sum, m) => sum + m.items.length, 0);

  const totalInterestDue = activeMortgages.reduce((sum, m) => {
    const breakdown = calculateInterestBreakdown(m, payments);
    return sum + breakdown.totalInterestDue;
  }, 0);

  const totalInterestPaid = payments.reduce((sum, p) => sum + (p.interestPaid || 0), 0);

  const sortedByMaturity = [...activeMortgages].sort(
    (a, b) => new Date(a.maturityDate).getTime() - new Date(b.maturityDate).getTime()
  );
  const earliestMaturity = sortedByMaturity[0]?.maturityDate;
  const hasOverdue = activeMortgages.some(m => m.status === 'Overdue');

  useEffect(() => {
    const checkinUrl = `${window.location.origin}/?customer=${customer.id}&mobile=${customer.mobile}`;
    QRCode.toDataURL(checkinUrl, { width: 140, margin: 1 }).then(setQrDataUrl).catch(() => {});
  }, [customer.id, customer.mobile]);

  return (
    <div className="space-y-4">
      
      {/* Mobile Passbook Gold Banner (Direct Original Portal Styling) */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 p-5 rounded-3xl text-slate-950 shadow-md relative overflow-hidden">
        <div className="flex items-start justify-between relative z-10">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-950/80">
              {language === 'ta' ? 'அடமான டிஜிட்டல் பாஸ்புக்' : 'Digital Gold Passbook'}
            </span>
            <h2 className="text-xl sm:text-2xl font-black leading-tight text-slate-950 mt-0.5">
              {branch.name}
            </h2>
            <p className="text-xs text-amber-950/90 font-medium mt-0.5">
              {branch.address}, {branch.city} • Phone: {branch.phone}
            </p>
          </div>
          <div className="p-2.5 bg-white/90 rounded-2xl border border-white shadow-xs shrink-0">
            <Building2 className="w-6 h-6 text-amber-800" />
          </div>
        </div>

        {/* Insured Vault Guarantee Strip */}
        <div className="mt-3.5 pt-3 border-t border-amber-950/20 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-950">
          <div className="flex items-center gap-1.5 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-950" />
            <span>{language === 'ta' ? 'அரசு உரிமம் பெற்ற அடமானக் கடை' : 'Section 25 Licensed Pawnbroker'}</span>
          </div>
          <div className="font-mono text-[11px] font-bold">
            Lic: {branch.licenseNumber}
          </div>
        </div>
      </div>

      {/* 4 Metric Cards (Matching Original Portal Balance Style) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Principal Due (Asal) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-200 text-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-amber-900 text-xs font-bold mb-1">
            <span>{t.totalPrincipal}</span>
            <Coins className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 mt-0.5">
            {formatCurrency(totalPrincipal)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {activeMortgages.length} {language === 'ta' ? 'நடப்பு கடன்கள்' : 'Active Loans'}
          </div>
        </div>

        {/* Card 2: Accrued Interest Due */}
        <div className="p-4 sm:p-5 rounded-2xl bg-yellow-50/90 border border-yellow-200 text-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-yellow-900 text-xs font-bold mb-1">
            <span>{t.accruedInterest}</span>
            <CircleDollarSign className="w-4 h-4 text-yellow-700" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-amber-950 mt-0.5">
            {formatCurrency(totalInterestDue)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {language === 'ta' ? 'இன்று வரை கணக்கிடப்பட்ட வட்டி' : 'Calculated up to today'}
          </div>
        </div>

        {/* Card 3: Pledged Gold Net Weight */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 text-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-700 text-xs font-bold mb-1">
            <span>{t.totalGoldPledged}</span>
            <Scale className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 mt-0.5">
            {formatWeight(totalNetWeight)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {totalItemsCount} {language === 'ta' ? 'நகைகள் வைப்பில் உள்ளன' : 'Jewels in Safe Locker'}
          </div>
        </div>

        {/* Card 4: Next Due Date */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 text-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-700 text-xs font-bold mb-1">
            <span>{t.nextDue}</span>
            <Calendar className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-slate-900 mt-0.5">
            {earliestMaturity ? formatDate(earliestMaturity) : '—'}
          </div>
          <div className="mt-1">
            {hasOverdue ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                <span>{language === 'ta' ? 'தவணை கடந்தது' : 'Overdue Action Needed'}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                <span>✓ {language === 'ta' ? 'முறையான தவணை' : 'Account Regular'}</span>
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Counter Check-In QR Box (Exact Match to Original Portal) */}
      <div className="p-4 rounded-3xl bg-slate-900 text-white flex items-center justify-between gap-4 shadow-md">
        <div>
          <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>{language === 'ta' ? 'கவுண்டர் விரைவு QR' : 'Counter Check-In QR'}</span>
          </span>
          <h4 className="font-extrabold text-sm text-white mt-0.5">
            {language === 'ta' ? 'கடை கவுண்டரில் காட்டவும்' : 'Show to Cashier at Counter'}
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {language === 'ta'
              ? 'இந்த QR-ஐ கவுண்டரில் ஸ்கேன் செய்து 1 வினாடியில் உங்கள் கணக்கை திறக்கலாம்'
              : 'Scan with counter barcode scanner for instant 1-second customer lookup'}
          </p>
        </div>
        
        {/* Scannable Real QR Code */}
        <div className="bg-white p-1.5 rounded-2xl shrink-0 shadow-inner flex items-center justify-center">
          {qrDataUrl ? (
            <img 
              src={qrDataUrl} 
              alt="Customer Passbook QR" 
              className="w-16 h-16 object-contain"
            />
          ) : (
            <div className="w-16 h-16 bg-slate-100 flex items-center justify-center font-mono text-[9px] text-slate-500">
              <QrCode className="w-8 h-8 text-slate-400" />
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
