export function formatCurrency(amount: number): string {
  if (isNaN(amount)) return '₹0';
  return '₹' + Math.round(amount).toLocaleString('en-IN');
}

export function formatWeight(grams: number): string {
  if (isNaN(grams)) return '0.000 g';
  return `${Number(grams).toFixed(3)} g`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
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

export function formatDateTime(dateString: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
}

export function maskAadhaar(id: string): string {
  if (!id) return 'XXXX-XXXX-XXXX';
  const clean = id.replace(/\s|-/g, '');
  if (clean.length < 4) return 'XXXX-XXXX-XXXX';
  const lastFour = clean.slice(-4);
  return `XXXX-XXXX-${lastFour}`;
}

export function getRelativeDays(dateString: string): { label: string; days: number; isPast: boolean } {
  const target = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - today.getTime();
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (days === 0) return { label: 'Due Today', days: 0, isPast: false };
  if (days < 0) return { label: `${Math.abs(days)}d Overdue`, days, isPast: true };
  return { label: `In ${days} days`, days, isPast: false };
}
