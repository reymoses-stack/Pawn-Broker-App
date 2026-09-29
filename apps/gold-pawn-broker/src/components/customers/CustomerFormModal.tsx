import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Customer, CustomerTier } from '../../types';
import { WebcamCapture } from './WebcamCapture';
import { 
  UserPlus, X, User, Phone, MapPin, Briefcase, Heart, 
  FileText, Award, Percent, ShieldCheck, CheckCircle2, 
  AlertTriangle, RefreshCw, Smartphone, ArrowLeftRight, UserCheck, UserX
} from 'lucide-react';
import { 
  validateVerhoeffAadhaar, 
  compareNames, 
  requestUidaiOtp, 
  verifyUidaiOtpAndFetchKyc,
  UidaiKycDetails
} from '../../utils/uidaiVerificationService';

interface CustomerFormModalProps {
  onClose: () => void;
  customerToEdit?: Customer;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({ onClose, customerToEdit }) => {
  const { addCustomer, updateCustomer } = useApp();

  const [formData, setFormData] = useState({
    name: customerToEdit?.name || '',
    mobile: customerToEdit?.mobile || '',
    secondaryMobile: customerToEdit?.secondaryMobile || '',
    aadhaarNumber: customerToEdit?.aadhaarNumber || customerToEdit?.kycRecord?.maskedId || '',
    dateOfBirth: customerToEdit?.dateOfBirth || '1990-01-01',
    address: customerToEdit?.address || '',
    city: customerToEdit?.city || 'Chennai',
    pincode: customerToEdit?.pincode || '600001',
    occupation: customerToEdit?.occupation || 'Business',
    nomineeName: customerToEdit?.nomineeName || '',
    nomineeRelation: customerToEdit?.nomineeRelation || 'Spouse',
    nomineePhone: customerToEdit?.nomineePhone || '',
    photoUrl: customerToEdit?.photoUrl || '',
    kycStatus: customerToEdit?.kycStatus || 'Pending',
    notes: customerToEdit?.notes || '',
    customerTier: (customerToEdit?.customerTier || 'Standard') as CustomerTier,
    preferredBrokerRateAdjustment: customerToEdit?.preferredBrokerRateAdjustment !== undefined ? customerToEdit.preferredBrokerRateAdjustment : 85,
    preferredInterestRate: customerToEdit?.preferredInterestRate !== undefined ? customerToEdit.preferredInterestRate : 2.0
  });

  // UIDAI verification states
  const [showUidaiSection, setShowUidaiSection] = useState(false);
  const [aadhaarValidation, setAadhaarValidation] = useState<{ isValid: boolean; error?: string }>({ isValid: true });
  const [uidaiOtpSent, setUidaiOtpSent] = useState(false);
  const [uidaiOtpCode, setUidaiOtpCode] = useState('');
  const [isVerifyingUidai, setIsVerifyingUidai] = useState(false);
  const [uidaiDetails, setUidaiDetails] = useState<UidaiKycDetails | null>(null);
  const [uidaiError, setUidaiError] = useState<string | null>(null);

  const handleAadhaarInputChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 12);
    setFormData(prev => ({ ...prev, aadhaarNumber: cleaned }));
    if (cleaned.length === 12) {
      setAadhaarValidation(validateVerhoeffAadhaar(cleaned));
    } else {
      setAadhaarValidation({ isValid: false, error: `${cleaned.length}/12 Digits` });
    }
  };

  const handleSendUidaiOtp = async () => {
    if (!formData.aadhaarNumber || formData.aadhaarNumber.length < 12) {
      alert('Please enter a valid 12-digit Aadhaar number');
      return;
    }
    setUidaiError(null);
    try {
      await requestUidaiOtp(formData.aadhaarNumber);
      setUidaiOtpSent(true);
      setUidaiOtpCode('');
      setUidaiDetails(null);
    } catch (err: any) {
      setUidaiError(err.message || 'Failed to dispatch Aadhaar OTP');
    }
  };

  const handleVerifyUidaiOtp = async () => {
    if (!uidaiOtpCode || uidaiOtpCode.length < 4) {
      alert('Please enter the 6-digit OTP');
      return;
    }
    setIsVerifyingUidai(true);
    setUidaiError(null);
    try {
      const details = await verifyUidaiOtpAndFetchKyc({
        aadhaarNumber: formData.aadhaarNumber,
        otp: uidaiOtpCode,
        enteredCustomerName: formData.name,
        transactionId: `UIDAI-FRM-${Date.now().toString().slice(-6)}`
      });
      setUidaiDetails(details);
    } catch (err: any) {
      setUidaiError(err.message || 'OTP verification failed');
    } finally {
      setIsVerifyingUidai(false);
    }
  };

  const handleApplyAadhaarSync = () => {
    if (!uidaiDetails) return;
    setFormData(prev => ({
      ...prev,
      name: uidaiDetails.aadhaarLegalName,
      address: uidaiDetails.address || prev.address,
      city: uidaiDetails.city || prev.city,
      pincode: uidaiDetails.pincode || prev.pincode,
      dateOfBirth: uidaiDetails.dob || prev.dateOfBirth,
      kycStatus: 'Verified',
      photoUrl: uidaiDetails.photoUrl || prev.photoUrl
    }));
    setShowUidaiSection(false);
  };

  const handleTierChange = (tier: CustomerTier) => {
    let rateAdj = 85;
    let interestRate = 2.0;
    if (tier === 'VIP Gold') {
      rateAdj = 92;
      interestRate = 1.5;
    } else if (tier === 'Regular Premium') {
      rateAdj = 88;
      interestRate = 1.75;
    } else if (tier === 'Standard') {
      rateAdj = 85;
      interestRate = 2.0;
    } else if (tier === 'New Customer' || tier === 'New Borrower') {
      rateAdj = 80;
      interestRate = 2.5;
    }

    setFormData(prev => ({
      ...prev,
      customerTier: tier,
      preferredBrokerRateAdjustment: rateAdj,
      preferredInterestRate: interestRate
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.mobile) {
      alert('Please enter customer full name and mobile number');
      return;
    }

    if (customerToEdit) {
      updateCustomer(customerToEdit.id, formData);
    } else {
      addCustomer(formData as any);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="liquid-glass-modal border border-amber-200/80 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500/15 via-white/50 to-yellow-500/10 border-b border-amber-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 liquid-glass-gold text-amber-950 rounded-2xl border border-amber-300 shadow-xs">
              <UserPlus className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                {customerToEdit ? `Edit Customer Profile (${customerToEdit.id})` : 'New Customer Registration'}
              </h3>
              <p className="text-[11px] text-slate-500">Master Customer Record • Relationship Tier & Broker Rate Preset</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* Top Row: Camera Capture & Core Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            <div className="bg-white/80 p-3 rounded-2xl border border-amber-200/70 shadow-xs">
              <WebcamCapture
                initialPhotoUrl={formData.photoUrl}
                onCapture={(url) => setFormData(prev => ({ ...prev, photoUrl: url }))}
              />
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-700" />
                  <span>Full Customer Name *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. S. Ramachandran"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/90 border border-amber-200/80 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400/40 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    <span>Mobile No *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-3 py-2 bg-white/90 border border-amber-200/80 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400/40 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    <span>Secondary Mobile</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="Alt phone"
                    value={formData.secondaryMobile}
                    onChange={(e) => setFormData({ ...formData, secondaryMobile: e.target.value })}
                    className="w-full px-3 py-2 bg-white/90 border border-amber-200/80 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400/40 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 bg-white/90 border border-amber-200/80 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-purple-600" />
                    <span>Occupation</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Textile Trader"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    className="w-full px-3 py-2 bg-white/90 border border-amber-200/80 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                  />
                </div>
              </div>

              {/* Aadhaar Number & UIDAI Name Sync */}
              <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                    <span>Aadhaar Number (12 Digits)</span>
                  </label>
                  {formData.aadhaarNumber && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      aadhaarValidation.isValid
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}>
                      {aadhaarValidation.isValid ? '✓ Verhoeff Valid' : '✕ Invalid Checksum'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={14}
                    placeholder="e.g. 9841 2345 6789"
                    value={formData.aadhaarNumber.replace(/(\d{4})/g, '$1 ').trim()}
                    onChange={(e) => handleAadhaarInputChange(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-slate-900 font-mono font-bold text-xs tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowUidaiSection(!showUidaiSection);
                      if (!uidaiOtpSent && formData.aadhaarNumber.length === 12) {
                        handleSendUidaiOtp();
                      }
                    }}
                    disabled={formData.aadhaarNumber.length < 12}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-bold text-[11px] rounded-xl shadow-xs transition flex items-center gap-1 whitespace-nowrap"
                  >
                    <ArrowLeftRight className="w-3 h-3" />
                    <span>Verify & Sync</span>
                  </button>
                </div>

                {/* Quick UIDAI Verification & Sync Card */}
                {showUidaiSection && (
                  <div className="p-3 bg-white rounded-xl border border-amber-300 space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                        <span>UIDAI OTP Verification</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setUidaiOtpCode('482915')}
                        className="text-[10px] text-amber-700 underline font-semibold"
                      >
                        Use Demo OTP (482915)
                      </button>
                    </div>

                    {uidaiError && (
                      <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[10px]">
                        {uidaiError}
                      </div>
                    )}

                    {!uidaiDetails ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="6-digit OTP"
                          value={uidaiOtpCode}
                          onChange={(e) => setUidaiOtpCode(e.target.value.replace(/\D/g, ''))}
                          className="flex-1 px-3 py-1.5 bg-slate-50 border border-amber-300 rounded-lg text-center font-mono font-bold tracking-widest text-xs"
                        />
                        <button
                          type="button"
                          disabled={uidaiOtpCode.length < 4 || isVerifyingUidai}
                          onClick={handleVerifyUidaiOtp}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition flex items-center gap-1"
                        >
                          {isVerifyingUidai ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                          <span>Check Match</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 border border-amber-200">
                          <div>
                            <span className="text-[10px] text-slate-500 block">UIDAI Legal Name:</span>
                            <strong className="text-slate-900 font-extrabold">{uidaiDetails.aadhaarLegalName}</strong>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            uidaiDetails.nameMatchResult.isMatchAcceptable
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}>
                            {uidaiDetails.nameMatchResult.score}% Match ({uidaiDetails.nameMatchResult.matchLevel})
                          </span>
                        </div>

                        <p className="text-[10px] text-slate-600">
                          {uidaiDetails.nameMatchResult.message}
                        </p>

                        <button
                          type="button"
                          onClick={handleApplyAadhaarSync}
                          className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Sync Official Legal Name & Address to Form</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Relationship Tier & Pawn Broker Desired Rate Configuration */}
          <div className="p-4 bg-gradient-to-r from-amber-500/10 via-white/80 to-amber-50/50 rounded-2xl border border-amber-300/70 space-y-3 text-xs shadow-xs">
            <div className="flex items-center justify-between">
              <div className="font-extrabold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-700" />
                <span>Customer Loyalty Tier & Desired Broker Mortgage Valuation %</span>
              </div>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-300/60">
                Pawn Broker Custom Appraisal Rate
              </span>
            </div>
            
            <p className="text-slate-600 text-[11px] leading-relaxed">
              When this customer pledges gold, the system will appraise items at this chosen mortgage rate percentage of the live <strong>GoodReturns</strong> spot market bullion rate.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['VIP Gold', 'Regular Premium', 'Standard', 'New Customer'] as const).map(tier => (
                <button
                  type="button"
                  key={tier}
                  onClick={() => handleTierChange(tier)}
                  className={`p-2 rounded-xl text-left border transition ${
                    formData.customerTier === tier
                      ? 'bg-gradient-to-br from-amber-500/25 to-yellow-500/15 border-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-white'
                  }`}
                >
                  <div className="font-bold text-[11px]">{tier}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {tier === 'VIP Gold' ? '92% of Spot' : tier === 'Regular Premium' ? '88% of Spot' : tier === 'Standard' ? '85% of Spot' : '80% of Spot'}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
              <label className="font-bold text-slate-700 text-xs flex items-center gap-1.5 min-w-[200px]">
                <Percent className="w-3.5 h-3.5 text-amber-600" />
                <span>Custom Broker Margin Rate %:</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="50"
                  max="100"
                  step="0.5"
                  value={formData.preferredBrokerRateAdjustment}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferredBrokerRateAdjustment: parseFloat(e.target.value) || 85 }))}
                  className="w-24 px-2.5 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                />
                <span className="text-[11px] text-slate-500">
                  (e.g., if GoodReturns 22K is ₹7,260/g, appraisal will be ₹{Math.round(7260 * (formData.preferredBrokerRateAdjustment / 100))}/g)
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-amber-100">
              <label className="font-bold text-slate-700 text-xs flex items-center gap-1.5 min-w-[200px]">
                <Percent className="w-3.5 h-3.5 text-emerald-600" />
                <span>Negotiated Interest Rate (%/mo):</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0.5"
                  max="10.0"
                  step="0.1"
                  value={formData.preferredInterestRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferredInterestRate: parseFloat(e.target.value) || 2.0 }))}
                  className="w-24 px-2.5 py-1.5 bg-white border border-emerald-300 rounded-xl text-xs font-mono font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                />
                <span className="text-[11px] text-slate-500">
                  Pawnbroker agreed rate (defaults automatically in new mortgages for this customer)
                </span>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="p-4 bg-white/70 rounded-2xl border border-amber-200/60 space-y-3 text-xs shadow-xs">
            <div className="font-extrabold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Residential Address & Location</span>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Door No, Street & Area</label>
              <textarea
                rows={2}
                placeholder="Complete street address as per Aadhaar / utility bill"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-amber-200/70 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">City / Town</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-amber-200/70 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pincode</label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-amber-200/70 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400/40 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Nominee & Emergency Contact */}
          <div className="p-4 bg-white/70 rounded-2xl border border-amber-200/60 space-y-3 text-xs shadow-xs">
            <div className="font-extrabold text-slate-900 flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              <span>Nominee / Emergency Contact</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nominee Name</label>
                <input
                  type="text"
                  placeholder="Full name"
                  value={formData.nomineeName}
                  onChange={(e) => setFormData({ ...formData, nomineeName: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-amber-200/70 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Relationship</label>
                <select
                  value={formData.nomineeRelation}
                  onChange={(e) => setFormData({ ...formData, nomineeRelation: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-amber-200/70 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                >
                  <option value="Spouse">Spouse</option>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Son">Son</option>
                  <option value="Daughter">Daughter</option>
                  <option value="Brother">Brother</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nominee Phone</label>
                <input
                  type="tel"
                  placeholder="Emergency phone"
                  value={formData.nomineePhone}
                  onChange={(e) => setFormData({ ...formData, nomineePhone: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-amber-200/70 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400/40 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Internal Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Internal Staff Notes & Special Relationship Notes</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Regular high-value customer, immediate loan clearance permitted"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-white/90 border border-amber-200/70 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
            />
          </div>

          <div className="p-4 bg-gradient-to-r from-amber-500/10 via-white/80 to-yellow-500/10 border-t border-amber-200/60 flex items-center justify-end gap-3 -mx-5 -mb-5 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white/80 hover:bg-white rounded-xl border border-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/25 transition border border-white/50"
            >
              {customerToEdit ? 'Save Customer Profile' : 'Register Customer Profile'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

