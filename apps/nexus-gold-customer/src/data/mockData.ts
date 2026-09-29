import { Customer, Mortgage, Payment, Branch, GoldRate, PawnEnquiry } from '../types';

export const MOCK_GOLD_RATES: GoldRate = {
  purity24K: 7550,
  purity22K: 6920,
  purity18K: 5660,
  silverPerGram: 96,
  lastUpdated: 'Live Market Benchmark • Today'
};

export const MOCK_BRANCH: Branch = {
  id: 'br-main',
  name: 'Nexus Gold Jewellers & Bankers',
  code: 'NG-CH-01',
  phone: '+91 98401 98765',
  email: 'support@nexusgoldpawn.com',
  address: 'No. 42, Car Street, Near Bus Stand',
  city: 'Tiruvannamalai, Tamil Nadu - 606601',
  licenseNumber: 'TN/PBN/2026/0894',
  panNumber: 'AAACN1234F',
  workingHours: '9:00 AM - 8:30 PM (Mon - Sat)',
  managerName: 'S. Ramanathan'
};

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'CUST-8041',
    name: 'Rajesh Kumar (ராஜேஷ் குமார்)',
    mobile: '9876543210',
    email: 'rajesh.kumar@gmail.com',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    address: '15, Sannathi Street, Pavazhakundur',
    city: 'Tiruvannamalai',
    kycRecord: {
      maskedId: 'XXXX-XXXX-4921',
      aadhaarNumber: '784512984921',
      verifiedDate: '2026-08-15',
      nameMatchScore: 98,
      nameMatchStatus: 'EXACT',
      status: 'VERIFIED'
    }
  },
  {
    id: 'CUST-7023',
    name: 'Priya Murugan (பிரியா முருகன்)',
    mobile: '9840123456',
    email: 'priya.murugan@yahoo.com',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    address: '8, Gandhi Nagar 2nd Street',
    city: 'Tiruvannamalai',
    kycRecord: {
      maskedId: 'XXXX-XXXX-8812',
      aadhaarNumber: '561234908812',
      verifiedDate: '2026-07-20',
      nameMatchScore: 100,
      nameMatchStatus: 'EXACT',
      status: 'VERIFIED'
    }
  },
  {
    id: 'CUST-9114',
    name: 'S. Murugesan (எஸ். முருகேசன்)',
    mobile: '9443312345',
    email: 'murugesan.farmer@gmail.com',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    address: 'Village Pudur, Post Office Road',
    city: 'Chengam',
    kycRecord: {
      maskedId: 'XXXX-XXXX-3341',
      aadhaarNumber: '901245673341',
      verifiedDate: '2026-09-02',
      nameMatchScore: 96,
      nameMatchStatus: 'EXACT',
      status: 'VERIFIED'
    }
  }
];

export const MOCK_MORTGAGES: Mortgage[] = [
  {
    id: 'MORT-2026-001',
    mortgageNumber: 'M-2026-0891',
    customerId: 'CUST-8041',
    branchCode: 'NG-CH-01',
    principalAmount: 120000,
    interestRate: 1.5, // 1.5% per month
    penaltyRateMonthly: 1.0,
    gracePeriodDays: 7,
    mortgageDate: '2026-07-10',
    maturityDate: '2027-01-10',
    status: 'Active',
    vaultLocation: 'Fireproof Safe 1 • Tray 03',
    tokenNumber: 'TK-891',
    totalValuation: 165000,
    notes: 'Family gold jewels pledged for agricultural borewell deepening.',
    items: [
      {
        id: 'ITM-01',
        itemType: 'Gold Rope Chain (கயிறு சங்கிலி)',
        description: '22K 916 Hallmarked Traditional Heavy Machine Chain',
        purity: '22K (916)',
        grossWeight: 24.500,
        stoneWeight: 0.000,
        netWeight: 24.500,
        marketValue: 185000,
        photoReference: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&auto=format&fit=crop&q=80'
      },
      {
        id: 'ITM-02',
        itemType: 'Gold Ruby Ring (ரூபி மோதிரம்)',
        description: 'Gentleman gents ring with red ruby stone',
        purity: '22K (916)',
        grossWeight: 8.200,
        stoneWeight: 0.600,
        netWeight: 7.600,
        marketValue: 58000,
        photoReference: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    id: 'MORT-2026-002',
    mortgageNumber: 'M-2026-0904',
    customerId: 'CUST-8041',
    branchCode: 'NG-CH-01',
    principalAmount: 55000,
    interestRate: 1.5,
    penaltyRateMonthly: 1.0,
    gracePeriodDays: 7,
    mortgageDate: '2026-08-25',
    maturityDate: '2027-02-25',
    status: 'Active',
    vaultLocation: 'Vault B • Locker V-102',
    tokenNumber: 'TK-904',
    totalValuation: 78000,
    notes: 'Gold bangles pledged for college tuition fee.',
    items: [
      {
        id: 'ITM-03',
        itemType: 'Casting Gold Bangles (வளையல்கள் 2)',
        description: 'Pair of solid floral design daily wear bangles',
        purity: '22K (916)',
        grossWeight: 16.400,
        stoneWeight: 0.000,
        netWeight: 16.400,
        marketValue: 125000,
        photoReference: 'https://images.unsplash.com/photo-1611591475806-0312384a6c8e?w=400&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    id: 'MORT-2026-003',
    mortgageNumber: 'M-2026-0742',
    customerId: 'CUST-7023',
    branchCode: 'NG-CH-01',
    principalAmount: 85000,
    interestRate: 1.25,
    penaltyRateMonthly: 1.0,
    gracePeriodDays: 7,
    mortgageDate: '2026-06-15',
    maturityDate: '2026-12-15',
    status: 'Active',
    vaultLocation: 'Vault A • Tray 01',
    tokenNumber: 'TK-742',
    totalValuation: 118000,
    notes: 'Wedding Thali coin and chain necklace.',
    items: [
      {
        id: 'ITM-04',
        itemType: 'Traditional Thali Chain (தாலி கொடி)',
        description: '22K 916 Hallmark mugappu long chain',
        purity: '22K (916)',
        grossWeight: 22.000,
        stoneWeight: 1.100,
        netWeight: 20.900,
        marketValue: 158000,
        photoReference: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    id: 'MORT-2026-004',
    mortgageNumber: 'M-2026-0518',
    customerId: 'CUST-9114',
    branchCode: 'NG-CH-01',
    principalAmount: 200000,
    interestRate: 1.75,
    penaltyRateMonthly: 1.0,
    gracePeriodDays: 7,
    mortgageDate: '2026-03-01',
    maturityDate: '2026-09-01',
    status: 'Overdue',
    vaultLocation: 'Special Safe • Box 12',
    tokenNumber: 'TK-518',
    totalValuation: 275000,
    notes: 'Pledged for tractor repair and fertilizer purchase.',
    items: [
      {
        id: 'ITM-05',
        itemType: 'Antique Gold Haram (ஆரம்)',
        description: 'Traditional temple jewelry necklace with emeralds and rubies',
        purity: '22K (916)',
        grossWeight: 42.500,
        stoneWeight: 3.200,
        netWeight: 39.300,
        marketValue: 298000,
        photoReference: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&auto=format&fit=crop&q=80'
      }
    ]
  }
];

export const MOCK_PAYMENTS: Payment[] = [
  {
    id: 'PAY-2026-4401',
    receiptNumber: 'RCP-4401',
    mortgageId: 'MORT-2026-001',
    amount: 3600,
    principalPaid: 0,
    interestPaid: 3600,
    paymentDate: '2026-09-10',
    paymentMethod: 'UPI',
    collectedBy: 'Staff Cashier (A. Kumar)',
    notes: '2 Months monthly interest cleared via Google Pay UPI.'
  },
  {
    id: 'PAY-2026-3810',
    receiptNumber: 'RCP-3810',
    mortgageId: 'MORT-2026-003',
    amount: 3187,
    principalPaid: 0,
    interestPaid: 3187,
    paymentDate: '2026-09-15',
    paymentMethod: 'CASH',
    collectedBy: 'Branch Manager',
    notes: '3 Months regular interest payment.'
  }
];

export const MOCK_ENQUIRIES: PawnEnquiry[] = [
  {
    id: 'ENQ-2026-1042',
    customerName: 'Karthik Subramanian (கார்த்திக்)',
    customerMobile: '9841122334',
    itemType: 'Gold Bangles (வளையல்கள்)',
    purity: '22K (916)',
    approxWeight: 32.0,
    expectedAmount: 150000,
    estimatedMarketValue: 221440,
    maxEligibleLoan: 166080,
    preferredVisitDate: '2026-09-30',
    notes: 'Would like to visit the shop around 11:30 AM for ornament testing.',
    status: 'SUBMITTED',
    createdAt: '2026-09-28 14:30'
  }
];
