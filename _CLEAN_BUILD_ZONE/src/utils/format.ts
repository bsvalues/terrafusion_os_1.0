/**
 * Formatting Utility Functions
 *
 * Comprehensive formatting utilities for TerraFusion OS.
 * Includes number, currency, date, and text formatting.
 */

/**
 * Format number with locale-specific formatting
 *
 * @param value - Number to format
 * @param options - Intl.NumberFormat options
 * @returns Formatted number string
 *
 * @example
 * formatNumber(1234567.89); // "1,234,567.89"
 */
export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat('en-US', options).format(value);
}

/**
 * Format currency with symbol
 *
 * @param value - Amount to format
 * @param currency - Currency code (default: USD)
 * @param options - Additional format options
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency(1234.56); // "$1,234.56"
 */
export function formatCurrency(
  value: number,
  currency: string = 'USD',
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    ...options,
  }).format(value);
}

/**
 * Format percentage
 *
 * @param value - Value to format (0.85 = 85%)
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 *
 * @example
 * formatPercent(0.8534, 2); // "85.34%"
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format date with locale-specific formatting
 *
 * @param date - Date to format
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 *
 * @example
 * formatDate(new Date()); // "1/15/2025"
 */
export function formatDate(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
}

/**
 * Format date and time
 *
 * @param date - Date to format
 * @param includeSeconds - Include seconds in output
 * @returns Formatted date-time string
 *
 * @example
 * formatDateTime(new Date()); // "1/15/2025, 3:45 PM"
 */
export function formatDateTime(
  date: Date | string | number,
  includeSeconds: boolean = false
): string {
  return formatDate(date, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    ...(includeSeconds && { second: 'numeric' }),
  });
}

/**
 * Format relative time (e.g., "3 hours ago")
 *
 * @param date - Date to format
 * @param baseDate - Base date for comparison (default: now)
 * @returns Relative time string
 *
 * @example
 * formatRelativeTime(new Date(Date.now() - 3600000)); // "1 hour ago"
 */
export function formatRelativeTime(
  date: Date | string | number,
  baseDate: Date = new Date()
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const diffMs = baseDate.getTime() - dateObj.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays < 30) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } else {
    return formatDate(dateObj);
  }
}

/**
 * Format file size
 *
 * @param bytes - Size in bytes
 * @param decimals - Number of decimal places
 * @returns Formatted file size string
 *
 * @example
 * formatFileSize(1536000); // "1.46 MB"
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Format phone number (US format)
 *
 * @param phone - Phone number string
 * @returns Formatted phone number
 *
 * @example
 * formatPhoneNumber('5551234567'); // "(555) 123-4567"
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  return phone; // Return original if format is unexpected
}

/**
 * Format Social Security Number (SSN)
 *
 * @param ssn - SSN string
 * @returns Formatted SSN
 *
 * @example
 * formatSSN('123456789'); // "123-45-6789"
 */
export function formatSSN(ssn: string): string {
  const cleaned = ssn.replace(/\D/g, '');

  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
  }

  return ssn;
}

/**
 * Truncate text with ellipsis
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @param ellipsis - Ellipsis string (default: "...")
 * @returns Truncated text
 *
 * @example
 * truncate('This is a long text', 10); // "This is..."
 */
export function truncate(
  text: string,
  maxLength: number,
  ellipsis: string = '...'
): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * Capitalize first letter of string
 *
 * @param text - Text to capitalize
 * @returns Capitalized text
 *
 * @example
 * capitalize('hello world'); // "Hello world"
 */
export function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Convert string to title case
 *
 * @param text - Text to convert
 * @returns Title case text
 *
 * @example
 * titleCase('hello world'); // "Hello World"
 */
export function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => capitalize(word))
    .join(' ');
}

/**
 * Convert camelCase to kebab-case
 *
 * @param text - camelCase text
 * @returns kebab-case text
 *
 * @example
 * camelToKebab('myVariableName'); // "my-variable-name"
 */
export function camelToKebab(text: string): string {
  return text.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Convert kebab-case to camelCase
 *
 * @param text - kebab-case text
 * @returns camelCase text
 *
 * @example
 * kebabToCamel('my-variable-name'); // "myVariableName"
 */
export function kebabToCamel(text: string): string {
  return text.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

/**
 * Pluralize word based on count
 *
 * @param word - Singular word
 * @param count - Count to determine plural
 * @param pluralForm - Custom plural form (optional)
 * @returns Pluralized word
 *
 * @example
 * pluralize('item', 1); // "item"
 * pluralize('item', 5); // "items"
 */
export function pluralize(
  word: string,
  count: number,
  pluralForm?: string
): string {
  if (count === 1) return word;
  return pluralForm || `${word}s`;
}

/**
 * Format county name for display
 *
 * @param countyCode - County code (e.g., "benton")
 * @returns Formatted county name (e.g., "Benton County, WA")
 *
 * @example
 * formatCountyName('benton'); // "Benton County, WA"
 */
export function formatCountyName(countyCode: string): string {
  return `${titleCase(countyCode)} County, WA`;
}

/**
 * Format parcel ID for display
 *
 * @param parcelId - Raw parcel ID
 * @returns Formatted parcel ID
 *
 * @example
 * formatParcelId('1234567890'); // "123-456-7890"
 */
export function formatParcelId(parcelId: string): string {
  const cleaned = parcelId.replace(/\D/g, '');

  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  return parcelId;
}

/**
 * Format assessment accuracy to percentage
 *
 * @param accuracy - Accuracy value (0.999 = 99.9%)
 * @returns Formatted accuracy string
 *
 * @example
 * formatAccuracy(0.999); // "99.90%"
 */
export function formatAccuracy(accuracy: number): string {
  return formatPercent(accuracy, 2);
}

/**
 * Format AI agent count
 *
 * @param count - Agent count
 * @returns Formatted agent count string
 *
 * @example
 * formatAgentCount(50000); // "50,000 Agents"
 */
export function formatAgentCount(count: number): string {
  return `${formatNumber(count)} ${pluralize('Agent', count)}`;
}

/**
 * Format quantum optimization factor
 *
 * @param factor - Optimization factor
 * @returns Formatted factor string
 *
 * @example
 * formatQuantumFactor(949); // "949x Quantum Optimization"
 */
export function formatQuantumFactor(factor: number): string {
  return `${factor}x Quantum Optimization`;
}

/**
 * Strip HTML tags from string
 *
 * @param html - HTML string
 * @returns Plain text
 *
 * @example
 * stripHtml('<p>Hello <strong>World</strong></p>'); // "Hello World"
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Escape HTML special characters
 *
 * @param text - Text to escape
 * @returns Escaped HTML
 *
 * @example
 * escapeHtml('<script>alert("XSS")</script>'); // "&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;"
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };

  return text.replace(/[&<>"']/g, (char) => map[char]);
}
