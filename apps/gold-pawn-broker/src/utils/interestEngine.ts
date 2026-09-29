import { InterestRule, TenureSlab } from '../types';

export const DEFAULT_TENURE_SLABS: TenureSlab[] = [
  { fromDays: 0, toDays: 31, rateMonthly: 1.0, label: '0 to 31 Days (1.0%/mo)' },
  { fromDays: 32, toDays: 61, rateMonthly: 1.25, label: '32 to 61 Days (1.25%/mo)' },
  { fromDays: 62, toDays: 91, rateMonthly: 1.5, label: '62 to 91 Days (1.5%/mo)' },
  { fromDays: 92, toDays: 180, rateMonthly: 2.0, label: '92 to 180 Days (2.0%/mo)' },
  { fromDays: 181, toDays: 99999, rateMonthly: 2.5, label: 'Above 180 Days (2.5%/mo)' }
];

export function getRateForTenureDays(days: number, customSlabs: TenureSlab[] = DEFAULT_TENURE_SLABS): number {
  const match = customSlabs.find(s => days >= s.fromDays && days <= s.toDays);
  if (match) return match.rateMonthly;
  if (days > 180) return customSlabs[customSlabs.length - 1]?.rateMonthly || 2.5;
  return 1.0;
}

export interface InterestCalculationResult {
  principal: number;
  startDate: string;
  asOfDate: string;
  elapsedDays: number;
  billableDays: number;
  effectiveMonthlyRate: number;
  baseInterest: number;
  penaltyCharges: number;
  totalAccruedInterest: number;
  isMinimumInterestApplied: boolean;
  isOverdue: boolean;
  overdueDays: number;
  ruleApplied: string;
  breakdown: string;
}

export function calculateInterest(
  principal: number,
  startDateStr: string,
  maturityDateStr: string,
  asOfDateStr: string,
  rule: InterestRule,
  customMonthlyRate?: number,
  customPenaltyRateMonthly?: number,
  customGracePeriodDays?: number
): InterestCalculationResult {
  const start = new Date(startDateStr);
  const maturity = new Date(maturityDateStr);
  const asOf = new Date(asOfDateStr);

  const diffMs = asOf.getTime() - start.getTime();
  const elapsedDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  // Minimum period constraint (e.g. at least 15 days)
  const billableDays = Math.max(elapsedDays, rule.minPeriodDays || 0);

  // Determine rate based on custom pawnbroker rate, tenure slabs, amount slabs, or base rate
  let effectiveMonthlyRate = customMonthlyRate !== undefined ? customMonthlyRate : rule.baseRateMonthly;

  if (customMonthlyRate === undefined) {
    if (rule.rateType === 'TenureSlab' || (rule.tenureSlabs && rule.tenureSlabs.length > 0)) {
      const slabsToUse = (rule.tenureSlabs && rule.tenureSlabs.length > 0) ? rule.tenureSlabs : DEFAULT_TENURE_SLABS;
      effectiveMonthlyRate = getRateForTenureDays(billableDays, slabsToUse);
    } else if (rule.rateType === 'Slab' && rule.slabs && rule.slabs.length > 0) {
      const matchedSlab = rule.slabs.find(s => principal <= s.upToAmount);
      if (matchedSlab) {
        effectiveMonthlyRate = matchedSlab.rateMonthly;
      } else {
        // highest slab
        effectiveMonthlyRate = rule.slabs[rule.slabs.length - 1].rateMonthly;
      }
    }
  }

  let baseInterest = 0;

  if (rule.rateType === 'Daily') {
    // Daily calculation: (Principal * (Rate/30) * Days) / 100
    const dailyRate = (effectiveMonthlyRate / 30) / 100;
    baseInterest = principal * dailyRate * billableDays;
  } else if (rule.rateType === 'Flat') {
    // Flat rate for whole tenure or months
    const months = Math.ceil(billableDays / 30);
    baseInterest = (principal * (effectiveMonthlyRate / 100)) * Math.max(1, months);
  } else {
    // Monthly Simple Interest with pro-rata days: (Principal * Rate * Days / 30) / 100
    const monthsExact = billableDays / 30;
    baseInterest = (principal * (effectiveMonthlyRate / 100)) * monthsExact;
  }

  // Minimum amount constraint
  let isMinimumInterestApplied = false;
  if (baseInterest < rule.minAmount && billableDays > 0) {
    baseInterest = rule.minAmount;
    isMinimumInterestApplied = true;
  }

  // Overdue and penalty check (Custom Pawnbroker fixed penalty rate)
  let isOverdue = false;
  let overdueDays = 0;
  let penaltyCharges = 0;
  const effectiveGracePeriod = customGracePeriodDays !== undefined ? customGracePeriodDays : (rule.gracePeriodDays || 7);
  const effectivePenaltyRate = customPenaltyRateMonthly !== undefined ? customPenaltyRateMonthly : (rule.penaltyRateMonthly || 1.0);

  if (asOf > maturity) {
    const overdueMs = asOf.getTime() - maturity.getTime();
    overdueDays = Math.max(0, Math.floor(overdueMs / (1000 * 60 * 60 * 24)));
    
    // Check if grace period has passed
    if (overdueDays > effectiveGracePeriod) {
      isOverdue = true;
      const penaltyMonths = overdueDays / 30;
      penaltyCharges = (principal * (effectivePenaltyRate / 100)) * penaltyMonths;
    }
  }

  baseInterest = Math.round(baseInterest);
  penaltyCharges = Math.round(penaltyCharges);
  const totalAccruedInterest = baseInterest + penaltyCharges;

  const breakdown = `${billableDays} days elapsed (${billableDays} days billed) at ${effectiveMonthlyRate}%/month. Base interest: ₹${baseInterest.toLocaleString('en-IN')}${
    penaltyCharges > 0 ? `, Overdue penalty (${overdueDays} days): ₹${penaltyCharges.toLocaleString('en-IN')}` : ''
  }. Total: ₹${totalAccruedInterest.toLocaleString('en-IN')}`;

  return {
    principal,
    startDate: startDateStr,
    asOfDate: asOfDateStr,
    elapsedDays,
    billableDays,
    effectiveMonthlyRate,
    baseInterest,
    penaltyCharges,
    totalAccruedInterest,
    isMinimumInterestApplied,
    isOverdue,
    overdueDays,
    ruleApplied: `${rule.name} (v1.0)`,
    breakdown
  };
}
