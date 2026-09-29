import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { GoldItem, GoldPurity, GoldItemType, DisbursementMode, CustomerTier } from '../../types';
import { formatCurrency, formatWeight } from '../../utils/formatters';
import { calculateBrokerMortgageRatePreset } from '../../utils/goodReturnsService';
import { DEFAULT_TENURE_SLABS, getRateForTenureDays } from '../../utils/interestEngine';
import { KycVerificationModal } from '../customers/KycVerificationModal';
import { WebcamCapture } from '../customers/WebcamCapture';
import { generateBarcodeDataUrl } from '../../utils/barcodeService';
import { 
  Sparkles, X, Plus, Trash2, Gem, 
  Calculator, Lock, ArrowRight, CheckCircle2, 
  ShieldCheck, Printer, User, Globe, SlidersHorizontal,
  Info, Award, Camera, Image, Upload, Eye, Check,
  ArrowLeftRight, UserCheck, UserX, Smartphone
} from 'lucide-react';
import confetti from 'canvas-confetti';

function compressImageFile(file: File, maxWidth = 800, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface NewMortgageWizardProps {
  onClose: () => void;
}

export const NewMortgageWizard: React.FC<NewMortgageWizardProps> = ({ onClose }) => {
  const { 
    customers, 
    lockers, 
    interestRules, 
    settings, 
    createMortgage, 
    setReceiptModalData,
    currentBranch,
    goodReturnsRates,
    setIsGoodReturnsModalOpen,
    updateCustomer,
    enquiryToConvert,
    setEnquiryToConvert,
    updateEnquiryStatus
  } = useApp();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(() => {
    if (enquiryToConvert) {
      const match = customers.find(c => c.mobile.endsWith(enquiryToConvert.customerMobile.slice(-10)));
      if (match) return match.id;
    }
    return customers[0]?.id || '';
  });
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerWebcamOpen, setIsCustomerWebcamOpen] = useState(false);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];

  // Helper to get initial rates for a purity
  const getInitialRates = (purity: GoldPurity, tier: CustomerTier = 'Standard') => {
    const marketSpot = goodReturnsRates.rates[purity] || settings.goldRates?.[purity] || 7260;
    const brokerRate = calculateBrokerMortgageRatePreset(marketSpot, tier);
    return { marketSpot, brokerRate };
  };

  // Gold Items
  const [goldItems, setGoldItems] = useState<Omit<GoldItem, 'id' | 'mortgageId'>[]>(() => {
    if (enquiryToConvert) {
      const p: GoldPurity = enquiryToConvert.purity.includes('24') ? '24K' : enquiryToConvert.purity.includes('18') ? '18K' : '22K';
      const { marketSpot, brokerRate } = getInitialRates(p, selectedCustomer?.customerTier || 'Standard');
      const gross = Number(enquiryToConvert.approxWeight) || 16;
      const net = gross;
      const ltv = settings.defaultLtv || 75;
      const brokerVal = Math.round(net * brokerRate);
      const eligibleLoan = Math.round(brokerVal * (ltv / 100));
      const approved = enquiryToConvert.expectedAmount || eligibleLoan;

      let itemType: GoldItemType = 'Chain';
      if (enquiryToConvert.itemType.toLowerCase().includes('bangle')) itemType = 'Bangle';
      else if (enquiryToConvert.itemType.toLowerCase().includes('neck') || enquiryToConvert.itemType.toLowerCase().includes('haram')) itemType = 'Necklace';
      else if (enquiryToConvert.itemType.toLowerCase().includes('ring')) itemType = 'Ring';
      else if (enquiryToConvert.itemType.toLowerCase().includes('coin')) itemType = 'Coin';

      return [
        {
          itemType,
          description: `${enquiryToConvert.itemType} (Ref: ${enquiryToConvert.id})`,
          grossWeight: gross,
          stoneWeight: 0,
          netWeight: net,
          purity: p,
          karat: p === '24K' ? 24 : p === '18K' ? 18 : 22,
          marketGoldRate: marketSpot,
          brokerMortgageRate: brokerRate,
          marketValue: Math.round(net * marketSpot),
          brokerValuation: brokerVal,
          eligibleLtv: ltv,
          eligibleLoan: eligibleLoan,
          approvedLoan: approved,
          packetId: 'PKT-NEW-01'
        }
      ];
    }

    const defaultPurity: GoldPurity = '22K';
    const { marketSpot, brokerRate } = getInitialRates(defaultPurity, selectedCustomer?.customerTier || 'Standard');
    const net = 19.5;
    const ltv = selectedCustomer?.customerTier === 'VIP Gold' ? 80 : (settings.defaultLtv || 75);
    const brokerVal = Math.round(net * brokerRate);
    const eligibleLoan = Math.round(brokerVal * (ltv / 100));

    return [
      {
        itemType: 'Chain',
        description: '22K gold necklace hallmarked',
        grossWeight: 20.0,
        stoneWeight: 0.5,
        netWeight: net,
        purity: defaultPurity,
        karat: 22,
        marketGoldRate: marketSpot,
        brokerMortgageRate: brokerRate,
        marketValue: Math.round(net * marketSpot),
        brokerValuation: brokerVal,
        eligibleLtv: ltv,
        eligibleLoan: eligibleLoan,
        approvedLoan: eligibleLoan,
        packetId: 'PKT-NEW-01'
      }
    ];
  });

  // Calculate live totals across all ornaments
  const totalGrossWeight = goldItems.reduce((sum, item) => sum + (Number(item.grossWeight) || 0), 0);
  const totalStoneWeight = goldItems.reduce((sum, item) => sum + (Number(item.stoneWeight) || 0), 0);
  const totalNetWeight = goldItems.reduce((sum, item) => sum + (Number(item.netWeight) || 0), 0);
  const totalMarketValuation = goldItems.reduce((sum, item) => sum + (Number(item.marketValue) || 0), 0);
  const totalBrokerValuation = goldItems.reduce((sum, item) => sum + (Number(item.brokerValuation) || 0), 0);
  const totalEligibleLoan = goldItems.reduce((sum, item) => sum + (Number(item.eligibleLoan) || 0), 0);
  const totalApprovedLoan = goldItems.reduce((sum, item) => sum + (Number(item.approvedLoan) || 0), 0);
  const totalMarketValue = totalMarketValuation;
  const totalMaxEligibleLoan = totalEligibleLoan;

  const [principalAmount, setPrincipalAmount] = useState<number>(totalEligibleLoan);
  const [interestRuleId, setInterestRuleId] = useState<string>(settings.defaultInterestRuleId || 'IR-TENURE');
  const [tenureMonths, setTenureMonths] = useState<number>(1);
  const [customInterestRate, setCustomInterestRate] = useState<number>(() => selectedCustomer?.preferredInterestRate || 1.0);
  const [penaltyRateMonthly, setPenaltyRateMonthly] = useState<number>(1.0);
  const [gracePeriodDays, setGracePeriodDays] = useState<number>(7);
  const [processingFee, setProcessingFee] = useState<number>(300);
  const [otherCharges, setOtherCharges] = useState<number>(50);
  const [disbursementMode, setDisbursementMode] = useState<DisbursementMode>('Cash');
  const [webcamItemIdx, setWebcamItemIdx] = useState<number | null>(null);
  const [showKycModal, setShowKycModal] = useState(false);


  // Batch broker desired mortgage rate applicator
  const [batchBrokerRate, setBatchBrokerRate] = useState<number>(() => {
    const spot = goodReturnsRates.rates['22K'] || 7260;
    return Math.round(spot * 0.85);
  });

  // Sync customer preferred rates when customer changes
  useEffect(() => {
    if (selectedCustomer?.preferredInterestRate) {
      setCustomInterestRate(selectedCustomer.preferredInterestRate);
    }
    if (selectedCustomer?.preferredBrokerRateAdjustment) {
      const spot = goodReturnsRates.rates['22K'] || 7260;
      setBatchBrokerRate(Math.round(spot * (selectedCustomer.preferredBrokerRateAdjustment / 100)));
    }
  }, [selectedCustomerId, selectedCustomer]);

  const applyBatchBrokerRate = (rate: number) => {
    setGoldItems(prev => prev.map(item => {
      const cur = { ...item, brokerMortgageRate: rate };
      cur.brokerValuation = Math.round(cur.netWeight * rate);
      cur.eligibleLoan = Math.round(cur.brokerValuation * (cur.eligibleLtv / 100));
      cur.approvedLoan = cur.eligibleLoan;
      return cur;
    }));
  };

  // Locker Custody
  const [lockerId, setLockerId] = useState<string>(lockers[0]?.id || 'LCK-01');
  const [rack, setRack] = useState<string>(lockers[0]?.racks[0] || 'Rack 1');
  const [tray, setTray] = useState<string>(lockers[0]?.trays[0] || 'Tray 01');
  const [bin, setBin] = useState<string>('Pouch A');

  const handleUpdateItemField = (index: number, field: string, val: any) => {
    setGoldItems(prev => {
      const items = [...prev];
      const cur = { ...items[index], [field]: val };

      // Weight adjustments
      if (field === 'grossWeight' || field === 'stoneWeight') {
        const gross = field === 'grossWeight' ? Number(val) : cur.grossWeight;
        const stone = field === 'stoneWeight' ? Number(val) : cur.stoneWeight;
        cur.netWeight = Math.max(0, gross - stone);
      } else if (field === 'purity') {
        const purity = val as GoldPurity;
        cur.purity = purity;
        cur.karat = purity === '24K' ? 24 : purity === '22K' ? 22 : purity === '20K' ? 20 : purity === '18K' ? 18 : 14;
        cur.marketGoldRate = goodReturnsRates.rates[purity] || 7260;
        cur.brokerMortgageRate = calculateBrokerMortgageRatePreset(cur.marketGoldRate, selectedCustomer?.customerTier || 'Standard');
      } else if (field === 'brokerMortgageRate') {
        cur.brokerMortgageRate = Number(val);
      } else if (field === 'eligibleLtv') {
        cur.eligibleLtv = Number(val);
      }

      // Calculations
      const spotRate = cur.marketGoldRate || goodReturnsRates.rates[cur.purity] || 7260;
      const brokerRate = cur.brokerMortgageRate || spotRate;
      cur.marketValue = Math.round(cur.netWeight * spotRate);
      cur.brokerValuation = Math.round(cur.netWeight * brokerRate);
      cur.eligibleLoan = Math.round(cur.brokerValuation * (cur.eligibleLtv / 100));
      cur.approvedLoan = cur.eligibleLoan;

      items[index] = cur;
      return items;
    });
  };

  const updateItem = handleUpdateItemField;

  // Quick preset broker mortgage rate
  const applyBrokerPreset = (index: number, percent: number) => {
    const item = goldItems[index];
    const spot = item.marketGoldRate || goodReturnsRates.rates[item.purity] || 7260;
    const customBrokerRate = Math.round((spot * percent) / 100);
    updateItem(index, 'brokerMortgageRate', customBrokerRate);
  };

  const addItem = () => {
    const defaultPurity: GoldPurity = '22K';
    const { marketSpot, brokerRate } = getInitialRates(defaultPurity, selectedCustomer?.customerTier || 'Standard');
    const net = 10.0;
    const ltv = selectedCustomer?.customerTier === 'VIP Gold' ? 80 : (settings.defaultLtv || 75);
    const brokerVal = Math.round(net * brokerRate);
    const eligibleLoan = Math.round(brokerVal * (ltv / 100));

    setGoldItems(prev => [
      ...prev,
      {
        itemType: 'Ring',
        description: '22K gold ornament',
        grossWeight: 10.0,
        stoneWeight: 0.0,
        netWeight: net,
        purity: defaultPurity,
        karat: 22,
        marketGoldRate: marketSpot,
        brokerMortgageRate: brokerRate,
        goldRate: brokerRate,
        marketValue: Math.round(net * marketSpot),
        brokerValuation: brokerVal,
        eligibleLtv: ltv,
        eligibleLoan: eligibleLoan,
        approvedLoan: eligibleLoan
      }
    ]);
  };

  const removeItem = (idx: number) => {
    if (goldItems.length <= 1) return;
    setGoldItems(prev => prev.filter((_, i) => i !== idx));
  };

  // Keep principal in sync when advancing
  const handleProceedToTerms = () => {
    setPrincipalAmount(totalMaxEligibleLoan);
    setStep(3);
  };

  const handleFinalSubmit = () => {
    if (!selectedCustomer) {
      alert('Please select a verified customer');
      return;
    }

    const maturityDate = new Date(Date.now() + tenureMonths * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const created = createMortgage({
      customerId: selectedCustomerId,
      items: goldItems,
      principalAmount,
      interestRuleId,
      customInterestRate: Number(customInterestRate) || 2.0,
      penaltyRateMonthly: Number(penaltyRateMonthly) || 0,
      gracePeriodDays: Number(gracePeriodDays) || 0,
      maturityDate,
      processingFee,
      otherCharges,
      disbursementMode,
      lockerId,
      rack,
      tray,
      bin
    });

    if (enquiryToConvert) {
      updateEnquiryStatus(enquiryToConvert.id, 'CONVERTED', `Converted to Mortgage #${created.mortgageNumber}`);
      setEnquiryToConvert(null);
    }

    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {}

    // Open receipt print preview immediately
    setReceiptModalData({
      type: 'pledge',
      mortgage: created,
      customer: selectedCustomer
    });

    onClose();
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.mobile.includes(customerSearch) ||
    c.id.toLowerCase().includes(customerSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5">
      <div className="liquid-glass-modal border border-amber-200/70 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Wizard Header & Stepper */}
        <div className="p-4 bg-gradient-to-r from-amber-500/15 via-white/50 to-yellow-500/10 border-b border-amber-200/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white flex items-center justify-center font-black shadow-md shadow-amber-500/30 border border-white/60">
              <Sparkles className="w-5 h-5 text-amber-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900">New Gold Mortgage & Pledge Creation</h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-900 text-[10px] font-bold border border-amber-400/40">
                  Custom Pawn Rate
                </span>
              </div>
              <p className="text-xs text-slate-500">Live GoodReturns Bullion Rates + Broker Negotiated Lending Valuation</p>
            </div>
          </div>

          {/* Stepper Pills */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            {[
              { num: 1, label: 'Customer' },
              { num: 2, label: 'Gold Appraisal' },
              { num: 3, label: 'Loan Terms' },
              { num: 4, label: 'Locker Custody' }
            ].map((s) => (
              <div
                key={s.num}
                onClick={() => setStep(s.num as any)}
                className={`px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition ${
                  step === s.num
                    ? 'liquid-glass-gold text-amber-950 border border-amber-400/60 shadow-xs'
                    : step > s.num
                    ? 'bg-emerald-500/10 text-emerald-800'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <span>{s.num}.</span>
                <span>{s.label}</span>
              </div>
            ))}
          </div>

          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white/80 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Body */}
        <div className="flex-1 overflow-y-auto p-5 text-xs text-slate-700">
          
          {/* STEP 1: Customer Selection & Tier */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Select Borrower / Customer</h3>
                  <p className="text-slate-500">The pawn broker mortgage rate preset automatically adjusts based on customer relationship tier.</p>
                </div>
                <input
                  type="text"
                  placeholder="Search name, mobile, customer ID..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="px-3 py-1.5 bg-white/80 border border-amber-200/60 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 w-full sm:w-64"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                {filteredCustomers.map(c => {
                  const isSelected = selectedCustomerId === c.id;
                  const tierColors: Record<CustomerTier, string> = {
                    'VIP Gold': 'bg-amber-500/20 text-amber-950 border-amber-400/60',
                    'Regular Premium': 'bg-blue-500/15 text-blue-950 border-blue-400/40',
                    'Standard': 'bg-slate-100 text-slate-700 border-slate-200',
                    'New Borrower': 'bg-emerald-500/15 text-emerald-950 border-emerald-400/40',
                    'New Customer': 'bg-emerald-500/15 text-emerald-950 border-emerald-400/40'
                  };

                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCustomerId(c.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                        isSelected 
                          ? 'liquid-glass-gold border-amber-400/80 shadow-md shadow-amber-500/10'
                          : 'bg-white/70 border-amber-200/50 hover:bg-white hover:border-amber-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={c.photoUrl}
                          alt=""
                          className="w-12 h-12 rounded-2xl object-cover border border-amber-200/60 shadow-xs shrink-0"
                        />
                        <div>
                          <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                            <span>{c.name}</span>
                            {c.kycStatus === 'Verified' && (
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">{c.id} • {c.mobile}</div>
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${tierColors[c.customerTier || 'Standard']}`}>
                              {c.customerTier || 'Standard'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Lending Cap: {c.customerTier === 'VIP Gold' ? '92%' : c.customerTier === 'Regular Premium' ? '88%' : '85%'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.kycStatus === 'Verified' ? 'bg-emerald-500/15 text-emerald-800' : 'bg-amber-500/15 text-amber-800'
                        }`}>
                          {c.kycStatus}
                        </span>
                        {isSelected && (
                          <div className="mt-2 text-amber-800 font-bold text-[11px] flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-4 h-4 text-amber-600" />
                            <span>Active</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>              {/* Selected Customer Tier Adjustment Pill */}
              {selectedCustomer && (
                <div className="space-y-2">
                  <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-white to-amber-500/5 rounded-2xl border border-amber-300/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-600" />
                      <div>
                        <span className="font-bold text-slate-800">Borrower Relationship Level: </span>
                        <strong className="text-amber-900">{selectedCustomer.customerTier}</strong>
                        <span className="text-slate-500 text-[11px] ml-1">
                          (Broker mortgage lending preset: {selectedCustomer.customerTier === 'VIP Gold' ? '92% rate' : selectedCustomer.customerTier === 'Regular Premium' ? '88% rate' : '85% rate'})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-semibold text-slate-500 mr-1">Adjust Tier:</span>
                      {(['VIP Gold', 'Regular Premium', 'Standard', 'New Customer'] as CustomerTier[]).map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateCustomer(selectedCustomer.id, { customerTier: t });
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                            selectedCustomer.customerTier === t
                              ? 'bg-amber-500/20 text-amber-950 border-amber-400'
                              : 'bg-white/60 text-slate-600 border-slate-200 hover:bg-white'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* UIDAI Aadhaar KYC & Name Sync Bar */}
                  <div className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                    selectedCustomer.kycStatus === 'Verified'
                      ? 'bg-emerald-500/10 border-emerald-300/80 text-emerald-950'
                      : 'bg-amber-500/10 border-amber-300/80 text-amber-950'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-xl border ${
                        selectedCustomer.kycStatus === 'Verified' 
                          ? 'bg-emerald-100 border-emerald-300 text-emerald-700' 
                          : 'bg-amber-100 border-amber-300 text-amber-700'
                      }`}>
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div className="text-xs">
                        <div className="flex items-center gap-2 font-extrabold">
                          <span>
                            {selectedCustomer.kycStatus === 'Verified' 
                              ? 'UIDAI Aadhaar Verified & Name Synced' 
                              : 'Aadhaar e-KYC Pending Verification'}
                          </span>
                          {selectedCustomer.kycRecord?.nameMatchScore !== undefined && (
                            <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">
                              {selectedCustomer.kycRecord.nameMatchScore}% Match
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          {selectedCustomer.kycStatus === 'Verified' ? (
                            <span>
                              Masked ID: <strong className="font-mono text-slate-800">{selectedCustomer.kycRecord?.maskedId || selectedCustomer.aadhaarNumber || 'Verified'}</strong>
                              {selectedCustomer.kycRecord?.aadhaarLegalName && (
                                <> • Legal Name: <strong className="text-emerald-900">{selectedCustomer.kycRecord.aadhaarLegalName}</strong></>
                              )}
                            </span>
                          ) : (
                            <span>Recommended to verify Aadhaar identity and sync customer legal name prior to loan sanction.</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowKycModal(true)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-1.5 whitespace-nowrap self-start sm:self-center ${
                        selectedCustomer.kycStatus === 'Verified'
                          ? 'bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50'
                          : 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-black'
                      }`}
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      <span>{selectedCustomer.kycStatus === 'Verified' ? 'Re-Verify / Sync' : 'Verify with UIDAI'}</span>
                    </button>
                  </div>

                  {/* Customer KYC Portrait via External Webcam */}
                  <div className="p-3.5 bg-white/80 rounded-2xl border border-amber-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {selectedCustomer.photoUrl ? (
                        <img
                          src={selectedCustomer.photoUrl}
                          alt={selectedCustomer.name}
                          className="w-14 h-16 rounded-xl object-cover border-2 border-amber-300 shadow-xs bg-white shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-16 rounded-xl border border-dashed border-amber-400 bg-amber-50/50 flex flex-col items-center justify-center text-amber-700 shrink-0">
                          <User className="w-5 h-5 text-amber-600" />
                          <span className="text-[8px] font-bold mt-0.5">No Photo</span>
                        </div>
                      )}
                      <div>
                        <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-amber-600" />
                          <span>Borrower Photo (Pawn Contract & Receipt)</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {selectedCustomer.photoUrl
                            ? 'Live portrait recorded. Prints directly onto the legal Pawn Ticket.'
                            : 'Snap live portrait of borrower using connected USB webcam or computer camera.'}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isCustomerWebcamOpen ? (
                        <div className="w-full max-w-sm">
                          <WebcamCapture
                            mode="portrait"
                            label="Borrower Snapshot"
                            initialPhotoUrl={selectedCustomer.photoUrl}
                            onCapture={(url) => {
                              updateCustomer(selectedCustomer.id, { photoUrl: url });
                              setIsCustomerWebcamOpen(false);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setIsCustomerWebcamOpen(false)}
                            className="mt-1 text-[11px] text-slate-500 hover:text-slate-800 underline block"
                          >
                            Cancel camera
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsCustomerWebcamOpen(true)}
                          className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>{selectedCustomer.photoUrl ? 'Retake Live Photo' : 'Snap Photo with Camera'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Gold Appraisal with GoodReturns vs Broker Desired Rate */}
          {step === 2 && (
            <div className="space-y-4">
              
              {/* Header with GoodReturns Benchmark Banner */}
              <div className="p-3.5 rounded-2xl liquid-glass-gold border border-amber-300/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Globe className="w-5 h-5 text-amber-700 shrink-0" />
                  <div>
                    <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                      <span>GoodReturns.in Live Ticker: <strong>{goodReturnsRates.city} Spot Market</strong></span>
                      <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-800 text-[9px] font-bold rounded">REF ONLY</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      22K Market: ₹{goodReturnsRates.rates['22K'].toLocaleString('en-IN')}/g | 24K: ₹{goodReturnsRates.rates['24K'].toLocaleString('en-IN')}/g • <span className="text-amber-900 font-bold">Company reference feed only</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsGoodReturnsModalOpen(true)}
                    className="px-2.5 py-1.5 bg-white/80 hover:bg-white text-slate-700 text-xs font-bold rounded-xl border border-amber-300/60 transition shadow-xs"
                  >
                    View Market Rates
                  </button>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-md shadow-amber-500/20 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Ornament</span>
                  </button>
                </div>
              </div>

              {/* Pawnbroker Desired Mortgage Rate Batch Bar */}
              <div className="p-3 bg-white/90 border border-amber-300 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-900 flex items-center justify-center font-bold text-xs">
                    ₹
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                      <span>Pawnbroker Desired Mortgage Valuation Rate</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold">Your Custom Rate</span>
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      GoodReturns rate is just company reference. Apply your desired lending rate per gram across all items or fine-tune individually:
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-500">Set All:</span>
                  <div className="flex items-center gap-1 bg-amber-50/80 p-1 rounded-xl border border-amber-200">
                    <span className="text-xs font-mono font-bold text-amber-950 pl-1">₹</span>
                    <input
                      type="number"
                      value={batchBrokerRate}
                      onChange={(e) => setBatchBrokerRate(Number(e.target.value))}
                      className="w-20 px-1.5 py-0.5 bg-white border border-amber-300 rounded-lg text-xs font-mono font-bold text-amber-950"
                      placeholder="Rate/g"
                    />
                    <button
                      type="button"
                      onClick={() => applyBatchBrokerRate(batchBrokerRate)}
                      className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-extrabold rounded-lg transition"
                    >
                      Apply All
                    </button>
                  </div>

                  {/* Quick Preset Buttons */}
                  {[6000, 6200, 6500].map(rate => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => {
                        setBatchBrokerRate(rate);
                        applyBatchBrokerRate(rate);
                      }}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-950 transition border border-slate-200"
                    >
                      ₹{rate.toLocaleString('en-IN')}/g
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const spot = goodReturnsRates.rates['22K'] || 7260;
                      const calculated = Math.round(spot * 0.85);
                      setBatchBrokerRate(calculated);
                      applyBatchBrokerRate(calculated);
                    }}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-900 hover:bg-amber-200 transition"
                  >
                    85% of Spot
                  </button>
                </div>
              </div>

              {/* Items Card List */}
              <div className="space-y-3">
                {goldItems.map((item, idx) => {
                  const liveSpotRate = goodReturnsRates.rates[item.purity] || 7260;
                  const currentBrokerRate = item.brokerMortgageRate || item.marketGoldRate || liveSpotRate;
                  const diffFromMarket = liveSpotRate > 0 ? Math.round(((currentBrokerRate - liveSpotRate) / liveSpotRate) * 100) : 0;

                  return (
                    <div key={idx} className="p-4 bg-white/80 border border-amber-200/70 rounded-2xl space-y-3 shadow-xs">
                      
                      {/* Item Title & Type */}
                      <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                        <span className="font-extrabold text-amber-900 flex items-center gap-1.5 text-xs">
                          <Gem className="w-4 h-4 text-amber-600" />
                          <span>Ornament #{idx + 1} - {item.itemType}</span>
                        </span>

                        {goldItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="text-rose-500 hover:text-rose-700 p-1 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Basic Spec Inputs */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold mb-1">Item Category</label>
                          <select
                            value={item.itemType}
                            onChange={(e) => updateItem(idx, 'itemType', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-amber-50/40 border border-amber-200/70 rounded-xl text-slate-800 font-semibold"
                          >
                            {(['Chain', 'Ring', 'Bangle', 'Necklace', 'Coin', 'Earring', 'Bracelet', 'Waist Chain (Oddiyanam)', 'Anklet', 'Other'] as GoldItemType[]).map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-slate-500 font-bold mb-1">Article Description</label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItem(idx, 'description', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-amber-50/40 border border-amber-200/70 rounded-xl text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold mb-1">Gross Wt (g)</label>
                          <input
                            type="number"
                            step="0.001"
                            value={item.grossWeight}
                            onChange={(e) => updateItem(idx, 'grossWeight', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-amber-200/70 rounded-xl text-slate-900 font-mono font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold mb-1">Stone / Dust Wt (g)</label>
                          <input
                            type="number"
                            step="0.001"
                            value={item.stoneWeight}
                            onChange={(e) => updateItem(idx, 'stoneWeight', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-amber-200/70 rounded-xl text-slate-900 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-emerald-800 font-bold mb-1">Net Gold Wt (g)</label>
                          <input
                            type="text"
                            readOnly
                            value={formatWeight(item.netWeight)}
                            className="w-full px-2.5 py-1.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 font-mono font-extrabold"
                          />
                        </div>
                      </div>

                      {/* Ornament Photo Capture / Upload Section */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
                        <div className="flex items-center gap-3">
                          {item.photoReference ? (
                            <div className="relative group shrink-0">
                              <img
                                src={item.photoReference}
                                alt={`Ornament ${idx + 1}`}
                                className="w-14 h-14 object-cover rounded-xl border-2 border-amber-400 shadow-sm"
                              />
                              <button
                                type="button"
                                onClick={() => updateItem(idx, 'photoReference', undefined)}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] shadow hover:bg-rose-600 transition"
                                title="Remove Ornament Photo"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="w-14 h-14 rounded-xl border-2 border-dashed border-amber-300 bg-white/80 flex flex-col items-center justify-center text-amber-700 shrink-0">
                              <Camera className="w-5 h-5" />
                              <span className="text-[8px] font-bold mt-0.5">No Photo</span>
                            </div>
                          )}

                          <div>
                            <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                              <span>Ornament #{idx + 1} Visual Proof / Photo</span>
                              {item.photoReference && (
                                <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold border border-emerald-300 flex items-center gap-0.5">
                                  <Check className="w-2.5 h-2.5" />
                                  <span>Attached</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 leading-tight">
                              Take a live picture with camera or upload picture from device. Prints on receipt & audit log.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {webcamItemIdx === idx ? (
                            <div className="w-full">
                              <WebcamCapture
                                mode="landscape"
                                label={`Ornament #${idx + 1} — Snap with External Webcam`}
                                onCapture={(dataUrl) => {
                                  updateItem(idx, 'photoReference', dataUrl);
                                  setWebcamItemIdx(null);
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => setWebcamItemIdx(null)}
                                className="mt-2 text-[11px] text-slate-500 hover:text-slate-800 underline"
                              >
                                Cancel webcam
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => setWebcamItemIdx(idx)}
                                className="cursor-pointer px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-sm transition"
                              >
                                <Camera className="w-3.5 h-3.5" />
                                <span>{item.photoReference ? 'Retake with Webcam' : 'Capture with Webcam'}</span>
                              </button>
                              <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1.5 transition border border-slate-300">
                                <Upload className="w-3.5 h-3.5" />
                                <span>Upload</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      try {
                                        const compressed = await compressImageFile(file);
                                        updateItem(idx, 'photoReference', compressed);
                                      } catch (err) {
                                        console.error('Failed processing ornament photo', err);
                                      }
                                    }
                                  }}
                                />
                              </label>
                            </>
                          )}
                        </div>
                      </div>

                      {/* DUAL RATE COMPARISON: GoodReturns Live Bullion vs Pawn Broker Desired Rate */}
                      <div className="p-3 bg-gradient-to-r from-amber-50/60 via-white to-amber-50/40 rounded-xl border border-amber-200/80 space-y-2.5">
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 pb-2">
                          <div>
                            <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
                              <span>Purity & Pawn Broker Lending Valuation Rate</span>
                            </div>
                            <span className="text-[10px] text-slate-500">
                              GoodReturns spot rate is pure bullion value. Broker desired rate is customized per customer risk and negotiation.
                            </span>
                          </div>

                          {/* Quick Broker Discount Presets */}
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-slate-400 mr-1">Presets:</span>
                            <button
                              type="button"
                              onClick={() => applyBrokerPreset(idx, 92)}
                              className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-900 hover:bg-amber-200 transition"
                              title="VIP Regular Customer: 92% of market"
                            >
                              VIP 92%
                            </button>
                            <button
                              type="button"
                              onClick={() => applyBrokerPreset(idx, 88)}
                              className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-900 hover:bg-amber-200 transition"
                              title="Regular Loyal Customer: 88% of market"
                            >
                              Regular 88%
                            </button>
                            <button
                              type="button"
                              onClick={() => applyBrokerPreset(idx, 85)}
                              className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-900 hover:bg-amber-200 transition"
                              title="Standard Lending Margin: 85% of market"
                            >
                              Std 85%
                            </button>
                            <button
                              type="button"
                              onClick={() => applyBrokerPreset(idx, 80)}
                              className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-900 hover:bg-amber-200 transition"
                              title="New / Conservative Margin: 80% of market"
                            >
                              New 80%
                            </button>
                            <button
                              type="button"
                              onClick={() => applyBrokerPreset(idx, 100)}
                              className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-800 hover:bg-slate-200 transition"
                              title="Full 100% GoodReturns market rate"
                            >
                              100% Spot
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          
                          {/* Purity selector */}
                          <div>
                            <label className="block text-[10px] text-slate-500 font-bold mb-1">Purity (Karat)</label>
                            <select
                              value={item.purity}
                              onChange={(e) => updateItem(idx, 'purity', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-amber-200 rounded-xl text-amber-950 font-bold"
                            >
                              <option value="24K">24K (999 Purity)</option>
                              <option value="22K">22K (916 Hallmark)</option>
                              <option value="20K">20K (833 Purity)</option>
                              <option value="18K">18K (750 Purity)</option>
                              <option value="14K">14K (585 Purity)</option>
                            </select>
                          </div>

                          {/* 1. GoodReturns Market Spot Rate (Readonly Benchmark) */}
                          <div>
                            <label className="block text-[10px] text-slate-500 font-bold mb-1">
                              GoodReturns Spot (₹/g)
                            </label>
                            <div className="px-2.5 py-1.5 bg-slate-100/90 border border-slate-200 rounded-xl text-slate-700 font-mono font-bold text-xs flex items-center justify-between">
                              <span>₹{liveSpotRate.toLocaleString('en-IN')}</span>
                              <span className="text-[9px] text-slate-500 uppercase">Spot</span>
                            </div>
                          </div>

                          {/* 2. Broker Desired Mortgage Rate (Editable per customer) */}
                          <div>
                            <label className="block text-[10px] text-amber-900 font-extrabold mb-1 flex items-center justify-between">
                              <span>Broker Desired Rate *</span>
                              <span className="text-[9px] font-mono font-bold text-amber-700">
                                {diffFromMarket}% of spot
                              </span>
                            </label>
                            <input
                              type="number"
                              value={currentBrokerRate}
                              onChange={(e) => updateItem(idx, 'brokerMortgageRate', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-amber-500/15 border border-amber-400 rounded-xl text-amber-950 font-mono font-extrabold text-xs focus:ring-2 focus:ring-amber-500/40"
                              title="Enter desired gold mortgage valuation rate per gram for this customer"
                            />
                          </div>

                          {/* 3. Broker Mortgage Valuation */}
                          <div>
                            <label className="block text-[10px] text-slate-600 font-bold mb-1">
                              Broker Valuation
                            </label>
                            <div className="px-2.5 py-1.5 bg-white border border-amber-200 rounded-xl text-slate-900 font-mono font-bold">
                              {formatCurrency(item.brokerValuation || Math.round(item.netWeight * currentBrokerRate))}
                            </div>
                          </div>

                          {/* 4. Eligible Loan at LTV */}
                          <div>
                            <label className="block text-[10px] text-amber-900 font-bold mb-1">
                              Max Loan ({item.eligibleLtv}% LTV)
                            </label>
                            <div className="px-2.5 py-1.5 bg-amber-500/20 border border-amber-400/60 rounded-xl text-amber-950 font-mono font-extrabold">
                              {formatCurrency(item.eligibleLoan)}
                            </div>
                          </div>

                        </div>

                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Comprehensive Valuation Summary Bar */}
              <div className="p-4 liquid-glass-card rounded-3xl border border-amber-300/70 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center shadow-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Total Net Weight</span>
                  <div className="text-base font-black text-emerald-800 font-mono mt-0.5">
                    {formatWeight(goldItems.reduce((s, i) => s + i.netWeight, 0))}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">GoodReturns Bullion Worth</span>
                  <div className="text-base font-extrabold text-slate-700 font-mono mt-0.5">
                    {formatCurrency(totalMarketValue)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-amber-900 uppercase font-bold">Broker Appraisal Valuation</span>
                  <div className="text-base font-black text-amber-950 font-mono mt-0.5">
                    {formatCurrency(totalBrokerValuation)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-800 uppercase font-bold">Max Eligible Pawn Loan</span>
                  <div className="text-lg font-black text-emerald-900 font-mono mt-0.5">
                    {formatCurrency(totalMaxEligibleLoan)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Loan Terms & Interest Projection */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Loan Disbursement & Interest Terms</h3>
                <p className="text-slate-500">Specify disbursement principal, interest scheme, tenure and upfront fees.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Left: Financial Inputs */}
                <div className="p-4 bg-white/80 rounded-3xl border border-amber-200/70 space-y-3 shadow-xs">
                  <div>
                    <label className="block text-slate-800 font-bold mb-1">
                      Approved Loan Principal (₹) *
                    </label>
                    <input
                      type="number"
                      value={principalAmount}
                      max={totalMaxEligibleLoan}
                      onChange={(e) => setPrincipalAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-amber-50/50 border border-amber-400 rounded-2xl text-amber-950 font-mono font-black text-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                    <div className="text-[10px] text-slate-500 mt-1">
                      Max Permitted Collateral Loan: <strong className="text-slate-800">{formatCurrency(totalMaxEligibleLoan)}</strong>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-800 font-bold mb-1">Interest Scheme & Baseline</label>
                    <select
                      value={interestRuleId}
                      onChange={(e) => {
                        const rId = e.target.value;
                        setInterestRuleId(rId);
                        const r = interestRules.find(x => x.id === rId);
                        if (r && !selectedCustomer?.preferredInterestRate) {
                          setCustomInterestRate(r.baseRateMonthly);
                        }
                      }}
                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-slate-800 font-semibold"
                    >
                      {interestRules.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.name} - Baseline {r.baseRateMonthly}%/mo ({r.rateType})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* TENURE-BASED INTEREST RATE SLABS SECTION */}
                  <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-amber-100/40 to-yellow-500/10 rounded-2xl border border-amber-300 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-amber-700" />
                        <span>Tenure Interest Rate Slabs (Default Standard)</span>
                      </label>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200/90 text-amber-950 font-bold border border-amber-300">
                        Tenure Slabs Active
                      </span>
                    </div>

                    <p className="text-[10.5px] text-slate-600 leading-snug">
                      Default interest rates calibrated by loan tenure. Click a tenure slab below or manually enter custom agreed rate:
                    </p>

                    {/* Interactive Tenure Slab Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                      {[
                        { label: '0 to 31 Days', tenure: 1, rate: 1.0, sub: '1 Month' },
                        { label: '32 to 61 Days', tenure: 2, rate: 1.25, sub: '2 Months' },
                        { label: '62 to 91 Days', tenure: 3, rate: 1.5, sub: '3 Months' },
                        { label: '92 to 180 Days', tenure: 6, rate: 2.0, sub: '6 Months' },
                        { label: 'Above 180 Days', tenure: 12, rate: 2.5, sub: '6+ Months' }
                      ].map(slab => {
                        const isSelected = customInterestRate === slab.rate;
                        return (
                          <button
                            key={slab.label}
                            type="button"
                            onClick={() => {
                              setCustomInterestRate(slab.rate);
                              setTenureMonths(slab.tenure);
                            }}
                            className={`p-2 rounded-xl text-left border transition flex flex-col justify-between ${
                              isSelected
                                ? 'bg-amber-600 text-white border-amber-700 shadow-md ring-2 ring-amber-400/40'
                                : 'bg-white/90 text-slate-700 border-amber-200 hover:bg-amber-100 hover:text-amber-950'
                            }`}
                          >
                            <div>
                              <div className={`text-[10px] font-bold ${isSelected ? 'text-amber-100' : 'text-slate-600'}`}>
                                {slab.label}
                              </div>
                              <div className={`text-[9px] ${isSelected ? 'text-amber-100/90' : 'text-slate-500'}`}>
                                {slab.sub}
                              </div>
                            </div>
                            <div className="mt-1 font-mono font-black text-sm">
                              {slab.rate.toFixed(2)}%
                              <span className={`text-[9px] font-normal ${isSelected ? 'text-amber-100' : 'text-slate-500'}`}> /mo</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Manual Customization & Override */}
                    <div className="pt-2 border-t border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-extrabold text-slate-900">
                            Pawnbroker Agreed Rate (%/month) *
                          </label>
                          <span className="text-[10px] font-bold text-amber-800">
                            (Manual Override Allowed)
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.05"
                            min="0.1"
                            max="15.0"
                            value={customInterestRate}
                            onChange={(e) => setCustomInterestRate(parseFloat(e.target.value) || 0)}
                            className="w-full pl-3 pr-20 py-1.5 bg-white border border-amber-400 rounded-xl text-amber-950 font-mono font-black text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                          />
                          <span className="absolute right-3 top-1.5 text-xs font-bold text-amber-800">
                            % / month
                          </span>
                        </div>
                      </div>

                      <div className="text-right sm:pl-3 sm:border-l sm:border-amber-200 shrink-0">
                        <div className="text-sm font-mono font-bold text-emerald-800">
                          {formatCurrency(Math.round(principalAmount * (customInterestRate / 100)))}
                        </div>
                        <span className="text-[10px] text-slate-500">monthly interest</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 italic">
                      Standard default slab auto-fills based on chosen loan tenure (0-31d: 1%, 32-61d: 1.25%, 62-91d: 1.5%, 92-180d: 2%, 180+d: 2.5%). Pawnbroker can freely edit/override manually.
                    </p>
                  </div>

                  {/* PAWNBROKER FIXED LATE PAYMENT PENALTY */}
                  <div className="p-3 bg-gradient-to-r from-rose-50/70 via-amber-50/30 to-rose-50/50 rounded-2xl border border-rose-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        <span>Late Payment Penalty (%/month) & Grace Period *</span>
                      </label>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 font-bold">
                        Fixed at Pledge
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-600 font-bold mb-1">Overdue Penalty Rate (%/mo)</label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min="0.0"
                            max="10.0"
                            value={penaltyRateMonthly}
                            onChange={(e) => setPenaltyRateMonthly(parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-1.5 bg-white border border-rose-300 rounded-xl text-rose-950 font-mono font-black text-sm focus:outline-none focus:ring-2 focus:ring-rose-400/30"
                          />
                          <span className="absolute right-2.5 top-1.5 text-xs font-bold text-rose-800">%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-600 font-bold mb-1">Grace Period (Days)</label>
                        <select
                          value={gracePeriodDays}
                          onChange={(e) => setGracePeriodDays(Number(e.target.value))}
                          className="w-full px-3 py-1.5 bg-white border border-rose-300 rounded-xl text-slate-800 text-xs font-bold"
                        >
                          <option value={0}>0 Days (Immediate on Due)</option>
                          <option value={7}>7 Days (Standard Grace)</option>
                          <option value={15}>15 Days (Extended Grace)</option>
                          <option value={30}>30 Days (1 Month Grace)</option>
                        </select>
                      </div>
                    </div>

                    {/* Quick penalty rate presets */}
                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      <span className="text-[10px] font-bold text-slate-400 mr-1">Penalty Presets:</span>
                      {[
                        { label: '0% (Waived)', val: 0.0 },
                        { label: '0.5% (Low)', val: 0.5 },
                        { label: '1.0% (Standard)', val: 1.0 },
                        { label: '1.5%', val: 1.5 },
                        { label: '2.0% (Strict)', val: 2.0 }
                      ].map(preset => (
                        <button
                          key={preset.val}
                          type="button"
                          onClick={() => setPenaltyRateMonthly(preset.val)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition border ${
                            penaltyRateMonthly === preset.val
                              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                              : 'bg-white text-slate-700 border-rose-200 hover:bg-rose-50 hover:text-rose-900'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    <p className="text-[10px] text-slate-500 italic">
                      Fixed by pawnbroker during pledge. Applies to overdue principal only after {gracePeriodDays} grace days from maturity.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-800 font-bold mb-1">Loan Tenure Period</label>
                      <select
                        value={tenureMonths}
                        onChange={(e) => {
                          const m = Number(e.target.value);
                          setTenureMonths(m);
                          const slabRate = getRateForTenureDays(m * 30);
                          setCustomInterestRate(slabRate);
                        }}
                        className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-slate-800 font-semibold text-xs"
                      >
                        <option value={1}>1 Month (0 to 31 Days • 1.00%/mo)</option>
                        <option value={2}>2 Months (32 to 61 Days • 1.25%/mo)</option>
                        <option value={3}>3 Months (62 to 91 Days • 1.50%/mo)</option>
                        <option value={6}>6 Months (92 to 180 Days • 2.00%/mo)</option>
                        <option value={12}>12 Months (Above 180 Days • 2.50%/mo)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-800 font-bold mb-1">Maturity Date</label>
                      <input
                        type="text"
                        readOnly
                        value={new Date(Date.now() + tenureMonths * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-800 font-bold mb-1">Processing Fee (₹)</label>
                      <input
                        type="number"
                        value={processingFee}
                        onChange={(e) => setProcessingFee(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-slate-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-800 font-bold mb-1">Appraisal Fee (₹)</label>
                      <input
                        type="number"
                        value={otherCharges}
                        onChange={(e) => setOtherCharges(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-slate-800 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-800 font-bold mb-1">Disbursement Mode</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Cash', 'Bank Transfer', 'UPI'] as DisbursementMode[]).map(mode => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setDisbursementMode(mode)}
                          className={`py-2 rounded-xl text-center font-bold border transition ${
                            disbursementMode === mode
                              ? 'bg-amber-500/20 text-amber-950 border-amber-400 font-extrabold shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-amber-200'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Right: Projected Breakdown Card */}
                <div className="p-4 liquid-glass-card rounded-3xl border border-amber-200/80 flex flex-col justify-between shadow-xs">
                  <div>
                    <h4 className="font-extrabold text-amber-950 text-sm mb-3 flex items-center gap-1.5">
                      <Calculator className="w-4 h-4 text-amber-600" />
                      <span>Interest Projection & Summary</span>
                    </h4>

                    {(() => {
                      const rule = interestRules.find(r => r.id === interestRuleId) || interestRules[0];
                      const effectiveRate = customInterestRate !== undefined && customInterestRate > 0 ? customInterestRate : rule.baseRateMonthly;
                      const monthlyInterest = Math.round(principalAmount * (effectiveRate / 100));
                      const totalTenureInterest = monthlyInterest * tenureMonths;
                      const netDisbursed = principalAmount - (processingFee + otherCharges);

                      return (
                        <div className="space-y-2.5 text-xs">
                          <div className="flex justify-between py-1.5 border-b border-amber-100">
                            <span className="text-slate-500">Approved Principal:</span>
                            <span className="font-mono font-extrabold text-slate-900">{formatCurrency(principalAmount)}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-amber-100">
                            <span className="text-slate-500">Agreed Interest Rate:</span>
                            <span className="font-mono font-extrabold text-emerald-800">{effectiveRate}% / month</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-amber-100">
                            <span className="text-slate-500">Late Payment Penalty:</span>
                            <span className="font-mono font-bold text-rose-700">{penaltyRateMonthly}% / mo (after {gracePeriodDays}d grace)</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-amber-100">
                            <span className="text-slate-500">Scheme Baseline Ref:</span>
                            <span className="font-mono text-slate-600">{rule.name} ({rule.baseRateMonthly}%)</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-amber-100">
                            <span className="text-slate-500">Monthly Interest Accrual:</span>
                            <span className="font-mono font-bold text-amber-950">{formatCurrency(monthlyInterest)}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-amber-100">
                            <span className="text-slate-500">Full Tenure Interest ({tenureMonths} mo):</span>
                            <span className="font-mono text-slate-700">{formatCurrency(totalTenureInterest)}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-amber-100 text-rose-700 font-medium">
                            <span>Upfront Fees:</span>
                            <span className="font-mono">- {formatCurrency(processingFee + otherCharges)}</span>
                          </div>
                          <div className="flex justify-between py-2 text-sm font-black text-emerald-900">
                            <span>Net Payout to Customer:</span>
                            <span className="font-mono">{formatCurrency(netDisbursed)}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="p-3 bg-amber-50/60 rounded-2xl text-[11px] text-amber-900 mt-3 border border-amber-200/50">
                    A Khatabook ledger debit of {formatCurrency(principalAmount)} will be booked automatically to the branch {disbursementMode} ledger.
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* STEP 4: Vault Custody & Packet Assignment */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Locker Custody & Tamper-Proof Packet Tag</h3>
                <p className="text-slate-500">Assign a physical safe locker, rack and tray location. Generates tamper-proof QR packet tag.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/80 rounded-3xl border border-amber-200/70 space-y-3 shadow-xs">
                  <div className="flex items-center gap-2 text-amber-900 font-extrabold mb-2">
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span>Vault Safe & Storage Coordinate</span>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Strongroom Safe / Locker</label>
                    <select
                      value={lockerId}
                      onChange={(e) => {
                        const lck = lockers.find(l => l.id === e.target.value);
                        setLockerId(e.target.value);
                        if (lck && lck.racks.length > 0) setRack(lck.racks[0]);
                        if (lck && lck.trays.length > 0) setTray(lck.trays[0]);
                      }}
                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-slate-800 font-semibold"
                    >
                      {lockers.map(l => (
                        <option key={l.id} value={l.id}>
                          {l.name} ({l.lockerCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Rack</label>
                      <select
                        value={rack}
                        onChange={(e) => setRack(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-slate-800"
                      >
                        {lockers.find(l => l.id === lockerId)?.racks.map(r => (
                          <option key={r} value={r}>{r}</option>
                        )) || <option value="Rack 1">Rack 1</option>}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Tray / Bin</label>
                      <select
                        value={tray}
                        onChange={(e) => setTray(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-slate-800"
                      >
                        {lockers.find(l => l.id === lockerId)?.trays.map(t => (
                          <option key={t} value={t}>{t}</option>
                        )) || <option value="Tray 01">Tray 01</option>}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Security Pouch Identifier</label>
                    <input
                      type="text"
                      value={bin}
                      onChange={(e) => setBin(e.target.value)}
                      placeholder="e.g. Tamper-proof Pouch #A-44"
                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-slate-800"
                    />
                  </div>
                </div>

                {/* Packet Preview Card */}
                <div className="p-4 liquid-glass-card rounded-3xl border border-amber-200/80 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-extrabold text-slate-900">Security Packet Tag Preview</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-900 font-bold">
                        READY TO SEAL
                      </span>
                    </div>

                    <div className="p-3.5 bg-white text-slate-900 rounded-2xl shadow-sm border border-amber-200/60 space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <div className="font-bold text-xs uppercase tracking-wider">{currentBranch.name}</div>
                        <div className="font-mono text-[10px] font-black text-amber-800">NEXUS GOLD</div>
                      </div>

                      <div className="text-[11px] leading-tight space-y-0.5 text-slate-700">
                        <div>Borrower: <strong>{selectedCustomer?.name}</strong> ({selectedCustomer?.id})</div>
                        <div>Tier: <strong>{selectedCustomer?.customerTier}</strong></div>
                        <div>Total Net Wt: <strong>{formatWeight(goldItems.reduce((s, i) => s + i.netWeight, 0))}</strong></div>
                        <div>Ornaments: <strong>{goldItems.length} items</strong></div>
                        <div>Vault Safe: <strong>{lockerId} / {rack} / {tray}</strong></div>
                      </div>

                      {/* Real Scannable Barcode */}
                      <div className="pt-2 text-center">
                        <img
                          src={generateBarcodeDataUrl('PKT-2026-AUTOGEN', { barWidth: 2, height: 38, fontSize: 10 })}
                          alt="Packet Barcode"
                          className="h-10 mx-auto block"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 mt-3">
                    Clicking <strong>Disburse & Complete Pledge</strong> books the loan in the ledger, generates the pledge receipt, and locks the packet into vault custody.
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div className="p-4 bg-slate-50/90 border-t border-amber-200/60 flex items-center justify-between">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep(prev => (prev - 1) as any)}
            className="px-4 py-2 bg-white hover:bg-slate-100 disabled:opacity-30 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition"
          >
            Previous
          </button>

          <div className="flex items-center gap-2">
            {step < 4 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 2) handleProceedToTerms();
                  else setStep(prev => (prev + 1) as any);
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-300 text-slate-950 font-extrabold text-xs rounded-xl shadow-md shadow-amber-500/25 transition flex items-center gap-1.5 border border-white/50"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Disburse & Complete Pledge</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Embedded UIDAI KYC & Name Sync Modal */}
      {showKycModal && selectedCustomer && (
        <KycVerificationModal
          customer={selectedCustomer}
          onClose={() => setShowKycModal(false)}
        />
      )}
    </div>
  );
};

