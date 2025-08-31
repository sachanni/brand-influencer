import { z } from 'zod';

// Platform-specific URL patterns
export const URL_PATTERNS = {
  instagram: /^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/(p|tv|reel)\/[A-Za-z0-9_-]+\/?(\?.*)?$/,
  tiktok: /^https?:\/\/(www\.)?tiktok\.com\/@[A-Za-z0-9_.]+\/video\/\d+(\?.*)?$/,
  youtube: /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[A-Za-z0-9_-]+(\?.*)?$/,
  facebook: /^https?:\/\/(www\.)?facebook\.com\/[A-Za-z0-9_.]+\/(posts|videos)\/\d+(\?.*)?$/,
  twitter: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[A-Za-z0-9_]+\/status\/\d+(\?.*)?$/,
  linkedin: /^https?:\/\/(www\.)?linkedin\.com\/(posts|feed)\/[A-Za-z0-9_-]+(\?.*)?$/,
  snapchat: /^https?:\/\/(www\.)?snapchat\.com\/[A-Za-z0-9_.-]+(\?.*)?$/,
  pinterest: /^https?:\/\/(www\.)?pinterest\.com\/pin\/\d+(\?.*)?$/
} as const;

export type Platform = keyof typeof URL_PATTERNS;

export interface URLValidationResult {
  isValid: boolean;
  platform?: Platform;
  error?: string;
  sanitizedUrl?: string;
}

/**
 * Validates and sanitizes a social media post URL
 */
export function validateSocialMediaURL(url: string, expectedPlatform?: Platform): URLValidationResult {
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      error: 'URL is required and must be a string'
    };
  }

  // Basic URL format validation
  let sanitizedUrl: string;
  try {
    // Remove extra whitespace and normalize
    sanitizedUrl = url.trim();
    
    // Add https if no protocol specified
    if (!/^https?:\/\//i.test(sanitizedUrl)) {
      sanitizedUrl = 'https://' + sanitizedUrl;
    }

    // Validate URL format
    const urlObj = new URL(sanitizedUrl);
    
    // Security check: only allow HTTP/HTTPS
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return {
        isValid: false,
        error: 'Only HTTP and HTTPS URLs are allowed'
      };
    }

    // Normalize to HTTPS for security
    sanitizedUrl = sanitizedUrl.replace(/^http:/i, 'https:');
    
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid URL format'
    };
  }

  // Check against platform patterns
  let detectedPlatform: Platform | undefined;
  
  for (const [platform, pattern] of Object.entries(URL_PATTERNS)) {
    if (pattern.test(sanitizedUrl)) {
      detectedPlatform = platform as Platform;
      break;
    }
  }

  if (!detectedPlatform) {
    return {
      isValid: false,
      error: 'URL does not match any supported social media platform format'
    };
  }

  // If expected platform is specified, validate it matches
  if (expectedPlatform && detectedPlatform !== expectedPlatform) {
    return {
      isValid: false,
      error: `Expected ${expectedPlatform} URL, but detected ${detectedPlatform}`
    };
  }

  return {
    isValid: true,
    platform: detectedPlatform,
    sanitizedUrl
  };
}

/**
 * Zod schema for live post URL validation
 */
export const livePostUrlSchema = z.string()
  .trim()
  .min(1, 'URL is required')
  .max(2048, 'URL is too long')
  .refine((url) => {
    const result = validateSocialMediaURL(url);
    return result.isValid;
  }, {
    message: 'Please provide a valid social media post URL'
  })
  .transform((url) => {
    const result = validateSocialMediaURL(url);
    return result.sanitizedUrl || url;
  });

/**
 * Get user-friendly platform name
 */
export function getPlatformDisplayName(platform: Platform): string {
  const names: Record<Platform, string> = {
    instagram: 'Instagram',
    tiktok: 'TikTok',
    youtube: 'YouTube',
    facebook: 'Facebook',
    twitter: 'Twitter/X',
    linkedin: 'LinkedIn',
    snapchat: 'Snapchat',
    pinterest: 'Pinterest'
  };
  
  return names[platform] || platform;
}

/**
 * Get platform-specific URL example
 */
export function getPlatformURLExample(platform: Platform): string {
  const examples: Record<Platform, string> = {
    instagram: 'https://instagram.com/p/ABC123xyz',
    tiktok: 'https://tiktok.com/@username/video/1234567890',
    youtube: 'https://youtube.com/watch?v=ABC123xyz',
    facebook: 'https://facebook.com/username/posts/1234567890',
    twitter: 'https://twitter.com/username/status/1234567890',
    linkedin: 'https://linkedin.com/posts/activity-1234567890',
    snapchat: 'https://snapchat.com/add/username',
    pinterest: 'https://pinterest.com/pin/1234567890'
  };
  
  return examples[platform] || 'https://platform.com/post/123';
}

/**
 * Content-specific validation for different content types
 */
export function validateContentURL(url: string, contentType: string, platform: Platform): URLValidationResult {
  const baseValidation = validateSocialMediaURL(url, platform);
  
  if (!baseValidation.isValid) {
    return baseValidation;
  }

  // Platform-specific content type validation
  switch (platform) {
    case 'instagram':
      if (contentType === 'video' && url.includes('/p/')) {
        // Instagram videos can be posts, but reels are preferred
        // This is just a warning, not an error
      }
      break;
      
    case 'youtube':
      if (contentType === 'video' && !url.includes('watch?v=') && !url.includes('youtu.be/')) {
        return {
          isValid: false,
          error: 'YouTube video URLs should link to a specific video'
        };
      }
      break;
      
    case 'tiktok':
      if (contentType === 'video' && !url.includes('/video/')) {
        return {
          isValid: false,
          error: 'TikTok URLs should link to a specific video'
        };
      }
      break;
  }

  return baseValidation;
}