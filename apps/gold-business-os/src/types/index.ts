export type Role =
  | 'SUPER_ADMIN'
  | 'BUSINESS_ADMIN'
  | 'BRANCH_MANAGER'
  | 'LOAN_OFFICER'
  | 'GOLD_APPRAISER'
  | 'CASHIER'
  | 'VAULT_MANAGER'
  | 'ACCOUNTANT'
  | 'CUSTOMER';

export interface GoldRates {
  rate24kPerGram: number; // e.g. 15,475 (GoodReturns/Metals Live Rate)
  rate22kPerGram: number; // e.g. 14,185 (916 Hallmarked)
  rate18kPerGram: number; // e.g. 11,955 (750 Purity)
  rate14kPerGram: number; // e.g. 9,027 (585 Purity)
  ratePerSovereign22k: number; // 8 grams 22K (Pavan)
  ratePerSovereign24k: number; // 8 grams 24K
  changePercent24k: number; // e.g. -0.60%
  changePercent22k: number; // e.g. -0.60%
  highToday24k: number;
  lowToday24k: number;
  highToday22k: number;
  lowToday22k: number;
  buyingMarginPercent: number; // e.g. -2.5% scrap margin
  loanValuationRate22k: number; // e.g. 10,638 benchmark (75% LTV)
  coinPremiumPercent: number; // e.g. 2.8%
  coinMakingChargesPerGram: number; // e.g. 220
  taxGstPercent: number; // 3%
  source: string; // e.g. 'GoodReturns & Metals Live Market Feed'
  marketStatus: 'OPEN' | 'CLOSED';
  lastUpdated: string;
  isLiveStreaming: boolean;
}

export interface Branch {
  id: string;
  code: string;
  name: string;
  city: string;
  address: string;
  vaultCapacityKg: number;
  currentVaultHoldingGrams: number;
  cashLimit: number;
  currentCashBalance: number;
  activeStaffCount: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  kycStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
  idType: 'AADHAAR' | 'PAN' | 'PASSPORT';
  idNumberMasked: string;
  cibilScore: number;
  totalActiveLoans: number;
  totalGoldPledgedGrams: number;
  joinedDate: string;
}

export interface GoldAppraisalItem {
  id: string;
  itemType: 'NECKLACE' | 'BANGLE' | 'RING' | 'CHAIN' | 'COIN' | 'EARRINGS' | 'OTHER';
  description: string;
  grossWeight: number; // in grams
  stoneWeight: number; // in grams
  netWeight: number; // gross - stone
  karat: 18 | 20 | 22 | 24;
  purityPercentage: number;
  rateApplied: number; // ₹ per gram
  calculatedValue: number;
  imageUrl?: string;
}

export interface LoanProduct {
  id: string;
  name: string;
  tenureMonths: number;
  interestRatePerAnnum: number; // e.g. 10.5%
  maxLtvPercent: number; // e.g. 75% max as per RBI
  processingFeePercent: number; // e.g. 0.5%
  repaymentType: 'BULLET' | 'MONTHLY_INTEREST' | 'EMI';
  gracePeriodDays: number;
  penalInterestPercent: number;
}

export type LoanStatus =
  | 'APPLIED'
  | 'APPRAISED'
  | 'APPROVED'
  | 'DISBURSED'
  | 'ACTIVE'
  | 'DUE'
  | 'OVERDUE'
  | 'RENEWED'
  | 'CLOSED'
  | 'DEFAULT'
  | 'AUCTION';

export interface GoldLoan {
  id: string;
  loanNumber: string; // e.g. GL-2026-000182
  customerId: string;
  customerName: string;
  customerPhone: string;
  branchId: string;
  branchName: string;
  items: GoldAppraisalItem[];
  totalGrossWeight: number;
  totalNetWeight: number;
  totalValuation: number;
  loanAmount: number;
  ltvPercent: number;
  product: LoanProduct;
  status: LoanStatus;
  packetId: string;
  packetLocation: string; // e.g. Vault 1 -> Rack B -> Tray 04 -> P-12
  disbursementMethod: 'CASH' | 'NEFT' | 'UPI';
  disbursementRef: string;
  outstandingPrincipal: number;
  accruedInterest: number;
  interestPaidTotal: number;
  startDate: string;
  dueDate: string;
  closedDate?: string;
  appraiserName: string;
  approverName: string;
}

export interface VaultPacket {
  id: string;
  packetCode: string; // e.g. PKT-CHN-000928
  loanNumber: string;
  customerId: string;
  customerName: string;
  branchCode: string;
  vaultId: string;
  rack: string;
  tray: string;
  slot: string;
  itemCount: number;
  grossWeight: number;
  netWeight: number;
  sealedAt: string;
  sealStatus: 'SEALED_IN_VAULT' | 'IN_TRANSIT' | 'RELEASE_PENDING' | 'RELEASED_TO_CUSTOMER';
  custodianEmployee: string;
  qrPayload: string;
}

export interface GoldPurchaseTransaction {
  id: string;
  purchaseNumber: string; // PUR-2026-0041
  customerId: string;
  customerName: string;
  phone: string;
  branchId: string;
  branchName: string;
  items: GoldAppraisalItem[];
  totalGrossWeight: number;
  totalNetWeight: number;
  meltLossPercent: number;
  payableWeight: number;
  appliedRatePerGram: number;
  grossValuation: number;
  deductions: number;
  finalPayout: number;
  paymentMethod: 'UPI' | 'NEFT' | 'CASH';
  paymentRef: string;
  status: 'EVALUATED' | 'OFFER_ACCEPTED' | 'APPROVED' | 'PAID' | 'SENT_TO_REFINERY';
  date: string;
  employeeName: string;
}

export interface CoinProduct {
  id: string;
  name: string;
  purity: '24K (99.9% Pure Gold)' | '22K (91.6% Pure Gold)';
  weightGrams: number;
  makingCharges: number;
  category: 'COIN' | 'BAR' | 'LAKSHMI_GANESH' | 'NEXUS_BULLION';
  image: string;
  description: string;
  hallmarkCertified: boolean;
  stockCount: number;
}

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'CONFIRMED'
  | 'PACKING'
  | 'PACKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface CoinOrder {
  id: string;
  orderNumber: string; // ORD-GLD-8829
  customerId: string;
  customerName: string;
  phone: string;
  shippingAddress: string;
  items: {
    product: CoinProduct;
    quantity: number;
    unitPrice: number;
  }[];
  subtotal: number;
  makingChargesTotal: number;
  taxGst: number;
  shippingCharge: number;
  totalAmount: number;
  paymentMethod: 'UPI' | 'CREDIT_CARD' | 'NET_BANKING';
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED';
  orderStatus: OrderStatus;
  trackingNumber: string;
  createdAt: string;
  invoiceUrl?: string;
}

export interface ChartOfAccount {
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  balance: number;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  refType: 'LOAN_DISBURSEMENT' | 'LOAN_REPAYMENT' | 'GOLD_PURCHASE' | 'COIN_SALE' | 'FEE_INCOME';
  refNumber: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  narration: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  who: string;
  role: string;
  branch: string;
  what: string;
  beforeValue?: string;
  afterValue?: string;
  ipContext: string;
  approvalRef?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: 'LOAN' | 'STORE' | 'VAULT' | 'SYSTEM' | 'PAYMENT';
  timestamp: string;
  read: boolean;
  recipient: 'CUSTOMER' | 'STAFF' | 'ADMIN';
}
