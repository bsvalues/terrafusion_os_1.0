/**
 * Date utilities for standardized date formatting and calculations
 * Used throughout the application for consistent date handling
 */

/**
 * Format a date object according to Washington state requirements
 * Default format: MM/DD/YYYY
 */
export function formatDate(date: Date, format: string = 'MM/DD/YYYY'): string {
  if (!date) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'MM/DD/YYYY HH:mm':
      return `${month}/${day}/${year} ${hours}:${minutes}`;
    case 'MM/DD/YYYY HH:mm:ss':
      return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
    case 'MMMM D, YYYY':
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June', 
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return `${monthNames[date.getMonth()]} ${date.getDate()}, ${year}`;
    default:
      return `${month}/${day}/${year}`;
  }
}

/**
 * Calculate the difference in days between two dates
 */
export function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  const diffDays = Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
  return diffDays;
}

/**
 * Calculate the difference in years between two dates
 */
export function yearsBetween(date1: Date, date2: Date): number {
  const diffYears = Math.abs(date1.getFullYear() - date2.getFullYear());
  return diffYears;
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add months to a date
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Add years to a date
 */
export function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

/**
 * Check if a date is within a specified time range
 */
export function isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
  return date >= startDate && date <= endDate;
}

/**
 * Get the fiscal year based on a date
 * For Washington State, fiscal year runs from July 1 to June 30
 * Returns the year when the fiscal year ends
 */
export function fiscalYear(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // If month is January through June (0-5), fiscal year is the current year
  // If month is July through December (6-11), fiscal year is the next year
  return month < 6 ? year : year + 1;
}

/**
 * Check if a date is within the current fiscal year
 */
export function isCurrentFiscalYear(date: Date): boolean {
  const today = new Date();
  return fiscalYear(date) === fiscalYear(today);
}

/**
 * Format a date range as a string
 */
export function formatDateRange(startDate: Date, endDate: Date, format: string = 'MM/DD/YYYY'): string {
  return `${formatDate(startDate, format)} - ${formatDate(endDate, format)}`;
}