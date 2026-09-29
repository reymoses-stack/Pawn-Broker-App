import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PawnEnquiry } from '../../types';
import { 
  FileText, 
  MessageCircle, 
  Phone, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Search, 
  ArrowRight, 
  Gem, 
  Scale, 
  ExternalLink,
  RefreshCw,
  Eye,
  X,
  Truck,
  MapPin
} from 'lucide-react';
import { formatCurrency, formatWeight } from '../../utils/formatters';

export const EnquiryListView: React.FC = () => {
  const { 
    enquiries, 
    updateEnquiryStatus, 
    convertEnquiryToMortgage, 
    language,
    currentBranch 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUBMITTED' | 'REVIEWED' | 'CONVERTED'>('ALL');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const filteredEnquiries = enquiries.filter(enq => {
    const matchesSearch = 
      enq.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enq.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enq.customerMobile.includes(searchQuery) ||
      enq.itemType.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = 
      statusFilter === 'ALL' || 
      (statusFilter === 'SUBMITTED' && enq.status === 'SUBMITTED') ||
      (statusFilter === 'REVIEWED' && (enq.status === 'REVIEWED' || enq.status === 'APPOINTMENT_BOOKED')) ||
      (statusFilter === 'CONVERTED' && enq.status === 'CONVERTED');

    return matchesSearch && matchesStatus;
  });

  const pendingCount = enquiries.filter(e => e.status === 'SUBMITTED').length;
  const totalWeight = enquiries.reduce((sum, e) => sum + (Number(e.approxWeight) || 0), 0);
  const totalExpectedLoan = enquiries.reduce((sum, e) => sum + (Number(e.expectedAmount) || 0), 0);

  const handleWhatsApp = (enq: PawnEnquiry) => {
    const text = encodeURIComponent(
      `Hello ${enq.customerName},\nWe received your Gold Loan Enquiry (${enq.id}) on ${currentBranch.name}.\n• Ornament: ${enq.itemType} (${enq.purity})\n• Approx Wt: ${enq.approxWeight}g\n• Sanctionable Loan: ₹${enq.maxEligibleLoan.toLocaleString('en-IN')}\n\nYou are welcome to visit our branch at ${currentBranch.address}. Our appraiser is ready to test and disburse your loan in 5 minutes.`
    );
    const cleanPhone = enq.customerMobile.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Stats */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 rounded-3xl p-5 sm:p-7 text-slate-950 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/15 backdrop-blur-md text-slate-950 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>Customer APK & Web Passbook Sync Active</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">
              {language === 'ta' ? 'வாடிக்கையாளர் அடமான விசாரிப்புகள்' : 'Customer Pawn Enquiries'}
            </h1>
            <p className="text-xs sm:text-sm text-amber-950 font-medium mt-1">
              {language === 'ta'
                ? 'புதிய வாடிக்கையாளர்கள் தங்களது நகைகளுக்கான உடனடி கடன் மதிப்பீடு கேட்டு அனுப்பிய விண்ணப்பங்கள்'
                : 'Incoming loan enquiries submitted by new & existing borrowers via Customer Portal'}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap gap-2 shrink-0">
            <div className="bg-slate-950/15 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20 text-center">
              <div className="text-[10px] text-amber-950 font-bold uppercase">Pending Enquiries</div>
              <div className="text-lg font-black text-slate-950 font-mono">{pendingCount} New</div>
            </div>
            <div className="bg-slate-950/15 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20 text-center">
              <div className="text-[10px] text-amber-950 font-bold uppercase">Total Gold</div>
              <div className="text-lg font-black text-slate-950 font-mono">{totalWeight.toFixed(1)}g</div>
            </div>
            <div className="bg-slate-950/15 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20 text-center">
              <div className="text-[10px] text-amber-950 font-bold uppercase">Expected Loans</div>
              <div className="text-lg font-black text-slate-950 font-mono">{formatCurrency(totalExpectedLoan)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-amber-200/80 shadow-2xs">
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={language === 'ta' ? 'பெயர், எண் அல்லது ரசீது எண்...' : 'Search by name, phone, item, ID...'}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:border-amber-500 focus:outline-none"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'SUBMITTED', 'REVIEWED', 'CONVERTED'] as const).map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? 'bg-amber-500 text-slate-950 font-black shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' && (language === 'ta' ? 'அனைத்தும்' : 'All Enquiries')}
              {st === 'SUBMITTED' && (language === 'ta' ? 'புதியவை' : 'New / Unreviewed')}
              {st === 'REVIEWED' && (language === 'ta' ? 'விசாரிக்கப்பட்டது' : 'In Review / Follow-up')}
              {st === 'CONVERTED' && (language === 'ta' ? 'அடகு வைக்கப்பட்டது' : 'Converted to Loan')}
            </button>
          ))}
        </div>

      </div>

      {/* Enquiries Cards List */}
      {filteredEnquiries.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-amber-200 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="font-extrabold text-sm text-slate-800">
            {language === 'ta' ? 'விசாரிப்புகள் எதுவும் காணப்படவில்லை' : 'No Enquiries Found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {language === 'ta'
              ? 'வாடிக்கையாளர் போர்ட்டல் மூலம் புதிய அடமான விண்ணப்பங்கள் வரும்போது இங்கே உடனடியாக தோன்றும்.'
              : 'When customers enquire via the Customer Passbook APK or Web Portal, their requests will appear here in real time.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEnquiries.map(enq => {
            const isNew = enq.status === 'SUBMITTED';
            const isConverted = enq.status === 'CONVERTED';

            return (
              <div 
                key={enq.id}
                className={`bg-white rounded-3xl p-5 border transition-all duration-200 flex flex-col justify-between space-y-4 shadow-sm ${
                  isNew 
                    ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-amber-500/5' 
                    : isConverted
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : 'border-slate-200'
                }`}
              >
                {/* Header Row: ID, Timestamp & Status */}
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-slate-900">{enq.id}</span>
                      {isNew && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[10px] border border-amber-300 animate-pulse">
                          ● NEW
                        </span>
                      )}
                      {isConverted && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] border border-emerald-300">
                          ✓ LOAN SANCTIONED
                        </span>
                      )}
                      {enq.serviceType === 'DOORSTEP' && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-extrabold text-[10px] border border-blue-300 flex items-center gap-1">
                          <Truck className="w-2.5 h-2.5" /> DOORSTEP
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {enq.createdAt}
                    </div>
                  </div>

                  {/* Customer Info Box */}
                  <div className="mt-3 flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">
                        {enq.customerName}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-slate-600 mt-0.5 font-mono">
                        <a 
                          href={`tel:${enq.customerMobile}`} 
                          className="hover:text-amber-700 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <Phone className="w-3 h-3 text-amber-600" />
                          <span>+91 {enq.customerMobile}</span>
                        </a>
                      </div>
                    </div>

                    {/* Quick WhatsApp Button */}
                    <button
                      type="button"
                      onClick={() => handleWhatsApp(enq)}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                      title="Chat on WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </button>
                  </div>

                  {/* Ornament Particulars Grid */}
                  <div className="mt-3 bg-amber-50/60 rounded-2xl p-3 border border-amber-200/70 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Ornament:</span>
                      <strong className="text-slate-900 truncate block">{enq.itemType}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Weight & Purity:</span>
                      <strong className="text-amber-950 font-mono block">
                        {formatWeight(enq.approxWeight)} • {enq.purity}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Expected Loan:</span>
                      <strong className="text-emerald-700 font-mono block">
                        {formatCurrency(enq.expectedAmount)}
                      </strong>
                    </div>
                  </div>

                  {/* Additional Valuation & Date Row */}
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 px-1">
                    <div>
                      Est. Market Value: <strong className="text-slate-800 font-mono">{formatCurrency(enq.estimatedMarketValue)}</strong> (75% Max: <strong className="text-emerald-800 font-mono">{formatCurrency(enq.maxEligibleLoan)}</strong>)
                    </div>
                    {enq.preferredVisitDate && (
                      <div className="flex items-center gap-1 font-medium text-amber-900">
                        <Calendar className="w-3 h-3" />
                        <span>Visit: {enq.preferredVisitDate}</span>
                      </div>
                    )}
                  </div>

                  {/* Doorstep address panel */}
                  {enq.serviceType === 'DOORSTEP' && enq.customerAddress && (
                    <div className="mt-2 p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 text-blue-600 shrink-0" />
                      <div>
                        <div className="font-black text-blue-800 text-[10px] uppercase tracking-wide mb-0.5">🏠 Doorstep Address</div>
                        <div>{enq.customerAddress}</div>
                        {enq.customerPincode && <div className="font-mono font-bold">PIN: {enq.customerPincode}</div>}
                        {enq.preferredSlot && <div className="text-blue-700">Slot: {enq.preferredSlot}</div>}
                      </div>
                    </div>
                  )}

                  {/* Notes / Customer query */}
                  {enq.notes && (
                    <div className="mt-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-700 italic">
                      "{enq.notes}"
                    </div>
                  )}

                  {/* Photo Preview if attached */}
                  {enq.photoUrl && (
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPhoto(enq.photoUrl || null)}
                        className="text-[11px] text-amber-800 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Ornament Photo</span>
                      </button>
                    </div>
                  )}

                </div>

                {/* Bottom Actions Row */}
                <div className="border-t border-slate-100 pt-3 flex flex-col sm:flex-row items-center justify-between gap-2">
                  
                  {/* Status Dropdown */}
                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Status:</span>
                    <select
                      value={enq.status}
                      onChange={e => updateEnquiryStatus(enq.id, e.target.value as any)}
                      className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-800 focus:outline-none cursor-pointer"
                    >
                      <option value="SUBMITTED">Submitted (New)</option>
                      <option value="REVIEWED">Reviewed / In Touch</option>
                      <option value="APPOINTMENT_BOOKED">Appointment Booked</option>
                      <option value="CONVERTED">Converted to Loan</option>
                      <option value="CLOSED">Closed / Discarded</option>
                    </select>
                  </div>

                  {/* Big Primary Action: Convert to Pawn / Sanction Loan */}
                  {!isConverted && (
                    <button
                      type="button"
                      onClick={() => convertEnquiryToMortgage(enq)}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-xs transition active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Gem className="w-3.5 h-3.5" />
                      <span>{language === 'ta' ? 'அடமானக் கடன் உருவாக்கு' : 'Convert to Pawn Ticket'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Photo Preview Modal */}
      {selectedPhoto && (
        <div 
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-lg w-full bg-white rounded-3xl p-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-extrabold text-xs text-slate-900">Ornament Attachment</span>
              <button onClick={() => setSelectedPhoto(null)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>
            <img src={selectedPhoto} alt="Ornament Preview" className="w-full max-h-[70vh] object-contain rounded-2xl mt-3" />
          </div>
        </div>
      )}

    </div>
  );
};
