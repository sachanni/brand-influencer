/**
 * Security utilities for input sanitization and XSS protection
 */

/**
 * Sanitizes HTML by escaping dangerous characters
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Sanitizes text input by removing/escaping potentially dangerous characters
 */
export function sanitizeTextInput(input: string, options: {
  maxLength?: number;
  allowNewlines?: boolean;
  allowHtml?: boolean;
} = {}): string {
  if (typeof input !== 'string') {
    return '';
  }

  let sanitized = input.trim();

  // Apply length limits
  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }

  // Remove or escape HTML if not allowed
  if (!options.allowHtml) {
    sanitized = escapeHtml(sanitized);
  }

  // Handle newlines
  if (!options.allowNewlines) {
    sanitized = sanitized.replace(/[\r\n]/g, ' ');
  }

  // Remove null bytes and other control characters
  sanitized = sanitized.replace(/\0/g, '');
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return sanitized;
}

/**
 * Validates and sanitizes a content title
 */
export function sanitizeContentTitle(title: string): string {
  return sanitizeTextInput(title, {
    maxLength: 200,
    allowNewlines: false,
    allowHtml: false
  });
}

/**
 * Validates and sanitizes content description
 */
export function sanitizeContentDescription(description: string): string {
  return sanitizeTextInput(description, {
    maxLength: 1000,
    allowNewlines: true,
    allowHtml: false
  });
}

/**
 * Sanitizes user input for search queries
 */
export function sanitizeSearchQuery(query: string): string {
  return sanitizeTextInput(query, {
    maxLength: 100,
    allowNewlines: false,
    allowHtml: false
  }).replace(/[^\w\s-]/g, ''); // Only allow word characters, spaces, and hyphens
}

/**
 * Rate limiting helper - generates a unique key for rate limiting
 */
export function getRateLimitKey(identifier: string, action: string): string {
  return `rate_limit:${action}:${identifier}`;
}

/**
 * Validates file upload security
 */
export function validateFileUpload(file: File): {
  isValid: boolean;
  error?: string;
  sanitizedName?: string;
} {
  // Check file size (max 200MB for video content)
  if (file.size > 200 * 1024 * 1024) {
    return {
      isValid: false,
      error: 'File size must be less than 200MB'
    };
  }

  // Validate file type
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'application/pdf'
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'File type not allowed. Please upload images, videos, or PDFs only.'
    };
  }

  // Sanitize filename
  const sanitizedName = file.name
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .substring(0, 255); // Limit length

  return {
    isValid: true,
    sanitizedName
  };
}

/**
 * Content Security Policy headers for XSS protection
 */
export const CSP_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "media-src 'self' https: blob:",
    "connect-src 'self' https:",
    "frame-src 'self' https://www.google.com",
    "object-src 'none'",
    "base-uri 'self'"
  ].join('; ')
};

/**
 * Security headers for API responses
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  ...CSP_HEADERS
};

/**
 * Logging helper for security events
 */
export function logSecurityEvent(event: {
  type: 'auth_failure' | 'rate_limit' | 'invalid_input' | 'xss_attempt';
  userId?: string;
  ip?: string;
  userAgent?: string;
  details?: any;
}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: 'SECURITY',
    ...event
  };
  
  // In production, this would go to a secure logging service
  console.warn('[SECURITY]', logEntry);
  
  return logEntry;
}