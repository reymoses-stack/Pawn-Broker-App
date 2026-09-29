import React, { useState } from 'react';
import { ShieldCheck, Phone, ArrowRight, Lock, Sparkles, Building2 } from 'lucide-react';
import { Customer } from '../types';
import { MOCK_CUSTOMERS, MOCK_BRANCH } from '../data/mockData';
import { Language, translations } from '../i18n/translations';

interface LoginViewProps {
  onLoginSuccess: (customer: Customer) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  language,
  onLanguageChange
}) => {
  const t = translations[language];
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [errorMessage, setErrorMessage] = useState('');
  const [resendTimer, setResendTimer] = useState(30);

  const [customerName, setCustomerName] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber.length !== 10) {
      setErrorMessage(language === 'ta' ? 'சரியான 10 இலக்க மொபைல் எண்ணை உள்ளிடவும்.' : 'Please enter a valid 10-digit mobile number.');
      return;
    }

    const matchedCustomer = MOCK_CUSTOMERS.find(c => c.mobile.endsWith(cleanNumber));
    if (!matchedCustomer) {
      // New Customer - allow login and enquiry!
      setIsNewUser(true);
    } else {
      setIsNewUser(false);
      setCustomerName(matchedCustomer.name);
    }

    setOtpStep(true);
    setResendTimer(30);
  };

  const handleVerifyOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    const fullOtp = otp.join('');
    
    if (fullOtp.length !== 6) {
      setErrorMessage(language === 'ta' ? '6 இலக்க OTP-ஐ உள்ளிடவும்.' : 'Please enter the complete 6-digit OTP code.');
      return;
    }

    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const matchedCustomer = MOCK_CUSTOMERS.find(c => c.mobile.endsWith(cleanNumber));
    
    if (matchedCustomer) {
      onLoginSuccess(matchedCustomer);
    } else {
      // Synthesize new customer profile
      const newCustomer: Customer = {
        id: `CUST-NEW-${cleanNumber.slice(-4)}`,
        name: customerName.trim() || `Customer (+91 ${cleanNumber})`,
        mobile: cleanNumber,
        isNewCustomer: true,
        address: 'New Customer Prospect',
        city: MOCK_BRANCH.city.split(',')[0],
        kycRecord: {
          maskedId: 'Awaiting Counter KYC',
          verifiedDate: new Date().toISOString().split('T')[0],
          status: 'PENDING'
        }
      };
      onLoginSuccess(newCustomer);
    }
  };

  const handleQuickDemoLogin = (customer: Customer) => {
    setPhoneNumber(customer.mobile);
    onLoginSuccess(customer);
  };

  const handleQuickNewCustomerDemo = () => {
    const newDemoCustomer: Customer = {
      id: 'CUST-NEW-9988',
      name: 'Anand Varma (ஆனந்த் வர்மா)',
      mobile: '9840011223',
      isNewCustomer: true,
      address: 'Gandhi Road',
      city: 'Tiruvannamalai',
      kycRecord: {
        maskedId: 'Awaiting Counter KYC',
        verifiedDate: new Date().toISOString().split('T')[0],
        status: 'PENDING'
      }
    };
    setPhoneNumber('9840011223');
    onLoginSuccess(newDemoCustomer);
  };

  const fillDemoOtp = () => {
    setOtp(['1', '2', '3', '4', '5', '6']);
  };

  return (
    <div className="min-h-screen bg-[#fbf9f5] flex flex-col justify-between text-slate-900 relative">
      
      {/* Top Header */}
      <header className="p-4 sm:p-6 flex items-center justify-between max-w-5xl mx-auto w-full z-10 border-b border-amber-200/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-md shadow-amber-500/20 text-slate-950 font-black font-mono text-lg">
            NG
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-1.5">
              <span>{MOCK_BRANCH.name}</span>
            </h1>
            <p className="text-[11px] text-amber-800 font-medium">
              Lic: {MOCK_BRANCH.licenseNumber} • {MOCK_BRANCH.city}
            </p>
          </div>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center bg-white border border-amber-200 rounded-xl p-1 text-xs shadow-2xs">
          <button
            type="button"
            onClick={() => onLanguageChange('en')}
            className={`px-3 py-1 rounded-lg font-bold transition ${
              language === 'en'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => onLanguageChange('ta')}
            className={`px-3 py-1 rounded-lg font-bold transition ${
              language === 'ta'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            தமிழ்
          </button>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 z-10 my-4">
        <div className="w-full max-w-md">
          
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-200/80 relative">
            
            {/* Safe Vault Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold mb-5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>{language === 'ta' ? 'அரசு உரிமம் பெற்ற அடமானப் பாஸ்புக்' : 'Section 25 Licensed Pawnbroker'}</span>
            </div>

            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {t.loginHeader}
            </h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {t.loginDesc}
            </p>

            {/* Error Banner */}
            {errorMessage && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <span className="font-bold">⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {!otpStep ? (
              /* Step 1: Mobile Number */
              <form onSubmit={handleSendOtp} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t.phoneLabel}
                  </label>
                  <div className="flex items-center bg-slate-50 border border-slate-300 rounded-2xl p-1.5 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 transition">
                    <div className="px-3 py-2 bg-amber-100/70 rounded-xl text-amber-950 font-mono font-bold text-xs border border-amber-200 flex items-center gap-1">
                      <span>🇮🇳 +91</span>
                    </div>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder={t.phonePlaceholder}
                      className="w-full bg-transparent px-3 py-2 text-slate-900 font-mono text-base font-semibold placeholder:text-slate-400 focus:outline-none"
                      autoFocus
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    {language === 'ta'
                      ? '💡 புதிய வாடிக்கையாளர்களும் எந்த மொபைல் எண்ணையும் உள்ளிட்டு கடன் விவரங்களை விசாரிக்கலாம்.'
                      : '💡 New customers can also enter any 10-digit mobile number to enquire about gold loans.'}
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs tracking-wide shadow-md shadow-amber-500/20 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{t.sendOtp}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* Step 2: OTP Verification & Optional Name */
              <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      {t.otpHeader}
                    </label>
                    <button
                      type="button"
                      onClick={() => setOtpStep(false)}
                      className="text-xs text-amber-700 hover:underline font-semibold cursor-pointer"
                    >
                      {t.changePhone}
                    </button>
                  </div>
                  
                  <p className="text-[11px] text-slate-500 mb-3">
                    {t.otpDesc} <strong className="text-slate-800 font-mono">+91 {phoneNumber}</strong>
                    {isNewUser && (
                      <span className="block mt-1 text-emerald-700 font-bold">
                        ★ {language === 'ta' ? 'புதிய வாடிக்கையாளர் விசாரிப்புக் கணக்கு' : 'New Customer Enquiry Account'}
                      </span>
                    )}
                  </p>

                  {/* If new user, allow entering their name */}
                  {isNewUser && (
                    <div className="mb-3">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {language === 'ta' ? 'உங்கள் பெயர் (விசாரிப்பிற்கு)' : 'Your Full Name (For Enquiry Ticket)'}
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  )}

                  {/* 6 Digit Inputs */}
                  <div className="flex justify-between gap-1.5">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-${idx}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          const newOtp = [...otp];
                          newOtp[idx] = val;
                          setOtp(newOtp);
                          if (val && idx < 5) {
                            const nextInput = document.getElementById(`otp-${idx + 1}`);
                            nextInput?.focus();
                          }
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
                            const prevInput = document.getElementById(`otp-${idx - 1}`);
                            prevInput?.focus();
                          }
                        }}
                        className="w-12 h-14 bg-slate-50 border border-slate-300 rounded-xl text-center text-xl font-bold font-mono text-amber-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                      />
                    ))}
                  </div>

                  {/* Quick autofill helper */}
                  <div className="mt-3 flex items-center justify-between text-[11px]">
                    <button
                      type="button"
                      onClick={fillDemoOtp}
                      className="text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>{language === 'ta' ? 'தானியங்கி OTP (123456) நிரப்புக' : 'Quick Auto-Fill (123456)'}</span>
                    </button>
                    <span className="text-slate-500 font-mono">
                      {resendTimer > 0 ? `${t.resendIn} ${resendTimer}s` : (
                        <button type="button" onClick={() => setResendTimer(30)} className="text-amber-700 hover:underline font-bold cursor-pointer">
                          {t.resendOtp}
                        </button>
                      )}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs tracking-wide shadow-md shadow-amber-500/20 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>{t.verifyOtp}</span>
                </button>
              </form>
            )}

            {/* Quick Demo Accounts Selection */}
            <div className="mt-7 pt-5 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>{t.quickDemoTitle}</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                {t.quickDemoSubtitle}
              </p>

              <div className="space-y-2">
                
                {/* Dedicated New Customer / Enquirer Demo Option */}
                <button
                  type="button"
                  onClick={handleQuickNewCustomerDemo}
                  className="w-full p-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100/70 hover:to-teal-100/70 border-2 border-emerald-300 transition flex items-center justify-between text-left group cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-emerald-500 text-white font-black flex items-center justify-center text-xs shadow-xs">
                      ✨
                    </div>
                    <div>
                      <div className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                        <span>Anand Varma (புதிய வாடிக்கையாளர்)</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-emerald-200 text-emerald-900 text-[9px] font-black uppercase">
                          New
                        </span>
                      </div>
                      <div className="text-[10px] text-emerald-800 font-medium">
                        First-Time Enquirer • Loan Calculator & Enquiry Form
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-black text-emerald-800 group-hover:text-emerald-950">
                    <span>{language === 'ta' ? 'விசாரிக்க' : 'Enquire'}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                  </div>
                </button>

                {/* Existing Mock Customers */}
                {MOCK_CUSTOMERS.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleQuickDemoLogin(c)}
                    className="w-full p-2.5 rounded-xl bg-amber-50/50 hover:bg-amber-100/60 border border-amber-200/80 transition flex items-center justify-between text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={c.photoUrl}
                        alt={c.name}
                        className="w-8 h-8 rounded-full object-cover border border-amber-300"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900 group-hover:text-amber-900 transition">
                          {c.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          +91 {c.mobile} • {c.city}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800 group-hover:text-amber-950">
                      <span>{language === 'ta' ? 'பாஸ்புக்' : 'Passbook'}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-[11px] text-slate-500 border-t border-amber-200/40 bg-white/50">
        <div>
          {MOCK_BRANCH.name} • {MOCK_BRANCH.address}, {MOCK_BRANCH.city}
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">
          Powered by Nexus OS Pawnbroking Cloud • Safe & Bank-Grade Encrypted
        </div>
      </footer>
    </div>
  );
};
