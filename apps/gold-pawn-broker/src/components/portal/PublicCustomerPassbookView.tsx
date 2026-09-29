import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatWeight, formatDate } from '../../utils/formatters';
import { 
  Building2, Phone, ShieldCheck, CheckCircle2, AlertTriangle, 
  Calendar, Clock, Gem, ArrowRight, Lock, ExternalLink, HelpCircle, 
  Sparkles, RefreshCw, MessageSquare 
} from 'lucide-react';

export const PublicCustomerPassbookView: React.FC = () => {
  const { customers, mortgages, payments, settings, currentBranch, branches } = useApp();

  const [customerId, setCustomerId] = useState<string>('');
  const [mortgageId, setMortgageId] = useState<string>('');
  const [lang, setLang] = useState<'en' | 'ta'>('en');

  useEffect(() => {
    // Parse query params from search or hash
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#\/?portal\??/, ''));

    const c = searchParams.get('c') || hashParams.get('c') || '';
    const m = searchParams.get('m') || hashParams.get('m') || '';
    setCustomerId(c);
    setMortgageId(m);

    if (m && !c) {
      const mort = mortgages.find(item => item.mortgageNumber.toUpperCase() === m.toUpperCase() || item.id.toUpperCase() === m.toUpperCase());
      if (mort) {
        setCustomerId(mort.customerId);
      }
    }
  }, [mortgages]);

  const [searchInput, setSearchInput] = useState('');

  // Find customer matching ID, mobile search, or fallback
  const customer = customers.find(c => c.id === customerId) || 
    (customerId ? customers.find(c => c.mobile.replace(/\D/g, '').includes(customerId.replace(/\D/g, ''))) : null) ||
    (searchInput ? customers.find(c => c.mobile.includes(searchInput) || c.name.toLowerCase().includes(searchInput.toLowerCase()) || c.id === searchInput) : null) ||
    customers[0];

  const customerMortgages = mortgages.filter(m => m.customerId === customer?.id);
  const activeMortgages = customerMortgages.filter(m => m.status === 'Active' || m.status === 'Due' || m.status === 'Overdue');
  const closedMortgages = customerMortgages.filter(m => m.status === 'Closed');

  const customerPayments = payments.filter(p => p.customerId === customer?.id && p.status === 'Completed');
  const totalCurrentOutstanding = activeMortgages.reduce((sum, m) => sum + m.outstandingPrincipal, 0);
  const totalPrincipalBorrowed = customerMortgages.reduce((sum, m) => sum + m.principalAmount, 0);
  const totalInterestPaid = customerPayments.reduce((sum, p) => sum + p.allocatedInterest, 0);

  const branch = branches.find(b => b.id === customer?.branchId) || currentBranch;

  const handleExitPortal = () => {
    window.location.href = window.location.origin + window.location.pathname;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf8f5] via-[#f7f3eb] to-[#f4eee1] text-slate-900 font-sans pb-12">
      
      {/* Top Floating App Banner */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-amber-200/80 px-4 py-2.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-black shadow-xs">
            <Gem className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-extrabold text-xs text-slate-900 tracking-tight leading-tight">
              {settings.companyName || 'Sovereign Pawn Broker'}
            </h1>
            <p className="text-[10px] text-slate-500">
              {lang === 'ta' ? 'வாடிக்கையாளர் டிஜிட்டல் பாஸ்புக்' : 'Digital Gold Passbook'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Switch */}
          <button
            type="button"
            onClick={() => setLang(l => l === 'en' ? 'ta' : 'en')}
            className="px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-bold"
          >
            {lang === 'en' ? 'தமிழ்' : 'English'}
          </button>

          {/* Return / Staff login */}
          <button
            type="button"
            onClick={handleExitPortal}
            className="text-[10px] text-slate-500 hover:text-amber-800 underline font-medium"
          >
            {lang === 'ta' ? 'அலுவலக உள்நுழைவு' : 'Staff Login'}
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        
        {/* Quick Customer Mobile Lookup */}
        <div className="bg-white/90 backdrop-blur-md p-2 rounded-2xl border border-amber-200/80 shadow-2xs flex items-center gap-2">
          <input
            type="text"
            placeholder={lang === 'ta' ? 'பதிவு செய்த மொபைல் எண் அல்லது அடமான எண்...' : 'Lookup by 10-digit mobile or mortgage ID...'}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800 font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Customer Header Card */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 p-5 rounded-3xl text-slate-950 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-950/80 mb-3">
            <span className="uppercase tracking-wider">
              {lang === 'ta' ? 'டிஜிட்டல் தங்க பாஸ்புக்' : 'Verified Gold Passbook'}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/30 backdrop-blur-md text-slate-950 font-mono text-[10px]">
              ID: {customer?.id || 'CUS-001'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/95 text-amber-800 flex items-center justify-center font-black text-xl shadow-md">
              {customer?.name?.charAt(0) || 'C'}
            </div>
            <div>
              <h2 className="text-lg font-black leading-tight text-slate-950">
                {customer?.name || 'Valued Customer'}
              </h2>
              <p className="text-xs text-amber-950/90 font-mono">
                +91 {customer?.mobile || '9876543210'}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-amber-700/20 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 font-bold text-amber-950">
              <ShieldCheck className="w-4 h-4 text-emerald-950" />
              <span>{lang === 'ta' ? 'KYC சரிபார்க்கப்பட்டது' : 'KYC Verified Customer'}</span>
            </span>
            <span className="text-[11px] text-amber-950/80 font-medium">
              {branch.name}
            </span>
          </div>
        </div>

        {/* Portfolio Summary Tiles */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3.5 rounded-2xl bg-white border border-amber-200/80 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              {lang === 'ta' ? 'நடப்பு அசல் பாக்கி' : 'Principal Due (Asal)'}
            </span>
            <span className="text-xl font-black font-mono text-slate-900 block mt-0.5">
              {formatCurrency(totalCurrentOutstanding)}
            </span>
            <span className="text-[10px] text-amber-800 font-bold block mt-1">
              {activeMortgages.length} {lang === 'ta' ? 'அடமானங்கள்' : 'Active Loans'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-amber-200/80 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              {lang === 'ta' ? 'செலுத்திய வட்டி' : 'Total Interest Paid'}
            </span>
            <span className="text-xl font-black font-mono text-emerald-700 block mt-0.5">
              {formatCurrency(totalInterestPaid)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">
              {customerPayments.length} {lang === 'ta' ? 'ரசீதுகள்' : 'Vouchers Settled'}
            </span>
          </div>
        </div>

        {/* Active Mortgages / Loans Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Gem className="w-3.5 h-3.5 text-amber-600" />
              <span>{lang === 'ta' ? 'அடமானக் கணக்குகள்' : 'Active Gold Pledges'}</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">
              {activeMortgages.length} {lang === 'ta' ? 'கணக்கு' : 'Accounts'}
            </span>
          </div>

          {activeMortgages.length === 0 ? (
            <div className="p-6 bg-white rounded-3xl border border-slate-200 text-center text-xs text-slate-500">
              {lang === 'ta' 
                ? 'தற்போது தீவிர அடமானங்கள் ஏதும் இல்லை. அனைத்து கடன்களும் மீட்கப்பட்டுவிட்டன.' 
                : 'No active loans outstanding. All previous pledges redeemed.'}
            </div>
          ) : (
            activeMortgages.map(m => {
              const totalNetWeight = m.items?.reduce((s, i) => s + i.netWeight, 0) || 0;
              const isTarget = mortgageId && m.mortgageNumber === mortgageId;

              return (
                <div 
                  key={m.id}
                  className={`bg-white rounded-3xl border p-4 shadow-xs space-y-3 ${
                    isTarget ? 'border-amber-500 ring-2 ring-amber-400/40' : 'border-amber-200/80'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-slate-900 text-sm">
                          {m.mortgageNumber}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          m.status === 'Overdue' ? 'bg-rose-100 text-rose-800' :
                          m.status === 'Due' ? 'bg-amber-100 text-amber-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {m.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {lang === 'ta' ? 'அடமானம் வைத்த நாள்: ' : 'Pledged on: '}{m.mortgageDate}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-black font-mono text-slate-900">
                        {formatCurrency(m.outstandingPrincipal)}
                      </div>
                      <div className="text-[10px] text-amber-800 font-bold">
                        {m.interestRate}% {lang === 'ta' ? 'மாத வட்டி' : '/ month'}
                      </div>
                    </div>
                  </div>

                  {/* Pledged Ornaments List */}
                  <div className="p-2.5 rounded-2xl bg-amber-50/50 border border-amber-200/60 space-y-1.5 text-xs">
                    <span className="text-[10px] font-extrabold uppercase text-amber-900 flex items-center justify-between">
                      <span>{lang === 'ta' ? 'அடமான நகைகள்:' : 'Pledged Ornaments:'}</span>
                      <span className="font-mono text-slate-700">{formatWeight(totalNetWeight)} Net</span>
                    </span>
                    <div className="space-y-1">
                      {m.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px] text-slate-700">
                          <span className="font-medium">• {item.itemType} ({item.purity})</span>
                          <span className="font-mono text-slate-500">{formatWeight(item.netWeight)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Due Date & Branch Contact */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">
                      {lang === 'ta' ? 'தவணை நாள்: ' : 'Due Date: '}
                      <strong className="text-slate-800">{m.maturityDate}</strong>
                    </span>

                    <span className="text-amber-800 font-bold text-[10px]">
                      Vault ID: {m.packetId}
                    </span>
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* Shop Counter Contact & Helpdesk */}
        <div className="p-5 rounded-3xl bg-white border border-amber-200 text-center space-y-3 shadow-xs">
          <div>
            <h4 className="font-black text-sm text-slate-900">
              {settings.companyName}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {branch.address}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 pt-1">
            <a
              href={`tel:${branch.phone}`}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{lang === 'ta' ? 'அழைக்க' : 'Call Shop'}</span>
            </a>

            <a
              href={`https://wa.me/91${branch.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(settings.companyName)}%2C%20inquiring%20about%20my%20gold%20loan%20ID%20${customer?.id}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>

          <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-100">
            {lang === 'ta' 
              ? 'பாதுகாக்கப்பட்ட இறையாண்மை அடமான முறைமை • 256-பிட் SSL குறியாக்கம்' 
              : 'Secured Sovereign Pawn Broker OS • 256-Bit SSL Protection'}
          </p>
        </div>

      </div>

    </div>
  );
};
