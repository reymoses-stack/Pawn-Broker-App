import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Send, MessageCircle, Camera, CheckCircle2, Calendar, Sparkles, 
  Phone, Clock, MapPin, HelpCircle, Copy, Home, Building2, Loader2,
  CheckCircle, XCircle, Truck, Star
} from 'lucide-react';
import { Customer, Branch, PawnEnquiry, GoldRate } from '../types';
import { Language, translations } from '../i18n/translations';
import { sendEnquiryToPawnBroker } from '../utils/enquirySyncService';
import { checkPincodeAvailability } from '../utils/doorstepPincodeService';
import confetti from 'canvas-confetti';

interface PawnEnquiryFormProps {
  customer: Customer;
  branch: Branch;
  rates: GoldRate;
  language: Language;
  initialValues?: {
    weight?: number;
    purity?: string;
    estimatedValue?: number;
    maxLoan?: number;
  };
  onEnquirySubmitted?: (enquiry: PawnEnquiry) => void;
}

type ServiceType = 'COUNTER_VISIT' | 'DOORSTEP';
type PincodeStatus = 'idle' | 'checking' | 'available' | 'unavailable';

export const PawnEnquiryForm: React.FC<PawnEnquiryFormProps> = ({
  customer, branch, rates, language, initialValues, onEnquirySubmitted
}) => {
  const t = translations[language];

  const [itemType, setItemType] = useState('Gold Chain (சங்கிலி)');
  const [purity, setPurity] = useState(initialValues?.purity || '22K (916)');
  const [approxWeight, setApproxWeight] = useState<number>(initialValues?.weight || 16);
  const [expectedAmount, setExpectedAmount] = useState<number>(initialValues?.maxLoan || 80000);
  const [preferredVisitDate, setPreferredVisitDate] = useState('');
  const [notes, setNotes] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Service Type
  const [serviceType, setServiceType] = useState<ServiceType>('COUNTER_VISIT');
  const [customerPincode, setCustomerPincode] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [preferredSlot, setPreferredSlot] = useState('Morning (9AM - 12PM)');
  const [pincodeStatus, setPincodeStatus] = useState<PincodeStatus>('idle');
  const [pincodeArea, setPincodeArea] = useState<string | null>(null);
  const pincodeCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [submittedEnquiry, setSubmittedEnquiry] = useState<PawnEnquiry | null>(null);
  const [copied, setCopied] = useState(false);

  const getRatePerGram = () => {
    switch (purity) {
      case '24K (999)': return rates.purity24K;
      case '18K (750)': return rates.purity18K;
      default: return rates.purity22K;
    }
  };

  const rate = getRatePerGram();
  const estimatedMarketValue = Math.round(approxWeight * rate);
  const maxEligibleLoan = Math.round(estimatedMarketValue * 0.75);

  // Auto-check pincode with debounce
  useEffect(() => {
    if (serviceType !== 'DOORSTEP') return;
    if (customerPincode.length !== 6) {
      setPincodeStatus('idle');
      setPincodeArea(null);
      return;
    }

    setPincodeStatus('checking');
    if (pincodeCheckTimer.current) clearTimeout(pincodeCheckTimer.current);

    pincodeCheckTimer.current = setTimeout(async () => {
      const result = await checkPincodeAvailability(customerPincode);
      if (result.available) {
        setPincodeStatus('available');
        setPincodeArea(result.area || null);
      } else {
        setPincodeStatus('unavailable');
        setPincodeArea(null);
      }
    }, 500);

    return () => {
      if (pincodeCheckTimer.current) clearTimeout(pincodeCheckTimer.current);
    };
  }, [customerPincode, serviceType]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const canSubmit = () => {
    if (serviceType === 'DOORSTEP') {
      return pincodeStatus === 'available' && customerAddress.trim().length > 5;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit()) return;

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newEnquiry: PawnEnquiry = {
      id: `ENQ-2026-${randomSuffix}`,
      customerName: customer.name,
      customerMobile: customer.mobile,
      itemType,
      purity,
      approxWeight,
      expectedAmount,
      estimatedMarketValue,
      maxEligibleLoan,
      preferredVisitDate: preferredVisitDate || new Date().toISOString().split('T')[0],
      notes: serviceType === 'DOORSTEP'
        ? `[🏠 DOORSTEP REQUEST] Pincode: ${customerPincode} | Area: ${pincodeArea} | Address: ${customerAddress} | Slot: ${preferredSlot}${notes ? ' | Notes: ' + notes : ''}`
        : notes,
      photoUrl: photoPreview || undefined,
      status: 'SUBMITTED',
      createdAt: new Date().toLocaleString('en-IN'),
      serviceType,
      customerPincode: serviceType === 'DOORSTEP' ? customerPincode : undefined,
      customerAddress: serviceType === 'DOORSTEP' ? customerAddress : undefined,
      isDoorstepServiceAvailable: serviceType === 'DOORSTEP' ? true : undefined,
      preferredSlot: serviceType === 'DOORSTEP' ? preferredSlot : undefined,
    };

    setSubmittedEnquiry(newEnquiry);
    onEnquirySubmitted?.(newEnquiry);
    sendEnquiryToPawnBroker(newEnquiry).catch(err => console.error('Failed to sync enquiry', err));

    try {
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    } catch {}
  };

  const handleSendWhatsApp = () => {
    if (!submittedEnquiry) return;
    const isDoorstep = submittedEnquiry.serviceType === 'DOORSTEP';
    const text = encodeURIComponent(
      `Hello ${branch.name},\nI've submitted a Gold Loan Enquiry on Nexus Customer Passbook:\n• Ref ID: ${submittedEnquiry.id}\n• Customer: ${customer.name} (${customer.mobile})\n• Item: ${submittedEnquiry.itemType} (${submittedEnquiry.purity})\n• Approx Wt: ${submittedEnquiry.approxWeight}g\n• Expected Loan: ₹${submittedEnquiry.expectedAmount.toLocaleString('en-IN')}\n• Est. Value: ₹${submittedEnquiry.estimatedMarketValue.toLocaleString('en-IN')}\n${isDoorstep ? `• Service: 🏠 DOORSTEP VALUATION\n• Pincode: ${submittedEnquiry.customerPincode} (${pincodeArea})\n• Address: ${submittedEnquiry.customerAddress}\n• Preferred Slot: ${submittedEnquiry.preferredSlot}` : `• Service: 🏪 Counter Visit\n• Preferred Date: ${submittedEnquiry.preferredVisitDate || 'Today'}`}\n\nPlease confirm the appointment.`
    );
    const cleanPhone = branch.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${text}`, '_blank');
  };

  const handleCopyId = () => {
    if (submittedEnquiry) {
      navigator.clipboard.writeText(submittedEnquiry.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 rounded-3xl p-6 text-slate-950 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/15 backdrop-blur-md text-slate-950 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>{language === 'ta' ? 'அடமான விண்ணப்பம்' : 'Fast-Track Pawn Sanction'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">{t.enquiryTitle}</h2>
            <p className="text-xs sm:text-sm text-amber-950 font-medium mt-1">{t.enquirySubtitle}</p>
          </div>
          <div className="bg-slate-950/15 backdrop-blur-md p-3 rounded-2xl border border-white/20 text-xs shrink-0 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/30 flex items-center justify-center font-bold">⚖️</div>
            <div>
              <div className="text-[11px] text-amber-950 font-semibold">{branch.name}</div>
              <div className="font-mono text-xs font-black text-slate-950">{branch.phone}</div>
            </div>
          </div>
        </div>
      </div>

      {submittedEnquiry ? (
        /* ── Success Card ── */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-400 shadow-xl space-y-6 text-slate-900">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-emerald-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">
                  {language === 'ta' ? 'விசாரிப்பு பதிவு செய்யப்பட்டது' : 'Enquiry Recorded Successfully'}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xl sm:text-2xl font-black font-mono text-slate-950">{submittedEnquiry.id}</span>
                  <button type="button" onClick={handleCopyId} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition" title="Copy Reference ID">
                    <Copy className="w-4 h-4" />
                  </button>
                  {copied && <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>}
                </div>
              </div>
            </div>
            <div className="text-center sm:text-right">
              <div className="text-xs text-slate-500 font-medium">Service Type:</div>
              <span className={`inline-flex items-center gap-1.5 mt-0.5 px-3 py-1 rounded-full font-bold text-xs border ${
                submittedEnquiry.serviceType === 'DOORSTEP'
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}>
                {submittedEnquiry.serviceType === 'DOORSTEP' ? (
                  <><Truck className="w-3.5 h-3.5" /> Doorstep Valuation Booked</>
                ) : (
                  <><Building2 className="w-3.5 h-3.5" /> Ready for Counter Visit</>
                )}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-amber-50/50 p-4 rounded-2xl border border-amber-200/70 text-xs">
            <div><span className="text-slate-500 block">Ornament:</span><strong className="text-slate-900">{submittedEnquiry.itemType}</strong></div>
            <div><span className="text-slate-500 block">Weight & Purity:</span><strong className="text-slate-900 font-mono">{submittedEnquiry.approxWeight}g • {submittedEnquiry.purity}</strong></div>
            <div><span className="text-slate-500 block">Est. Valuation:</span><strong className="text-amber-900 font-mono">₹{submittedEnquiry.estimatedMarketValue.toLocaleString('en-IN')}</strong></div>
            <div><span className="text-slate-500 block">Max Loan:</span><strong className="text-emerald-700 font-mono">₹{submittedEnquiry.maxEligibleLoan.toLocaleString('en-IN')}</strong></div>
          </div>

          {/* Doorstep-specific info */}
          {submittedEnquiry.serviceType === 'DOORSTEP' && (
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-2 text-xs text-blue-900">
              <h4 className="font-bold text-blue-800 flex items-center gap-1.5">
                <Truck className="w-4 h-4" />
                Doorstep Valuation Details
              </h4>
              <p><strong>Pincode:</strong> {submittedEnquiry.customerPincode} ({pincodeArea})</p>
              <p><strong>Address:</strong> {submittedEnquiry.customerAddress}</p>
              <p><strong>Preferred Slot:</strong> {submittedEnquiry.preferredSlot}</p>
              <p className="text-blue-700 text-[11px] mt-2">Our agent will contact you to confirm the exact appointment time. Please keep your ornaments ready along with original Aadhaar card.</p>
            </div>
          )}

          {/* Counter visit info */}
          {submittedEnquiry.serviceType !== 'DOORSTEP' && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>{language === 'ta' ? 'கடைக்கு வரும்போது கொண்டுவர வேண்டியவை' : 'Documents to Carry for Instant Disbursal:'}</span>
              </h4>
              <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                <li>{language === 'ta' ? 'அசல் ஆதார் அட்டை' : 'Original Aadhaar Card or Voter ID for biometric KYC'}</li>
                <li>{language === 'ta' ? 'அடமானம் வைக்கப்பட வேண்டிய தங்க நகைகள்' : 'The gold ornaments for touchstone/carat meter testing'}</li>
                <li>{language === 'ta' ? 'கடன் பணம் 5 நிமிடத்தில் ரொக்கமாக அல்லது UPI மூலம் பெறலாம்' : 'Cash or UPI transfer within 5 minutes at counter'}</li>
              </ul>
            </div>
          )}

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button type="button" onClick={handleSendWhatsApp} className="flex-1 py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer">
              <MessageCircle className="w-4 h-4" />
              <span>{language === 'ta' ? 'வாட்ஸ்அப்பில் கடை மேலாளருக்கு அனுப்பவும்' : 'Send Enquiry on WhatsApp to Cashier'}</span>
            </button>
            <button type="button" onClick={() => setSubmittedEnquiry(null)} className="py-3 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer">
              {language === 'ta' ? 'மற்றுமொரு விசாரிப்பு' : 'Submit Another Enquiry'}
            </button>
          </div>
        </div>
      ) : (
        /* ── Enquiry Form ── */
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-sm space-y-6 text-slate-900">

          {/* Customer info row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{language === 'ta' ? 'வாடிக்கையாளர் பெயர்' : 'Customer Name'}</label>
              <input type="text" readOnly value={customer.name} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium text-xs cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{language === 'ta' ? 'மொபைல் எண்' : 'Registered Mobile Number'}</label>
              <input type="text" readOnly value={`+91 ${customer.mobile}`} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-mono text-xs cursor-not-allowed" />
            </div>
          </div>

          {/* Ornament details */}
          <div className="border-t border-slate-100 pt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{language === 'ta' ? 'நகை வகை' : 'Gold Ornament Type'}</label>
              <select value={itemType} onChange={e => setItemType(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 text-xs font-semibold focus:border-amber-500 focus:outline-none">
                <option value="Gold Chain (சங்கிலி)">Gold Chain (சங்கிலி)</option>
                <option value="Gold Bangles (வளையல்கள்)">Gold Bangles (வளையல்கள்)</option>
                <option value="Gold Necklace (ஆரம் / நெக்லஸ்)">Gold Necklace (ஆரம் / நெக்லஸ்)</option>
                <option value="Gold Ring (மோதிரம்)">Gold Ring (மோதிரம்)</option>
                <option value="Gold Coins / Bar (நாணயங்கள்)">Gold Coins / Bar (நாணயங்கள்)</option>
                <option value="Gold Ear Studs (தோடு / ஜிமிக்கி)">Gold Ear Studs (தோடு / ஜிமிக்கி)</option>
                <option value="Mangalsutra / Thali (தாலி கொடி)">Mangalsutra / Thali (தாலி கொடி)</option>
                <option value="Other Ornaments (இதர நகைகள்)">Other Ornaments (இதர நகைகள்)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.goldPurity}</label>
              <select value={purity} onChange={e => setPurity(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 text-xs font-semibold focus:border-amber-500 focus:outline-none">
                <option value="22K (916)">22K (916) — ₹{rates.purity22K}/g</option>
                <option value="24K (999)">24K (999) — ₹{rates.purity24K}/g</option>
                <option value="18K (750)">18K (750) — ₹{rates.purity18K}/g</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{language === 'ta' ? 'தோராயமான எடை (Grams)' : 'Approx Weight (Grams)'}</label>
              <div className="relative">
                <input type="number" min="0.5" step="0.1" required value={approxWeight || ''} onChange={e => setApproxWeight(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-mono text-xs font-bold focus:border-amber-500 focus:outline-none" placeholder="e.g. 16.0" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-slate-400">grams</span>
              </div>
            </div>
          </div>

          {/* Live valuation bar */}
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-600 block">{language === 'ta' ? 'கணிக்கப்பட்ட சந்தை மதிப்பு:' : 'Instant Market Valuation:'}</span>
              <strong className="text-base sm:text-lg font-black font-mono text-slate-950">₹{estimatedMarketValue.toLocaleString('en-IN')}</strong>
            </div>
            <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-amber-200">
              <span className="text-slate-600 block">{language === 'ta' ? 'அதிகபட்ச கடன் தகுதி (75% LTV):' : 'Max Sanctionable Loan (75%):'}</span>
              <strong className="text-base sm:text-lg font-black font-mono text-emerald-800">₹{maxEligibleLoan.toLocaleString('en-IN')}</strong>
            </div>
          </div>

          {/* ── SERVICE TYPE SELECTION ── */}
          <div className="border-t border-slate-100 pt-5">
            <label className="block text-xs font-bold text-slate-700 mb-3">
              {language === 'ta' ? 'சேவை வகை தேர்வு செய்யுங்கள்' : 'How would you like to get your gold valued?'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Counter Visit Option */}
              <button
                type="button"
                onClick={() => setServiceType('COUNTER_VISIT')}
                className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                  serviceType === 'COUNTER_VISIT'
                    ? 'border-amber-500 bg-amber-50 shadow-md shadow-amber-200/50'
                    : 'border-slate-200 bg-slate-50 hover:border-amber-300 hover:bg-amber-50/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${serviceType === 'COUNTER_VISIT' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-black text-sm text-slate-900">
                      {language === 'ta' ? '🏪 கடைக்கு நேரில் வருக' : '🏪 Visit Our Branch'}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      {language === 'ta' 
                        ? 'நகைகளை நேரில் கொண்டுவந்து 5 நிமிடத்தில் கடன் பெறுக' 
                        : 'Bring your ornaments to our shop. Get cash / UPI in 5 mins.'}
                    </div>
                  </div>
                  {serviceType === 'COUNTER_VISIT' && (
                    <CheckCircle className="w-4 h-4 text-amber-600 absolute top-3 right-3 shrink-0" />
                  )}
                </div>
              </button>

              {/* Doorstep Option */}
              <button
                type="button"
                onClick={() => setServiceType('DOORSTEP')}
                className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                  serviceType === 'DOORSTEP'
                    ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-200/50'
                    : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${serviceType === 'DOORSTEP' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                      {language === 'ta' ? '🏠 வீட்டிலேயே மதிப்பீடு' : '🏠 Doorstep Valuation'}
                      <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[9px] font-extrabold uppercase tracking-wide">NEW</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      {language === 'ta' 
                        ? 'நம் ஊழியர் உங்கள் வீட்டிற்கே வந்து நகைகளை மதிப்பீடு செய்வார்' 
                        : 'Our agent visits your home for valuation & instant pawn sanction.'}
                    </div>
                  </div>
                  {serviceType === 'DOORSTEP' && (
                    <CheckCircle className="w-4 h-4 text-blue-600 absolute top-3 right-3 shrink-0" />
                  )}
                </div>
              </button>

            </div>
          </div>

          {/* ── DOORSTEP FIELDS ── */}
          {serviceType === 'DOORSTEP' && (
            <div className="space-y-4 p-4 rounded-2xl bg-blue-50 border border-blue-200">
              <h4 className="text-xs font-black text-blue-800 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {language === 'ta' ? 'வீட்டு முகவரி விவரங்கள்' : 'Doorstep Service Details'}
              </h4>

              {/* Pincode input with live check */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {language === 'ta' ? 'உங்கள் பின்கோட் (Pincode) *' : 'Your Area Pincode *'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    value={customerPincode}
                    onChange={e => setCustomerPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="e.g. 600001"
                    className={`w-full border rounded-xl px-3.5 py-2.5 text-slate-900 font-mono text-sm font-bold focus:outline-none pr-10 transition-colors ${
                      pincodeStatus === 'available' ? 'border-emerald-400 bg-emerald-50 focus:border-emerald-500' :
                      pincodeStatus === 'unavailable' ? 'border-red-300 bg-red-50 focus:border-red-400' :
                      'border-slate-300 bg-white focus:border-blue-400'
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {pincodeStatus === 'checking' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                    {pincodeStatus === 'available' && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                    {pincodeStatus === 'unavailable' && <XCircle className="w-4 h-4 text-red-500" />}
                  </div>
                </div>

                {/* Status message */}
                {pincodeStatus === 'available' && pincodeArea && (
                  <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-100 border border-emerald-300 text-xs">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-black text-emerald-800">✅ Doorstep service available!</span>
                      <span className="text-emerald-700 ml-1">— {pincodeArea}</span>
                    </div>
                  </div>
                )}
                {pincodeStatus === 'unavailable' && (
                  <div className="mt-2 flex items-start gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-xs">
                    <XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-black text-red-700">❌ Doorstep service not available in this pincode.</span>
                      <div className="text-red-600 mt-0.5">
                        {language === 'ta' 
                          ? 'தயவுசெய்து கடைக்கு நேரில் வருக அல்லது கீழே "கடைக்கு வருக" தேர்வை பயன்படுத்துங்கள்.'
                          : 'Please switch to "Visit Our Branch" or choose a different service type above.'}
                      </div>
                    </div>
                  </div>
                )}
                {customerPincode.length === 0 && (
                  <p className="text-[11px] text-blue-600 mt-1">Enter your 6-digit pincode to check if doorstep service is available in your area.</p>
                )}
              </div>

              {/* Full address — only show if pincode is available */}
              {pincodeStatus === 'available' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {language === 'ta' ? 'முழு வீட்டு முகவரி *' : 'Full Home / Office Address *'}
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={customerAddress}
                      onChange={e => setCustomerAddress(e.target.value)}
                      placeholder={language === 'ta' ? 'எ.கா. 14/3, ஆனந்த நகர், வடபழனி, சென்னை - 600026' : 'e.g. 14/3, Anand Nagar, Vadapalani, Chennai - 600026'}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs focus:border-blue-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {language === 'ta' ? 'விருப்பமான வருகை நேரம்' : 'Preferred Visit Slot'}
                    </label>
                    <select
                      value={preferredSlot}
                      onChange={e => setPreferredSlot(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 text-xs font-semibold focus:border-blue-400 focus:outline-none"
                    >
                      <option value="Morning (9AM - 12PM)">🌅 Morning (9AM – 12PM)</option>
                      <option value="Afternoon (12PM - 3PM)">☀️ Afternoon (12PM – 3PM)</option>
                      <option value="Evening (3PM - 6PM)">🌆 Evening (3PM – 6PM)</option>
                    </select>
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-100 border border-blue-200 text-[11px] text-blue-800">
                    <Star className="w-3.5 h-3.5 mt-0.5 shrink-0 text-blue-600" />
                    <span>{language === 'ta' ? 'எங்கள் ஊழியர் உங்கள் வீட்டிற்கு வருவதற்கு முன் மொபைல் மூலம் தொடர்பு கொள்வார்.' : 'Our certified agent will call you before visiting. Please keep Aadhaar + ornaments ready.'}</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Expected amount + date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{language === 'ta' ? 'தேவையான கடன் தொகை (₹)' : 'Expected Loan Amount (₹)'}</label>
              <input type="number" min="1000" max={maxEligibleLoan > 0 ? maxEligibleLoan : 5000000} value={expectedAmount || ''} onChange={e => setExpectedAmount(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-mono text-xs font-bold focus:border-amber-500 focus:outline-none" placeholder="e.g. 100000" />
              <span className="text-[10px] text-slate-500 mt-1 block">{language === 'ta' ? 'அரசு உச்ச வரம்பு ₹' : 'Capped at ₹'}{maxEligibleLoan.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {serviceType === 'DOORSTEP' ? (language === 'ta' ? 'விருப்பமான வருகை தேதி' : 'Preferred Doorstep Date') : (language === 'ta' ? 'கடைக்கு வர விரும்பும் நாள்' : 'Preferred Visit Date')}
              </label>
              <input type="date" value={preferredVisitDate} onChange={e => setPreferredVisitDate(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 text-xs font-medium focus:border-amber-500 focus:outline-none" />
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">{language === 'ta' ? 'நகை புகைப்படம் (விரும்பினால்)' : 'Ornament Photo (Optional)'}</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-300 border-dashed cursor-pointer text-xs font-bold text-slate-700 transition">
                <Camera className="w-4 h-4 text-amber-600" />
                <span>{language === 'ta' ? 'புகைப்படம் இணைக்க' : 'Choose Photo / Capture'}</span>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
              {photoPreview && (
                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-amber-300">
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">{language === 'ta' ? 'கூடுதல் குறிப்புகள்' : 'Additional Notes / Queries'}</label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder={language === 'ta' ? 'எ.கா. பழைய பில் உள்ளது, உடனடியாக ரொக்கம் தேவை...' : 'e.g. Have purchase invoice, urgent loan needed...'} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs focus:border-amber-500 focus:outline-none" />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!canSubmit()}
            className={`w-full py-4 px-6 rounded-2xl font-black text-xs tracking-wider uppercase shadow-md transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer ${
              canSubmit()
                ? serviceType === 'DOORSTEP'
                  ? 'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white shadow-blue-400/25'
                  : 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white shadow-amber-500/25'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {serviceType === 'DOORSTEP' ? <Truck className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            <span>
              {!canSubmit() && serviceType === 'DOORSTEP'
                ? (pincodeStatus === 'unavailable' ? 'Doorstep not available — switch to Counter Visit' : 'Enter valid pincode & address to continue')
                : serviceType === 'DOORSTEP'
                  ? (language === 'ta' ? 'வீட்டு மதிப்பீடு கோரிக்கை அனுப்பவும்' : '🏠 Book Doorstep Valuation')
                  : t.submitEnquiry
              }
            </span>
          </button>

        </form>
      )}
    </div>
  );
};
