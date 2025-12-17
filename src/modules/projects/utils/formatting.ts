/**
 * Format date to DD-MM-YYYY format
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}-${month}-${year}`;
}

/**
 * Format currency amount
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency: string | null | undefined = 'USD'
): string {
  if (amount === null || amount === undefined || amount === '') return '-';
  
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '-';
  
  const currencyCode = currency || 'USD';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Check if deadline is overdue
 */
export function isOverdue(deadline: string | Date | null | undefined): boolean {
  if (!deadline) return false;
  
  const d = typeof deadline === 'string' ? new Date(deadline) : deadline;
  if (isNaN(d.getTime())) return false;
  
  return d < new Date();
}

/**
 * Check if deadline is upcoming (within 7 days)
 */
export function isUpcoming(deadline: string | Date | null | undefined): boolean {
  if (!deadline) return false;
  
  const d = typeof deadline === 'string' ? new Date(deadline) : deadline;
  if (isNaN(d.getTime())) return false;
  
  const today = new Date();
  const diffTime = d.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 && diffDays <= 7;
}

/**
 * Get deadline color class
 */
export function getDeadlineColor(deadline: string | Date | null | undefined): string {
  if (isOverdue(deadline)) return 'text-red-600 dark:text-red-400';
  if (isUpcoming(deadline)) return 'text-orange-600 dark:text-orange-400';
  return 'text-foreground';
}

