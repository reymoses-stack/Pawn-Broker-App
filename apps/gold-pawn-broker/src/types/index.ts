export type UserRole = 
  | 'Master Admin / Owner'
  | 'Manager'
  | 'Cashier'
  | 'KYC Staff'
  | 'Gold Appraiser'
  | 'Auditor';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  branchId: string;
  avatar?: string;
  isActive: boolean;
  username?: string;
  password?: string;
  mustChangePassword?: boolean;
  isOwner?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface RolePermissionSet {
  desc: string;
  customers: boolean;
  kyc: boolean;
  appraise: boolean;
  mortgageApproval: boolean;
  paymentCollection: boolean;
  expenses: boolean;
  reports: boolean;
  auditLogs: boolean;
  systemSettings: boolean;
}

export type RbacMatrix = Record<UserRole, RolePermissionSet>;

export interface AuthSession {
  user: User;
  token: string;
  loginMethod: 'owner_email' | 'owner_otp' | 'employee_password';
  loginTime: number; // millisecond timestamp
  expiresAt: number; // loginTime + 4 hours
}

export interface BankAccount {
  id: string;
  bankName: string; // e.g. State Bank of India, HDFC Bank, ICICI Bank, Indian Bank, Canara Bank
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string; // Bank's branch name e.g. "T. Nagar Branch"
  accountType: 'Current' | 'Savings' | 'OD / CC';
  balance: number;
  assignedBranchId?: string; // 'all' or specific shop branch ID
  isDefault?: boolean;
  createdAt: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  panNumber: string;
  licenseNumber: string;
  assignedBankAccountIds?: string[];
  openingCash?: number;
  createdAt?: string;
}

export type KycStatus = 'Pending' | 'In Progress' | 'Verified' | 'Failed' | 'Expired';
export type KycProvider = 'UIDAI Aadhaar' | 'PAN Card' | 'Passport' | 'Voter ID' | 'Driving License';
export type CustomerTier = 'VIP Gold' | 'Regular Premium' | 'Standard' | 'New Borrower' | 'New Customer';

export interface NameMatchResult {
  score: number; // 0 to 100
  matchLevel: 'EXACT' | 'HIGH' | 'PARTIAL' | 'MISMATCH';
  message: string;
  recommendation: string;
  enteredNameTokens: string[];
  aadhaarNameTokens: string[];
  isMatchAcceptable: boolean;
}

export interface KycRecord {
  id: string;
  customerId: string;
  provider: KycProvider;
  maskedId: string;
  consentGiven: boolean;
  consentTimestamp: string;
  status: KycStatus;
  verificationReference: string;
  operatorId: string;
  verifiedAt?: string;
  responseMetadata?: string;
  notes?: string;
  // UIDAI Aadhaar Name Sync & Demographics
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
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  secondaryMobile?: string;
  aadhaarNumber?: string;
  dateOfBirth: string;
  address: string;
  city: string;
  pincode: string;
  occupation: string;
  nomineeName: string;
  nomineeRelation: string;
  nomineePhone: string;
  photoUrl: string;
  kycStatus: KycStatus;
  kycRecord?: KycRecord;
  branchId: string;
  customerTier: CustomerTier;
  preferredBrokerRateAdjustment?: number; // e.g. +100/g for loyal customer
  preferredInterestRate?: number; // Pawnbroker's agreed custom monthly rate % (e.g. 1.5% or 2.0%)
  creditScoreRating?: 'A+' | 'A' | 'B' | 'C';
  notes?: string;
  createdAt: string;
}

export type GoldPurity = '24K' | '22K' | '20K' | '18K' | '14K';
export type GoldItemType = 'Chain' | 'Ring' | 'Bangle' | 'Necklace' | 'Coin' | 'Earring' | 'Bracelet' | 'Waist Chain (Oddiyanam)' | 'Anklet' | 'Other';

export interface GoldItem {
  id: string;
  mortgageId: string;
  itemType: GoldItemType;
  description: string;
  grossWeight: number; // grams
  stoneWeight: number; // grams
  netWeight: number; // gross - stone
  purity: GoldPurity;
  karat: number;
  goldRate?: number;
  marketGoldRate: number; // GoodReturns Live Bullion Market Rate per gram
  brokerMortgageRate: number; // Pawn Broker's Desired Lending Rate for this customer (₹/g)
  marketValue: number; // netWeight * marketGoldRate
  brokerValuation: number; // netWeight * brokerMortgageRate
  eligibleLtv: number; // % applied to brokerValuation
  eligibleLoan: number; // brokerValuation * (LTV/100)
  approvedLoan: number;
  photoReference?: string;
  packetId?: string;
}

export type MortgageStatus = 'Active' | 'Due' | 'Overdue' | 'Renewed' | 'Closed';
export type InterestType = 'Monthly' | 'Daily' | 'Flat' | 'Slab' | 'TenureSlab';
export type DisbursementMode = 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque';

export interface Mortgage {
  id: string;
  mortgageNumber: string;
  customerId: string;
  branchId: string;
  mortgageDate: string;
  maturityDate: string;
  principalAmount: number;
  interestRate: number;
  interestType: InterestType;
  interestFrequency: 'Monthly' | 'Daily';
  penaltyRateMonthly?: number; // Late payment penalty percentage fixed at pledge time (e.g. 1.0%/mo)
  gracePeriodDays?: number; // Grace period in days before late penalty applies (e.g. 7 days)
  processingFee: number;
  otherCharges: number;
  outstandingPrincipal: number;
  outstandingInterest: number;
  status: MortgageStatus;
  disbursementMode: DisbursementMode;
  packetId: string;
  items: GoldItem[];
  renewalHistory: RenewalRecord[];
  createdBy: string;
  approvedBy: string;
  lastPaymentDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RenewalRecord {
  id: string;
  mortgageId: string;
  previousMaturityDate: string;
  newMaturityDate: string;
  interestSettled: number;
  settledDate: string;
  approvedBy: string;
  receiptNumber: string;
  notes?: string;
}

export type PacketStatus = 'Prepared' | 'In Locker' | 'Temporarily Removed' | 'Released' | 'Auction';

export interface PacketMovement {
  id: string;
  timestamp: string;
  fromLocation: string;
  toLocation: string;
  movedBy: string;
  reason: string;
}

export interface GoldPacket {
  id: string;
  mortgageId: string;
  customerId: string;
  branchId: string;
  lockerId: string;
  rack: string;
  tray: string;
  bin?: string;
  status: PacketStatus;
  totalGrossWeight: number;
  totalNetWeight: number;
  itemCount: number;
  movements: PacketMovement[];
  createdAt: string;
  releasedAt?: string;
  releasedBy?: string;
}

export interface LockerLocation {
  id: string;
  branchId: string;
  name: string;
  lockerCode: string;
  racks: string[];
  trays: string[];
}

export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque';
export type PaymentStatus = 'Completed' | 'Reversed';

export interface Payment {
  id: string;
  mortgageId: string;
  mortgageNumber: string;
  customerId: string;
  branchId: string;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  allocatedPrincipal: number;
  allocatedInterest: number;
  allocatedPenalties: number;
  allocatedCharges: number;
  receivedBy: string;
  status: PaymentStatus;
  reversalReason?: string;
  reversedBy?: string;
  reversedAt?: string;
  createdAt: string;
}

export type LedgerAccount = 'Cash' | 'Bank';
export type LedgerEntryType = 'Credit' | 'Debit';
export type LedgerCategory = 
  | 'Loan Disbursement'
  | 'Principal Repayment'
  | 'Interest Income'
  | 'Processing Fee'
  | 'Late Penalty'
  | 'Rent'
  | 'Salary'
  | 'Electricity'
  | 'Internet'
  | 'Transport'
  | 'Office Supplies'
  | 'Maintenance'
  | 'Marketing'
  | 'Gold Sales'
  | 'Bank Charges'
  | 'Other Expense'
  | 'Other Income'
  | 'Capital Injection'
  | 'Internal Branch Transfer Out'
  | 'Internal Branch Transfer In';

export interface LedgerEntry {
  id: string;
  branchId: string;
  date: string;
  account: LedgerAccount;
  type: LedgerEntryType;
  category: LedgerCategory;
  amount: number;
  balanceAfter: number;
  referenceId?: string;
  bankAccountId?: string;
  sourceBranchId?: string;
  targetBranchId?: string;
  description: string;
  recordedBy: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  branchId: string;
  category: 'Rent' | 'Salary' | 'Electricity' | 'Internet' | 'Transport' | 'Maintenance' | 'Marketing' | 'Bank Charges' | 'Office Supplies' | 'Tea & Refreshments' | 'Other';
  amount: number;
  paymentMode: 'Cash' | 'Bank';
  date: string;
  description: string;
  recordedBy: string;
  receiptRef?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  branchId: string;
  action: 'CREATE' | 'UPDATE' | 'APPROVE' | 'PAYMENT' | 'REVERSAL' | 'RENEWAL' | 'CLOSURE' | 'RELEASE' | 'KYC_VERIFY' | 'MOVE_PACKET' | 'SETTINGS_CHANGE' | 'USER_LOGIN' | 'USER_LOGOUT' | 'PASSWORD_CHANGE' | 'CREATE_EMPLOYEE' | 'UPDATE_EMPLOYEE' | 'RESET_PASSWORD' | 'DELETE_EMPLOYEE';
  entityType: 'MORTGAGE' | 'CUSTOMER' | 'PAYMENT' | 'EXPENSE' | 'GOLD_PACKET' | 'KYC' | 'SETTINGS' | 'AUTH' | 'STAFF_MANAGEMENT';
  entityId: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  deviceIp?: string;
}

export interface TenureSlab {
  fromDays: number;
  toDays: number;
  rateMonthly: number;
  label: string;
}

export interface InterestRule {
  id: string;
  name: string;
  rateType: InterestType;
  baseRateMonthly: number;
  minPeriodDays: number;
  minAmount: number;
  gracePeriodDays: number;
  penaltyRateMonthly: number;
  slabs?: {
    upToAmount: number;
    rateMonthly: number;
  }[];
  tenureSlabs?: TenureSlab[];
  description: string;
}

export interface GoodReturnsRateData {
  city: string;
  lastUpdated: string;
  rates: {
    '24K': number;
    '22K': number;
    '20K': number;
    '18K': number;
    '14K': number;
  };
  ratesByKarat: Record<number, number>;
  change24h: {
    '24K': number;
    '22K': number;
  };
  sourceUrl: string;
  isLive: boolean;
  isManualOverride?: boolean;
}

export interface BusinessSettings {
  companyName: string;
  tagline: string;
  selectedCity: string;
  goodReturnsLiveRates: GoodReturnsRateData;
  goldRates: {
    '24K': number;
    '22K': number;
    '20K': number;
    '18K': number;
    '14K': number;
  };
  defaultBrokerMortgageMarginPct: number; // e.g. 88% of GoodReturns live rate as standard mortgage lending rate
  defaultLtv: number;
  defaultInterestRuleId: string;
  prefixes: {
    customer: string;
    mortgage: string;
    packet: string;
    receipt: string;
    expense: string;
  };
  thermalReceiptHeader: string;
  termsAndConditions: string;
}

export interface PawnEnquiry {
  id: string;
  customerName: string;
  customerMobile: string;
  itemType: string;
  purity: string;
  approxWeight: number;
  expectedAmount: number;
  estimatedMarketValue: number;
  maxEligibleLoan: number;
  preferredVisitDate?: string;
  notes?: string;
  photoUrl?: string;
  status: 'SUBMITTED' | 'REVIEWED' | 'APPOINTMENT_BOOKED' | 'CONVERTED' | 'CLOSED';
  createdAt: string;
  // Doorstep service fields
  serviceType?: 'COUNTER_VISIT' | 'DOORSTEP';
  customerPincode?: string;
  customerAddress?: string;
  isDoorstepServiceAvailable?: boolean;
  preferredSlot?: string;
}

export interface ServicePincode {
  id: string;
  pincode: string;
  area: string;
  active: boolean;
  addedAt: string;
}
