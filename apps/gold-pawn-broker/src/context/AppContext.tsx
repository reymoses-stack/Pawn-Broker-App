import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, UserRole, Branch, BankAccount, Customer, Mortgage, GoldPacket, 
  LockerLocation, Payment, LedgerEntry, Expense, 
  AuditLog, InterestRule, BusinessSettings, KycProvider,
  DisbursementMode, PaymentMethod, GoodReturnsRateData, AuthSession,
  RbacMatrix, RolePermissionSet, PawnEnquiry
} from '../types';
import { 
  SEED_USERS, SEED_BRANCHES, SEED_BANK_ACCOUNTS, SEED_INTEREST_RULES, 
  SEED_LOCKERS, SEED_CUSTOMERS, SEED_MORTGAGES, 
  SEED_PACKETS, SEED_PAYMENTS, SEED_LEDGER, 
  SEED_EXPENSES, SEED_AUDIT_LOGS, SEED_SETTINGS,
  DEFAULT_RBAC_MATRIX
} from '../data/seedData';
import { subscribeToEnquiries, updateRemoteEnquiryStatus } from '../utils/enquirySyncService';
import { calculateInterest } from '../utils/interestEngine';
import { 
  getGoodReturnsRatesForCity, 
  saveGoodReturnsOverride, 
  clearGoodReturnsOverride, 
  fetchLiveGoodReturnsRates 
} from '../utils/goodReturnsService';
import { Language, Translations, translations } from '../i18n/translations';

const STORAGE_KEY = 'nexus_gold_pawn_os_v3_clean';

// Automatic purge of previous mock data from localStorage if upgrading
if (typeof window !== 'undefined') {
  try {
    const legacyKeys = [
      'nexus_gold_pawn_os_v2_liquid_customers',
      'nexus_gold_pawn_os_v2_liquid_mortgages',
      'nexus_gold_pawn_os_v2_liquid_packets',
      'nexus_gold_pawn_os_v2_liquid_payments',
      'nexus_gold_pawn_os_v2_liquid_ledger',
      'nexus_gold_pawn_os_v2_liquid_expenses',
      'nexus_gold_pawn_os_v2_liquid_audit',
      'nexus_gold_pawn_os_v2_liquid_users'
    ];
    legacyKeys.forEach(k => localStorage.removeItem(k));
  } catch {}
}

interface ReceiptData {
  type: 'pledge' | 'payment' | 'renewal' | 'closure' | 'packet_tag';
  mortgage?: Mortgage;
  payment?: Payment;
  customer?: Customer;
  packet?: GoldPacket;
  notes?: string;
}

export interface KycExtraDetails {
  aadhaarLegalName?: string;
  nameMatchScore?: number;
  nameMatchStatus?: 'EXACT' | 'HIGH' | 'PARTIAL' | 'MISMATCH';
  gender?: string;
  dob?: string;
  careOf?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  photoUrl?: string;
  authMethod?: 'OTP' | 'Biometric' | 'Demographic';
  syncCustomerName?: boolean;
  syncCustomerAddress?: boolean;
}

export interface AppContextType {
  // Navigation & Role
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  currentBranch: Branch;
  setCurrentBranch: (branch: Branch) => void;
  users: User[];
  branches: Branch[];
  addBranch: (branchData: Omit<Branch, 'id' | 'createdAt'>) => Branch;
  updateBranch: (id: string, updates: Partial<Branch>) => void;

  // Multiple Bank Accounts
  bankAccounts: BankAccount[];
  addBankAccount: (account: Omit<BankAccount, 'id' | 'createdAt'>) => BankAccount;
  updateBankAccount: (id: string, updates: Partial<BankAccount>) => void;
  deleteBankAccount: (id: string) => void;

  // Inter-Branch Fund Transfers
  transferBetweenBranches: (params: {
    sourceBranchId: string;
    targetBranchId: string;
    sourceAccountType: 'Cash' | 'Bank';
    targetAccountType: 'Cash' | 'Bank';
    sourceBankAccountId?: string;
    targetBankAccountId?: string;
    amount: number;
    remarks: string;
  }) => { success: boolean; message: string };

  // 4-Hour Authentication & Session Control
  authSession: AuthSession | null;
  sessionRemainingSeconds: number;
  authNotice: string | null;
  setAuthNotice: (notice: string | null) => void;
  loginWithEmail: (email: string, password: string) => { success: boolean; message?: string; mustChangePassword?: boolean; user?: User };
  loginWithMobileOtp: (mobile: string, otp: string) => { success: boolean; message?: string; user?: User };
  loginWithUsernamePassword: (username: string, password: string) => { success: boolean; message?: string; mustChangePassword?: boolean; user?: User };
  completeFirstTimePasswordChange: (userId: string, newPassword: string) => boolean;
  logout: (reason?: string) => void;

  // Employee Management (Owner Control)
  createEmployeeAccount: (data: {
    name: string;
    username: string;
    password: string;
    role: UserRole;
    phone: string;
    email?: string;
    branchId?: string;
  }) => { success: boolean; message?: string; user?: User };
  updateEmployeeAccount: (userId: string, updates: Partial<User>) => void;
  resetEmployeePassword: (userId: string, tempPassword: string) => void;
  deleteEmployeeAccount: (userId: string) => void;

  // Role-Based Access Control (RBAC) Matrix Management
  rbacPermissions: RbacMatrix;
  updateRolePermission: (role: UserRole, permKey: keyof Omit<RolePermissionSet, 'desc'>, value: boolean) => void;
  resetRbacPermissions: () => void;

  // Core Data
  customers: Customer[];
  mortgages: Mortgage[];
  packets: GoldPacket[];
  lockers: LockerLocation[];
  payments: Payment[];
  ledger: LedgerEntry[];
  expenses: Expense[];
  auditLogs: AuditLog[];
  interestRules: InterestRule[];
  settings: BusinessSettings;

  // GoodReturns Live Bullion Feed
  goodReturnsRates: GoodReturnsRateData;
  refreshGoodReturnsRates: (city?: string, forceLive?: boolean) => void;
  syncLiveMarketRates: (city?: string) => Promise<GoodReturnsRateData>;
  resetGoldRatesToLive: (city?: string) => void;
  updateGoldRates: (rates: { '24K': number; '22K': number; '20K'?: number; '18K'?: number; '14K'?: number }, city?: string) => void;
  changeGoodReturnsCity: (city: string) => void;
  isGoodReturnsModalOpen: boolean;
  setIsGoodReturnsModalOpen: (open: boolean) => void;

  // Language & Localization (Indian English / Tamil)
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Translations, fallback?: string) => string;

  // Modals & Overlays
  selectedMortgage: Mortgage | null;
  setSelectedMortgage: (m: Mortgage | null) => void;
  selectedCustomer: Customer | null;
  setSelectedCustomer: (c: Customer | null) => void;
  receiptModalData: ReceiptData | null;
  setReceiptModalData: (data: ReceiptData | null) => void;
  isNewMortgageOpen: boolean;
  setIsNewMortgageOpen: (open: boolean) => void;
  isNewCustomerOpen: boolean;
  setIsNewCustomerOpen: (open: boolean) => void;
  isPaymentModalOpen: boolean;
  setIsPaymentModalOpen: (open: boolean) => void;
  isExpenseModalOpen: boolean;
  setIsExpenseModalOpen: (open: boolean) => void;
  isScannerModalOpen: boolean;
  setIsScannerModalOpen: (open: boolean) => void;
  isRenewalModalOpen: boolean;
  setIsRenewalModalOpen: (open: boolean) => void;
  isClosureModalOpen: boolean;
  setIsClosureModalOpen: (open: boolean) => void;
  isKycModalOpen: boolean;
  setIsKycModalOpen: (open: boolean) => void;
  isCustomerPortalOpen: boolean;
  setIsCustomerPortalOpen: (open: boolean) => void;
  portalCustomerId: string | null;
  setPortalCustomerId: (id: string | null) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebar: () => void;

  // Business Actions
  addCustomer: (data: Omit<Customer, 'id' | 'createdAt' | 'branchId'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  verifyCustomerKyc: (
    customerId: string, 
    provider: KycProvider, 
    maskedId: string, 
    referenceNo: string, 
    notes?: string,
    extraDetails?: KycExtraDetails
  ) => void;
  createMortgage: (params: {
    customerId: string;
    items: any[];
    principalAmount: number;
    interestRuleId: string;
    customInterestRate?: number;
    penaltyRateMonthly?: number;
    gracePeriodDays?: number;
    maturityDate: string;
    processingFee: number;
    otherCharges: number;
    disbursementMode: DisbursementMode;
    lockerId: string;
    rack: string;
    tray: string;
    bin?: string;
  }) => Mortgage;
  receivePayment: (params: {
    mortgageId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    referenceNumber?: string;
    allocation: {
      principal: number;
      interest: number;
      penalties: number;
      charges: number;
    };
  }) => Payment;
  reversePayment: (paymentId: string, reason: string) => void;
  renewMortgage: (mortgageId: string, newMaturityDate: string, interestSettled: number, notes?: string) => void;
  closeMortgageAndReleaseGold: (mortgageId: string, notes?: string) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'branchId' | 'recordedBy'>) => Expense;
  addDrawerTransaction: (params: {
    account: 'Cash' | 'Bank';
    action: 'CashIn' | 'Withdrawal' | 'TransferToBank' | 'TransferToCash';
    amount: number;
    category: string;
    notes: string;
    referenceNumber?: string;
  }) => LedgerEntry[];
  isDrawerModalOpen: boolean;
  setIsDrawerModalOpen: (open: boolean) => void;
  drawerModalInitialTab: 'CashIn' | 'Withdrawal' | 'Transfer';
  setDrawerModalInitialTab: (tab: 'CashIn' | 'Withdrawal' | 'Transfer') => void;
  movePacketLocation: (packetId: string, newLocation: string, reason: string) => void;
  updateSettings: (newSettings: BusinessSettings) => void;
  resetToDefaults: () => void;
  exportDatabaseJson: () => string;
  importDatabaseJson: (json: string) => boolean;

  // Calculators
  getCashBalance: () => number;
  getBankBalance: () => number;
  getMortgageDueInfo: (mortgage: Mortgage) => any;

  // Customer Portal Enquiries
  enquiries: PawnEnquiry[];
  unreadEnquiriesCount: number;
  updateEnquiryStatus: (id: string, status: any, notes?: string) => Promise<void>;
  enquiryToConvert: PawnEnquiry | null;
  setEnquiryToConvert: (e: PawnEnquiry | null) => void;
  convertEnquiryToMortgage: (enquiry: PawnEnquiry) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_users');
    return saved ? JSON.parse(saved) : SEED_USERS;
  });

  const [authSession, setAuthSession] = useState<AuthSession | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_auth_session');
    if (saved) {
      try {
        const parsed: AuthSession = JSON.parse(saved);
        if (parsed.expiresAt && parsed.expiresAt > Date.now()) {
          return parsed;
        }
        localStorage.removeItem(STORAGE_KEY + '_auth_session');
      } catch {
        localStorage.removeItem(STORAGE_KEY + '_auth_session');
      }
    }
    return null;
  });

  const [sessionRemainingSeconds, setSessionRemainingSeconds] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_auth_session');
    if (saved) {
      try {
        const parsed: AuthSession = JSON.parse(saved);
        if (parsed.expiresAt && parsed.expiresAt > Date.now()) {
          return Math.floor((parsed.expiresAt - Date.now()) / 1000);
        }
      } catch {}
    }
    return 0;
  });

  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_branches');
    return saved ? JSON.parse(saved) : SEED_BRANCHES;
  });
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_bank_accounts');
    return saved ? JSON.parse(saved) : SEED_BANK_ACCOUNTS;
  });
  const [currentUser, setCurrentUser] = useState<User>(() => {
    if (authSession?.user) return authSession.user;
    const savedUsers = localStorage.getItem(STORAGE_KEY + '_users');
    const uList = savedUsers ? JSON.parse(savedUsers) : SEED_USERS;
    return uList[0] || SEED_USERS[0];
  });
  const [currentBranch, setCurrentBranch] = useState<Branch>(() => branches[0] || SEED_BRANCHES[0]);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_branches', JSON.stringify(branches));
  }, [branches]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_bank_accounts', JSON.stringify(bankAccounts));
  }, [bankAccounts]);

  const [settings, setSettings] = useState<BusinessSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_settings');
    return saved ? JSON.parse(saved) : SEED_SETTINGS;
  });

  const [rbacPermissions, setRbacPermissions] = useState<RbacMatrix>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_rbac_matrix');
    return saved ? JSON.parse(saved) : DEFAULT_RBAC_MATRIX;
  });

  const [goodReturnsRates, setGoodReturnsRates] = useState<GoodReturnsRateData>(() => {
    const saved = settings.goodReturnsLiveRates;
    if (saved && saved.rates && saved.rates['22K'] >= 10000) {
      return saved;
    }
    return getGoodReturnsRatesForCity(settings.selectedCity || 'Chennai', true);
  });

  const [isGoodReturnsModalOpen, setIsGoodReturnsModalOpen] = useState(false);

  // Language & Localization (Indian English / Tamil)
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('nexus_gold_language');
    if (saved === 'ta' || saved === 'en') return saved;
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('nexus_gold_language', lang);
  };

  const t = (key: keyof Translations, fallback?: string): string => {
    const langDict = translations[language] || translations.en;
    return (langDict[key] as string) || fallback || (translations.en[key] as string) || (key as string);
  };

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_customers');
    return saved ? JSON.parse(saved) : SEED_CUSTOMERS;
  });

  const [mortgages, setMortgages] = useState<Mortgage[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_mortgages');
    return saved ? JSON.parse(saved) : SEED_MORTGAGES;
  });

  const [packets, setPackets] = useState<GoldPacket[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_packets');
    return saved ? JSON.parse(saved) : SEED_PACKETS;
  });

  const [lockers, setLockers] = useState<LockerLocation[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_lockers');
    return saved ? JSON.parse(saved) : SEED_LOCKERS;
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_payments');
    return saved ? JSON.parse(saved) : SEED_PAYMENTS;
  });

  const [ledger, setLedger] = useState<LedgerEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_ledger');
    return saved ? JSON.parse(saved) : SEED_LEDGER;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_expenses');
    return saved ? JSON.parse(saved) : SEED_EXPENSES;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_audit');
    const initialLogs: AuditLog[] = saved ? JSON.parse(saved) : SEED_AUDIT_LOGS;
    // Filter out any live rates sync audit logs
    return initialLogs.filter(l => l.entityId !== 'GOODRETURNS_FEED' && !l.reason?.includes('GoodReturns'));
  });

  const [interestRules, setInterestRules] = useState<InterestRule[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_rules');
    return saved ? JSON.parse(saved) : SEED_INTEREST_RULES;
  });

  // Modals state
  const [selectedMortgage, setSelectedMortgage] = useState<Mortgage | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [receiptModalData, setReceiptModalData] = useState<ReceiptData | null>(null);
  
  const [isNewMortgageOpen, setIsNewMortgageOpen] = useState(false);
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
  const [isClosureModalOpen, setIsClosureModalOpen] = useState(false);
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [isCustomerPortalOpen, setIsCustomerPortalOpen] = useState(false);
  const [portalCustomerId, setPortalCustomerId] = useState<string | null>(null);
  const [isDrawerModalOpen, setIsDrawerModalOpen] = useState(false);
  const [drawerModalInitialTab, setDrawerModalInitialTab] = useState<'CashIn' | 'Withdrawal' | 'Transfer'>('CashIn');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  // Live Customer Enquiries
  const [enquiries, setEnquiries] = useState<PawnEnquiry[]>([]);
  const [enquiryToConvert, setEnquiryToConvert] = useState<PawnEnquiry | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToEnquiries((incomingEnquiries, isNewArrival) => {
      setEnquiries(incomingEnquiries);
      if (isNewArrival) {
        // Play notification chime
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, ctx.currentTime);
          osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.4);
        } catch {}
      }
    });

    return () => unsubscribe();
  }, []);

  const unreadEnquiriesCount = enquiries.filter(e => e.status === 'SUBMITTED').length;

  const updateEnquiryStatus = async (id: string, status: any, notes?: string) => {
    setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status, notes: notes !== undefined ? notes : e.notes } : e));
    await updateRemoteEnquiryStatus(id, status, notes);
  };

  const convertEnquiryToMortgage = (enquiry: PawnEnquiry) => {
    // Check if customer exists by phone
    let cust = customers.find(c => c.mobile.endsWith(enquiry.customerMobile.slice(-10)));
    if (!cust) {
      cust = addCustomer({
        name: enquiry.customerName,
        mobile: enquiry.customerMobile,
        dateOfBirth: '1990-01-01',
        address: 'Customer Portal Lead',
        city: currentBranch.city,
        pincode: '606601',
        occupation: 'Business / Self-Employed',
        nomineeName: '',
        nomineeRelation: '',
        nomineePhone: '',
        photoUrl: enquiry.photoUrl || '',
        kycStatus: 'Pending',
        customerTier: 'Standard'
      });
    }
    setEnquiryToConvert(enquiry);
    setIsNewMortgageOpen(true);
  };

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY + '_customers', JSON.stringify(customers));
      localStorage.setItem(STORAGE_KEY + '_mortgages', JSON.stringify(mortgages));
      localStorage.setItem(STORAGE_KEY + '_packets', JSON.stringify(packets));
      localStorage.setItem(STORAGE_KEY + '_lockers', JSON.stringify(lockers));
      localStorage.setItem(STORAGE_KEY + '_payments', JSON.stringify(payments));
      localStorage.setItem(STORAGE_KEY + '_ledger', JSON.stringify(ledger));
      localStorage.setItem(STORAGE_KEY + '_expenses', JSON.stringify(expenses));
      localStorage.setItem(STORAGE_KEY + '_audit', JSON.stringify(auditLogs));
      localStorage.setItem(STORAGE_KEY + '_rules', JSON.stringify(interestRules));
      localStorage.setItem(STORAGE_KEY + '_settings', JSON.stringify(settings));
    } catch (e) {
      console.error('Failed saving to localStorage', e);
    }
  }, [customers, mortgages, packets, lockers, payments, ledger, expenses, auditLogs, interestRules, settings]);

  const refreshGoodReturnsRates = (cityToUse?: string, forceLive: boolean = false) => {
    const targetCity = cityToUse || goodReturnsRates.city || 'Chennai';
    if (forceLive) {
      clearGoodReturnsOverride(targetCity);
    }
    const updated = getGoodReturnsRatesForCity(targetCity, forceLive);
    setGoodReturnsRates(updated);
    setSettings(prev => {
      const newSettings = {
        ...prev,
        selectedCity: targetCity,
        goodReturnsLiveRates: updated,
        goldRates: {
          ...prev.goldRates,
          '24K': updated.rates['24K'],
          '22K': updated.rates['22K'],
          '20K': updated.rates['20K'],
          '18K': updated.rates['18K'],
          '14K': updated.rates['14K'] || prev.goldRates?.['14K'] || 4620
        }
      };
      try {
        localStorage.setItem(STORAGE_KEY + '_settings', JSON.stringify(newSettings));
      } catch {}
      return newSettings;
    });
  };

  const syncLiveMarketRates = async (cityToUse?: string): Promise<GoodReturnsRateData> => {
    const targetCity = cityToUse || goodReturnsRates.city || 'Chennai';
    clearGoodReturnsOverride(targetCity);
    const liveData = await fetchLiveGoodReturnsRates(targetCity);
    setGoodReturnsRates(liveData);
    setSettings(prev => {
      const newSettings = {
        ...prev,
        selectedCity: targetCity,
        goodReturnsLiveRates: liveData,
        goldRates: {
          ...prev.goldRates,
          '24K': liveData.rates['24K'],
          '22K': liveData.rates['22K'],
          '20K': liveData.rates['20K'],
          '18K': liveData.rates['18K'],
          '14K': liveData.rates['14K'] || prev.goldRates?.['14K'] || 4620
        }
      };
      try {
        localStorage.setItem(STORAGE_KEY + '_settings', JSON.stringify(newSettings));
      } catch {}
      return newSettings;
    });
    return liveData;
  };

  const resetGoldRatesToLive = (cityToUse?: string) => {
    const targetCity = cityToUse || goodReturnsRates.city || 'Chennai';
    clearGoodReturnsOverride(targetCity);
    refreshGoodReturnsRates(targetCity, true);
  };

  const updateGoldRates = (
    rates: { '24K': number; '22K': number; '20K'?: number; '18K'?: number; '14K'?: number },
    cityToUse?: string
  ) => {
    const targetCity = cityToUse || goodReturnsRates.city || 'Chennai';
    saveGoodReturnsOverride(targetCity, rates);
    const updated = getGoodReturnsRatesForCity(targetCity);
    setGoodReturnsRates(updated);
    setSettings(prev => {
      const newSettings = {
        ...prev,
        selectedCity: targetCity,
        goodReturnsLiveRates: updated,
        goldRates: {
          ...prev.goldRates,
          '24K': updated.rates['24K'],
          '22K': updated.rates['22K'],
          '20K': updated.rates['20K'],
          '18K': updated.rates['18K'],
          '14K': updated.rates['14K'] || prev.goldRates?.['14K'] || 4620
        }
      };
      try {
        localStorage.setItem(STORAGE_KEY + '_settings', JSON.stringify(newSettings));
      } catch {}
      return newSettings;
    });
  };

  const changeGoodReturnsCity = (newCity: string) => {
    refreshGoodReturnsRates(newCity);
  };

  const logAudit = (
    action: AuditLog['action'], 
    entityType: AuditLog['entityType'], 
    entityId: string, 
    reason: string, 
    oldValue?: string, 
    newValue?: string
  ) => {
    const newLog: AuditLog = {
      id: `AUD-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      branchId: currentBranch.id,
      action,
      entityType,
      entityId,
      oldValue,
      newValue,
      reason,
      deviceIp: '192.168.1.' + (10 + Math.floor(Math.random() * 20))
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const getCashBalance = () => {
    const cashEntries = ledger.filter(l => l.account === 'Cash' && l.branchId === currentBranch.id);
    return cashEntries.reduce((acc, curr) => curr.type === 'Credit' ? acc + curr.amount : acc - curr.amount, 0);
  };

  const getBankBalance = () => {
    const bankEntries = ledger.filter(l => l.account === 'Bank' && l.branchId === currentBranch.id);
    return bankEntries.reduce((acc, curr) => curr.type === 'Credit' ? acc + curr.amount : acc - curr.amount, 0);
  };

  const getMortgageDueInfo = (mortgage: Mortgage) => {
    const rule = interestRules.find(r => r.id === settings.defaultInterestRuleId) || interestRules[0];
    const todayStr = new Date().toISOString().split('T')[0];
    return calculateInterest(
      mortgage.outstandingPrincipal,
      mortgage.lastPaymentDate || mortgage.mortgageDate,
      mortgage.maturityDate,
      todayStr,
      rule,
      mortgage.interestRate,
      mortgage.penaltyRateMonthly,
      mortgage.gracePeriodDays
    );
  };

  const addCustomer = (data: Omit<Customer, 'id' | 'createdAt' | 'branchId'>): Customer => {
    const nextNum = customers.length + 101;
    const newCustomer: Customer = {
      ...data,
      id: `CUS-${nextNum.toString().padStart(6, '0')}`,
      customerTier: data.customerTier || 'Standard',
      branchId: currentBranch.id,
      createdAt: new Date().toISOString()
    };
    setCustomers(prev => [newCustomer, ...prev]);
    logAudit('CREATE', 'CUSTOMER', newCustomer.id, `Created customer profile for ${newCustomer.name} (${newCustomer.customerTier})`);
    return newCustomer;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    logAudit('UPDATE', 'CUSTOMER', id, `Updated profile details for customer ${id}`);
  };

  const verifyCustomerKyc = (
    customerId: string, 
    provider: KycProvider, 
    maskedId: string, 
    referenceNo: string, 
    notes?: string,
    extraDetails?: KycExtraDetails
  ) => {
    setCustomers(prev => prev.map(c => {
      if (c.id !== customerId) return c;
      const kycRecord = {
        id: `KYC-${Date.now().toString().slice(-4)}`,
        customerId,
        provider,
        maskedId,
        consentGiven: true,
        consentTimestamp: new Date().toISOString(),
        status: 'Verified' as const,
        verificationReference: referenceNo,
        operatorId: currentUser.id,
        verifiedAt: new Date().toISOString(),
        responseMetadata: `Authorized ${provider} verification approved. Ref: ${referenceNo}`,
        notes,
        aadhaarLegalName: extraDetails?.aadhaarLegalName,
        nameMatchScore: extraDetails?.nameMatchScore,
        nameMatchStatus: extraDetails?.nameMatchStatus,
        gender: extraDetails?.gender,
        dob: extraDetails?.dob,
        careOf: extraDetails?.careOf,
        address: extraDetails?.address,
        city: extraDetails?.city,
        state: extraDetails?.state,
        pincode: extraDetails?.pincode,
        photoUrl: extraDetails?.photoUrl,
        authMethod: extraDetails?.authMethod || 'OTP'
      };

      const updatedCustomer: Customer = {
        ...c,
        kycStatus: 'Verified',
        kycRecord,
        aadhaarNumber: maskedId
      };

      // Sync customer name if requested
      if (extraDetails?.syncCustomerName && extraDetails.aadhaarLegalName) {
        updatedCustomer.name = extraDetails.aadhaarLegalName;
      }
      // Sync address and pincode if requested
      if (extraDetails?.syncCustomerAddress && extraDetails.address) {
        updatedCustomer.address = extraDetails.address;
        if (extraDetails.city) updatedCustomer.city = extraDetails.city;
        if (extraDetails.pincode) updatedCustomer.pincode = extraDetails.pincode;
      }
      // Sync photo if available and current photo is default
      if (extraDetails?.photoUrl && (!updatedCustomer.photoUrl || updatedCustomer.photoUrl.includes('unsplash'))) {
        updatedCustomer.photoUrl = extraDetails.photoUrl;
      }

      return updatedCustomer;
    }));
    logAudit('KYC_VERIFY', 'KYC', customerId, `Verified KYC with provider ${provider} (Ref: ${referenceNo}, Match: ${extraDetails?.nameMatchScore ?? 100}%)`);
  };

  const createMortgage = (params: {
    customerId: string;
    items: any[];
    principalAmount: number;
    interestRuleId: string;
    customInterestRate?: number;
    penaltyRateMonthly?: number;
    gracePeriodDays?: number;
    maturityDate: string;
    processingFee: number;
    otherCharges: number;
    disbursementMode: DisbursementMode;
    lockerId: string;
    rack: string;
    tray: string;
    bin?: string;
  }): Mortgage => {
    const nextMortgageNum = mortgages.length + 185;
    const mortgageId = `GM-2026-${nextMortgageNum.toString().padStart(5, '0')}`;
    const nextPacketNum = packets.length + 4824;
    const packetId = `PKT-2026-${nextPacketNum.toString().padStart(6, '0')}`;

    const totalGross = params.items.reduce((s, i) => s + (Number(i.grossWeight) || 0), 0);
    const totalNet = params.items.reduce((s, i) => s + (Number(i.netWeight) || 0), 0);
    const rule = interestRules.find(r => r.id === params.interestRuleId) || interestRules[0];
    const finalInterestRate = params.customInterestRate !== undefined ? Number(params.customInterestRate) : rule.baseRateMonthly;
    const finalPenaltyRate = params.penaltyRateMonthly !== undefined ? Number(params.penaltyRateMonthly) : (rule.penaltyRateMonthly || 1.0);
    const finalGracePeriod = params.gracePeriodDays !== undefined ? Number(params.gracePeriodDays) : (rule.gracePeriodDays || 7);

    const newMortgage: Mortgage = {
      id: mortgageId,
      mortgageNumber: mortgageId,
      customerId: params.customerId,
      branchId: currentBranch.id,
      mortgageDate: new Date().toISOString().split('T')[0],
      maturityDate: params.maturityDate,
      principalAmount: params.principalAmount,
      interestRate: finalInterestRate,
      penaltyRateMonthly: finalPenaltyRate,
      gracePeriodDays: finalGracePeriod,
      interestType: rule.rateType,
      interestFrequency: 'Monthly',
      processingFee: params.processingFee,
      otherCharges: params.otherCharges,
      outstandingPrincipal: params.principalAmount,
      outstandingInterest: 0,
      status: 'Active',
      disbursementMode: params.disbursementMode,
      packetId: packetId,
      renewalHistory: [],
      createdBy: currentUser.id,
      approvedBy: currentUser.id,
      items: params.items.map((it, idx) => ({
        ...it,
        id: `ITM-${Date.now()}-${idx}`,
        mortgageId,
        packetId
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newPacket: GoldPacket = {
      id: packetId,
      mortgageId,
      customerId: params.customerId,
      branchId: currentBranch.id,
      lockerId: params.lockerId,
      rack: params.rack,
      tray: params.tray,
      bin: params.bin,
      status: 'In Locker',
      totalGrossWeight: totalGross,
      totalNetWeight: totalNet,
      itemCount: params.items.length,
      movements: [
        {
          id: `MOV-${Date.now()}`,
          timestamp: new Date().toISOString(),
          fromLocation: 'Appraisal Counter',
          toLocation: `${params.lockerId} / ${params.rack} / ${params.tray}`,
          movedBy: currentUser.name,
          reason: 'Initial storage for newly disbursed mortgage ' + mortgageId
        }
      ],
      createdAt: new Date().toISOString()
    };

    const disburseAccount = params.disbursementMode === 'Cash' ? 'Cash' : 'Bank';
    const currentBal = disburseAccount === 'Cash' ? getCashBalance() : getBankBalance();
    const ledgerDisburse: LedgerEntry = {
      id: `LED-${Date.now().toString().slice(-6)}`,
      branchId: currentBranch.id,
      date: new Date().toISOString().split('T')[0],
      account: disburseAccount,
      type: 'Debit',
      category: 'Loan Disbursement',
      amount: params.principalAmount,
      balanceAfter: currentBal - params.principalAmount,
      referenceId: mortgageId,
      description: `Principal disbursement for pawn loan ${mortgageId} to customer ${params.customerId}`,
      recordedBy: currentUser.id,
      createdAt: new Date().toISOString()
    };

    const newLedgerEntries = [ledgerDisburse];
    if (params.processingFee > 0) {
      const feeEntry: LedgerEntry = {
        id: `LED-FEE-${Date.now().toString().slice(-6)}`,
        branchId: currentBranch.id,
        date: new Date().toISOString().split('T')[0],
        account: disburseAccount,
        type: 'Credit',
        category: 'Processing Fee',
        amount: params.processingFee,
        balanceAfter: (currentBal - params.principalAmount) + params.processingFee,
        referenceId: mortgageId,
        description: `Upfront processing fee on ${mortgageId}`,
        recordedBy: currentUser.id,
        createdAt: new Date().toISOString()
      };
      newLedgerEntries.push(feeEntry);
    }

    setMortgages(prev => [newMortgage, ...prev]);
    setPackets(prev => [newPacket, ...prev]);
    setLedger(prev => [...newLedgerEntries, ...prev]);

    logAudit('CREATE', 'MORTGAGE', mortgageId, `Created pawn mortgage ${mortgageId} for ₹${params.principalAmount.toLocaleString('en-IN')}`);
    logAudit('APPROVE', 'MORTGAGE', mortgageId, `Approved loan disbursement via ${params.disbursementMode}`);

    return newMortgage;
  };

  const receivePayment = (params: {
    mortgageId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    referenceNumber?: string;
    allocation: {
      principal: number;
      interest: number;
      penalties: number;
      charges: number;
    };
  }): Payment => {
    const mortgage = mortgages.find(m => m.id === params.mortgageId);
    if (!mortgage) throw new Error('Mortgage not found');

    const nextPmtNum = payments.length + 392;
    const paymentId = `RCT-2026-${nextPmtNum.toString().padStart(5, '0')}`;

    const newPayment: Payment = {
      id: paymentId,
      mortgageId: mortgage.id,
      mortgageNumber: mortgage.mortgageNumber,
      customerId: mortgage.customerId,
      branchId: currentBranch.id,
      paymentDate: new Date().toISOString(),
      amount: params.amount,
      paymentMethod: params.paymentMethod,
      referenceNumber: params.referenceNumber,
      allocatedPrincipal: params.allocation.principal,
      allocatedInterest: params.allocation.interest,
      allocatedPenalties: params.allocation.penalties,
      allocatedCharges: params.allocation.charges,
      receivedBy: currentUser.id,
      status: 'Completed',
      createdAt: new Date().toISOString()
    };

    const newOutstandingPrincipal = Math.max(0, mortgage.outstandingPrincipal - params.allocation.principal);
    const newStatus = newOutstandingPrincipal === 0 ? 'Closed' : mortgage.status;

    setMortgages(prev => prev.map(m => {
      if (m.id !== params.mortgageId) return m;
      return {
        ...m,
        outstandingPrincipal: newOutstandingPrincipal,
        lastPaymentDate: new Date().toISOString().split('T')[0],
        status: newStatus,
        updatedAt: new Date().toISOString()
      };
    }));

    const acct = params.paymentMethod === 'Cash' ? 'Cash' : 'Bank';
    const curBal = acct === 'Cash' ? getCashBalance() : getBankBalance();
    const ledgerEntries: LedgerEntry[] = [];
    let runningBal = curBal;

    if (params.allocation.interest > 0) {
      runningBal += params.allocation.interest;
      ledgerEntries.push({
        id: `LED-${Date.now().toString().slice(-6)}-INT`,
        branchId: currentBranch.id,
        date: new Date().toISOString().split('T')[0],
        account: acct,
        type: 'Credit',
        category: 'Interest Income',
        amount: params.allocation.interest,
        balanceAfter: runningBal,
        referenceId: paymentId,
        description: `Interest collection on ${mortgage.mortgageNumber}`,
        recordedBy: currentUser.id,
        createdAt: new Date().toISOString()
      });
    }

    if (params.allocation.principal > 0) {
      runningBal += params.allocation.principal;
      ledgerEntries.push({
        id: `LED-${Date.now().toString().slice(-6)}-PRN`,
        branchId: currentBranch.id,
        date: new Date().toISOString().split('T')[0],
        account: acct,
        type: 'Credit',
        category: 'Principal Repayment',
        amount: params.allocation.principal,
        balanceAfter: runningBal,
        referenceId: paymentId,
        description: `Principal recovery on ${mortgage.mortgageNumber}`,
        recordedBy: currentUser.id,
        createdAt: new Date().toISOString()
      });
    }

    if (params.allocation.penalties > 0) {
      runningBal += params.allocation.penalties;
      ledgerEntries.push({
        id: `LED-${Date.now().toString().slice(-6)}-PEN`,
        branchId: currentBranch.id,
        date: new Date().toISOString().split('T')[0],
        account: acct,
        type: 'Credit',
        category: 'Late Penalty',
        amount: params.allocation.penalties,
        balanceAfter: runningBal,
        referenceId: paymentId,
        description: `Late fee / penalty collection on ${mortgage.mortgageNumber}`,
        recordedBy: currentUser.id,
        createdAt: new Date().toISOString()
      });
    }

    setPayments(prev => [newPayment, ...prev]);
    setLedger(prev => [...ledgerEntries, ...prev]);
    logAudit('PAYMENT', 'PAYMENT', paymentId, `Collected ₹${params.amount.toLocaleString('en-IN')} on ${mortgage.mortgageNumber}`);

    return newPayment;
  };

  const reversePayment = (paymentId: string, reason: string) => {
    const payment = payments.find(p => p.id === paymentId);
    if (!payment || payment.status === 'Reversed') return;

    setPayments(prev => prev.map(p => {
      if (p.id !== paymentId) return p;
      return {
        ...p,
        status: 'Reversed',
        reversalReason: reason,
        reversedBy: currentUser.name,
        reversedAt: new Date().toISOString()
      };
    }));

    setMortgages(prev => prev.map(m => {
      if (m.id !== payment.mortgageId) return m;
      return {
        ...m,
        outstandingPrincipal: m.outstandingPrincipal + payment.allocatedPrincipal,
        status: 'Active',
        updatedAt: new Date().toISOString()
      };
    }));

    const acct = payment.paymentMethod === 'Cash' ? 'Cash' : 'Bank';
    const curBal = acct === 'Cash' ? getCashBalance() : getBankBalance();
    const revLedger: LedgerEntry = {
      id: `LED-REV-${Date.now().toString().slice(-6)}`,
      branchId: currentBranch.id,
      date: new Date().toISOString().split('T')[0],
      account: acct,
      type: 'Debit',
      category: 'Other Expense',
      amount: payment.amount,
      balanceAfter: curBal - payment.amount,
      referenceId: paymentId,
      description: `Payment Reversal for ${paymentId}. Reason: ${reason}`,
      recordedBy: currentUser.id,
      createdAt: new Date().toISOString()
    };
    setLedger(prev => [revLedger, ...prev]);
    logAudit('REVERSAL', 'PAYMENT', paymentId, `Authorized payment reversal of ₹${payment.amount.toLocaleString('en-IN')}`);
  };

  const renewMortgage = (mortgageId: string, newMaturityDate: string, interestSettled: number, notes?: string) => {
    const mortgage = mortgages.find(m => m.id === mortgageId);
    if (!mortgage) return;

    const renewalReceipt = `REN-2026-${Date.now().toString().slice(-4)}`;
    const renewalRecord = {
      id: `RNW-${Date.now()}`,
      mortgageId,
      previousMaturityDate: mortgage.maturityDate,
      newMaturityDate,
      interestSettled,
      settledDate: new Date().toISOString(),
      approvedBy: currentUser.name,
      receiptNumber: renewalReceipt,
      notes
    };

    setMortgages(prev => prev.map(m => {
      if (m.id !== mortgageId) return m;
      return {
        ...m,
        maturityDate: newMaturityDate,
        status: 'Renewed',
        renewalHistory: [...m.renewalHistory, renewalRecord],
        lastPaymentDate: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString()
      };
    }));

    logAudit('RENEWAL', 'MORTGAGE', mortgageId, `Renewed mortgage ${mortgageId}. New due date: ${newMaturityDate}.`);
  };

  const closeMortgageAndReleaseGold = (mortgageId: string, notes?: string) => {
    const mortgage = mortgages.find(m => m.id === mortgageId);
    if (!mortgage) return;

    setMortgages(prev => prev.map(m => {
      if (m.id !== mortgageId) return m;
      return {
        ...m,
        status: 'Closed',
        outstandingPrincipal: 0,
        outstandingInterest: 0,
        updatedAt: new Date().toISOString()
      };
    }));

    setPackets(prev => prev.map(p => {
      if (p.mortgageId !== mortgageId) return p;
      return {
        ...p,
        status: 'Released',
        releasedAt: new Date().toISOString(),
        releasedBy: currentUser.name,
        movements: [
          ...p.movements,
          {
            id: `MOV-${Date.now()}`,
            timestamp: new Date().toISOString(),
            fromLocation: `${p.lockerId} / ${p.rack} / ${p.tray}`,
            toLocation: 'Handover Counter - Customer Custody',
            movedBy: currentUser.name,
            reason: 'Mortgage settled. Gold packet physically released to borrower.'
          }
        ]
      };
    }));

    logAudit('CLOSURE', 'MORTGAGE', mortgageId, `Pledge account closed and fully settled. ${notes || ''}`);
    logAudit('RELEASE', 'GOLD_PACKET', mortgage.packetId, `Gold packet released from custody to borrower.`);
  };

  const addExpense = (data: Omit<Expense, 'id' | 'createdAt' | 'branchId' | 'recordedBy'>): Expense => {
    const nextExpNum = expenses.length + 82;
    const expId = `EXP-2026-${nextExpNum.toString().padStart(4, '0')}`;

    const newExp: Expense = {
      ...data,
      id: expId,
      branchId: currentBranch.id,
      recordedBy: currentUser.id,
      createdAt: new Date().toISOString()
    };

    const acct = data.paymentMode;
    const curBal = acct === 'Cash' ? getCashBalance() : getBankBalance();
    const ledgerEntry: LedgerEntry = {
      id: `LED-${Date.now().toString().slice(-6)}`,
      branchId: currentBranch.id,
      date: data.date,
      account: acct,
      type: 'Debit',
      category: data.category as any,
      amount: data.amount,
      balanceAfter: curBal - data.amount,
      referenceId: expId,
      description: `${data.category}: ${data.description}`,
      recordedBy: currentUser.id,
      createdAt: new Date().toISOString()
    };

    setExpenses(prev => [newExp, ...prev]);
    setLedger(prev => [ledgerEntry, ...prev]);
    logAudit('CREATE', 'EXPENSE', expId, `Recorded branch expense of ₹${data.amount.toLocaleString('en-IN')} for ${data.category}`);
    return newExp;
  };

  const addDrawerTransaction = (params: {
    account: 'Cash' | 'Bank';
    action: 'CashIn' | 'Withdrawal' | 'TransferToBank' | 'TransferToCash';
    amount: number;
    category: string;
    notes: string;
    referenceNumber?: string;
  }): LedgerEntry[] => {
    const todayStr = new Date().toISOString().split('T')[0];
    const createdEntries: LedgerEntry[] = [];
    const timestamp = new Date().toISOString();

    if (params.action === 'CashIn') {
      const curBal = params.account === 'Cash' ? getCashBalance() : getBankBalance();
      const entry: LedgerEntry = {
        id: `LED-${Date.now().toString().slice(-6)}`,
        branchId: currentBranch.id,
        date: todayStr,
        account: params.account,
        type: 'Credit',
        category: (params.category || 'Capital Inflow') as any,
        amount: params.amount,
        balanceAfter: curBal + params.amount,
        referenceId: params.referenceNumber || `IN-${Date.now().toString().slice(-4)}`,
        description: `${params.category}: ${params.notes}`,
        recordedBy: currentUser.id,
        createdAt: timestamp
      };
      createdEntries.push(entry);
      setLedger(prev => [entry, ...prev]);
      logAudit(
        'CREATE',
        'PAYMENT',
        entry.id,
        `${params.account} Cash-In / Deposit of ₹${params.amount.toLocaleString('en-IN')} (${params.category})`
      );
    } else if (params.action === 'Withdrawal') {
      const curBal = params.account === 'Cash' ? getCashBalance() : getBankBalance();
      const entry: LedgerEntry = {
        id: `LED-${Date.now().toString().slice(-6)}`,
        branchId: currentBranch.id,
        date: todayStr,
        account: params.account,
        type: 'Debit',
        category: (params.category || 'Withdrawal') as any,
        amount: params.amount,
        balanceAfter: curBal - params.amount,
        referenceId: params.referenceNumber || `OUT-${Date.now().toString().slice(-4)}`,
        description: `${params.category}: ${params.notes}`,
        recordedBy: currentUser.id,
        createdAt: timestamp
      };
      createdEntries.push(entry);
      setLedger(prev => [entry, ...prev]);
      logAudit(
        'CREATE',
        'EXPENSE',
        entry.id,
        `${params.account} Withdrawal of ₹${params.amount.toLocaleString('en-IN')} (${params.category})`
      );
    } else if (params.action === 'TransferToBank') {
      const cashBal = getCashBalance();
      const bankBal = getBankBalance();
      const cashEntry: LedgerEntry = {
        id: `LED-${Date.now().toString().slice(-6)}A`,
        branchId: currentBranch.id,
        date: todayStr,
        account: 'Cash',
        type: 'Debit',
        category: 'Bank Deposit' as any,
        amount: params.amount,
        balanceAfter: cashBal - params.amount,
        referenceId: params.referenceNumber || `TRF-B-${Date.now().toString().slice(-4)}`,
        description: `Cash Drawer to Bank Deposit: ${params.notes}`,
        recordedBy: currentUser.id,
        createdAt: timestamp
      };
      const bankEntry: LedgerEntry = {
        id: `LED-${Date.now().toString().slice(-6)}B`,
        branchId: currentBranch.id,
        date: todayStr,
        account: 'Bank',
        type: 'Credit',
        category: 'Bank Deposit' as any,
        amount: params.amount,
        balanceAfter: bankBal + params.amount,
        referenceId: params.referenceNumber || `TRF-B-${Date.now().toString().slice(-4)}`,
        description: `Cash Drawer Deposit Received: ${params.notes}`,
        recordedBy: currentUser.id,
        createdAt: timestamp
      };
      createdEntries.push(cashEntry, bankEntry);
      setLedger(prev => [cashEntry, bankEntry, ...prev]);
      logAudit(
        'CREATE',
        'PAYMENT',
        cashEntry.id,
        `Internal Transfer: ₹${params.amount.toLocaleString('en-IN')} from Cash Drawer to Bank Account`
      );
    } else if (params.action === 'TransferToCash') {
      const cashBal = getCashBalance();
      const bankBal = getBankBalance();
      const bankEntry: LedgerEntry = {
        id: `LED-${Date.now().toString().slice(-6)}A`,
        branchId: currentBranch.id,
        date: todayStr,
        account: 'Bank',
        type: 'Debit',
        category: 'Cash Withdrawal' as any,
        amount: params.amount,
        balanceAfter: bankBal - params.amount,
        referenceId: params.referenceNumber || `TRF-C-${Date.now().toString().slice(-4)}`,
        description: `Bank Withdrawal for Drawer Float: ${params.notes}`,
        recordedBy: currentUser.id,
        createdAt: timestamp
      };
      const cashEntry: LedgerEntry = {
        id: `LED-${Date.now().toString().slice(-6)}B`,
        branchId: currentBranch.id,
        date: todayStr,
        account: 'Cash',
        type: 'Credit',
        category: 'Cash In / Deposit' as any,
        amount: params.amount,
        balanceAfter: cashBal + params.amount,
        referenceId: params.referenceNumber || `TRF-C-${Date.now().toString().slice(-4)}`,
        description: `Cash Inflow from Bank Withdrawal: ${params.notes}`,
        recordedBy: currentUser.id,
        createdAt: timestamp
      };
      createdEntries.push(bankEntry, cashEntry);
      setLedger(prev => [bankEntry, cashEntry, ...prev]);
      logAudit(
        'CREATE',
        'PAYMENT',
        cashEntry.id,
        `Internal Transfer: ₹${params.amount.toLocaleString('en-IN')} from Bank Account to Cash Drawer`
      );
    }

    return createdEntries;
  };

  const movePacketLocation = (packetId: string, newLocation: string, reason: string) => {
    setPackets(prev => prev.map(p => {
      if (p.id !== packetId) return p;
      const oldLoc = `${p.lockerId} / ${p.rack} / ${p.tray}`;
      return {
        ...p,
        movements: [
          ...p.movements,
          {
            id: `MOV-${Date.now()}`,
            timestamp: new Date().toISOString(),
            fromLocation: oldLoc,
            toLocation: newLocation,
            movedBy: currentUser.name,
            reason
          }
        ]
      };
    }));
    logAudit('MOVE_PACKET', 'GOLD_PACKET', packetId, `Moved packet ${packetId} to ${newLocation}. Reason: ${reason}`);
  };

  const addBankAccount = (data: Omit<BankAccount, 'id' | 'createdAt'>): BankAccount => {
    const newAccount: BankAccount = {
      ...data,
      id: `BA-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setBankAccounts(prev => {
      if (newAccount.isDefault) {
        return [...prev.map(a => ({ ...a, isDefault: false })), newAccount];
      }
      return [...prev, newAccount];
    });
    logAudit('CREATE', 'SETTINGS', newAccount.id, `Added bank account: ${newAccount.bankName} (${newAccount.accountNumber})`);
    return newAccount;
  };

  const updateBankAccount = (id: string, updates: Partial<BankAccount>) => {
    setBankAccounts(prev => prev.map(a => {
      if (a.id === id) {
        return { ...a, ...updates };
      }
      if (updates.isDefault && a.id !== id) {
        return { ...a, isDefault: false };
      }
      return a;
    }));
    logAudit('UPDATE', 'SETTINGS', id, `Updated bank account details for ${id}`);
  };

  const deleteBankAccount = (id: string) => {
    const target = bankAccounts.find(b => b.id === id);
    setBankAccounts(prev => prev.filter(b => b.id !== id));
    logAudit('SETTINGS_CHANGE', 'SETTINGS', id, `Deleted bank account: ${target?.bankName} (${target?.accountNumber})`);
  };

  const addBranch = (branchData: Omit<Branch, 'id' | 'createdAt'>): Branch => {
    const newBranch: Branch = {
      ...branchData,
      id: `BR-${(branches.length + 1).toString().padStart(3, '0')}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setBranches(prev => [...prev, newBranch]);

    // If opening cash is provided, inject an opening ledger entry
    if (newBranch.openingCash && newBranch.openingCash > 0) {
      const openingEntry: LedgerEntry = {
        id: `LED-OP-${Date.now().toString().slice(-4)}`,
        branchId: newBranch.id,
        date: new Date().toISOString().split('T')[0],
        account: 'Cash',
        type: 'Credit',
        category: 'Capital Injection',
        amount: newBranch.openingCash,
        balanceAfter: newBranch.openingCash,
        description: `Initial Opening Cash Drawer Capital for Branch ${newBranch.name} (${newBranch.code})`,
        recordedBy: currentUser.id,
        createdAt: new Date().toISOString()
      };
      setLedger(prev => [openingEntry, ...prev]);
    }

    logAudit('CREATE', 'SETTINGS', newBranch.id, `Created new branch: ${newBranch.name} (${newBranch.code})`);
    return newBranch;
  };

  const updateBranch = (id: string, updates: Partial<Branch>) => {
    setBranches(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    if (currentBranch.id === id) {
      setCurrentBranch(prev => ({ ...prev, ...updates }));
    }
    logAudit('UPDATE', 'SETTINGS', id, `Updated branch details for ${id}`);
  };

  const transferBetweenBranches = (params: {
    sourceBranchId: string;
    targetBranchId: string;
    sourceAccountType: 'Cash' | 'Bank';
    targetAccountType: 'Cash' | 'Bank';
    sourceBankAccountId?: string;
    targetBankAccountId?: string;
    amount: number;
    remarks: string;
  }): { success: boolean; message: string } => {
    const { 
      sourceBranchId, 
      targetBranchId, 
      sourceAccountType, 
      targetAccountType, 
      sourceBankAccountId, 
      targetBankAccountId, 
      amount, 
      remarks 
    } = params;

    if (sourceBranchId === targetBranchId) {
      return { success: false, message: 'Source and destination branches cannot be the same.' };
    }
    if (amount <= 0) {
      return { success: false, message: 'Transfer amount must be greater than zero.' };
    }

    const sourceBranch = branches.find(b => b.id === sourceBranchId);
    const targetBranch = branches.find(b => b.id === targetBranchId);
    if (!sourceBranch || !targetBranch) {
      return { success: false, message: 'Invalid source or destination branch specified.' };
    }

    // Check balance in source branch
    const sourceBranchCashBal = ledger
      .filter(l => l.account === 'Cash' && l.branchId === sourceBranchId)
      .reduce((acc, curr) => curr.type === 'Credit' ? acc + curr.amount : acc - curr.amount, 0);

    const sourceBranchBankBal = ledger
      .filter(l => l.account === 'Bank' && l.branchId === sourceBranchId)
      .reduce((acc, curr) => curr.type === 'Credit' ? acc + curr.amount : acc - curr.amount, 0);

    const availableBal = sourceAccountType === 'Cash' ? sourceBranchCashBal : sourceBranchBankBal;
    if (amount > availableBal) {
      return { 
        success: false, 
        message: `Insufficient funds in ${sourceBranch.name} (${sourceAccountType}). Available: ₹${availableBal.toLocaleString('en-IN')}` 
      };
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timestamp = now.toISOString();

    const debitEntry: LedgerEntry = {
      id: `LED-TRF-OUT-${Date.now().toString().slice(-6)}`,
      branchId: sourceBranchId,
      date: dateStr,
      account: sourceAccountType,
      type: 'Debit',
      category: 'Internal Branch Transfer Out',
      amount,
      balanceAfter: availableBal - amount,
      referenceId: `TRF-OUT-${Date.now().toString().slice(-4)}`,
      bankAccountId: sourceBankAccountId,
      targetBranchId,
      description: `Internal Fund Transfer OUT to ${targetBranch.name} (${targetAccountType}) - ${remarks || 'Branch fund rebalance'}`,
      recordedBy: currentUser.id,
      createdAt: timestamp
    };

    // Calculate target branch current balance
    const targetBranchCurrentBal = ledger
      .filter(l => l.account === targetAccountType && l.branchId === targetBranchId)
      .reduce((acc, curr) => curr.type === 'Credit' ? acc + curr.amount : acc - curr.amount, 0);

    const creditEntry: LedgerEntry = {
      id: `LED-TRF-IN-${(Date.now() + 1).toString().slice(-6)}`,
      branchId: targetBranchId,
      date: dateStr,
      account: targetAccountType,
      type: 'Credit',
      category: 'Internal Branch Transfer In',
      amount,
      balanceAfter: targetBranchCurrentBal + amount,
      referenceId: `TRF-IN-${Date.now().toString().slice(-4)}`,
      bankAccountId: targetBankAccountId,
      sourceBranchId,
      description: `Internal Fund Transfer IN from ${sourceBranch.name} (${sourceAccountType}) - ${remarks || 'Branch fund rebalance'}`,
      recordedBy: currentUser.id,
      createdAt: timestamp
    };

    setLedger(prev => [debitEntry, creditEntry, ...prev]);

    // Update bank accounts balances if applicable
    if (sourceBankAccountId) {
      setBankAccounts(prev => prev.map(ba => ba.id === sourceBankAccountId ? { ...ba, balance: ba.balance - amount } : ba));
    }
    if (targetBankAccountId) {
      setBankAccounts(prev => prev.map(ba => ba.id === targetBankAccountId ? { ...ba, balance: ba.balance + amount } : ba));
    }

    logAudit(
      'APPROVE',
      'SETTINGS',
      debitEntry.id,
      `Inter-Branch Transfer: ₹${amount.toLocaleString('en-IN')} from [${sourceBranch.name} / ${sourceAccountType}] to [${targetBranch.name} / ${targetAccountType}]`
    );

    return { 
      success: true, 
      message: `Successfully transferred ₹${amount.toLocaleString('en-IN')} from ${sourceBranch.name} to ${targetBranch.name}.` 
    };
  };

  const updateSettings = (newSettings: BusinessSettings) => {
    setSettings(newSettings);
    if (newSettings.goldRates) {
      const city = newSettings.selectedCity || goodReturnsRates.city || 'Chennai';
      saveGoodReturnsOverride(city, newSettings.goldRates);
      const updated = getGoodReturnsRatesForCity(city);
      setGoodReturnsRates(updated);
    }
    logAudit('SETTINGS_CHANGE', 'SETTINGS', 'BUSINESS_RULES', `Updated business configuration and gold rates`);
  };

  const resetToDefaults = () => {
    setCustomers(SEED_CUSTOMERS);
    setMortgages(SEED_MORTGAGES);
    setPackets(SEED_PACKETS);
    setLockers(SEED_LOCKERS);
    setPayments(SEED_PAYMENTS);
    setLedger(SEED_LEDGER);
    setExpenses(SEED_EXPENSES);
    setAuditLogs(SEED_AUDIT_LOGS);
    setInterestRules(SEED_INTEREST_RULES);
    setSettings(SEED_SETTINGS);
    setBranches(SEED_BRANCHES);
    setBankAccounts(SEED_BANK_ACCOUNTS);
    setGoodReturnsRates(SEED_SETTINGS.goodReturnsLiveRates);
    localStorage.clear();
  };

  const exportDatabaseJson = () => {
    const backup = {
      exportDate: new Date().toISOString(),
      version: '2.0',
      data: {
        customers,
        mortgages,
        packets,
        lockers,
        payments,
        ledger,
        expenses,
        auditLogs,
        interestRules,
        settings,
        branches,
        bankAccounts,
        goodReturnsRates
      }
    };
    return JSON.stringify(backup, null, 2);
  };

  const importDatabaseJson = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && parsed.data) {
        if (parsed.data.customers) setCustomers(parsed.data.customers);
        if (parsed.data.mortgages) setMortgages(parsed.data.mortgages);
        if (parsed.data.packets) setPackets(parsed.data.packets);
        if (parsed.data.lockers) setLockers(parsed.data.lockers);
        if (parsed.data.payments) setPayments(parsed.data.payments);
        if (parsed.data.ledger) setLedger(parsed.data.ledger);
        if (parsed.data.expenses) setExpenses(parsed.data.expenses);
        if (parsed.data.auditLogs) setAuditLogs(parsed.data.auditLogs);
        if (parsed.data.interestRules) setInterestRules(parsed.data.interestRules);
        if (parsed.data.settings) setSettings(parsed.data.settings);
        if (parsed.data.branches) setBranches(parsed.data.branches);
        if (parsed.data.bankAccounts) setBankAccounts(parsed.data.bankAccounts);
        if (parsed.data.goodReturnsRates) setGoodReturnsRates(parsed.data.goodReturnsRates);
        logAudit('SETTINGS_CHANGE', 'SETTINGS', 'DATABASE_RESTORE', 'Restored system database from JSON backup file');
        return true;
      }
    } catch (e) {
      console.error('Import error:', e);
    }
    return false;
  };

  // 4-Hour Session monitoring effect
  useEffect(() => {
    const checkSession = () => {
      if (authSession) {
        const remainingMs = authSession.expiresAt - Date.now();
        if (remainingMs <= 0) {
          setAuthSession(null);
          localStorage.removeItem(STORAGE_KEY + '_auth_session');
          setAuthNotice('Session expired. Please log in to continue.');
          setSessionRemainingSeconds(0);
        } else {
          setSessionRemainingSeconds(Math.floor(remainingMs / 1000));
        }
      } else {
        setSessionRemainingSeconds(0);
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 1000);
    return () => clearInterval(interval);
  }, [authSession]);

  const loginWithEmail = (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    let user = users.find(u => (u.email.toLowerCase() === cleanEmail || u.username?.toLowerCase() === cleanEmail) && u.isActive);

    // If owner enters their custom email during live test, link to owner account
    if (!user) {
      const owner = users.find(u => u.isOwner || u.role === 'Master Admin / Owner') || users[0];
      if (owner) {
        user = { ...owner, email: cleanEmail, password: password };
        const updatedUsers = users.map(u => u.id === owner.id ? user! : u);
        setUsers(updatedUsers);
        localStorage.setItem(STORAGE_KEY + '_users', JSON.stringify(updatedUsers));
      }
    }

    if (!user) {
      return { success: false, message: 'No registered account found with this email or username.' };
    }
    if (user.password !== password) {
      return { success: false, message: 'Incorrect password. Please verify and try again.' };
    }
    if (user.mustChangePassword) {
      return { success: false, mustChangePassword: true, user, message: 'First-time login: Password change required.' };
    }

    const session: AuthSession = {
      user,
      token: 'tok_' + Math.random().toString(36).substring(2) + Date.now(),
      loginMethod: 'owner_email',
      loginTime: Date.now(),
      expiresAt: Date.now() + 4 * 60 * 60 * 1000 // 4 hours
    };

    setAuthSession(session);
    setCurrentUser(user);
    setAuthNotice(null);
    localStorage.setItem(STORAGE_KEY + '_auth_session', JSON.stringify(session));

    logAudit('USER_LOGIN', 'AUTH', user.id, `User ${user.name} logged in via Email/Password. 4-hour session active.`);
    return { success: true, user };
  };

  const loginWithMobileOtp = (mobile: string, otp: string) => {
    const cleanMobile = mobile.replace(/\D/g, '');
    let user = users.find(u => u.phone.replace(/\D/g, '') === cleanMobile && u.isActive);

    // If owner enters their actual phone number, link it to owner account so realtime login succeeds
    if (!user) {
      const owner = users.find(u => u.isOwner || u.role === 'Master Admin / Owner') || users[0];
      if (owner) {
        user = { ...owner, phone: cleanMobile };
        const updatedUsers = users.map(u => u.id === owner.id ? user! : u);
        setUsers(updatedUsers);
        localStorage.setItem(STORAGE_KEY + '_users', JSON.stringify(updatedUsers));
      }
    }

    if (!user) {
      return { success: false, message: `No active owner or staff registered with mobile +91 ${cleanMobile}.` };
    }
    if (!otp || otp.length < 4) {
      return { success: false, message: 'Please enter the 6-digit OTP sent to your phone.' };
    }

    const session: AuthSession = {
      user,
      token: 'tok_' + Math.random().toString(36).substring(2) + Date.now(),
      loginMethod: 'owner_otp',
      loginTime: Date.now(),
      expiresAt: Date.now() + 4 * 60 * 60 * 1000 // 4 hours
    };

    setAuthSession(session);
    setCurrentUser(user);
    setAuthNotice(null);
    localStorage.setItem(STORAGE_KEY + '_auth_session', JSON.stringify(session));

    logAudit('USER_LOGIN', 'AUTH', user.id, `Owner ${user.name} authenticated via Mobile OTP (+91 ${cleanMobile}). 4-hour session active.`);
    return { success: true, user };
  };

  const loginWithUsernamePassword = (username: string, password: string) => {
    const cleanUname = username.trim().toLowerCase();
    const user = users.find(u => (u.username?.toLowerCase() === cleanUname || u.email.toLowerCase() === cleanUname) && u.isActive);
    if (!user) {
      return { success: false, message: `Account "${username}" not found or disabled. Please contact the business owner.` };
    }
    if (user.password !== password) {
      return { success: false, message: 'Incorrect password. Please verify and try again.' };
    }
    if (user.mustChangePassword) {
      return { success: false, mustChangePassword: true, user, message: 'First-time login: Password change required.' };
    }

    const session: AuthSession = {
      user,
      token: 'tok_' + Math.random().toString(36).substring(2) + Date.now(),
      loginMethod: 'employee_password',
      loginTime: Date.now(),
      expiresAt: Date.now() + 4 * 60 * 60 * 1000 // 4 hours
    };

    setAuthSession(session);
    setCurrentUser(user);
    setAuthNotice(null);
    localStorage.setItem(STORAGE_KEY + '_auth_session', JSON.stringify(session));

    logAudit('USER_LOGIN', 'AUTH', user.id, `Employee ${user.name} (${user.role}) logged in. 4-hour session active.`);
    return { success: true, user };
  };

  const completeFirstTimePasswordChange = (userId: string, newPassword: string): boolean => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return false;

    const updatedUser: User = {
      ...targetUser,
      password: newPassword,
      mustChangePassword: false,
      lastLoginAt: new Date().toISOString()
    };

    const updatedUsers = users.map(u => u.id === userId ? updatedUser : u);
    setUsers(updatedUsers);
    localStorage.setItem(STORAGE_KEY + '_users', JSON.stringify(updatedUsers));

    // Start 4-hour active session
    const session: AuthSession = {
      user: updatedUser,
      token: 'tok_' + Math.random().toString(36).substring(2) + Date.now(),
      loginMethod: 'employee_password',
      loginTime: Date.now(),
      expiresAt: Date.now() + 4 * 60 * 60 * 1000
    };

    setAuthSession(session);
    setCurrentUser(updatedUser);
    setAuthNotice(null);
    localStorage.setItem(STORAGE_KEY + '_auth_session', JSON.stringify(session));

    logAudit('PASSWORD_CHANGE', 'AUTH', userId, `Employee ${updatedUser.name} completed initial password setup and logged in.`);
    return true;
  };

  const logout = (reason?: string) => {
    setAuthSession(null);
    localStorage.removeItem(STORAGE_KEY + '_auth_session');
    if (reason) {
      setAuthNotice(reason);
    }
    logAudit('USER_LOGOUT', 'AUTH', currentUser.id, `User logged out. ${reason || 'User initiated manual logout'}`);
  };

  const createEmployeeAccount = (data: {
    name: string;
    username: string;
    password: string;
    role: UserRole;
    phone: string;
    email?: string;
    branchId?: string;
  }) => {
    if (currentUser.role !== 'Master Admin / Owner' && !currentUser.isOwner) {
      return { success: false, message: 'Only the business owner is authorized to create employee accounts.' };
    }

    const cleanUsername = data.username.trim().toLowerCase();
    if (users.some(u => u.username?.toLowerCase() === cleanUsername)) {
      return { success: false, message: `Username "${data.username}" is already in use. Please select a unique username.` };
    }

    const newEmployee: User = {
      id: `USR-${String(users.length + 1).padStart(3, '0')}`,
      name: data.name.trim(),
      username: cleanUsername,
      password: data.password,
      role: data.role,
      phone: data.phone.trim(),
      email: data.email?.trim() || `${cleanUsername}@nexusgold.com`,
      branchId: data.branchId || currentBranch.id,
      isActive: true,
      isOwner: false,
      mustChangePassword: true, // First login mandatory change
      createdAt: new Date().toISOString()
    };

    const updatedUsers = [...users, newEmployee];
    setUsers(updatedUsers);
    localStorage.setItem(STORAGE_KEY + '_users', JSON.stringify(updatedUsers));

    logAudit('CREATE_EMPLOYEE', 'STAFF_MANAGEMENT', newEmployee.id, `Owner created staff account for ${newEmployee.name} (${cleanUsername}) with role ${newEmployee.role}. First-login password change enforced.`);
    return { success: true, user: newEmployee };
  };

  const updateEmployeeAccount = (userId: string, updates: Partial<User>) => {
    const updatedUsers = users.map(u => u.id === userId ? { ...u, ...updates } : u);
    setUsers(updatedUsers);
    localStorage.setItem(STORAGE_KEY + '_users', JSON.stringify(updatedUsers));
    logAudit('UPDATE_EMPLOYEE', 'STAFF_MANAGEMENT', userId, `Updated staff profile for user ID ${userId}`);
  };

  const resetEmployeePassword = (userId: string, tempPassword: string) => {
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          password: tempPassword,
          mustChangePassword: true // Forces employee to change on next login
        };
      }
      return u;
    });
    setUsers(updatedUsers);
    localStorage.setItem(STORAGE_KEY + '_users', JSON.stringify(updatedUsers));
    logAudit('RESET_PASSWORD', 'STAFF_MANAGEMENT', userId, `Owner reset password for user ${userId}. Mandatory change flagged.`);
  };

  const deleteEmployeeAccount = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target?.isOwner || target?.role === 'Master Admin / Owner') {
      alert('Cannot delete Master Admin / Owner account.');
      return;
    }
    const updatedUsers = users.filter(u => u.id !== userId);
    setUsers(updatedUsers);
    localStorage.setItem(STORAGE_KEY + '_users', JSON.stringify(updatedUsers));
    logAudit('DELETE_EMPLOYEE', 'STAFF_MANAGEMENT', userId, `Owner deleted employee account ${target?.name} (${userId})`);
  };

  const updateRolePermission = (role: UserRole, permKey: keyof Omit<RolePermissionSet, 'desc'>, value: boolean) => {
    setRbacPermissions(prev => {
      const updated = {
        ...prev,
        [role]: {
          ...prev[role],
          [permKey]: value
        }
      };
      localStorage.setItem(STORAGE_KEY + '_rbac_matrix', JSON.stringify(updated));
      return updated;
    });

    logAudit('UPDATE_EMPLOYEE', 'STAFF_MANAGEMENT', role, `Owner modified RBAC permission: Set ${String(permKey)} = ${value ? 'GRANTED' : 'REVOKED'} for role ${role}`);
  };

  const resetRbacPermissions = () => {
    setRbacPermissions(DEFAULT_RBAC_MATRIX);
    localStorage.setItem(STORAGE_KEY + '_rbac_matrix', JSON.stringify(DEFAULT_RBAC_MATRIX));
    logAudit('UPDATE_EMPLOYEE', 'STAFF_MANAGEMENT', 'ALL_ROLES', `Owner reset RBAC permissions matrix to default enterprise policy`);
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        currentUser,
        setCurrentUser,
        currentBranch,
        setCurrentBranch,
        users,
        branches,
        addBranch,
        updateBranch,
        bankAccounts,
        addBankAccount,
        updateBankAccount,
        deleteBankAccount,
        transferBetweenBranches,
        customers,
        mortgages,
        packets,
        lockers,
        payments,
        ledger,
        expenses,
        auditLogs,
        interestRules,
        settings,
        goodReturnsRates,
        refreshGoodReturnsRates,
        syncLiveMarketRates,
        resetGoldRatesToLive,
        updateGoldRates,
        changeGoodReturnsCity,
        isGoodReturnsModalOpen,
        setIsGoodReturnsModalOpen,
        selectedMortgage,
        setSelectedMortgage,
        selectedCustomer,
        setSelectedCustomer,
        receiptModalData,
        setReceiptModalData,
        isNewMortgageOpen,
        setIsNewMortgageOpen,
        isNewCustomerOpen,
        setIsNewCustomerOpen,
        isPaymentModalOpen,
        setIsPaymentModalOpen,
        isExpenseModalOpen,
        setIsExpenseModalOpen,
        isScannerModalOpen,
        setIsScannerModalOpen,
        isRenewalModalOpen,
        setIsRenewalModalOpen,
        isClosureModalOpen,
        setIsClosureModalOpen,
        isKycModalOpen,
        setIsKycModalOpen,
        isCustomerPortalOpen,
        setIsCustomerPortalOpen,
        portalCustomerId,
        setPortalCustomerId,
        isDrawerModalOpen,
        setIsDrawerModalOpen,
        drawerModalInitialTab,
        setDrawerModalInitialTab,
        isSidebarOpen,
        setIsSidebarOpen,
        toggleSidebar,
        addCustomer,
        updateCustomer,
        verifyCustomerKyc,
        createMortgage,
        receivePayment,
        reversePayment,
        renewMortgage,
        closeMortgageAndReleaseGold,
        addExpense,
        addDrawerTransaction,
        movePacketLocation,
        updateSettings,
        resetToDefaults,
        exportDatabaseJson,
        importDatabaseJson,
        getCashBalance,
        getBankBalance,
        getMortgageDueInfo,

        // Auth & 4-Hour Session
        authSession,
        sessionRemainingSeconds,
        authNotice,
        setAuthNotice,
        loginWithEmail,
        loginWithMobileOtp,
        loginWithUsernamePassword,
        completeFirstTimePasswordChange,
        logout,

        // Employee Management
        createEmployeeAccount,
        updateEmployeeAccount,
        resetEmployeePassword,
        deleteEmployeeAccount,

        // Editable RBAC Matrix
        rbacPermissions,
        updateRolePermission,
        resetRbacPermissions,

        // Language & Localization (Indian English / Tamil)
        language,
        setLanguage,
        t,

        // Live Customer Enquiries
        enquiries,
        unreadEnquiriesCount,
        updateEnquiryStatus,
        enquiryToConvert,
        setEnquiryToConvert,
        convertEnquiryToMortgage
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
