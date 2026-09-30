import React, { useState, useEffect, useCallback } from 'react';
import { Customer, Mortgage, Payment, PawnEnquiry, GoldRate } from './types';
import { MOCK_BRANCH, MOCK_MORTGAGES, MOCK_PAYMENTS, MOCK_GOLD_RATES, MOCK_ENQUIRIES } from './data/mockData';
import { Language, translations } from './i18n/translations';
import { LoginView } from './components/LoginView';
import { AppHeader } from './components/layout/AppHeader';
import { SidebarDrawer } from './components/layout/SidebarDrawer';
import { BottomNav } from './components/layout/BottomNav';
import { DashboardOverview } from './components/DashboardOverview';
import { PledgesView } from './components/PledgesView';
import { InterestCalculatorView } from './components/InterestCalculatorView';
import { GoldLoanCalculator } from './components/GoldLoanCalculator';
import { PawnEnquiryForm } from './components/PawnEnquiryForm';
import { BranchVaultView } from './components/BranchVaultView';
import { CustomerReceiptModal } from './components/CustomerReceiptModal';
import { backendApi } from './services/backendApi';
import { 
  Calculator, 
  Sparkles, 
  Gem, 
  ArrowRight, 
  ShieldCheck, 
  MessageCircle, 
  PlusCircle, 
  Clock, 
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';

type AppTab = 'dashboard' | 'loans' | 'calculator' | 'enquiry' | 'branch';

export function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Enquiries state
  const [enquiries, setEnquiries] = useState<PawnEnquiry[]>(MOCK_ENQUIRIES);

  // Pre-filled calculation values from Calculator to Enquiry Form
  const [calculatorCarryOver, setCalculatorCarryOver] = useState<{
    weight?: number;
    purity?: string;
    estimatedValue?: number;
    maxLoan?: number;
  }>({});

  const [receiptModal, setReceiptModal] = useState<{
    mortgage: Mortgage;
    payment?: Payment;
  } | null>(null);

  const t = translations[language];

  const handleLoginSuccess = (customer: Customer) => {
    setCurrentCustomer(customer);
    // If new customer, direct them straight to the calculator & enquiry tools
    if (customer.isNewCustomer) {
      setActiveTab('calculator');
    } else {
      setActiveTab('dashboard');
    }

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    setCurrentCustomer(null);
    setIsSidebarOpen(false);
  };

  const handleCarryOverToEnquiry = (details: {
    weight: number;
    purity: string;
    estimatedValue: number;
    maxLoan: number;
  }) => {
    setCalculatorCarryOver(details);
    setActiveTab('enquiry');
  };

  const [customerMortgages, setCustomerMortgages] = useState<Mortgage[]>([]);
  const [customerPayments, setCustomerPayments] = useState<Payment[]>([]);
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>('');
  const [liveRates, setLiveRates] = useState<GoldRate>(MOCK_GOLD_RATES);

  const fetchLiveRates = useCallback(async () => {
    try {
      const data = await backendApi.getRates();
      if (data && data.rates) {
        setLiveRates({
          purity24K: Number(data.rates['24K']) || 7920,
          purity22K: Number(data.rates['22K']) || 7260,
          purity18K: Number(data.rates['18K']) || 5940,
          silverPerGram: Number(data.rates['silver']) || 96,
          lastUpdated: data.updatedAt
            ? `Admin Applied Rate (${data.city || 'Branch'}) • ${new Date(data.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
            : 'Admin Applied Rate • Live'
        });
      }
    } catch (err) {
      console.warn('Could not fetch admin live rates, using fallback:', err);
    }
  }, []);

  useEffect(() => {
    fetchLiveRates();
    const rateInterval = setInterval(() => {
      fetchLiveRates();
    }, 8000);
    return () => clearInterval(rateInterval);
  }, [fetchLiveRates]);

  const fetchLivePassbook = useCallback(async () => {
    if (!currentCustomer) return;
    setIsLoadingLive(true);
    try {
      const data = await backendApi.getPassbook(currentCustomer.mobile || currentCustomer.id);
      if (data && data.rates && data.rates.rates) {
        setLiveRates({
          purity24K: Number(data.rates.rates['24K']) || 7920,
          purity22K: Number(data.rates.rates['22K']) || 7260,
          purity18K: Number(data.rates.rates['18K']) || 5940,
          silverPerGram: Number(data.rates.rates['silver']) || 96,
          lastUpdated: data.rates.updatedAt
            ? `Admin Applied Rate (${data.rates.city || 'Branch'}) • ${new Date(data.rates.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
            : 'Admin Applied Rate • Live'
        });
      }

      if (data && data.mortgages && Array.isArray(data.mortgages) && data.mortgages.length > 0) {
        const mappedMortgages: Mortgage[] = data.mortgages.map((m: any) => ({
          id: m.id || m.mortgageNumber,
          mortgageNumber: m.mortgageNumber || m.id,
          customerId: m.customerId || currentCustomer.id,
          branchCode: m.branchId || 'BR-01',
          principalAmount: Number(m.principalAmount) || 0,
          interestRate: Number(m.interestRate) || 1.5,
          penaltyRateMonthly: Number(m.penaltyRateMonthly) || 1.0,
          gracePeriodDays: Number(m.gracePeriodDays) || 7,
          mortgageDate: m.mortgageDate || new Date().toISOString().split('T')[0],
          maturityDate: m.maturityDate || '',
          status: (m.status as any) || 'Active',
          vaultLocation: m.packetId ? `Locker Packet: ${m.packetId}` : 'Main Branch Vault',
          items: (m.items || []).map((it: any, idx: number) => ({
            id: it.id || `ITM-${idx}`,
            itemType: it.itemType || 'Gold Ornament',
            description: it.description || it.itemType || 'Pledged Gold Ornaments',
            purity: it.purity || '22K (916)',
            grossWeight: Number(it.grossWeight) || 0,
            stoneWeight: Number(it.stoneWeight) || 0,
            netWeight: Number(it.netWeight) || Number(it.grossWeight) || 0,
            marketValue: Number(it.marketValue) || Number(it.brokerValuation) || 0,
          })),
          totalValuation: (m.items || []).reduce((acc: number, it: any) => acc + (Number(it.marketValue) || 0), 0) || Number(m.principalAmount) * 1.33,
          tokenNumber: m.packetId || m.mortgageNumber || m.id,
          notes: m.notes,
        }));
        setCustomerMortgages(mappedMortgages);

        if (data.payments && Array.isArray(data.payments)) {
          const mappedPayments: Payment[] = data.payments.map((p: any) => ({
            id: p.id || p.receiptNumber,
            receiptNumber: p.receiptNumber || p.id,
            mortgageId: p.mortgageId,
            amount: Number(p.amount) || 0,
            principalPaid: Number(p.principalPortion || p.principalPaid) || 0,
            interestPaid: Number(p.interestPortion || p.interestPaid) || 0,
            paymentDate: (p.paymentDate || p.createdAt || '').split('T')[0] || new Date().toISOString().split('T')[0],
            paymentMode: p.paymentMode || 'UPI',
            collectedBy: p.collectedBy || 'Staff'
          }));
          setCustomerPayments(mappedPayments);
        }
        setLastSyncedAt(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
        return;
      }
    } catch (e) {
      console.warn('Live API passbook fetch failed, checking fallback', e);
    } finally {
      setIsLoadingLive(false);
    }

    // Fallback to local mock data if no live records or offline
    const fallbackM = MOCK_MORTGAGES.filter(m => m.customerId === currentCustomer.id);
    setCustomerMortgages(fallbackM);
    const mIds = fallbackM.map(m => m.id);
    setCustomerPayments(MOCK_PAYMENTS.filter(p => mIds.includes(p.mortgageId)));
  }, [currentCustomer]);

  useEffect(() => {
    if (!currentCustomer) return;
    fetchLivePassbook();
    const interval = setInterval(() => {
      fetchLivePassbook();
    }, 8000);
    return () => clearInterval(interval);
  }, [currentCustomer, fetchLivePassbook]);

  const handleEnquirySubmitted = (enquiry: PawnEnquiry) => {
    setEnquiries(prev => [enquiry, ...prev]);
    // Also post to backend so broker app receives it
    backendApi.createEnquiry(enquiry).catch(err => {
      console.warn('Enquiry backend post deferred:', err);
    });
  };

  if (!currentCustomer) {
    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        language={language}
        onLanguageChange={setLanguage}
      />
    );
  }

  const renderGoldRatesCard = () => (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-amber-200/90 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-black text-sm text-slate-900">
              {language === 'ta' ? 'இன்றைய தங்க விலை நிலவரம்' : 'Today\'s Benchmark Gold Rates'}
            </h3>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              {language === 'ta' ? 'நிர்வாக விலை (Admin Rate)' : 'Admin Applied Rate'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            {liveRates.lastUpdated || 'Official pawn rate benchmark for loans & advances'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchLiveRates()}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-bold transition active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-3 h-3 text-amber-700" />
          <span>{language === 'ta' ? 'விலை புதுப்பி' : 'Refresh Rates'}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-center hover:bg-amber-50 transition">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">22K 916 Hallmark</div>
          <div className="text-lg sm:text-xl font-black font-mono text-amber-950 mt-1">
            ₹{liveRates.purity22K ? liveRates.purity22K.toLocaleString('en-IN') : '7,260'}
          </div>
          <div className="text-[10px] text-amber-800 font-medium">per gram</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-center hover:bg-amber-50 transition">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">24K 999 Fine</div>
          <div className="text-lg sm:text-xl font-black font-mono text-amber-950 mt-1">
            ₹{liveRates.purity24K ? liveRates.purity24K.toLocaleString('en-IN') : '7,920'}
          </div>
          <div className="text-[10px] text-amber-800 font-medium">per gram</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-center hover:bg-amber-50 transition">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">18K 750 Gold</div>
          <div className="text-lg sm:text-xl font-black font-mono text-amber-950 mt-1">
            ₹{liveRates.purity18K ? liveRates.purity18K.toLocaleString('en-IN') : '5,940'}
          </div>
          <div className="text-[10px] text-amber-800 font-medium">per gram</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-center hover:bg-amber-50 transition">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Silver (வெள்ளி)</div>
          <div className="text-lg sm:text-xl font-black font-mono text-amber-950 mt-1">
            ₹{liveRates.silverPerGram ? liveRates.silverPerGram.toLocaleString('en-IN') : '96'}
          </div>
          <div className="text-[10px] text-amber-800 font-medium">per gram</div>
        </div>
      </div>
    </div>
  );

  const customerEnquiries = enquiries.filter(e => e.customerMobile === currentCustomer.mobile || currentCustomer.isNewCustomer);

  return (
    <div className="min-h-screen bg-[#fbf9f5] text-slate-900 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950 pb-24">
      
      {/* Top Application Header with Hamburger Menu */}
      <AppHeader
        customer={currentCustomer}
        branch={MOCK_BRANCH}
        language={language}
        onLanguageChange={setLanguage}
        onOpenSidebar={() => setIsSidebarOpen(true)}
      />

      {/* Slide-over Sidebar Drawer */}
      <SidebarDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        customer={currentCustomer}
        branch={MOCK_BRANCH}
        mortgages={customerMortgages}
        language={language}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-5 space-y-6">

        {/* Tab 1: Dashboard / Home */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* If New Customer: Show Dedicated Welcome & Action Hub */}
            {currentCustomer.isNewCustomer ? (
              <div className="space-y-6">
                
                {/* Hero Welcome Card for New Customers */}
                <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 rounded-3xl p-6 sm:p-8 text-slate-950 shadow-xl relative overflow-hidden">
                  <div className="relative z-10 max-w-xl">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/15 backdrop-blur-md text-slate-950 text-xs font-bold mb-3">
                      <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                      <span>{t.newCustomerBadge}</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
                      {language === 'ta' ? `வணக்கம், ${currentCustomer.name}!` : `Welcome, ${currentCustomer.name}!`}
                    </h1>
                    <p className="text-xs sm:text-sm text-amber-950/90 font-medium mt-2 leading-relaxed">
                      {t.welcomeNewCustomer}
                    </p>

                    {/* Action Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                      <button
                        type="button"
                        onClick={() => setActiveTab('calculator')}
                        className="py-3 px-4 rounded-2xl bg-slate-950 text-white hover:bg-slate-900 font-bold text-xs flex items-center justify-between shadow-md transition active:scale-98 cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <Calculator className="w-4 h-4 text-amber-400" />
                          <div className="text-left">
                            <div className="font-black">{language === 'ta' ? 'கடன் கால்குலேட்டர்' : 'Loan Calculator'}</div>
                            <div className="text-[10px] text-amber-200/80">75% Max LTV Estimate</div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-amber-300" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('enquiry')}
                        className="py-3 px-4 rounded-2xl bg-white text-slate-950 hover:bg-amber-50 font-bold text-xs flex items-center justify-between shadow-md transition active:scale-98 cursor-pointer border border-amber-300"
                      >
                        <div className="flex items-center gap-2.5">
                          <PlusCircle className="w-4 h-4 text-amber-600" />
                          <div className="text-left">
                            <div className="font-black">{language === 'ta' ? 'அடமான விசாரிப்பு' : 'Pawn Enquiry'}</div>
                            <div className="text-[10px] text-slate-500">Fast Counter Disbursal</div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-amber-700" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Benchmark Gold Rates */}
                {renderGoldRatesCard()}

                {/* Recent Enquiries if any */}
                {customerEnquiries.length > 0 && (
                  <div className="bg-white rounded-3xl p-6 border border-amber-200/80 shadow-sm space-y-4">
                    <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>{language === 'ta' ? 'உங்கள் அடமான விசாரிப்புகள்' : 'Your Submitted Pawn Enquiries'}</span>
                    </h3>
                    <div className="space-y-2">
                      {customerEnquiries.map(enq => (
                        <div key={enq.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black font-mono text-slate-900">{enq.id}</span>
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                {enq.status}
                              </span>
                            </div>
                            <div className="text-slate-600 mt-1 font-medium">
                              {enq.itemType} • {enq.approxWeight}g ({enq.purity}) • Est. Value: ₹{enq.estimatedMarketValue.toLocaleString('en-IN')}
                            </div>
                          </div>
                          <div className="text-left sm:text-right">
                            <div className="font-bold text-emerald-800 font-mono text-sm">
                              ₹{enq.maxEligibleLoan.toLocaleString('en-IN')} Max Loan
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Visit: {enq.preferredVisitDate || 'Flexible'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              /* Existing Customer Dashboard */
              <div className="space-y-6">
                {/* Live Vault Sync Status Banner */}
                <div className="flex items-center justify-between bg-emerald-50/90 border border-emerald-200/90 rounded-2xl px-4 py-2.5 text-xs shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="font-bold text-emerald-950 text-xs">
                      {language === 'ta' ? 'அடமான பெட்டகத்துடன் நேரடி இணைப்பு (Cloud Vault)' : 'Live Connected to Pawnbroker Vault'}
                    </span>
                    {lastSyncedAt && (
                      <span className="text-emerald-700 text-[11px] hidden sm:inline font-mono">
                        • {lastSyncedAt}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fetchLivePassbook()}
                    disabled={isLoadingLive}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingLive ? 'animate-spin' : ''}`} />
                    <span>{isLoadingLive ? (language === 'ta' ? 'புதுப்பிக்கிறது...' : 'Syncing...') : (language === 'ta' ? 'புதுப்பி' : 'Refresh')}</span>
                  </button>
                </div>

                <DashboardOverview
                  mortgages={customerMortgages}
                  payments={customerPayments}
                  customer={currentCustomer}
                  branch={MOCK_BRANCH}
                  language={language}
                />

                {/* Live Benchmark Gold Rates Card for Existing Customers */}
                {renderGoldRatesCard()}

                {/* Quick Shortcuts */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('calculator')}
                    className="p-4 rounded-2xl bg-white border border-amber-200 hover:border-amber-400 text-left transition shadow-2xs group cursor-pointer"
                  >
                    <Calculator className="w-5 h-5 text-amber-600 group-hover:scale-110 transition" />
                    <div className="font-black text-xs text-slate-900 mt-2">
                      {t.tabCalculator}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Calculate fresh loans on new jewellery
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('enquiry')}
                    className="p-4 rounded-2xl bg-white border border-amber-200 hover:border-amber-400 text-left transition shadow-2xs group cursor-pointer"
                  >
                    <Sparkles className="w-5 h-5 text-amber-600 group-hover:scale-110 transition" />
                    <div className="font-black text-xs text-slate-900 mt-2">
                      {t.tabNewEnquiry}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Enquire about pledging more gold ornaments
                    </div>
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Tab 2: Pledges View */}
        {activeTab === 'loans' && (
          <div>
            {customerMortgages.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 border border-amber-200 text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                  <Gem className="w-8 h-8" />
                </div>
                <h3 className="font-black text-base text-slate-900">
                  {language === 'ta' ? 'நடப்பு அடமானக் கணக்குகள் இல்லை' : 'No Active Gold Pledges Found'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  {language === 'ta'
                    ? 'நீங்கள் இதுவரை எந்த தங்க நகைகளையும் அடகு வைக்கவில்லை. கடன் கால்குலேட்டரைப் பயன்படுத்தி அல்லது புதிய அடமான விசாரிப்பை சமர்ப்பித்து உடனே கடன் பெறலாம்.'
                    : 'You do not have any active gold pledges on file. Use the Gold Loan Calculator or Submit a Pawn Enquiry to get instant counter approval at 75% LTV.'}
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('calculator')}
                    className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition cursor-pointer shadow-xs"
                  >
                    {language === 'ta' ? 'தங்கக் கடன் கால்குலேட்டர்' : 'Check Loan Calculator'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('enquiry')}
                    className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition cursor-pointer shadow-xs"
                  >
                    {language === 'ta' ? 'புதிய அடமான விசாரிப்பு' : 'Submit Pawn Enquiry'}
                  </button>
                </div>
              </div>
            ) : (
              <PledgesView
                mortgages={customerMortgages}
                payments={customerPayments}
                language={language}
                onOpenReceipt={mortgage => setReceiptModal({ mortgage })}
              />
            )}
          </div>
        )}

        {/* Tab 3: Gold Valuation Calculator */}
        {activeTab === 'calculator' && (
          <GoldLoanCalculator
            rates={liveRates}
            branch={MOCK_BRANCH}
            language={language}
            onProceedToEnquiry={handleCarryOverToEnquiry}
          />
        )}

        {/* Tab 4: New Pawn Enquiry Form */}
        {activeTab === 'enquiry' && (
          <PawnEnquiryForm
            customer={currentCustomer}
            branch={MOCK_BRANCH}
            rates={liveRates}
            language={language}
            initialValues={calculatorCarryOver}
            onEnquirySubmitted={handleEnquirySubmitted}
          />
        )}

        {/* Tab 5: Branch & Safe Vault Details */}
        {activeTab === 'branch' && (
          <BranchVaultView
            branch={MOCK_BRANCH}
            language={language}
          />
        )}

      </main>

      {/* Apple Liquid Glassmorphism Bottom Navigation Dock */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={(tabId) => setActiveTab(tabId as AppTab)}
        activeMortgagesCount={customerMortgages.length}
        language={language}
      />

      {/* Official Receipt & Pawn Ticket Modal */}
      {receiptModal && (
        <CustomerReceiptModal
          mortgage={receiptModal.mortgage}
          payment={receiptModal.payment}
          customer={currentCustomer}
          branch={MOCK_BRANCH}
          language={language}
          onClose={() => setReceiptModal(null)}
        />
      )}

    </div>
  );
}

export default App;
