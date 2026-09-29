import { Mortgage, Payment, InterestBreakdown } from '../types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0);
}

export function formatWeight(weight: number): string {
  return `${(weight || 0).toFixed(3)} g`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

export function calculateDaysBetween(startDateStr: string, endDate: Date = new Date()): number {
  const start = new Date(startDateStr);
  const diffTime = endDate.getTime() - start.getTime();
  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
}

/**
 * Standard Indian / Tamil Nadu Pawnbroking Interest Calculation Formula
 * Monthly interest rate applied per elapsed month or fraction of month.
 */
export function calculateInterestBreakdown(
  mortgage: Mortgage,
  payments: Payment[] = [],
  asOfDate: Date = new Date()
): InterestBreakdown {
  const daysElapsed = calculateDaysBetween(mortgage.mortgageDate, asOfDate);
  const monthsElapsed = Math.max(1, Math.ceil(daysElapsed / 30));

  // Monthly regular interest = (Principal * Rate%) / 100
  const monthlyInterestRate = mortgage.interestRate || 1.5;
  const regularInterestTotal = Math.round((mortgage.principalAmount * (monthlyInterestRate / 100)) * monthsElapsed);

  // Total interest paid so far across payment receipts
  const interestPaidSoFar = payments
    .filter(p => p.mortgageId === mortgage.id)
    .reduce((sum, p) => sum + (p.interestPaid || 0), 0);

  // Check overdue against maturity date
  const maturity = new Date(mortgage.maturityDate);
  const isOverdue = asOfDate.getTime() > maturity.getTime();
  const overdueDays = isOverdue
    ? Math.max(0, Math.floor((asOfDate.getTime() - maturity.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Penalty interest if overdue beyond grace period
  let penaltyInterest = 0;
  if (isOverdue && overdueDays > (mortgage.gracePeriodDays || 7)) {
    const penaltyRate = mortgage.penaltyRateMonthly || 1.0;
    const overdueMonths = Math.ceil(overdueDays / 30);
    penaltyInterest = Math.round((mortgage.principalAmount * (penaltyRate / 100)) * overdueMonths);
  }

  const netInterestDue = Math.max(0, regularInterestTotal + penaltyInterest - interestPaidSoFar);
  const totalSettlementAmount = mortgage.principalAmount + netInterestDue;

  return {
    daysElapsed,
    monthsElapsed,
    regularInterest: regularInterestTotal,
    isOverdue,
    overdueDays,
    penaltyInterest,
    totalInterestDue: netInterestDue,
    totalSettlementAmount
  };
}
