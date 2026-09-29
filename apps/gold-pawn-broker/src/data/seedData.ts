import { 
  User, Branch, BankAccount, Customer, Mortgage, GoldPacket, 
  LockerLocation, Payment, LedgerEntry, Expense, 
  AuditLog, InterestRule, BusinessSettings, RbacMatrix 
} from '../types';
import { getGoodReturnsRatesForCity } from '../utils/goodReturnsService';

// Default Owner / Master Admin (The pawnbroker owner account)
export const SEED_USERS: User[] = [
  {
    id: 'USR-001',
    name: 'Master Admin / Owner',
    email: 'owner@nexusgold.com',
    phone: '9840123456',
    username: 'owner',
    password: 'Owner@1234',
    role: 'Master Admin / Owner',
    branchId: 'BR-001',
    isActive: true,
    isOwner: true,
    mustChangePassword: false,
    createdAt: new Date().toISOString().split('T')[0]
  }
];

export const SEED_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'BA-001',
    bankName: 'State Bank of India',
    accountHolder: 'Nexus Gold Pawn Brokers',
    accountNumber: '38920194821',
    ifscCode: 'SBIN0001234',
    branchName: 'T. Nagar Commercial Branch',
    accountType: 'Current',
    balance: 500000,
    assignedBranchId: 'BR-001',
    isDefault: true,
    createdAt: '2026-01-01'
  },
  {
    id: 'BA-002',
    bankName: 'HDFC Bank',
    accountHolder: 'Nexus Gold Pawn Brokers',
    accountNumber: '50200034981290',
    ifscCode: 'HDFC0000456',
    branchName: 'Anna Salai Main Branch',
    accountType: 'Current',
    balance: 250000,
    assignedBranchId: 'all',
    isDefault: false,
    createdAt: '2026-01-01'
  },
  {
    id: 'BA-003',
    bankName: 'Indian Bank',
    accountHolder: 'Nexus Gold Pawn Brokers',
    accountNumber: '6829401928',
    ifscCode: 'IDIB000M024',
    branchName: 'George Town Branch',
    accountType: 'OD / CC',
    balance: 150000,
    assignedBranchId: 'all',
    isDefault: false,
    createdAt: '2026-01-01'
  }
];

export const SEED_BRANCHES: Branch[] = [
  {
    id: 'BR-001',
    name: 'Main Head Office & Vault',
    code: 'HQ-01',
    address: '42 Usman Road, T. Nagar',
    city: 'Chennai',
    phone: '+91 44 2538 9012',
    email: 'hq@nexusgold.com',
    panNumber: 'AAACN1234F',
    licenseNumber: 'TN-PBN-2026-001',
    assignedBankAccountIds: ['BA-001', 'BA-002'],
    openingCash: 250000,
    createdAt: '2026-01-01'
  },
  {
    id: 'BR-002',
    name: 'Tambaram West Branch',
    code: 'TBM-02',
    address: '15 GST Road, Tambaram West',
    city: 'Chennai',
    phone: '+91 44 2226 7890',
    email: 'tambaram@nexusgold.com',
    panNumber: 'AAACN1234F',
    licenseNumber: 'TN-PBN-2026-002',
    assignedBankAccountIds: ['BA-002', 'BA-003'],
    openingCash: 100000,
    createdAt: '2026-01-15'
  }
];

export const SEED_INTEREST_RULES: InterestRule[] = [
  {
    id: 'IR-TENURE',
    name: 'Tenure-Based Interest Slabs (Default)',
    rateType: 'TenureSlab',
    baseRateMonthly: 1.0,
    minPeriodDays: 15,
    minAmount: 50,
    gracePeriodDays: 7,
    penaltyRateMonthly: 0.5,
    tenureSlabs: [
      { fromDays: 0, toDays: 31, rateMonthly: 1.0, label: '0–31 Days (1.0%/mo)' },
      { fromDays: 32, toDays: 61, rateMonthly: 1.25, label: '32–61 Days (1.25%/mo)' },
      { fromDays: 62, toDays: 91, rateMonthly: 1.5, label: '62–91 Days (1.5%/mo)' },
      { fromDays: 92, toDays: 180, rateMonthly: 2.0, label: '92–180 Days (2.0%/mo)' },
      { fromDays: 181, toDays: 99999, rateMonthly: 2.5, label: 'Above 180 Days (2.5%/mo)' }
    ],
    description: 'Standard Pawnbroker Tenure Slabs: 0-31d: 1.0%, 32-61d: 1.25%, 62-91d: 1.5%, 92-180d: 2.0%, >180d: 2.5%'
  },
  {
    id: 'IR-001',
    name: 'Standard Monthly (2.0%)',
    rateType: 'Monthly',
    baseRateMonthly: 2.0,
    minPeriodDays: 15,
    minAmount: 100,
    gracePeriodDays: 7,
    penaltyRateMonthly: 0.5,
    description: 'Standard broker rule: 2% monthly simple interest pro-rata, 15 days min, 7 days grace, 0.5% overdue penalty'
  },
  {
    id: 'IR-002',
    name: 'High Value Slab Scheme',
    rateType: 'Slab',
    baseRateMonthly: 1.5,
    minPeriodDays: 30,
    minAmount: 500,
    gracePeriodDays: 5,
    penaltyRateMonthly: 0.5,
    slabs: [
      { upToAmount: 50000, rateMonthly: 2.25 },
      { upToAmount: 150000, rateMonthly: 1.85 },
      { upToAmount: 500000, rateMonthly: 1.50 },
      { upToAmount: 10000000, rateMonthly: 1.25 }
    ],
    description: 'Tiered interest: lower rates for higher principal loans above ₹1.5L and ₹5L'
  },
  {
    id: 'IR-003',
    name: 'Short Term Daily Scheme',
    rateType: 'Daily',
    baseRateMonthly: 2.4,
    minPeriodDays: 7,
    minAmount: 50,
    gracePeriodDays: 3,
    penaltyRateMonthly: 0.75,
    description: 'Daily calculated interest for quick emergency pledges'
  },
  {
    id: 'IR-004',
    name: 'Flat Rate 1.75% Fixed',
    rateType: 'Flat',
    baseRateMonthly: 1.75,
    minPeriodDays: 30,
    minAmount: 200,
    gracePeriodDays: 7,
    penaltyRateMonthly: 0.5,
    description: 'Fixed 1.75% per calendar month or fraction'
  }
];

export const SEED_LOCKERS: LockerLocation[] = [
  {
    id: 'LCK-01',
    branchId: 'BR-001',
    name: 'Main Strongroom Vault Alpha',
    lockerCode: 'SAFE-A',
    racks: ['Rack 1', 'Rack 2', 'Rack 3', 'Rack 4'],
    trays: ['Tray 01', 'Tray 02', 'Tray 03', 'Tray 04', 'Tray 05']
  },
  {
    id: 'LCK-02',
    branchId: 'BR-001',
    name: 'Secondary Safe Beta',
    lockerCode: 'SAFE-B',
    racks: ['Rack A', 'Rack B'],
    trays: ['Tray 01', 'Tray 02', 'Tray 03']
  }
];

// Clean Production Initial State — Zero mock data
export const SEED_CUSTOMERS: Customer[] = [];
export const SEED_MORTGAGES: Mortgage[] = [];
export const SEED_PACKETS: GoldPacket[] = [];
export const SEED_PAYMENTS: Payment[] = [];
export const SEED_LEDGER: LedgerEntry[] = [];
export const SEED_EXPENSES: Expense[] = [];
export const SEED_AUDIT_LOGS: AuditLog[] = [];

export const SEED_SETTINGS: BusinessSettings = {
  companyName: 'Nexus Gold Pawn Brokers & Bankers',
  tagline: 'Licensed Pawnbroking, Gold Loans & Secured Strongroom Custody',
  selectedCity: 'Chennai',
  goodReturnsLiveRates: getGoodReturnsRatesForCity('Chennai'),
  goldRates: {
    '24K': 7920,
    '22K': 7260,
    '20K': 6600,
    '18K': 5940,
    '14K': 4620
  },
  defaultBrokerMortgageMarginPct: 88,
  defaultLtv: 70,
  defaultInterestRuleId: 'IR-TENURE',
  prefixes: {
    customer: 'CUS-',
    mortgage: 'GM-2026-',
    packet: 'PKT-2026-',
    receipt: 'RCT-2026-',
    expense: 'EXP-2026-'
  },
  thermalReceiptHeader: 'NEXUS GOLD PAWN BROKERS\nLicensed Pawnbrokers Under State Act\nGSTIN: 33AAACN1234F1Z5\nHelpline: +91 44 2538 9012',
  termsAndConditions: '1. The borrower pledges the described gold ornaments as security for loan.\n2. Loan eligibility is based on broker appraised valuation.\n3. Interest is calculated as agreed in this agreement.\n4. Gold packets remain in insured strongroom custody until full redemption.\n5. On redemption, the customer must present this original pawn ticket with valid ID.'
};

export const DEFAULT_RBAC_MATRIX: RbacMatrix = {
  'Master Admin / Owner': {
    desc: 'Full unrestricted system, users, settings, reports, audit and financial controls.',
    customers: true,
    kyc: true,
    appraise: true,
    mortgageApproval: true,
    paymentCollection: true,
    expenses: true,
    reports: true,
    auditLogs: true,
    systemSettings: true
  },
  'Manager': {
    desc: 'Customers, KYC, mortgages, loan approvals, payments, reports; restricted system settings.',
    customers: true,
    kyc: true,
    appraise: true,
    mortgageApproval: true,
    paymentCollection: true,
    expenses: true,
    reports: true,
    auditLogs: true,
    systemSettings: false
  },
  'Cashier': {
    desc: 'Customer search, payment collection, receipts, and permitted operational expense entries.',
    customers: true,
    kyc: false,
    appraise: false,
    mortgageApproval: false,
    paymentCollection: true,
    expenses: true,
    reports: false,
    auditLogs: false,
    systemSettings: false
  },
  'KYC Staff': {
    desc: 'Customer registration, webcam photograph capture, and authorized KYC identity workflows.',
    customers: true,
    kyc: true,
    appraise: false,
    mortgageApproval: false,
    paymentCollection: false,
    expenses: false,
    reports: false,
    auditLogs: false,
    systemSettings: false
  },
  'Gold Appraiser': {
    desc: 'Gold item entry, gross/net weight testing, karat purity verification, and loan valuation.',
    customers: true,
    kyc: false,
    appraise: true,
    mortgageApproval: false,
    paymentCollection: false,
    expenses: false,
    reports: false,
    auditLogs: false,
    systemSettings: false
  },
  'Auditor': {
    desc: 'Read-only access to transaction history, interest accounting, and immutable audit logs.',
    customers: true,
    kyc: false,
    appraise: false,
    mortgageApproval: false,
    paymentCollection: false,
    expenses: false,
    reports: true,
    auditLogs: true,
    systemSettings: false
  }
};
