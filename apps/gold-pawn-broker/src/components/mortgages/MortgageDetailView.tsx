import React from 'react';
import { useApp } from '../../context/AppContext';
import { Mortgage } from '../../types';
import { formatCurrency, formatWeight, formatDate, getRelativeDays } from '../../utils/formatters';
import { 
  Gem, User, Clock, Wallet, ShieldCheck, 
  Lock, Printer, ArrowRight, CheckCircle2, 
  RotateCcw, AlertTriangle, ArrowLeft, History, FileText, TrendingUp, Award,
  MessageCircle
} from 'lucide-react';
import { openWhatsApp, buildReminderMessage, buildPledgeReceiptMessage } from '../../utils/whatsappService';

interface MortgageDetailViewProps {
  mortgage: Mortgage;
  onBack: () => void;
}

export const MortgageDetailView: React.FC<MortgageDetailViewProps> = ({ mortgage, onBack }) => {
  const { 
    customers, 
    packets, 
    payments, 
    getMortgageDueInfo,
    setReceiptModalData,
    setIsPaymentModalOpen,
    setIsRenewalModalOpen,
    setIsClosureModalOpen,
    goodReturnsRates,
    currentBranch,
    settings,
    language
  } = useApp();

  const customer = customers.find(c => c.id === mortgage.customerId);
  const packet = packets.find(p => p.id === mortgage.packetId);
  const dueInfo = getMortgageDueInfo(mortgage);
  const relDays = getRelativeDays(mortgage.maturityDate);

  const mortgagePayments = payments.filter(p => p.mortgageId === mortgage.id);

  const totalGrossWeight = mortgage.items.reduce((sum, item) => sum + item.grossWeight, 0);
  const totalNetWeight = mortgage.items.reduce((sum, item) => sum + item.netWeight, 0);
  const totalMarketValue = mortgage.items.reduce((sum, item) => sum + (item.marketValue || 0), 0);
  const totalBrokerValuation = mortgage.items.reduce((sum, item) => sum + (item.brokerValuation || item.marketValue || 0), 0);

  const statusColors: Record<string, string> = {
    Active: 'bg-emerald-500/15 text-emerald-950 border-emerald-400/50',
    Due: 'bg-amber-500/20 text-amber-950 border-amber-400/60',
    Overdue: 'bg-rose-500/15 text-rose-950 border-rose-400/50',
    Renewed: 'bg-blue-500/15 text-blue-950 border-blue-400/50',
    Closed: 'bg-slate-100 text-slate-700 border-slate-300'
  };

  return (
    <div className="space-y-5 pb-10 text-slate-800">
      
      {/* Top Bar with Navigation & Primary Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 liquid-glass-card p-4 rounded-3xl border border-amber-200/70 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-white/80 hover:bg-white text-slate-700 rounded-2xl border border-amber-200/60 shadow-xs transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black font-mono text-amber-800">{mortgage.mortgageNumber}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${statusColors[mortgage.status]}`}>
                {mortgage.status}
              </span>
              {customer?.customerTier && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-950 border border-amber-300/60">
                  {customer.customerTier}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Pawn Date: {formatDate(mortgage.mortgageDate)} • Maturity: {formatDate(mortgage.maturityDate)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {mortgage.status !== 'Closed' && (
            <>
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-600/20 transition"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Receive Payment</span>
              </button>

              <button
                onClick={() => setIsRenewalModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl shadow-md shadow-blue-600/20 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Renew Pledge</span>
              </button>

              <button
                onClick={() => setIsClosureModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-300 text-slate-950 text-xs font-black rounded-xl shadow-md shadow-amber-500/25 transition border border-white/50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Settle & Release</span>
              </button>
              <button
                onClick={() => {
                  if (!customer?.mobile) {
                    alert('Customer mobile number is missing.');
                    return;
                  }
                  const msg = buildReminderMessage({
                    mortgage,
                    customer,
                    branch: currentBranch,
                    settings,
                    language
                  });
                  openWhatsApp(customer.mobile, msg);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition active:scale-98"
                title="Send Payment Due Reminder via WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-white/20" />
                <span>WhatsApp Reminder</span>
              </button>
            </>
          )}

          <button
            onClick={() => {
              if (!customer?.mobile) {
                alert('Customer mobile number is missing.');
                return;
              }
              const msg = buildPledgeReceiptMessage({
                mortgage,
                customer,
                branch: currentBranch,
                settings,
                language
              });
              openWhatsApp(customer.mobile, msg);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300 transition"
            title="Share Pledge Receipt & Passbook Link on WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">WhatsApp Receipt</span>
          </button>

          <button
            onClick={() => setReceiptModalData({ type: 'pledge', mortgage, customer })}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/90 hover:bg-white text-slate-800 text-xs font-bold rounded-xl border border-amber-200/70 shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5 text-amber-700" />
            <span>Pawn Ticket</span>
          </button>
        </div>
      </div>

      {/* Grid: Borrower Info & Current Due Calculation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Borrower Card */}
        <div className="liquid-glass-card p-5 rounded-3xl border border-amber-200/70 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-amber-200/60 pb-2.5">
            <span className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-600" />
              <span>Borrower / Customer</span>
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
              customer?.kycStatus === 'Verified' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-900 border-amber-300'
            }`}>
              {customer?.kycStatus || 'Pending'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <img
              src={customer?.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt=""
              className="w-14 h-14 rounded-2xl object-cover border border-amber-300 shadow-xs"
            />
            <div>
              <div className="font-extrabold text-slate-900 text-sm">{customer?.name}</div>
              <div className="text-xs text-slate-500 font-mono">{customer?.id}</div>
              <div className="text-xs text-amber-800 font-bold">{customer?.mobile}</div>
            </div>
          </div>

          <div className="pt-2 border-t border-amber-100 text-xs space-y-1 text-slate-600">
            <div>Address: <strong className="text-slate-800">{customer?.address}, {customer?.city}</strong></div>
            <div>Nominee: <strong className="text-slate-800">{customer?.nomineeName} ({customer?.nomineeRelation})</strong></div>
            <div>KYC Proof: <strong className="text-slate-800">{customer?.kycRecord?.provider || 'None'} ({customer?.kycRecord?.maskedId || '-'})</strong></div>
            <div>Tier Margin: <strong className="text-amber-800 font-bold">{customer?.preferredBrokerRateAdjustment ?? 85}% Broker Desired Rate</strong></div>
          </div>
        </div>

        {/* Real-time Due Calculation Engine Card */}
        <div className="lg:col-span-2 liquid-glass-card p-5 rounded-3xl border border-amber-200/70 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-amber-200/60 pb-2.5">
            <span className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-700" />
              <span>Real-Time Interest & Due Calculation (Section 11)</span>
            </span>
            <span className="text-[11px] font-mono font-bold text-amber-900 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-300/50">
              Rule: {mortgage.interestRate}%/mo ({mortgage.interestType})
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-white/80 rounded-2xl border border-amber-200/60 shadow-xs">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Principal Outstanding</span>
              <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
                {formatCurrency(mortgage.outstandingPrincipal)}
              </div>
            </div>

            <div className="p-3 bg-white/80 rounded-2xl border border-amber-200/60 shadow-xs">
              <span className="text-[10px] text-amber-800 uppercase font-bold">Accrued Interest</span>
              <div className="text-lg font-black text-amber-700 font-mono mt-0.5">
                {formatCurrency(dueInfo.baseInterest)}
              </div>
            </div>

            <div className="p-3 bg-white/80 rounded-2xl border border-amber-200/60 shadow-xs">
              <span className="text-[10px] text-rose-700 uppercase font-bold">Late Penalties</span>
              <div className="text-lg font-black text-rose-600 font-mono mt-0.5">
                {formatCurrency(dueInfo.penaltyCharges)}
              </div>
            </div>

            <div className="p-3 bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-emerald-50 rounded-2xl border border-emerald-300 shadow-xs">
              <span className="text-[10px] text-emerald-800 uppercase font-extrabold">Total Amount Due</span>
              <div className="text-xl font-black text-emerald-800 font-mono mt-0.5">
                {formatCurrency(mortgage.outstandingPrincipal + dueInfo.totalAccruedInterest)}
              </div>
            </div>
          </div>

          <div className="p-3 bg-white/70 rounded-2xl border border-amber-200/60 text-xs text-slate-700 space-y-1">
            <div className="font-bold text-slate-900">Calculation Engine Breakdown:</div>
            <div className="text-slate-600 font-mono text-[11px]">{dueInfo.breakdown}</div>
            <div className="text-slate-500 text-[10px] flex items-center justify-between pt-1">
              <span>Maturity Status: <strong className={relDays.isPast ? 'text-rose-600 font-bold' : 'text-slate-800'}>{relDays.label}</strong></span>
              <span>Disbursement Mode: <strong className="text-slate-800">{mortgage.disbursementMode}</strong></span>
            </div>
          </div>
        </div>

      </div>

      {/* Gold Items & Valuation Appraisal Table (Section 10) */}
      <div className="liquid-glass-card rounded-3xl border border-amber-200/70 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-amber-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-amber-500/10 via-white/70 to-yellow-500/10">
          <div className="flex items-center gap-2">
            <Gem className="w-4 h-4 text-amber-700" />
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Pledged Gold Items & Valuation Breakdown</h3>
              <p className="text-[11px] text-slate-500">
                Live GoodReturns Bullion Spot vs Pawn Broker Desired Loan Appraisal
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-600 font-mono flex items-center gap-3">
            <span>Net Wt: <strong className="text-emerald-700 font-bold">{formatWeight(totalNetWeight)}</strong></span>
            <span>Broker Appraisal: <strong className="text-amber-800 font-bold">{formatCurrency(totalBrokerValuation)}</strong></span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-amber-500/10 text-slate-700 uppercase text-[10px] tracking-wider font-extrabold border-b border-amber-200/60">
              <tr>
                <th className="py-2.5 px-4">Item Type</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4">Gross Wt</th>
                <th className="py-2.5 px-4">Net Wt</th>
                <th className="py-2.5 px-4">Purity</th>
                <th className="py-2.5 px-4">GoodReturns Spot</th>
                <th className="py-2.5 px-4">Broker Loan Rate</th>
                <th className="py-2.5 px-4">Appraisal Value</th>
                <th className="py-2.5 px-4 text-right">Approved Loan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {mortgage.items.map((item, idx) => {
                const spotRate = item.marketGoldRate || (goodReturnsRates.ratesByKarat?.[item.karat] || item.goldRate || 7260);
                const brokerRate = item.brokerMortgageRate || item.goldRate || spotRate;
                const valuation = item.brokerValuation || item.marketValue;

                return (
                  <tr key={idx} className="hover:bg-amber-50/50 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        {item.photoReference && (
                          <img
                            src={item.photoReference}
                            alt={item.itemType}
                            className="w-8 h-8 rounded-lg object-cover border border-amber-300 shadow-2xs shrink-0"
                          />
                        )}
                        <span>{item.itemType}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{item.description}</td>
                    <td className="py-3 px-4 font-mono">{formatWeight(item.grossWeight)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">{formatWeight(item.netWeight)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-950 font-bold text-[10px] border border-amber-300">
                        {item.purity} ({item.karat}K)
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      ₹{spotRate.toLocaleString()}/g
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-800">
                      ₹{brokerRate.toLocaleString()}/g
                      <span className="text-[10px] text-slate-500 block font-normal">
                        ({Math.round((brokerRate / (spotRate || 1)) * 100)}% of spot)
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{formatCurrency(valuation)}</td>
                    <td className="py-3 px-4 font-mono font-black text-amber-700 text-right">{formatCurrency(item.approvedLoan)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vault Custody & Packet Details (Section 15) */}
      <div className="liquid-glass-card p-5 rounded-3xl border border-amber-200/70 shadow-xs">
        <div className="flex items-center justify-between border-b border-amber-200/60 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-700" />
            <h3 className="font-extrabold text-slate-900 text-sm">Vault Custody & Gold Packet Details</h3>
          </div>
          <button
            onClick={() => setReceiptModalData({ type: 'packet_tag', mortgage, packet, customer })}
            className="flex items-center gap-1.5 px-3 py-1.5 liquid-glass-gold text-amber-950 rounded-xl text-xs font-bold border border-amber-300 shadow-2xs hover:bg-amber-400/30 transition"
          >
            <Printer className="w-3.5 h-3.5 text-amber-800" />
            <span>Print Packet QR Tag</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-white/80 rounded-2xl border border-amber-200/60 shadow-xs">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">Packet ID</span>
            <span className="text-base font-black font-mono text-amber-800">{packet?.id || mortgage.packetId}</span>
          </div>

          <div className="p-3 bg-white/80 rounded-2xl border border-amber-200/60 shadow-xs">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">Locker Location</span>
            <span className="text-xs font-bold text-slate-800">
              {packet?.lockerId} • {packet?.rack} • {packet?.tray}
            </span>
          </div>

          <div className="p-3 bg-white/80 rounded-2xl border border-amber-200/60 shadow-xs">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">Custody Status</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
              packet?.status === 'In Locker' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-700 border-slate-300'
            }`}>
              {packet?.status || 'In Locker'}
            </span>
          </div>

          <div className="p-3 bg-white/80 rounded-2xl border border-amber-200/60 shadow-xs">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">Total Net In Custody</span>
            <span className="text-base font-black font-mono text-emerald-700">{formatWeight(totalNetWeight)}</span>
          </div>
        </div>

        {/* Packet Movement History */}
        {packet && packet.movements.length > 0 && (
          <div className="mt-3 pt-3 border-t border-amber-100">
            <div className="text-[11px] font-bold text-slate-700 mb-2">Custody Movement Audit Log:</div>
            <div className="space-y-1 text-[11px] text-slate-600 font-mono">
              {packet.movements.map((mov, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-slate-400">{formatDate(mov.timestamp)}:</span>
                  <span className="text-slate-800 font-bold">{mov.fromLocation} → {mov.toLocation}</span>
                  <span className="text-slate-500">by {mov.movedBy} ({mov.reason})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Payment History Table (Section 12) */}
      <div className="liquid-glass-card rounded-3xl border border-amber-200/70 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-amber-200/60 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-white/70 to-teal-500/10">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-700" />
            <h3 className="font-extrabold text-slate-900 text-sm">Payment Collections History</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">{mortgagePayments.length} transactions recorded</span>
        </div>

        {mortgagePayments.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No payments received yet on this mortgage.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-amber-500/10 text-slate-700 uppercase text-[10px] tracking-wider font-extrabold border-b border-amber-200/60">
                <tr>
                  <th className="py-2.5 px-4">Receipt ID</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Amount</th>
                  <th className="py-2.5 px-4">Mode</th>
                  <th className="py-2.5 px-4">Principal Adj</th>
                  <th className="py-2.5 px-4">Interest Paid</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {mortgagePayments.map(p => (
                  <tr key={p.id} className="hover:bg-amber-50/50 transition">
                    <td className="py-3 px-4 font-mono font-black text-amber-800">{p.id}</td>
                    <td className="py-3 px-4">{formatDate(p.paymentDate)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{formatCurrency(p.amount)}</td>
                    <td className="py-3 px-4">{p.paymentMethod}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{formatCurrency(p.allocatedPrincipal)}</td>
                    <td className="py-3 px-4 font-mono text-emerald-700 font-bold">{formatCurrency(p.allocatedInterest)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        p.status === 'Completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-rose-50 text-rose-800 border-rose-300'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setReceiptModalData({ type: 'payment', mortgage, customer, payment: p })}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-xs transition"
                      >
                        Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
