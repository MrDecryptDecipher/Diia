/**
 * Format a number as currency
 * @param {number} value - The value to format
 * @param {string} currency - The currency code (default: USD)
 * @param {number} decimals - The number of decimal places (default: 2)
 * @returns {string} - The formatted currency string
 */
export const formatCurrency = (value, currency = 'USD', decimals = 2) => {
  if (value === undefined || value === null) return '';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Format a number as percentage
 * @param {number} value - The value to format
 * @param {number} decimals - The number of decimal places (default: 2)
 * @returns {string} - The formatted percentage string
 */
export const formatPercentage = (value, decimals = 2) => {
  if (value === undefined || value === null) return '';
  
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
};

/**
 * Format a number
 * @param {number} value - The value to format
 * @param {number} decimals - The number of decimal places (default: 2)
 * @returns {string} - The formatted number string
 */
export const formatNumber = (value, decimals = 2) => {
  if (value === undefined || value === null) return '';
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Format a large number with abbreviations (K, M, B, T)
 * @param {number} value - The value to format
 * @param {number} decimals - The number of decimal places (default: 2)
 * @returns {string} - The formatted number string with abbreviation
 */
export const formatLargeNumber = (value, decimals = 2) => {
  if (value === undefined || value === null) return '';
  
  const absValue = Math.abs(value);
  
  if (absValue >= 1e12) {
    return `${formatNumber(value / 1e12, decimals)}T`;
  } else if (absValue >= 1e9) {
    return `${formatNumber(value / 1e9, decimals)}B`;
  } else if (absValue >= 1e6) {
    return `${formatNumber(value / 1e6, decimals)}M`;
  } else if (absValue >= 1e3) {
    return `${formatNumber(value / 1e3, decimals)}K`;
  } else {
    return formatNumber(value, decimals);
  }
};

/**
 * Format a date
 * @param {string|Date} date - The date to format
 * @param {string} format - The format to use (default: 'short')
 * @returns {string} - The formatted date string
 */
export const formatDate = (date, format = 'short') => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  switch (format) {
    case 'short':
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(dateObj);
    case 'long':
      return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(dateObj);
    case 'datetime':
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true,
      }).format(dateObj);
    case 'time':
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true,
      }).format(dateObj);
    case 'relative':
      return formatRelativeTime(dateObj);
    default:
      return new Intl.DateTimeFormat('en-US').format(dateObj);
  }
};

/**
 * Format a date as relative time (e.g., "2 hours ago")
 * @param {string|Date} date - The date to format
 * @returns {string} - The formatted relative time string
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now - dateObj;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffMonth / 12);
  
  if (diffSec < 60) {
    return diffSec === 1 ? '1 second ago' : `${diffSec} seconds ago`;
  } else if (diffMin < 60) {
    return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
  } else if (diffHour < 24) {
    return diffHour === 1 ? '1 hour ago' : `${diffHour} hours ago`;
  } else if (diffDay < 30) {
    return diffDay === 1 ? '1 day ago' : `${diffDay} days ago`;
  } else if (diffMonth < 12) {
    return diffMonth === 1 ? '1 month ago' : `${diffMonth} months ago`;
  } else {
    return diffYear === 1 ? '1 year ago' : `${diffYear} years ago`;
  }
};

/**
 * Format a duration in seconds
 * @param {number} seconds - The duration in seconds
 * @param {boolean} short - Whether to use short format (default: false)
 * @returns {string} - The formatted duration string
 */
export const formatDuration = (seconds, short = false) => {
  if (seconds === undefined || seconds === null) return '';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (short) {
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  } else {
    const parts = [];
    
    if (days > 0) {
      parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
    }
    
    if (hours > 0) {
      parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
    }
    
    if (minutes > 0) {
      parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
    }
    
    if (secs > 0 || parts.length === 0) {
      parts.push(`${secs} ${secs === 1 ? 'second' : 'seconds'}`);
    }
    
    return parts.join(', ');
  }
};
