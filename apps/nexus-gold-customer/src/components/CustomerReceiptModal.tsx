import React, { useState } from 'react';
import { Mortgage, Payment, Customer, Branch } from '../types';
import { formatCurrency, formatWeight, formatDate } from '../utils/formatters';
import { printElement } from '../utils/printService';
import { X, Printer, FileText, CheckCircle2, ShieldCheck, Download, Gem } from 'lucide-react';
import { Language, translations } from '../i18n/translations';

interface CustomerReceiptModalProps {
  mortgage: Mortgage;
  payment?: Payment;
  customer: Customer;
  branch: Branch;
  language: Language;
  onClose: () => void;
}

export const CustomerReceiptModal: React.FC<CustomerReceiptModalProps> = ({
  mortgage,
  payment,
  customer,
  branch,
  language,
  onClose
}) => {
  const t = translations[language];
  const [format, setFormat] = useState<'A4' | 'thermal'>('A4');

  const docTitle = payment
    ? `Payment-Receipt-${payment.receiptNumber}`
    : `Pawn-Ticket-${mortgage.mortgageNumber}`;

  const handlePrint = () => {
    printElement('customer-printable-document', {
      format,
      title: `${branch.name} - ${docTitle}`
    });
  };

  const totalNet = mortgage.items.reduce((s, it) => s + it.netWeight, 0);
  const totalGross = mortgage.items.reduce((s, it) => s + it.grossWeight, 0);
  const totalStone = mortgage.items.reduce((s, it) => s + it.stoneWeight, 0);
  const totalValuation = mortgage.items.reduce((s, it) => s + it.marketValue, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh]">
        
        {/* Controls Bar (no-print) */}
        <div className="no-print p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-sm">
                {payment
                  ? (language === 'ta' ? 'அடமான வட்டி வசூல் ரசீது' : 'Payment Collection Voucher')
                  : (language === 'ta' ? 'அசல் அடமான ரசீது & ஒப்பந்தம்' : 'Pawn Ticket & Pledge Agreement')}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Ref: {payment ? payment.receiptNumber : mortgage.mortgageNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Format Selector */}
            <div className="hidden sm:flex items-center bg-slate-900 border border-slate-700 rounded-xl p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setFormat('A4')}
                className={`px-3 py-1 rounded-lg font-bold transition text-xs ${
                  format === 'A4'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                A4 Document
              </button>
              <button
                type="button"
                onClick={() => setFormat('thermal')}
                className={`px-3 py-1 rounded-lg font-bold transition text-xs ${
                  format === 'thermal'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                80mm Thermal
              </button>
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/25 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{language === 'ta' ? 'ரசீதை அச்சிடு' : 'Print Document'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Preview Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-stone-200/90 flex justify-center">
          
          {format === 'A4' ? (
            /* A4 Formal Print Template */
            <div
              id="customer-printable-document"
              className="printable-area bg-white text-slate-900 w-full max-w-[194mm] p-6 sm:p-8 rounded-2xl shadow-xl space-y-4 text-[11px] font-sans leading-tight border border-slate-300"
            >
              {/* Header */}
              <div className="border-b-2 border-slate-900 pb-3 text-center space-y-1">
                <div className="text-xl font-black uppercase text-slate-950 tracking-tight">
                  {branch.name}
                </div>
                <div className="text-xs font-semibold text-slate-700">
                  Licensed Pawnbrokers & Gold Bankers • Section 25 Compliant
                </div>
                <div className="text-[10px] text-slate-600">
                  {branch.address}, {branch.city} • Phone: {branch.phone}
                </div>
                <div className="text-[9.5px] font-mono text-slate-500">
                  State Pawnbroking License: <strong>{branch.licenseNumber}</strong> • PAN: <strong>{branch.panNumber}</strong>
                </div>
              </div>

              {/* Document Subheader */}
              <div className="flex items-center justify-between border-b border-slate-300 pb-2">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Document Type</span>
                  <span className="text-xs font-black uppercase text-slate-900">
                    {payment ? 'Official Payment Receipt' : 'Pawn Ticket & Pledge Agreement'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Pawn Ticket Reference</span>
                  <span className="text-sm font-black font-mono text-slate-900">
                    {payment ? payment.receiptNumber : mortgage.mortgageNumber}
                  </span>
                </div>
              </div>

              {/* Borrower & Loan Particulars Grid */}
              <div className="grid grid-cols-2 gap-3 border border-slate-300 p-3 rounded-lg bg-slate-50/80 text-[10.5px]">
                {/* Borrower Info */}
                <div>
                  <div className="font-bold text-slate-900 uppercase border-b border-slate-200 pb-1 mb-1.5 flex items-center justify-between">
                    <span>Borrower Particulars</span>
                    <span className="text-[9px] text-slate-500 font-mono">KYC ID Verified</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    {customer.photoUrl && (
                      <img
                        src={customer.photoUrl}
                        alt={customer.name}
                        className="w-14 h-16 object-cover rounded border border-slate-400 shrink-0"
                      />
                    )}
                    <div className="space-y-0.5">
                      <div>Name: <strong>{customer.name}</strong></div>
                      <div>Phone: <span className="font-mono">{customer.mobile}</span></div>
                      <div>KYC ID: <span className="font-mono">{customer.kycRecord.maskedId}</span></div>
                      <div>Address: <span className="text-slate-600">{customer.address}, {customer.city}</span></div>
                    </div>
                  </div>
                </div>

                {/* Loan Info */}
                <div>
                  <div className="font-bold text-slate-900 uppercase border-b border-slate-200 pb-1 mb-1.5 flex items-center justify-between">
                    <span>Pawn Contract Terms</span>
                    <span className="text-[9px] text-slate-500 font-mono">Token: {mortgage.tokenNumber}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Date of Pledge:</span>
                      <strong className="font-mono">{formatDate(mortgage.mortgageDate)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Maturity / Due Date:</span>
                      <strong className="font-mono">{formatDate(mortgage.maturityDate)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly Interest:</span>
                      <strong className="font-mono text-amber-900">{mortgage.interestRate}% / month</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Vault Safe Location:</span>
                      <strong className="font-mono text-slate-800">{mortgage.vaultLocation}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ornaments Table */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead className="bg-slate-200/90 text-slate-900 font-bold uppercase border-b border-slate-300">
                    <tr>
                      <th className="py-1.5 px-2">#</th>
                      <th className="py-1.5 px-2">Jewelry Description</th>
                      <th className="py-1.5 px-2">Purity</th>
                      <th className="py-1.5 px-2 text-right">Gross Wt</th>
                      <th className="py-1.5 px-2 text-right">Stone Wt</th>
                      <th className="py-1.5 px-2 text-right font-black">Net Wt</th>
                      <th className="py-1.5 px-2 text-right">Appraisal Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {mortgage.items.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="py-1.5 px-2 font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-1.5 px-2">
                          <strong className="text-slate-950">{item.itemType}</strong>
                          <span className="block text-[9.5px] text-slate-600">{item.description}</span>
                        </td>
                        <td className="py-1.5 px-2 font-mono">{item.purity}</td>
                        <td className="py-1.5 px-2 text-right font-mono">{formatWeight(item.grossWeight)}</td>
                        <td className="py-1.5 px-2 text-right font-mono">{formatWeight(item.stoneWeight)}</td>
                        <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-950">{formatWeight(item.netWeight)}</td>
                        <td className="py-1.5 px-2 text-right font-mono">{formatCurrency(item.marketValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400">
                    <tr>
                      <td colSpan={3} className="py-1.5 px-2 uppercase">Total Gold Weights</td>
                      <td className="py-1.5 px-2 text-right font-mono">{formatWeight(totalGross)}</td>
                      <td className="py-1.5 px-2 text-right font-mono">{formatWeight(totalStone)}</td>
                      <td className="py-1.5 px-2 text-right font-mono font-black">{formatWeight(totalNet)}</td>
                      <td className="py-1.5 px-2 text-right font-mono font-black">{formatCurrency(totalValuation)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Financial Box */}
              <div className="grid grid-cols-2 gap-3 border border-slate-300 p-2.5 rounded-lg bg-slate-50/80">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 uppercase border-b border-slate-200 pb-0.5 mb-1">
                    Financial Particulars
                  </div>
                  <div className="flex justify-between">
                    <span>Principal Sanctioned (Asal):</span>
                    <strong className="font-mono text-slate-950">{formatCurrency(mortgage.principalAmount)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Interest Rate:</span>
                    <strong className="font-mono">{mortgage.interestRate}% / month</strong>
                  </div>
                  {payment && (
                    <div className="flex justify-between text-emerald-800 font-bold border-t border-slate-300 pt-0.5">
                      <span>Amount Paid Now:</span>
                      <span className="font-mono">{formatCurrency(payment.amount)}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-0.5 text-[9px] text-slate-600">
                  <div className="font-bold text-slate-800 uppercase border-b border-slate-200 pb-0.5 mb-1">
                    Statutory Pawn Agreement (Sec 25)
                  </div>
                  <p>1. Gold ornaments held in insured safe vault custody until full redemption.</p>
                  <p>2. Monthly interest payable regularly; overdue penalty of {mortgage.penaltyRateMonthly}%/mo applies after {mortgage.gracePeriodDays} days grace period.</p>
                  <p>3. Surrender this original ticket with photo ID to claim released ornaments.</p>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-6 pt-4 text-center text-[10px]">
                <div>
                  <div className="border-t border-slate-400 pt-1 font-bold">
                    Borrower Signature / Thumb Impression
                  </div>
                  <div className="text-[9px] text-slate-500">({customer.name})</div>
                </div>
                <div>
                  <div className="border-t border-slate-400 pt-1 font-bold">
                    For {branch.name}
                  </div>
                  <div className="text-[9px] text-slate-500">Authorized Signatory / Licensed Pawnbroker</div>
                </div>
              </div>

              <div className="text-[8px] text-center text-slate-400 pt-1 border-t border-slate-200">
                Generated via Nexus Gold Pawn OS • Page 1 of 1 (A4)
              </div>
            </div>
          ) : (
            /* 80mm Thermal Receipt Format */
            <div
              id="customer-printable-document"
              className="printable-area bg-white text-slate-900 w-[80mm] p-4 rounded shadow-xl space-y-2.5 text-[11px] font-mono leading-tight border border-slate-300"
            >
              <div className="text-center space-y-0.5 border-b border-dashed border-slate-400 pb-2">
                <div className="font-black text-sm uppercase">{branch.name}</div>
                <div className="text-[9px]">{branch.address}, {branch.city}</div>
                <div className="text-[9px]">Lic: {branch.licenseNumber}</div>
              </div>

              <div className="text-center font-bold uppercase py-1 border-b border-dashed border-slate-400">
                {payment ? '*** PAYMENT RECEIPT ***' : '*** PAWN TICKET ***'}
              </div>

              <div className="space-y-0.5 text-[10px] border-b border-dashed border-slate-400 pb-2">
                <div>PLEDGE: <strong>{mortgage.mortgageNumber}</strong></div>
                <div>CUST  : <strong>{customer.name}</strong></div>
                <div>PHONE : {customer.mobile}</div>
                <div>DATE  : {formatDate(mortgage.mortgageDate)}</div>
                <div>DUE   : {formatDate(mortgage.maturityDate)}</div>
              </div>

              <div className="space-y-1 text-[10px] border-b border-dashed border-slate-400 py-1.5">
                <div className="font-bold">GOLD COLLATERAL:</div>
                {mortgage.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{it.itemType}</span>
                    <span>{formatWeight(it.netWeight)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold border-t border-slate-300 pt-0.5">
                  <span>TOTAL NET WT:</span>
                  <span>{formatWeight(totalNet)}</span>
                </div>
              </div>

              <div className="space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span>LOAN PRINCIPAL:</span>
                  <strong>{formatCurrency(mortgage.principalAmount)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>INTEREST RATE:</span>
                  <span>{mortgage.interestRate}%/mo</span>
                </div>
                {payment && (
                  <div className="flex justify-between font-bold border-t border-dashed border-slate-400 pt-1 mt-1">
                    <span>AMOUNT PAID:</span>
                    <span>{formatCurrency(payment.amount)}</span>
                  </div>
                )}
              </div>

              <div className="text-center text-[8px] text-slate-500 pt-2 border-t border-dashed border-slate-400">
                Keep this ticket safe. Valid ID required for gold redemption.
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
