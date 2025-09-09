// Professional-grade data import utilities for seamless influencer onboarding

export interface ComprehensiveImportResult {
  // Platform identification
  platform: string;
  platformUserId: string;
  
  // Basic profile data
  displayName: string;
  username: string;
  handle?: string;
  profileImageUrl: string;
  bannerImageUrl?: string;
  bio: string;
  
  // Metrics
  followerCount: number;
  followingCount?: number;
  postCount: number;
  totalViews?: number;
  
  // Engagement analytics
  engagementRate: number;
  averageLikes?: number;
  averageComments?: number;
  averageShares?: number;
  
  // Geographic and demographic data
  country?: string;
  primaryLanguage?: string;
  categories?: string[];
  
  // Platform URLs
  profileUrl: string;
  verificationStatus: boolean;
  
  // Timestamps
  accountCreatedAt: string;
  lastPostDate?: string;
  
  // Content insights
  topPerformingContent?: Array<{
    id: string;
    title: string;
    url: string;
    views: number;
    likes: number;
    comments: number;
    publishedAt: string;
  }>;
  
  // Additional metadata
  keywords?: string[];
  collaborationHistory?: Array<{
    brand: string;
    campaignType: string;
    year: number;
  }>;
}

/**
 * Industry-standard data validation for imported social media profiles
 */
export function validateImportedData(data: Partial<ComprehensiveImportResult>): string[] {
  const errors: string[] = [];
  
  // Required fields validation
  if (!data.displayName || data.displayName.trim().length === 0) {
    errors.push("Display name is required");
  }
  
  if (!data.followerCount || data.followerCount < 0) {
    errors.push("Valid follower count is required");
  }
  
  if (!data.profileImageUrl || !isValidUrl(data.profileImageUrl)) {
    errors.push("Valid profile image URL is required");
  }
  
  if (!data.profileUrl || !isValidUrl(data.profileUrl)) {
    errors.push("Valid profile URL is required");
  }
  
  // Business rules validation
  if (data.followerCount && data.followerCount > 0 && (!data.engagementRate || data.engagementRate <= 0)) {
    errors.push("Engagement rate should be positive for accounts with followers");
  }
  
  if (data.followingCount && data.followerCount && data.followingCount > data.followerCount * 10) {
    errors.push("Following count seems unusually high compared to followers");
  }
  
  return errors;
}

/**
 * Calculate professional engagement metrics
 */
export function calculateEngagementMetrics(recentPosts: Array<{
  likes: number;
  comments: number;
  shares?: number;
  views: number;
}>, followerCount: number): {
  engagementRate: number;
  averageLikes: number;
  averageComments: number;
  viewsToFollowersRatio: number;
} {
  if (recentPosts.length === 0 || followerCount === 0) {
    return {
      engagementRate: 0,
      averageLikes: 0,
      averageComments: 0,
      viewsToFollowersRatio: 0,
    };
  }
  
  const totalLikes = recentPosts.reduce((sum, post) => sum + post.likes, 0);
  const totalComments = recentPosts.reduce((sum, post) => sum + post.comments, 0);
  const totalViews = recentPosts.reduce((sum, post) => sum + post.views, 0);
  const totalEngagement = totalLikes + totalComments + (recentPosts.reduce((sum, post) => sum + (post.shares || 0), 0));
  
  return {
    engagementRate: Math.round(((totalEngagement / recentPosts.length) / followerCount) * 10000) / 100, // 2 decimal places
    averageLikes: Math.round(totalLikes / recentPosts.length),
    averageComments: Math.round(totalComments / recentPosts.length),
    viewsToFollowersRatio: Math.round((totalViews / recentPosts.length / followerCount) * 100) / 100,
  };
}

/**
 * Detect content categories from bio and recent posts
 */
export function detectContentCategories(bio: string, recentTitles: string[]): string[] {
  const categories: { [key: string]: string[] } = {
    'Fashion': ['fashion', 'style', 'outfit', 'clothing', 'designer', 'trend', 'ootd', 'wardrobe'],
    'Beauty': ['beauty', 'makeup', 'skincare', 'cosmetics', 'hair', 'nails', 'glam', 'tutorial'],
    'Fitness': ['fitness', 'workout', 'gym', 'health', 'exercise', 'training', 'yoga', 'nutrition'],
    'Technology': ['tech', 'technology', 'gadget', 'software', 'app', 'coding', 'ai', 'review'],
    'Gaming': ['gaming', 'game', 'esports', 'stream', 'console', 'pc', 'mobile', 'gameplay'],
    'Food': ['food', 'recipe', 'cooking', 'chef', 'restaurant', 'meal', 'cuisine', 'kitchen'],
    'Travel': ['travel', 'trip', 'vacation', 'adventure', 'explore', 'destination', 'journey'],
    'Lifestyle': ['lifestyle', 'daily', 'routine', 'home', 'decor', 'family', 'personal', 'vlog'],
    'Business': ['business', 'entrepreneur', 'startup', 'marketing', 'finance', 'career', 'professional'],
    'Education': ['education', 'learn', 'tutorial', 'teach', 'study', 'knowledge', 'school', 'course'],
  };
  
  const allText = (bio + ' ' + recentTitles.join(' ')).toLowerCase();
  const detectedCategories: string[] = [];
  
  Object.entries(categories).forEach(([category, keywords]) => {
    const matchCount = keywords.filter(keyword => allText.includes(keyword)).length;
    if (matchCount >= 2) { // Require at least 2 keyword matches
      detectedCategories.push(category);
    }
  });
  
  return detectedCategories.slice(0, 5); // Limit to top 5 categories
}

/**
 * Professional data sanitization for imported content
 */
export function sanitizeImportedData(data: Partial<ComprehensiveImportResult>): ComprehensiveImportResult {
  return {
    platform: data.platform || 'unknown',
    platformUserId: data.platformUserId || '',
    displayName: sanitizeText(data.displayName || ''),
    username: sanitizeUsername(data.username || ''),
    handle: data.handle ? sanitizeUsername(data.handle) : undefined,
    profileImageUrl: data.profileImageUrl || '',
    bannerImageUrl: data.bannerImageUrl,
    bio: sanitizeText(data.bio || ''),
    followerCount: Math.max(0, data.followerCount || 0),
    followingCount: data.followingCount ? Math.max(0, data.followingCount) : undefined,
    postCount: Math.max(0, data.postCount || 0),
    totalViews: data.totalViews ? Math.max(0, data.totalViews) : undefined,
    engagementRate: Math.max(0, Math.min(100, data.engagementRate || 0)),
    averageLikes: data.averageLikes ? Math.max(0, data.averageLikes) : undefined,
    averageComments: data.averageComments ? Math.max(0, data.averageComments) : undefined,
    averageShares: data.averageShares ? Math.max(0, data.averageShares) : undefined,
    country: data.country,
    primaryLanguage: data.primaryLanguage,
    categories: data.categories || [],
    profileUrl: data.profileUrl || '',
    verificationStatus: Boolean(data.verificationStatus),
    accountCreatedAt: data.accountCreatedAt || new Date().toISOString(),
    lastPostDate: data.lastPostDate,
    topPerformingContent: data.topPerformingContent || [],
    keywords: data.keywords || [],
    collaborationHistory: data.collaborationHistory || [],
  };
}

// Helper functions
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function sanitizeText(text: string): string {
  return text.trim().replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
}

function sanitizeUsername(username: string): string {
  return username.trim().replace(/[^a-zA-Z0-9._@-]/g, '');
}

/**
 * Industry-standard rate limiting for API calls
 */
export class RateLimiter {
  private calls: number[] = [];
  
  constructor(private maxCalls: number, private windowMs: number) {}
  
  async waitForSlot(): Promise<void> {
    const now = Date.now();
    this.calls = this.calls.filter(time => now - time < this.windowMs);
    
    if (this.calls.length >= this.maxCalls) {
      const oldestCall = this.calls[0];
      const waitTime = this.windowMs - (now - oldestCall);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.waitForSlot();
    }
    
    this.calls.push(now);
  }
}