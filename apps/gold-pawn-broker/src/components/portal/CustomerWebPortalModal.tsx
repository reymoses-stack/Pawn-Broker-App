import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatWeight, formatDate, getRelativeDays } from '../../utils/formatters';
import { 
  QrCode, X, Smartphone, ArrowRight, ShieldCheck, 
  ExternalLink, Printer, CheckCircle2, AlertTriangle, 
  Clock, Gem, User, Phone, MapPin, Receipt, Share2, Sparkles, Building2, Check
} from 'lucide-react';
import { Customer, Mortgage } from '../../types';
import { 
  generateQrDataUrl, 
  buildCustomerPortalUrl, 
  getPortalBaseUrl, 
  setPortalBaseUrl 
} from '../../utils/qrCodeService';
import { printElement } from '../../utils/printService';

interface CustomerWebPortalModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialCustomerId?: string;
}

export const CustomerWebPortalModal: React.FC<CustomerWebPortalModalProps> = ({
  isOpen,
  onClose,
  initialCustomerId
}) => {
  const { 
    customers, 
    mortgages, 
    payments, 
    currentBranch, 
    settings, 
    setSelectedMortgage, 
    language,
    isCustomerPortalOpen,
    setIsCustomerPortalOpen,
    portalCustomerId
  } = useApp();
  
  const effectiveIsOpen = isOpen !== undefined ? isOpen : isCustomerPortalOpen;
  const effectiveClose = onClose || (() => setIsCustomerPortalOpen(false));

  // Selected customer for portal preview
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialCustomerId || portalCustomerId || customers[0]?.id || ''
  );
  
  // Tab within portal: 'passbook' | 'standee'
  const [portalViewMode, setPortalViewMode] = useState<'passbook' | 'standee'>('passbook');
  const [portalLang, setPortalLang] = useState<'en' | 'ta'>(language);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [standeeQrDataUrl, setStandeeQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [configuredHost, setConfiguredHost] = useState<string>(getPortalBaseUrl());

  const currentCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];
  const customerMortgages = mortgages.filter(m => m.customerId === currentCustomer?.id);
  const activeMortgages = customerMortgages.filter(m => m.status === 'Active' || m.status === 'Due' || m.status === 'Overdue');
  const closedMortgages = customerMortgages.filter(m => m.status === 'Closed');

  const customerPayments = payments.filter(p => p.customerId === currentCustomer?.id && p.status === 'Completed');
  const totalPrincipalBorrowed = customerMortgages.reduce((sum, m) => sum + m.principalAmount, 0);
  const totalCurrentOutstanding = activeMortgages.reduce((sum, m) => sum + m.outstandingPrincipal, 0);
  const totalInterestPaid = customerPayments.reduce((sum, p) => sum + p.allocatedInterest, 0);

  // Generate real portal URL with origin/host
  const portalUrl = buildCustomerPortalUrl(currentCustomer?.id, currentBranch.code);
  const standeeUrl = buildCustomerPortalUrl('', currentBranch.code);

  useEffect(() => {
    let active = true;
    generateQrDataUrl(portalUrl, { width: 280, margin: 1 }).then(url => {
      if (active) setQrDataUrl(url);
    });
    generateQrDataUrl(standeeUrl, { width: 450, margin: 2 }).then(url => {
      if (active) setStandeeQrDataUrl(url);
    });
    return () => { active = false; };
  }, [portalUrl, standeeUrl, configuredHost]);

  const handleCopyUrl = (urlToCopy: string) => {
    navigator.clipboard?.writeText(urlToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveHost = (newHost: string) => {
    setConfiguredHost(newHost);
    setPortalBaseUrl(newHost);
  };

  if (!effectiveIsOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="liquid-glass-modal border border-amber-200/90 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[96vh] bg-white/95">
        
        {/* Top Control Bar */}
        <div className="no-print p-3 sm:p-4 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-white border-b border-amber-200/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {portalLang === 'ta' ? 'வாடிக்கையாளர் டிஜிட்டல் பாஸ்புக் போர்டல்' : 'Customer Self-Service Web Portal'}
                </h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold px-2 py-0.5 rounded-full">
                  No App Store Required • 100% Web/PWA
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {portalLang === 'ta' 
                  ? 'வாடிக்கையாளர்கள் தங்கள் அடமானக் கணக்கு, அசல் & வட்டி பாக்கியை மொபைல் QR மூலம் அறியலாம்' 
                  : 'Customers scan shop QR code on their phone to track live loans, interest, and past payments'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setPortalViewMode('passbook')}
                className={`px-3 py-1 rounded-lg transition ${
                  portalViewMode === 'passbook'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📱 {portalLang === 'ta' ? 'மொபைல் காட்சி' : 'Mobile Preview'}
              </button>
              <button
                type="button"
                onClick={() => setPortalViewMode('standee')}
                className={`px-3 py-1 rounded-lg transition ${
                  portalViewMode === 'standee'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🏷️ {portalLang === 'ta' ? 'கவுண்டர் QR பலகை' : 'Shop Counter QR Standee'}
              </button>
            </div>

            {/* Open in New Tab & Copy Link */}
            <button
              type="button"
              onClick={() => window.open(portalUrl, '_blank')}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 shadow-xs transition"
              title="Open full customer passbook web app in new browser tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open Passbook</span>
            </button>

            <button
              type="button"
              onClick={() => handleCopyUrl(portalUrl)}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1 border border-slate-200 transition"
              title="Copy customer passbook URL to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
            </button>

            {/* Language toggle for customer portal */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setPortalLang('en')}
                className={`px-2 py-1 rounded-lg ${portalLang === 'en' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setPortalLang('ta')}
                className={`px-2 py-1 rounded-lg ${portalLang === 'ta' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
              >
                தமிழ்
              </button>
            </div>

            <button 
              onClick={effectiveClose} 
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Customer Selector Ribbon (For Broker to test different customer accounts) */}
        <div className="no-print px-4 py-2 bg-amber-50/50 border-b border-amber-200/60 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">
              {portalLang === 'ta' ? 'மாதிரி வாடிக்கையாளர்:' : 'Previewing Customer:'}
            </span>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="bg-white border border-amber-300 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.mobile} ({mortgages.filter(m => m.customerId === c.id && m.status === 'Active').length} Active Loans)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
              {portalUrl}
            </span>
            <button
              type="button"
              onClick={() => {
                if (portalViewMode === 'standee') {
                  printElement('printable-standee-card', { format: 'A4', title: `${settings.companyName} Counter Standee` });
                } else {
                  printElement('printable-passbook-preview', { format: 'A4', title: `${currentCustomer?.name || 'Customer'} Passbook QR` });
                }
              }}
              className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-950 font-bold rounded-lg border border-amber-300 transition flex items-center gap-1 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{portalLang === 'ta' ? 'அச்சிடு' : 'Print QR'}</span>
            </button>
          </div>
        </div>

        {/* Modal Main Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#fbf9f5]">
          
          {/* VIEW MODE 1: CUSTOMER MOBILE WEB PASSBOOK PREVIEW */}
          {portalViewMode === 'passbook' && (
            <div id="printable-passbook-preview" className="printable-area max-w-md mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col">
              
              {/* Mobile Phone Mockup Top Notch & Header */}
              <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 p-4 text-slate-950 relative">
                <div className="flex items-center justify-between text-[11px] font-bold text-amber-950/80 mb-2">
                  <span>9:41 AM</span>
                  <div className="flex items-center gap-1.5">
                    <span>5G ●</span>
                    <span>100%</span>
                  </div>
                </div>

                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-950/80">
                      {portalLang === 'ta' ? 'அடமான டிஜிட்டல் பாஸ்புக்' : 'Digital Gold Passbook'}
                    </span>
                    <h2 className="text-base font-black leading-tight text-slate-950">
                      {settings.companyName}
                    </h2>
                    <p className="text-[11px] text-amber-950/90 font-medium">
                      {currentBranch.name} • {currentBranch.phone}
                    </p>
                  </div>
                  <div className="p-2 bg-white/90 rounded-2xl border border-white shadow-xs">
                    <Building2 className="w-6 h-6 text-amber-800" />
                  </div>
                </div>

                {/* Customer Identity Badge */}
                <div className="mt-3.5 p-2.5 rounded-2xl bg-white/95 backdrop-blur-md border border-white text-slate-800 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-900 border border-amber-300 flex items-center justify-center font-bold text-xs">
                      {currentCustomer?.name?.charAt(0)}
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-slate-900">
                        {currentCustomer?.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        +91 {currentCustomer?.mobile}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full border border-emerald-200">
                      ✓ {portalLang === 'ta' ? 'சரிபார்க்கப்பட்டது' : 'KYC Verified'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Body: Loan Portfolio Summary */}
              <div className="p-4 space-y-4">
                
                {/* Balance Summary Card */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-slate-800">
                    <div className="text-[10px] uppercase font-bold text-amber-900">
                      {portalLang === 'ta' ? 'நடப்பு அசல் பாக்கி' : 'Principal Due (Asal)'}
                    </div>
                    <div className="text-lg font-black font-mono text-slate-900 mt-0.5">
                      {formatCurrency(totalCurrentOutstanding)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {activeMortgages.length} {portalLang === 'ta' ? 'அடமானங்கள்' : 'Active Loans'}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-slate-800">
                    <div className="text-[10px] uppercase font-bold text-emerald-900">
                      {portalLang === 'ta' ? 'செலுத்திய வட்டி' : 'Total Vaddi Paid'}
                    </div>
                    <div className="text-lg font-black font-mono text-emerald-900 mt-0.5">
                      {formatCurrency(totalInterestPaid)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {customerPayments.length} {portalLang === 'ta' ? 'ரசீதுகள்' : 'Receipts'}
                    </div>
                  </div>
                </div>

                {/* Counter Check-In QR Box */}
                <div className="p-3.5 rounded-2xl bg-slate-900 text-white flex items-center justify-between gap-3 shadow-md">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>{portalLang === 'ta' ? 'கவுண்டர் விரைவு QR' : 'Counter Check-In QR'}</span>
                    </span>
                    <h4 className="font-extrabold text-xs text-white mt-0.5">
                      {portalLang === 'ta' ? 'கடை கவுண்டரில் காட்டவும்' : 'Show to Cashier at Counter'}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {portalLang === 'ta' ? '1 வினாடியில் கணக்கு திறக்கப்படும்' : 'Instant 1-sec account lookup'}
                    </p>
                  </div>
                  
                  {/* Scannable Real QR Code */}
                  <div 
                    onClick={() => window.open(portalUrl, '_blank')}
                    title="Click to open customer passbook in new tab"
                    className="bg-white p-1 rounded-xl shrink-0 shadow-inner cursor-pointer hover:ring-2 hover:ring-amber-400 transition flex items-center justify-center"
                  >
                    {qrDataUrl ? (
                      <img 
                        src={qrDataUrl} 
                        alt="Customer Passbook QR" 
                        className="w-16 h-16 object-contain"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-slate-100 flex items-center justify-center font-mono text-[9px] text-slate-500">
                        Loading QR...
                      </div>
                    )}
                  </div>
                </div>

                {/* Active Pledges Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                      <Gem className="w-3.5 h-3.5 text-amber-600" />
                      <span>{portalLang === 'ta' ? 'அடமான நகைகள் & நிலுவை' : 'Active Gold Pledges'}</span>
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono font-bold">
                      {activeMortgages.length} {portalLang === 'ta' ? 'பட்டியல்' : 'Pledges'}
                    </span>
                  </div>

                  {activeMortgages.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                      {portalLang === 'ta' ? 'நடப்பு அடமானம் ஏதுமில்லை' : 'No active gold pledges'}
                    </div>
                  ) : (
                    activeMortgages.map((m) => {
                      const rel = getRelativeDays(m.maturityDate);
                      return (
                        <div 
                          key={m.id} 
                          className={`p-3 rounded-2xl border transition ${
                            m.status === 'Overdue' 
                              ? 'bg-rose-50/60 border-rose-200' 
                              : m.status === 'Due' 
                                ? 'bg-amber-50/60 border-amber-200' 
                                : 'bg-white border-slate-200 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-black text-amber-900 text-xs">
                                  {m.mortgageNumber}
                                </span>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                                  m.status === 'Overdue' ? 'bg-rose-100 text-rose-800' :
                                  m.status === 'Due' ? 'bg-amber-100 text-amber-800' :
                                  'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {m.status === 'Overdue' ? (portalLang === 'ta' ? 'காலாவதி' : 'Overdue') : 
                                   m.status === 'Due' ? (portalLang === 'ta' ? 'இன்று தவணை' : 'Due Today') : 
                                   (portalLang === 'ta' ? 'நடைமுறையில்' : 'Active')}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                                {m.items?.map(i => i.itemType).join(', ') || 'Gold Jewelry'}
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-xs font-black font-mono text-slate-900">
                                {formatCurrency(m.outstandingPrincipal)}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {formatWeight(m.items?.reduce((s, i) => s + i.netWeight, 0) || 0)} Net
                              </div>
                            </div>
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10.5px]">
                            <div className="text-slate-500">
                              <span>{portalLang === 'ta' ? 'தவணை நாள்: ' : 'Due: '}</span>
                              <strong className={rel.isPast ? 'text-rose-700' : 'text-slate-700'}>
                                {m.maturityDate}
                              </strong>
                              {rel.isPast && (
                                <span className="text-rose-700 font-bold ml-1">
                                  ({rel.days}d {portalLang === 'ta' ? 'தாமதம்' : 'late'})
                                </span>
                              )}
                            </div>

                            <div className="text-amber-950 font-bold">
                              <span>{portalLang === 'ta' ? 'வட்டி: ' : 'Vaddi: '}</span>
                              <span>{m.interestRate}% / mo</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer Help & Shop Address */}
                <div className="p-3 rounded-2xl bg-amber-50/40 border border-amber-200/60 text-center text-[10px] text-slate-500 space-y-1">
                  <div className="font-bold text-slate-800">
                    {settings.companyName} • {currentBranch.address}
                  </div>
                  <div>
                    {portalLang === 'ta' 
                      ? 'தொடர்புக்கு: ' 
                      : 'Counter Helpdesk: '}
                    <strong className="text-amber-900">{currentBranch.phone}</strong>
                  </div>
                  <div className="text-[9px] text-slate-400">
                    Secured by Sovereign Pawn Broker OS • SSL 256-Bit Protection
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* VIEW MODE 2: PRINTABLE SHOP COUNTER STANDEE QR CODE */}
          {portalViewMode === 'standee' && (
            <div id="printable-standee-card" className="printable-area max-w-xl mx-auto bg-white p-8 rounded-3xl border-2 border-amber-300 shadow-xl text-center space-y-6">
              
              <div className="space-y-1.5">
                <span className="text-xs uppercase font-extrabold tracking-widest text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
                  {portalLang === 'ta' ? 'கவுண்டர் வாடிக்கையாளர் QR பலகை' : 'Official Counter QR Standee'}
                </span>
                <h2 className="text-2xl font-black text-slate-900 pt-1">
                  {settings.companyName}
                </h2>
                <p className="text-xs text-slate-600 font-medium max-w-md mx-auto">
                  {portalLang === 'ta'
                    ? 'வாடிக்கையாளர்கள் தங்கள் மொபைல் கேமரா மூலம் இந்த QR குறியீட்டை ஸ்கேன் செய்து தங்கள் அடமானக் கணக்கு & வட்டி பாக்கியை உடனடியாக பார்க்கலாம்'
                    : 'Place this standee on your counter. Customers can scan with any smartphone camera to check their gold loan balance & digital passbook'}
                </p>
              </div>

              {/* Large Printable Counter QR Code Frame */}
              <div className="inline-block p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-white border-2 border-amber-400 shadow-lg">
                <div 
                  onClick={() => window.open(standeeUrl, '_blank')}
                  title="Click to test / open customer portal in new tab"
                  className="bg-white p-4 rounded-2xl border border-amber-200 shadow-inner inline-block cursor-pointer hover:ring-4 hover:ring-amber-400 transition"
                >
                  {standeeQrDataUrl ? (
                    <img 
                      src={standeeQrDataUrl} 
                      alt="Counter Standee QR Code" 
                      className="w-52 h-52 object-contain"
                    />
                  ) : (
                    <div className="w-52 h-52 bg-slate-100 flex items-center justify-center font-mono text-xs text-slate-500">
                      Generating High-Res QR...
                    </div>
                  )}
                </div>
                <div className="mt-3 font-mono font-extrabold text-xs text-amber-950 flex flex-col items-center gap-2">
                  <span>SCAN WITH ANY CAMERA / GOOGLE LENS</span>
                  
                  {/* Test & Copy Buttons for Counter Staff / Testers */}
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => window.open(standeeUrl, '_blank')}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{portalLang === 'ta' ? 'புதிய தாவலில் திற' : 'Test Open in Browser'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(standeeUrl)}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 flex items-center gap-1.5 transition"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied Link!' : 'Copy Portal URL'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Instructions for Customer */}
              <div className="grid grid-cols-3 gap-3 text-left pt-2 border-t border-slate-200">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="font-extrabold text-slate-800">1. {portalLang === 'ta' ? 'ஸ்கேன் செய்க' : 'Scan QR'}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {portalLang === 'ta' ? 'மொபைல் கேமரா மூலம் ஸ்கேன் செய்க' : 'Use phone camera or Google Pay/Lens'}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="font-extrabold text-slate-800">2. {portalLang === 'ta' ? 'பாஸ்புக் காண்க' : 'View Loans'}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {portalLang === 'ta' ? 'அசல் & வட்டி விவரம் தெரியும்' : 'Instant live Asal, Vaddi & due dates'}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="font-extrabold text-slate-800">3. {portalLang === 'ta' ? 'கவுண்டர் சேவை' : 'Fast Counter'}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {portalLang === 'ta' ? '1 வினாடியில் ரசீது வசூல்' : 'Show check-in QR to cashier for quick receipt'}
                  </div>
                </div>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => printElement('printable-standee-card', { format: 'A4', title: `${settings.companyName} Counter Standee` })}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow-md transition inline-flex items-center gap-2 text-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>{portalLang === 'ta' ? 'கவுண்டர் பலகையை அச்சிடு (Print Standee)' : 'Print Counter Standee'}</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
