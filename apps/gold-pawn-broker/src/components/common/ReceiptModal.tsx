import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatWeight, formatDate, formatDateTime } from '../../utils/formatters';
import { Printer, X, Download, FileText, CheckCircle2, ShieldCheck, QrCode, User, Camera, Send, MessageCircle } from 'lucide-react';
import { generateQrDataUrl, buildCustomerPortalUrl } from '../../utils/qrCodeService';
import { generateBarcodeDataUrl } from '../../utils/barcodeService';
import { openWhatsApp, buildPledgeReceiptMessage, buildPaymentReceiptMessage } from '../../utils/whatsappService';
import { printElement } from '../../utils/printService';

export const ReceiptModal: React.FC = () => {
  const { receiptModalData, setReceiptModalData, currentBranch, settings, currentUser, customers, language } = useApp();
  const [receiptFormat, setReceiptFormat] = useState<'A4' | 'thermal'>('A4');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [mortgageBarcode, setMortgageBarcode] = useState<string>('');
  const [packetBarcode, setPacketBarcode] = useState<string>('');

  const activeCustomer = receiptModalData?.customer || (receiptModalData?.mortgage ? customers.find(c => c.id === receiptModalData.mortgage?.customerId) : undefined);
  const customerId = activeCustomer?.id;
  const mortgageNumber = receiptModalData?.mortgage?.mortgageNumber;
  const packetId = receiptModalData?.packet?.id || receiptModalData?.mortgage?.packetId;

  useEffect(() => {
    if (customerId) {
      const url = buildCustomerPortalUrl(customerId, currentBranch?.code, mortgageNumber);
      let isMounted = true;
      generateQrDataUrl(url, { width: 150, margin: 1 }).then(dataUrl => {
        if (isMounted) setQrDataUrl(dataUrl);
      });
      return () => { isMounted = false; };
    }
  }, [customerId, currentBranch?.code, mortgageNumber]);

  useEffect(() => {
    const docRef = receiptModalData?.payment?.id || mortgageNumber || 'DOC-2026';
    if (docRef) {
      setMortgageBarcode(generateBarcodeDataUrl(docRef, { barWidth: 2, height: 44, fontSize: 11 }));
    }
    if (packetId) {
      setPacketBarcode(generateBarcodeDataUrl(packetId, { barWidth: 2, height: 38, fontSize: 10 }));
    }
  }, [mortgageNumber, receiptModalData?.payment?.id, packetId]);

  if (!receiptModalData) return null;

  const { type, mortgage, payment, packet, notes } = receiptModalData;
  const customer = activeCustomer;

  const handlePrint = () => {
    const docRef = payment?.id || mortgage?.mortgageNumber || 'DOC-2026';
    const docTitle = `${settings.companyName || 'Receipt'} - ${docRef}`;
    printElement('printable-receipt-content', {
      format: receiptFormat,
      title: docTitle
    });
  };

  const handleSendWhatsApp = () => {
    if (!customer?.mobile) {
      alert('No customer mobile number available to send WhatsApp.');
      return;
    }

    let msg = '';
    if (type === 'payment' && payment) {
      msg = buildPaymentReceiptMessage({
        payment,
        mortgage,
        customer,
        branch: currentBranch,
        settings,
        language
      });
    } else if (mortgage) {
      msg = buildPledgeReceiptMessage({
        mortgage,
        customer,
        branch: currentBranch,
        settings,
        language
      });
    } else {
      msg = `Hello ${customer.name}, receipt for transaction from ${settings.companyName}: ${buildCustomerPortalUrl(customer.id, currentBranch.code, mortgageNumber)}`;
    }

    openWhatsApp(customer.mobile, msg);
  };

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="liquid-glass-modal border border-amber-200/80 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh]">
        
        {/* Modal Controls Bar (Hidden during print) */}
        <div className="no-print p-4 bg-white/70 border-b border-amber-200/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl border border-amber-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm capitalize">
                {type === 'pledge' ? 'Pawn Ticket & Pledge Agreement' : 
                 type === 'payment' ? 'Payment Collection Receipt' : 
                 type === 'renewal' ? 'Pledge Renewal & Extension Certificate' : 
                 type === 'closure' ? 'Settlement & Gold Release Voucher' : 'Packet QR Label'}
              </h3>
              <div className="flex items-center gap-2">
                <p className="text-[11px] text-slate-500">Section 25 Compliance: Dual A4 & 80mm Thermal Print Engine</p>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-900 border border-emerald-300 text-[10px] font-bold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Single Page A4 Calibrated</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Format Toggle */}
            <div className="flex items-center bg-amber-50/70 border border-amber-200/80 rounded-xl p-1 text-xs">
              <button
                type="button"
                onClick={() => setReceiptFormat('A4')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  receiptFormat === 'A4'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                A4 Formal Form
              </button>
              <button
                type="button"
                onClick={() => setReceiptFormat('thermal')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  receiptFormat === 'thermal'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                80mm Thermal POS
              </button>
            </div>

            <button
              onClick={handleSendWhatsApp}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition active:scale-98"
              title="Send Receipt & Passbook link to customer via WhatsApp"
            >
              <MessageCircle className="w-4 h-4 fill-white/20" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Document</span>
            </button>

            <button
              onClick={() => setReceiptModalData(null)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-amber-100/50 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Preview Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 pb-28 bg-stone-100/70 flex justify-center">
          
          {/* A4 FORM FORMAT (Calibrated for single-page A4: 210mm x 297mm) */}
          {receiptFormat === 'A4' ? (
            <div id="printable-receipt-content" className="printable-area bg-white text-slate-900 w-full max-w-[200mm] p-6 sm:p-7 rounded-2xl shadow-xl space-y-3.5 text-[11px] font-sans leading-tight border border-slate-300">
              
              {/* Header */}
              <div className="border-b-2 border-slate-900 pb-2.5 text-center space-y-0.5">
                <div className="text-lg font-black tracking-tight uppercase text-slate-950">
                  {settings.companyName}
                </div>
                <div className="text-[11px] font-semibold text-slate-700">{settings.tagline}</div>
                <div className="text-[10px] text-slate-600">
                  {currentBranch.address}, {currentBranch.city} • Phone: {currentBranch.phone} • Email: {currentBranch.email}
                </div>
                <div className="text-[9.5px] font-mono text-slate-500">
                  State Pawnbroking License: <strong>{currentBranch.licenseNumber}</strong> • PAN: <strong>{currentBranch.panNumber}</strong>
                </div>
              </div>

              {/* Title Strip */}
              <div className="flex items-center justify-between border-b border-slate-300 pb-1.5">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase block font-bold">Document Type</span>
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                    {type === 'pledge' ? 'Pawn Ticket & Pledge Agreement' :
                     type === 'payment' ? 'Collection & Settlement Receipt' :
                     type === 'renewal' ? 'Mortgage Extension Certificate' :
                     type === 'closure' ? 'Gold Handover & Release Voucher' : 'Packet Security Tag'}
                  </span>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="text-[9px] text-slate-500 uppercase block font-bold">Document Ref</span>
                  <span className="text-sm font-black font-mono text-slate-900">
                    {payment?.id || mortgage?.mortgageNumber || 'DOC-2026'}
                  </span>
                  {mortgageBarcode && (
                    <img
                      src={mortgageBarcode}
                      alt={mortgage?.mortgageNumber}
                      className="h-9 mt-1 object-contain block"
                    />
                  )}
                </div>
              </div>

              {/* Borrower & Loan Overview Box */}
              <div className="grid grid-cols-2 gap-3 border border-slate-300 p-2.5 rounded-lg bg-slate-50/80 text-[10.5px]">
                <div>
                  <div className="font-bold text-slate-900 text-[11px] uppercase border-b border-slate-200 pb-0.5 mb-1.5 flex items-center justify-between">
                    <span>Borrower Particulars</span>
                    <span className="text-[9px] text-slate-500 font-mono">KYC ID Verified</span>
                  </div>
                  
                  <div className="flex gap-2.5 items-start">
                    {/* Customer Picture in Receipt */}
                    <div className="shrink-0 flex flex-col items-center">
                      {customer?.photoUrl ? (
                        <img
                          src={customer.photoUrl}
                          alt={customer.name}
                          className="w-16 h-20 object-cover rounded border border-slate-400 shadow-2xs bg-white"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-16 h-20 rounded border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400">
                          <User className="w-6 h-6" />
                          <span className="text-[8px] font-bold mt-1">Photo</span>
                        </div>
                      )}
                      <span className="text-[7.5px] text-slate-500 uppercase mt-0.5 font-bold">Borrower</span>
                    </div>

                    <div className="space-y-0.5 text-[10px] flex-1">
                      <div>Name: <strong>{customer?.name}</strong></div>
                      <div>Customer ID: <strong className="font-mono">{customer?.id}</strong></div>
                      <div>Mobile: <strong>{customer?.mobile}</strong></div>
                      <div>Address: {customer?.address}, {customer?.city}</div>
                      <div>
                        UIDAI Aadhaar KYC: <strong className="font-mono text-emerald-800">{customer?.kycRecord?.maskedId || customer?.aadhaarNumber || 'Verified'}</strong>
                        {customer?.kycRecord?.nameMatchScore !== undefined && (
                          <span className="ml-1 text-[8.5px] font-bold text-blue-900 bg-blue-50 px-1 py-0.5 rounded border border-blue-200">
                            {customer.kycRecord.nameMatchScore}% Match ({customer.kycRecord.nameMatchStatus || 'EXACT'})
                          </span>
                        )}
                      </div>
                      {customer?.kycRecord?.aadhaarLegalName && customer.kycRecord.aadhaarLegalName !== customer.name && (
                        <div className="text-[9px] text-slate-600">
                          Aadhaar Legal: <strong className="font-mono">{customer.kycRecord.aadhaarLegalName}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-0.5 border-l border-slate-300 pl-3">
                  <div className="font-bold text-slate-900 text-[11px] uppercase border-b border-slate-200 pb-0.5">
                    Pawn Loan Terms
                  </div>
                  <div>Mortgage Ref: <strong className="font-mono">{mortgage?.mortgageNumber}</strong></div>
                  <div>Pawn Date: <strong>{formatDate(mortgage?.mortgageDate || '')}</strong> • Due: <strong>{formatDate(mortgage?.maturityDate || '')}</strong></div>
                  <div className="text-amber-900 font-bold">
                    Pawnbroker Agreed Rate: <strong className="font-mono text-slate-900">{formatCurrency(mortgage?.items?.[0]?.brokerMortgageRate || 6600)} / g</strong>
                  </div>
                  <div className="text-amber-950 font-bold">
                    Agreed Interest Rate: <strong className="font-mono text-slate-950 bg-amber-100 px-1 rounded">{mortgage?.interestRate}% per month</strong> ({mortgage?.interestType})
                  </div>
                  <div className="text-[9.5px] text-slate-500">
                    Locker Packet: <strong className="font-mono text-slate-700">{mortgage?.packetId}</strong> • GoodReturns Ref: {formatCurrency(mortgage?.items?.[0]?.marketGoldRate || 7260)}/g
                  </div>
                </div>
              </div>

              {/* Gold Items Table (Section 10 & 25) */}
              {mortgage && mortgage.items && (
                <div>
                  <div className="font-bold text-slate-900 text-[10.5px] uppercase mb-1 flex items-center justify-between">
                    <span>Pledged Gold Ornaments & Valuation Schedule</span>
                    <span className="text-[9px] text-slate-500 lowercase font-normal">*Valuation computed at pawnbroker agreed rate</span>
                  </div>
                  <table className="w-full text-left border border-slate-300 text-[10px]">
                    <thead className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300">
                      <tr>
                        <th className="py-1 px-2">#</th>
                        <th className="py-1 px-2">{language === 'ta' ? 'நகை வகை' : 'Item Type & Photo'}</th>
                        <th className="py-1 px-2">{language === 'ta' ? 'விவரம்' : 'Description'}</th>
                        <th className="py-1 px-2 text-right">{language === 'ta' ? 'மொத்த எடை' : 'Gross Wt'}</th>
                        <th className="py-1 px-2 text-right">{language === 'ta' ? 'கல் கழிவு' : 'Stone Wt'}</th>
                        <th className="py-1 px-2 text-right">{language === 'ta' ? 'நிகர எடை' : 'Net Wt'}</th>
                        <th className="py-1 px-2 text-center">{language === 'ta' ? 'தரம் (Touch)' : 'Purity'}</th>
                        <th className="py-1 px-2 text-right">{language === 'ta' ? 'கிராம் விலை' : 'Broker Rate'}</th>
                        <th className="py-1 px-2 text-right">{language === 'ta' ? 'மதிப்பீடு' : 'Valuation'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {mortgage.items.map((item, i) => (
                        <tr key={i}>
                          <td className="py-1 px-2 font-mono">{i + 1}</td>
                          <td className="py-1 px-2">
                            <div className="flex items-center gap-1.5 font-bold">
                              {item.photoReference ? (
                                <img
                                  src={item.photoReference}
                                  alt={item.itemType}
                                  className="w-10 h-10 object-cover rounded-lg border border-amber-300 shadow-2xs shrink-0 bg-white"
                                />
                              ) : (
                                <span className="w-10 h-10 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400 text-[8px] shrink-0 font-normal">
                                  Gold
                                </span>
                              )}
                              <span>{item.itemType}</span>
                            </div>
                          </td>
                          <td className="py-1 px-2 text-slate-700">{item.description}</td>
                          <td className="py-1 px-2 text-right font-mono">{formatWeight(item.grossWeight)}</td>
                          <td className="py-1 px-2 text-right font-mono">{formatWeight(item.stoneWeight)}</td>
                          <td className="py-1 px-2 text-right font-mono font-bold text-slate-950">{formatWeight(item.netWeight)}</td>
                          <td className="py-1 px-2 text-center font-bold">{item.purity}</td>
                          <td className="py-1 px-2 text-right font-mono">{formatCurrency(item.brokerMortgageRate || item.marketGoldRate || 6600)}</td>
                          <td className="py-1 px-2 text-right font-mono font-bold">{formatCurrency(item.brokerValuation || item.marketValue)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400">
                      <tr>
                        <td colSpan={3} className="py-1 px-2 uppercase">{language === 'ta' ? 'மொத்த எடை விவரம்' : 'Total Collateral Weights'}</td>
                        <td className="py-1 px-2 text-right font-mono">{formatWeight(mortgage.items.reduce((s, i) => s + i.grossWeight, 0))}</td>
                        <td className="py-1 px-2 text-right font-mono">{formatWeight(mortgage.items.reduce((s, i) => s + i.stoneWeight, 0))}</td>
                        <td className="py-1 px-2 text-right font-mono font-black">{formatWeight(mortgage.items.reduce((s, i) => s + i.netWeight, 0))}</td>
                        <td colSpan={2} className="py-1 px-2 text-right text-[9px] text-slate-500 uppercase">{language === 'ta' ? 'மொத்த மதிப்பு:' : 'Appraised Value:'}</td>
                        <td className="py-1 px-2 text-right font-mono font-black">{formatCurrency(mortgage.items.reduce((s, i) => s + (i.brokerValuation || i.marketValue), 0))}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* Financial Breakdown Table */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-slate-300 p-2.5 rounded bg-slate-50/80 space-y-0.5 text-[10.5px]">
                  <div className="font-bold text-slate-900 uppercase border-b border-slate-200 pb-0.5 mb-1">
                    {language === 'ta' ? 'கடன் நிதி சுருக்கம் (Financial Summary)' : 'Financial Summary'}
                  </div>
                  <div className="flex justify-between">
                    <span>{language === 'ta' ? 'வழங்கப்பட்ட அசல் (Asal):' : 'Principal Sanctioned (Asal):'}</span>
                    <strong className="font-mono text-slate-950">{formatCurrency(mortgage?.principalAmount || 0)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>{language === 'ta' ? 'மாத வட்டி விகிதம் (Vaddi):' : 'Monthly Interest Rate (Vaddi):'}</span>
                    <strong className="font-mono text-amber-900">{mortgage?.interestRate}% / mo</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>{language === 'ta' ? 'தவணை கடந்த அபராத வட்டி:' : 'Late Payment Penalty:'}</span>
                    <span className="font-mono">{mortgage?.penaltyRateMonthly ?? 1.0}% / mo (after {mortgage?.gracePeriodDays ?? 7}d grace)</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>{language === 'ta' ? 'நிர்வாக மற்றும் மதிப்பீட்டுக் கட்டணம்:' : 'Admin & Appraisal Fee:'}</span>
                    <span className="font-mono">{formatCurrency((mortgage?.processingFee || 0) + (mortgage?.otherCharges || 0))}</span>
                  </div>
                  {payment && (
                    <div className="flex justify-between text-emerald-800 font-bold border-t border-slate-300 pt-0.5 mt-0.5">
                      <span>{language === 'ta' ? 'வசூலிக்கப்பட்ட தொகை:' : 'Payment Collected:'}</span>
                      <span className="font-mono">{formatCurrency(payment.amount)}</span>
                    </div>
                  )}
                </div>

                <div className="border border-slate-300 p-2 rounded bg-slate-50/80 flex items-center justify-between gap-2.5">
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-1 text-[10px] font-black text-slate-900 uppercase">
                      <span>📱 {language === 'ta' ? 'வாடிக்கையாளர் பாஸ்புக்' : 'Customer Web Passbook'}</span>
                    </div>
                    <p className="text-[8.5px] text-slate-600 mt-0.5 leading-snug">
                      {language === 'ta' 
                        ? 'உங்கள் கேமரா மூலம் இந்த QR-ஐ ஸ்கேன் செய்து உங்கள் அசல், வட்டி & நகை நிலுவையை ஆன்லைனில் காண்க. (App Store தேவை இல்லை)'
                        : 'Scan with phone camera to track active loan, interest paid & pledged ornaments online. (No app store needed)'}
                    </p>
                    <div className="mt-1 font-mono font-bold text-[9.5px] text-amber-900">
                      ID: {mortgage?.mortgageNumber}
                    </div>
                  </div>

                  <div className="p-1 bg-white border border-slate-300 rounded shrink-0 flex flex-col items-center">
                    {qrDataUrl ? (
                      <img 
                        src={qrDataUrl} 
                        alt="Customer Passbook QR" 
                        className="w-14 h-14 object-contain cursor-pointer hover:opacity-90 transition"
                        onClick={() => {
                          const url = buildCustomerPortalUrl(customer?.id, currentBranch?.code, mortgage?.mortgageNumber);
                          window.open(url, '_blank');
                        }}
                        title="Click to test/open customer passbook"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-slate-100 flex items-center justify-center font-mono text-[8px] text-slate-400">
                        QR
                      </div>
                    )}
                    <span className="text-[7px] text-slate-500 uppercase font-mono font-bold mt-0.5">SCAN PASSBOOK</span>
                  </div>
                </div>
              </div>

              {/* Statutory Terms & Conditions (Section 25) */}
              <div className="border border-slate-300 p-2 rounded text-[9px] text-slate-600 space-y-0.5 bg-slate-50/50">
                <div className="font-bold text-slate-800 uppercase text-[9.5px]">
                  {language === 'ta' ? 'சட்டப்பூர்வ அடமான விதிமுறைகள் & ஒப்பந்தம்:' : 'Statutory Terms & Pawn Contract Agreement:'}
                </div>
                <p>1. {language === 'ta' ? 'மேற்குறிப்பிட்ட தங்க நகைகளை அடமானமாக வைத்து கடன் தொகை முழுமையாக பெறப்பட்டுள்ளது.' : 'The borrower pledges the described gold ornaments as security for the loan amount received in full.'}</p>
                <p>2. {language === 'ta' ? `ஒப்புக் கொண்ட மாத வட்டி ${mortgage?.interestRate}%/மாதம் செலுத்தப்பட வேண்டும். குறித்த காலத்திற்குள் செலுத்த தவறினால் ${mortgage?.penaltyRateMonthly ?? 1.0}% அபராத வட்டி விதிக்கப்படும்.` : `Monthly interest is payable at the agreed rate of ${mortgage?.interestRate}%/month. Overdue late penalty of ${mortgage?.penaltyRateMonthly ?? 1.0}%/month applies if not settled within ${mortgage?.gracePeriodDays ?? 7} days grace period after maturity.`}</p>
                <p>3. {language === 'ta' ? 'அசல் ரசீது மற்றும் அடையாளச் சான்று காண்பித்து அசல் மற்றும் வட்டி செலுத்தி நகையை மீட்டுக்கொள்ளலாம்.' : 'Gold packets remain in insured branch vault custody until redemption on surrender of this original ticket and photo ID.'}</p>
              </div>

              {/* Signature Blocks */}
              <div className="grid grid-cols-2 gap-6 pt-3 text-center text-[10.5px]">
                <div>
                  <div className="border-t border-slate-400 pt-1 font-bold">
                    {language === 'ta' ? 'வாடிக்கையாளர் கையொப்பம் / கட்டைவிரல் ரேகை' : 'Borrower Signature / Thumb Impression'}
                  </div>
                  <div className="text-[9.5px] text-slate-500">({customer?.name})</div>
                </div>

                <div>
                  <div className="border-t border-slate-400 pt-1 font-bold">
                    {language === 'ta' ? 'அடமானக் கடை உரிமையாளர் கையொப்பம்' : `For ${settings.companyName}`}
                  </div>
                  <div className="text-[9.5px] text-slate-500">Authorized Signatory / Cashier ({currentUser.name})</div>
                </div>
              </div>

              <div className="text-[8.5px] text-center text-slate-400 pt-2 border-t border-slate-200">
                Generated via Nexus Gold Pawn OS • {formatDateTime(new Date().toISOString())} • Branch Code: {currentBranch.code} • Page 1 of 1 (A4)
              </div>

            </div>
          ) : (
            
            /* 80mm THERMAL POS FORMAT (Section 25) */
            <div id="printable-receipt-content" className="printable-area bg-white text-slate-900 w-[80mm] p-4 rounded shadow-2xl space-y-3 text-[11px] font-mono leading-tight border border-slate-300">
              
              {/* Thermal Header */}
              <div className="text-center space-y-0.5 border-b border-dashed border-slate-400 pb-2">
                <div className="font-black text-sm uppercase">{settings.companyName}</div>
                <div className="text-[10px]">{currentBranch.name}</div>
                <div className="text-[9px] text-slate-600">{currentBranch.phone}</div>
                <div className="text-[9px]">Lic: {currentBranch.licenseNumber}</div>
              </div>

              {/* Receipt Title */}
              <div className="text-center font-bold uppercase py-1 border-b border-dashed border-slate-400">
                {type === 'pledge' ? '*** PAWN TICKET ***' :
                 type === 'payment' ? '*** PAYMENT RECEIPT ***' :
                 type === 'renewal' ? '*** RENEWAL VOUCHER ***' : '*** SETTLEMENT VOUCHER ***'}
              </div>

              {/* Reference Details with Customer Photo */}
              <div className="flex items-center gap-2 border-b border-dashed border-slate-400 pb-2">
                {customer?.photoUrl ? (
                  <img
                    src={customer.photoUrl}
                    alt={customer.name}
                    className="w-12 h-14 object-cover rounded border border-slate-500 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-14 rounded border border-dashed border-slate-400 flex flex-col items-center justify-center text-[7.5px] text-slate-500 shrink-0 bg-slate-50">
                    <User className="w-4 h-4" />
                    <span>PHOTO</span>
                  </div>
                )}
                <div className="space-y-0.5 text-[10px] flex-1">
                  <div>PLEDGE: <strong>{mortgage?.mortgageNumber}</strong></div>
                  <div>CUST  : <strong>{customer?.name}</strong></div>
                  <div>ID    : <span className="font-mono">{customer?.id}</span></div>
                  <div>PHONE : {customer?.mobile}</div>
                  <div>DATE  : {formatDate(mortgage?.mortgageDate || '')}</div>
                  <div>KYC   : <span className="font-mono text-[9px]">{customer?.kycRecord?.maskedId || customer?.aadhaarNumber || 'Verified (Aadhaar)'}</span></div>
                  {customer?.kycRecord?.nameMatchScore !== undefined && (
                    <div>MATCH : <span className="font-bold text-[9px]">{customer.kycRecord.nameMatchScore}% ({customer.kycRecord.nameMatchStatus || 'EXACT'})</span></div>
                  )}
                </div>
              </div>

              {/* Items Breakdown with Ornament Photos */}
              {mortgage && (
                <div className="border-b border-dashed border-slate-400 py-1.5 space-y-1">
                  <div className="font-bold text-[10px]">GOLD COLLATERAL:</div>
                  {mortgage.items.map((it, i) => (
                    <div key={i} className="flex justify-between items-center text-[10px]">
                      <span className="flex items-center gap-1">
                        {it.photoReference && (
                          <img
                            src={it.photoReference}
                            alt=""
                            className="w-5 h-5 object-cover rounded border border-slate-400 inline-block"
                          />
                        )}
                        <span>{it.itemType} ({it.purity})</span>
                      </span>
                      <span>{formatWeight(it.netWeight)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-[10px] border-t border-slate-300 pt-0.5">
                    <span>TOTAL NET WT:</span>
                    <span>{formatWeight(mortgage.items.reduce((s, i) => s + i.netWeight, 0))}</span>
                  </div>
                </div>
              )}

              {/* Amounts */}
              <div className="space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span>LOAN AMOUNT:</span>
                  <strong>{formatCurrency(mortgage?.principalAmount || 0)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>INT RATE:</span>
                  <span>{mortgage?.interestRate}%/mo</span>
                </div>
                <div className="flex justify-between">
                  <span>DUE DATE:</span>
                  <span>{formatDate(mortgage?.maturityDate || '')}</span>
                </div>

                {payment && (
                  <div className="flex justify-between text-xs font-bold border-t border-dashed border-slate-400 pt-1 mt-1">
                    <span>PAID NOW:</span>
                    <span>{formatCurrency(payment.amount)}</span>
                  </div>
                )}
              </div>

              {/* Real Machine-Readable Barcode (Code128) & Passbook QR */}
              <div className="text-center pt-2 border-t border-dashed border-slate-400 space-y-2">
                {mortgageBarcode ? (
                  <div className="flex flex-col items-center">
                    <img
                      src={mortgageBarcode}
                      alt={mortgage?.mortgageNumber}
                      className="mx-auto max-w-[95%] h-auto block"
                    />
                  </div>
                ) : (
                  <div className="text-[11px] font-mono font-black tracking-widest">{mortgage?.mortgageNumber}</div>
                )}

                {qrDataUrl && (
                  <div className="pt-1 flex flex-col items-center border-t border-dashed border-slate-300">
                    <img
                      src={qrDataUrl}
                      alt="Customer Passbook QR"
                      className="w-16 h-16 object-contain mx-auto"
                    />
                    <span className="text-[7.5px] font-mono text-slate-600 mt-0.5">SCAN FOR MOBILE PASSBOOK</span>
                  </div>
                )}
              </div>

              <div className="text-center text-[8px] text-slate-500 pt-1">
                Keep this ticket safe. Valid ID required for gold redemption.
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
