import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ShieldCheck, Lock, Mail, Smartphone, KeyRound, 
  Sparkles, ArrowRight, UserCheck, AlertCircle, Eye, 
  EyeOff, CheckCircle2, Crown, Users, RefreshCw, Send
} from 'lucide-react';
import { User } from '../../types';
import { LanguageToggle } from '../common/LanguageToggle';
import { 
  sendRealFirebaseOtp, 
  verifyRealFirebaseOtp, 
  loginWithRealFirebaseEmail 
} from '../../firebase/authService';

export const LoginPage: React.FC = () => {
  const { 
    loginWithEmail, 
    loginWithMobileOtp, 
    loginWithUsernamePassword, 
    completeFirstTimePasswordChange,
    authNotice,
    setAuthNotice,
    users,
    language,
    t
  } = useApp();

  // Primary mode: 'owner' | 'employee'
  const [activePortal, setActivePortal] = useState<'owner' | 'employee'>('owner');

  // Owner method: 'email' | 'otp'
  const [ownerMethod, setOwnerMethod] = useState<'email' | 'otp'>('email');

  // Owner Email state
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Owner Mobile OTP state
  const [ownerMobile, setOwnerMobile] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [smsNotification, setSmsNotification] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isFirebaseSession, setIsFirebaseSession] = useState(false);

  // Employee Login state
  const [employeeUsername, setEmployeeUsername] = useState('');
  const [employeePassword, setEmployeePassword] = useState('');
  const [showEmployeePassword, setShowEmployeePassword] = useState(false);

  // First-Time Password Change state
  const [pendingChangeUser, setPendingChangeUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // General error/success state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Find default owner from users
  const defaultOwner = users.find(u => u.isOwner || u.role === 'Master Admin / Owner') || users[0];

  // OTP Countdown timer
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  // Handle Owner Email Login (Real Firebase + ERP session)
  const handleOwnerEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const email = ownerEmail.trim() || defaultOwner.email;
    const pwd = ownerPassword.trim();

    if (!pwd) {
      setErrorMessage('Please enter your owner master password.');
      setIsLoading(false);
      return;
    }

    try {
      // Connect to Google Firebase Real Email Authentication
      const fbRes = await loginWithRealFirebaseEmail(email, pwd);
      if (!fbRes.success) {
        if (fbRes.message && (fbRes.message.includes('password') || fbRes.message.includes('Password'))) {
          setErrorMessage(fbRes.message);
          setIsLoading(false);
          return;
        }
      }
    } catch (fbErr: any) {
      console.warn('Firebase email auth notice:', fbErr);
    }

    const res = loginWithEmail(email, pwd);
    if (!res.success) {
      if (res.mustChangePassword && res.user) {
        setPendingChangeUser(res.user);
      } else {
        setErrorMessage(res.message || 'Invalid email or password.');
      }
    }
    setIsLoading(false);
  };

  // Play realistic SMS chime
  const playSmsChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {
      // AudioContext could be blocked if no user interaction
    }
  };

  // Handle Send Mobile OTP (Dispatches Real SMS via Firebase Auth)
  const handleSendOtp = async () => {
    setErrorMessage(null);
    const mobile = ownerMobile.trim() || defaultOwner.phone;
    const clean = mobile.replace(/\D/g, '');

    if (clean.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    // Check if it's the offline demo fill number (9840123456)
    if (clean === '9840123456') {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      setOtpSent(true);
      setOtpCountdown(60);
      setIsFirebaseSession(false);
      playSmsChime();
      setSmsNotification(`🔔 [DEMO MODE] Nexus Gold Owner Login OTP is: ${code}`);
      setTimeout(() => setSmsNotification(null), 8000);
      return;
    }

    // Real Mobile Number: Dispatch Real SMS OTP via Google Firebase Auth
    setIsSendingOtp(true);
    try {
      const result = await sendRealFirebaseOtp(mobile, 'recaptcha-container');
      if (result.success) {
        setOtpSent(true);
        setOtpCountdown(60);
        setIsFirebaseSession(true);
        setGeneratedOtp('');
        playSmsChime();
        setSmsNotification(`📲 Real SMS OTP sent via Google Firebase to +91 ${clean.slice(-10)}! Please check your phone messages.`);
        setTimeout(() => setSmsNotification(null), 12000);
      } else {
        setErrorMessage(result.message || 'Failed to dispatch real SMS OTP. Please check phone number format.');
      }
    } catch (err: any) {
      console.error('Firebase SMS OTP dispatch failed:', err);
      setErrorMessage(err?.message || 'Error communicating with Google Firebase SMS Gateway.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle Verify Mobile OTP (Verifies against Google Firebase confirmation session)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const mobile = ownerMobile.trim() || defaultOwner.phone;
    const clean = mobile.replace(/\D/g, '');
    const code = enteredOtp.trim();

    if (isFirebaseSession) {
      // Real Firebase Verification
      try {
        const verifyRes = await verifyRealFirebaseOtp(code);
        if (!verifyRes.success) {
          setErrorMessage(verifyRes.message || 'Incorrect 6-digit OTP code. Please check your SMS.');
          setIsLoading(false);
          return;
        }
      } catch (err: any) {
        setErrorMessage(err?.message || 'Failed to verify OTP with Google Firebase.');
        setIsLoading(false);
        return;
      }
    } else {
      // Demo fallback check
      if (generatedOtp && code !== generatedOtp && code !== '123456') {
        setErrorMessage('Incorrect OTP. Please enter the generated demo code.');
        setIsLoading(false);
        return;
      }
    }

    // Set authenticated session in AppContext
    const res = loginWithMobileOtp(mobile, code);
    if (!res.success) {
      setErrorMessage(res.message || 'Authentication error.');
    }
    setIsLoading(false);
  };

  // Handle Employee Login
  const handleEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      if (!employeeUsername.trim() || !employeePassword.trim()) {
        setErrorMessage('Please enter both username and password.');
        setIsLoading(false);
        return;
      }

      const res = loginWithUsernamePassword(employeeUsername.trim(), employeePassword.trim());
      if (!res.success) {
        if (res.mustChangePassword && res.user) {
          // Transition to mandatory first-time password change screen!
          setPendingChangeUser(res.user);
        } else {
          setErrorMessage(res.message || 'Authentication failed. Please verify credentials.');
        }
      }
      setIsLoading(false);
    }, 400);
  };

  // Handle Mandatory First-Time Password Change
  const handleFirstTimePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    if (!pendingChangeUser) return;

    setIsLoading(true);
    setTimeout(() => {
      const success = completeFirstTimePasswordChange(pendingChangeUser.id, newPassword);
      if (!success) {
        setErrorMessage('Failed to update password. Please try again.');
      }
      setIsLoading(false);
    }, 500);
  };

  // 1-Click Demo Fill helpers
  const fillOwnerDemoEmail = () => {
    setOwnerEmail(defaultOwner.email);
    setOwnerPassword(defaultOwner.password || 'Owner@1234');
    setErrorMessage(null);
  };

  const fillOwnerDemoMobile = () => {
    setOwnerMobile(defaultOwner.phone);
    setErrorMessage(null);
  };

  const fillEmployeeDemo = (user: User) => {
    setEmployeeUsername(user.username || user.email);
    setEmployeePassword(user.password || 'Temp@1234');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf8f5] via-[#f7f3eb] to-[#f4eee1] flex flex-col justify-between selection:bg-amber-400 selection:text-amber-950 font-sans p-4 sm:p-6 relative overflow-hidden">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-amber-300/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-yellow-400/20 blur-3xl pointer-events-none" />

      {/* Top Header / Brand Bar */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between py-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl liquid-glass-gold flex items-center justify-center border border-amber-300/80 shadow-md">
            <Crown className="w-5 h-5 text-amber-900" />
          </div>
          <div>
            <div className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>NEXUS GOLD</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-900 px-2 py-0.5 rounded-full font-mono font-bold border border-amber-400/40">
                SOVEREIGN OS
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              {language === 'ta' ? 'தங்க அடமானக் கடை & லாக்கர் மேலாண்மை' : 'Gold Pawn Brokerage & Vault Management'}
            </div>
          </div>
        </div>

        {/* Language Switcher & Security Badge */}
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl liquid-glass border border-amber-200/80 text-[11px] font-semibold text-slate-700 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>256-Bit Vault</span>
          </div>
        </div>
      </header>

      {/* Main Login Card Area */}
      <main className="max-w-md w-full mx-auto my-auto relative z-10 py-6">
        
        {/* Session Expired Notice if applicable */}
        {authNotice && (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-500/15 border border-amber-400/60 text-amber-950 text-xs flex items-start gap-2.5 shadow-sm animate-in fade-in slide-in-from-top-2">
            <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">
              {authNotice}
            </div>
            <button 
              type="button" 
              onClick={() => setAuthNotice(null)}
              className="text-amber-800 hover:text-amber-950 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Simulated Mobile SMS Toast Banner */}
        {smsNotification && (
          <div className="mb-4 p-3.5 rounded-2xl bg-blue-500/15 border border-blue-400/60 text-blue-950 text-xs flex items-start justify-between gap-2.5 shadow-md animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-700 shrink-0" />
              <span className="font-mono font-semibold">{smsNotification}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (generatedOtp) setEnteredOtp(generatedOtp);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 rounded text-[10px] font-bold shrink-0 shadow-xs"
            >
              Auto-Fill
            </button>
          </div>
        )}

        {/* Card Container */}
        <div className="liquid-glass rounded-3xl border border-amber-200/80 shadow-[0_12px_40px_rgba(217,119,6,0.12)] p-6 sm:p-8 backdrop-blur-xl">

          {/* Conditional View: First-Time Password Change Mode */}
          {pendingChangeUser ? (
            <div className="space-y-5 animate-in fade-in zoom-in-95">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-300 mx-auto flex items-center justify-center text-amber-900 shadow-sm">
                  <KeyRound className="w-6 h-6 text-amber-700" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 pt-2">
                  First-Time Login Security Setup
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Welcome, <strong className="text-amber-900">{pendingChangeUser.name}</strong> ({pendingChangeUser.role})!
                  The business owner issued a temporary password. You must set your permanent password to activate your account.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleFirstTimePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    New Secure Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      autoFocus
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-amber-200/80 bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    required
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-amber-200/80 bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-200 text-[11px] text-slate-600 space-y-1">
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Password Rules</span>
                  </div>
                  <div>• Minimum 6 characters</div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-2xl liquid-glass-gold font-bold text-amber-950 border border-amber-300 shadow-md hover:brightness-105 active:scale-[0.99] transition flex items-center justify-center gap-2 text-sm"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-900" />
                  ) : (
                    <>
                      <span>Save Password & Log In</span>
                      <ArrowRight className="w-4 h-4 text-amber-900" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPendingChangeUser(null);
                      setErrorMessage(null);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 underline"
                  >
                    Cancel and return to login
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Regular Login View: Owner vs Employee */
            <div className="space-y-6">
              
              {/* Primary Portal Selector: Owner vs Employee */}
              <div className="flex p-1 bg-amber-200/40 rounded-2xl border border-amber-300/40">
                <button
                  type="button"
                  onClick={() => {
                    setActivePortal('owner');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                    activePortal === 'owner'
                      ? 'bg-white text-amber-950 shadow-sm border border-amber-300/70'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Crown className="w-3.5 h-3.5 text-amber-600" />
                  <span>{language === 'ta' ? 'உரிமையாளர் (Owner)' : 'Owner Portal (உரிமையாளர்)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActivePortal('employee');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                    activePortal === 'employee'
                      ? 'bg-white text-slate-900 shadow-sm border border-amber-300/70'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>{language === 'ta' ? 'பணியாளர் (Staff)' : 'Staff / Employee'}</span>
                </button>
              </div>

              {/* Error Notice */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* OWNER PORTAL CONTENT */}
              {activePortal === 'owner' && (
                <div className="space-y-5">
                  <div className="text-center space-y-1">
                    <h2 className="text-base font-extrabold text-slate-900 flex items-center justify-center gap-1.5">
                      <span>{language === 'ta' ? 'உரிமையாளர் நேரடி உள்நுழைவு' : 'Owner Secure Authentication'}</span>
                      <Crown className="w-4 h-4 text-amber-600" />
                    </h2>
                    <p className="text-xs text-slate-500">
                      {language === 'ta' ? 'மின்னஞ்சல் அல்லது மொபைல் OTP மூலம் உள்நுழைக' : 'Sign in using your registered Email or Mobile OTP'}
                    </p>
                  </div>

                  {/* Owner Method Toggle: Email vs Mobile OTP */}
                  <div className="flex border-b border-amber-200/80 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        setOwnerMethod('email');
                        setErrorMessage(null);
                      }}
                      className={`flex-1 pb-2 flex items-center justify-center gap-1.5 border-b-2 transition ${
                        ownerMethod === 'email'
                          ? 'border-amber-600 text-amber-950 font-bold'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{language === 'ta' ? 'மின்னஞ்சல் & கடவுச்சொல்' : 'Email & Password'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOwnerMethod('otp');
                        setErrorMessage(null);
                      }}
                      className={`flex-1 pb-2 flex items-center justify-center gap-1.5 border-b-2 transition ${
                        ownerMethod === 'otp'
                          ? 'border-amber-600 text-amber-950 font-bold'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>{language === 'ta' ? 'மொபைல் OTP' : 'Mobile OTP'}</span>
                    </button>
                  </div>

                  {/* Owner Method A: Email & Password */}
                  {ownerMethod === 'email' && (
                    <form onSubmit={handleOwnerEmailSubmit} className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700">Owner Email</label>
                          <button
                            type="button"
                            onClick={fillOwnerDemoEmail}
                            className="text-[10px] text-amber-700 hover:text-amber-900 font-bold underline"
                          >
                            Quick Demo Fill
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type="email"
                            value={ownerEmail}
                            onChange={(e) => setOwnerEmail(e.target.value)}
                            placeholder="rajesh.owner@nexusgold.com"
                            className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-amber-200/80 bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                          />
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={ownerPassword}
                            onChange={(e) => setOwnerPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-amber-200/80 bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                          />
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 rounded-2xl liquid-glass-gold font-bold text-amber-950 border border-amber-300 shadow-md hover:brightness-105 active:scale-[0.99] transition flex items-center justify-center gap-2 text-sm"
                      >
                        {isLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin text-amber-900" />
                        ) : (
                          <>
                            <span>{language === 'ta' ? 'உள்நுழைக' : 'Log In'}</span>
                            <ArrowRight className="w-4 h-4 text-amber-900" />
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  {/* Owner Method B: Mobile OTP */}
                  {ownerMethod === 'otp' && (
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700">Registered Mobile Number</label>
                          <button
                            type="button"
                            onClick={fillOwnerDemoMobile}
                            className="text-[10px] text-amber-700 hover:text-amber-900 font-bold underline"
                          >
                            Use Demo Phone
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">+91</span>
                            <input
                              type="tel"
                              value={ownerMobile}
                              onChange={(e) => setOwnerMobile(e.target.value)}
                              placeholder="98401 23456"
                              className="w-full pl-11 pr-3.5 py-2.5 text-sm rounded-xl border border-amber-200/80 bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-mono"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={otpCountdown > 0 || isSendingOtp}
                            className="px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-950 font-bold text-xs border border-amber-300/80 transition shrink-0 disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {isSendingOtp ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-900" />
                                <span>Sending SMS...</span>
                              </>
                            ) : otpCountdown > 0 ? (
                              `${otpCountdown}s` 
                            ) : otpSent ? (
                              (language === 'ta' ? 'மீண்டும் அனுப்புக' : 'Resend') 
                            ) : (
                              (language === 'ta' ? 'OTP அனுப்புக' : 'Send Real OTP')
                            )}
                          </button>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>Google Firebase SMS Gateway active • Dispatches real 6-digit OTP</span>
                        </div>
                      </div>

                      {otpSent && (
                        <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-bold text-slate-700">
                                {language === 'ta' ? '6-இலக்க OTP உள்ளிடவும்' : 'Enter 6-Digit OTP'}
                              </label>
                              {generatedOtp ? (
                                <button
                                  type="button"
                                  onClick={() => setEnteredOtp(generatedOtp)}
                                  className="text-[10px] text-amber-800 font-bold underline"
                                >
                                  {language === 'ta' ? 'தானாக நிரப்புக' : 'Fill Demo OTP'} ({generatedOtp})
                                </button>
                              ) : (
                                <span className="text-[10px] text-emerald-700 font-semibold">
                                  ✓ SMS dispatched to your phone
                                </span>
                              )}
                            </div>
                            <input
                              type="text"
                              maxLength={6}
                              value={enteredOtp}
                              onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                              placeholder="••••••"
                              autoFocus
                              className="w-full py-2.5 text-center text-lg tracking-[0.5em] font-mono font-bold rounded-xl border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-inner"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={isLoading || enteredOtp.length < 4}
                            className="w-full py-3 rounded-2xl liquid-glass-gold font-bold text-amber-950 border border-amber-300 shadow-md hover:brightness-105 active:scale-[0.99] transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                          >
                            {isLoading ? (
                              <RefreshCw className="w-4 h-4 animate-spin text-amber-900" />
                            ) : (
                              <>
                                <span>{language === 'ta' ? 'OTP சரிபார்த்து உள்நுழைக' : 'Verify OTP & Log In'}</span>
                                <ArrowRight className="w-4 h-4 text-amber-900" />
                              </>
                            )}
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                </div>
              )}

              {/* EMPLOYEE / STAFF PORTAL CONTENT */}
              {activePortal === 'employee' && (
                <div className="space-y-5">
                  <div className="text-center space-y-1">
                    <h2 className="text-base font-extrabold text-slate-900 flex items-center justify-center gap-1.5">
                      <span>Staff Member Access</span>
                      <Users className="w-4 h-4 text-blue-600" />
                    </h2>
                    <p className="text-xs text-slate-500">
                      Log in using the credentials generated by the business owner
                    </p>
                  </div>

                  <form onSubmit={handleEmployeeSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Username or Work Email
                      </label>
                      <input
                        type="text"
                        value={employeeUsername}
                        onChange={(e) => setEmployeeUsername(e.target.value)}
                        placeholder="e.g. kavitha_mgr or anand_cash"
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-amber-200/80 bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                      <div className="relative">
                        <input
                          type={showEmployeePassword ? 'text' : 'password'}
                          value={employeePassword}
                          onChange={(e) => setEmployeePassword(e.target.value)}
                          placeholder="Temporary or personal password"
                          className="w-full pl-3.5 pr-10 py-2.5 text-sm rounded-xl border border-amber-200/80 bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowEmployeePassword(!showEmployeePassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                        >
                          {showEmployeePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-200 text-[11px] text-blue-900 leading-relaxed">
                      💡 <strong>First-Time Login Note:</strong> If this is your first time logging in, the system will prompt you to set your own private password.
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-md active:scale-[0.99] transition flex items-center justify-center gap-2 text-sm"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <>
                          <span>{language === 'ta' ? 'பணியாளர் உள்நுழைக' : 'Staff Log In'}</span>
                          <ArrowRight className="w-4 h-4 text-white" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Quick Demo Pre-fill for staff testing */}
                  {users.filter(u => !u.isOwner && u.role !== 'Master Admin / Owner').length > 0 && (
                    <div className="pt-2 border-t border-amber-200/60">
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5 text-center">
                        Staff Accounts
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        {users.filter(u => !u.isOwner && u.role !== 'Master Admin / Owner').slice(0, 4).map(u => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => fillEmployeeDemo(u)}
                            className="p-1.5 rounded-lg border border-amber-200 bg-white/60 hover:bg-amber-50 text-slate-700 text-left truncate transition"
                          >
                            <div className="font-bold truncate">{u.name}</div>
                            <div className="text-[9px] text-slate-500">{u.role}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

        </div>

        {/* Global permanent invisible reCAPTCHA container - never unmounted */}
        <div id="recaptcha-container" className="flex justify-center mt-2"></div>

      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full text-center py-2 text-[11px] text-slate-400 relative z-10">
        Nexus Gold ERP • Sovereign Pawnbroker Vault Operating System • v2.0
      </footer>

    </div>
  );
};
