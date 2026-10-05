export interface KycRecord {
  aadhaarNumber?: string;
  maskedId: string;
  verifiedDate: string;
  nameMatchScore?: number;
  nameMatchStatus?: string;
  status: 'VERIFIED' | 'PENDING' | 'REJECTED';
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  photoUrl?: string;
  address: string;
  city: string;
  isNewCustomer?: boolean;
  kycRecord: KycRecord;
}

export interface MortgageItem {
  id: string;
  itemType: string;
  description: string;
  purity: string; // e.g. '22K (916)' | '24K (999)' | '18K (750)'
  grossWeight: number; // in grams
  stoneWeight: number;
  netWeight: number;
  marketValue: number;
  photoReference?: string;
}

export interface Mortgage {
  id: string;
  mortgageNumber: string;
  customerId: string;
  branchCode: string;
  principalAmount: number;
  interestRate: number; // monthly % e.g. 1.5
  penaltyRateMonthly: number; // e.g. 1.0
  gracePeriodDays: number; // e.g. 7
  mortgageDate: string;
  maturityDate: string;
  status: 'Active' | 'Due' | 'Overdue' | 'Closed';
  vaultLocation: string; // e.g. "Vault A - Tray 04"
  items: MortgageItem[];
  totalValuation: number;
  tokenNumber: string;
  releaseRequest?: {
    requestedAt: string;
    scheduledPickupDate: string;
    customerNotes?: string;
    status: 'Pending' | 'Ready' | 'Delivered';
  };
  notes?: string;
}

export interface Payment {
  id: string;
  receiptNumber: string;
  mortgageId: string;
  amount: number;
  principalPaid: number;
  interestPaid: number;
  paymentDate: string;
  paymentMethod: 'CASH' | 'UPI' | 'NEFT';
  collectedBy: string;
  notes?: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  licenseNumber: string;
  panNumber: string;
  workingHours: string;
  managerName: string;
}

export interface InterestBreakdown {
  daysElapsed: number;
  monthsElapsed: number;
  regularInterest: number;
  isOverdue: boolean;
  overdueDays: number;
  penaltyInterest: number;
  totalInterestDue: number;
  totalSettlementAmount: number;
}

export interface GoldRate {
  purity24K: number;
  purity22K: number;
  purity18K: number;
  silverPerGram: number;
  lastUpdated: string;
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
  status: 'SUBMITTED' | 'REVIEWED' | 'APPOINTMENT_BOOKED' | 'CLOSED' | 'CONVERTED';
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
