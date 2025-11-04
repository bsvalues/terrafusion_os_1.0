/**
 * TerraFusionPro Shared Utility Module
 * 
 * This module exports shared utilities and helper functions
 * that are used across multiple services in the platform.
 */

/**
 * Format a number as currency
 * @param {number} amount - The amount to format
 * @param {string} locale - The locale to use for formatting (default: 'en-US')
 * @param {string} currency - The currency code (default: 'USD')
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount, locale = 'en-US', currency = 'USD') => {
  if (amount === null || amount === undefined) {
    return '';
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount);
};

/**
 * Format a date to local date string
 * @param {Date|string} date - The date to format
 * @param {string} locale - The locale to use for formatting (default: 'en-US')
 * @returns {string} - Formatted date string
 */
export const formatDate = (date, locale = 'en-US') => {
  if (!date) {
    return '';
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format a date to local date and time string
 * @param {Date|string} date - The date to format
 * @param {string} locale - The locale to use for formatting (default: 'en-US')
 * @returns {string} - Formatted date and time string
 */
export const formatDateTime = (date, locale = 'en-US') => {
  if (!date) {
    return '';
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  });
};

/**
 * Validate an email address
 * @param {string} email - The email to validate
 * @returns {boolean} - Whether the email is valid
 */
export const validateEmail = (email) => {
  if (!email) {
    return false;
  }
  
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).toLowerCase());
};

/**
 * Validate a US zip code
 * @param {string} zipCode - The zip code to validate
 * @returns {boolean} - Whether the zip code is valid
 */
export const validateZipCode = (zipCode) => {
  if (!zipCode) {
    return false;
  }
  
  const re = /^\d{5}(-\d{4})?$/;
  return re.test(String(zipCode));
};

/**
 * Validate a phone number
 * @param {string} phone - The phone number to validate
 * @returns {boolean} - Whether the phone number is valid
 */
export const validatePhone = (phone) => {
  if (!phone) {
    return false;
  }
  
  // Simple validation for US phone numbers
  // Accepts formats: (123) 456-7890, 123-456-7890, 1234567890
  const re = /^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
  return re.test(String(phone));
};

/**
 * Generate a unique ID
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} - Unique ID
 */
export const generateUniqueId = (prefix = '') => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${prefix}${timestamp}-${randomStr}`;
};

/**
 * Truncate a string to a maximum length with ellipsis
 * @param {string} str - The string to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} - Truncated string
 */
export const truncateString = (str, maxLength = 100) => {
  if (!str || str.length <= maxLength) {
    return str;
  }
  
  return str.substring(0, maxLength) + '...';
};

/**
 * Calculate the time difference between two dates in a human-readable format
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date (defaults to now)
 * @returns {string} - Human-readable time difference
 */
export const timeAgo = (startDate, endDate = new Date()) => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  const seconds = Math.floor((end - start) / 1000);
  
  if (seconds < 60) {
    return 'just now';
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  
  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
  
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} month${months !== 1 ? 's' : ''} ago`;
  }
  
  const years = Math.floor(months / 12);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
};

export default {
  formatCurrency,
  formatDate,
  formatDateTime,
  validateEmail,
  validateZipCode,
  validatePhone,
  generateUniqueId,
  truncateString,
  timeAgo
};