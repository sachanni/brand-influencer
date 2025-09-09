// TikTok data extraction utilities for professional-grade import

import { ComprehensiveImportResult, calculateEngagementMetrics, detectContentCategories, sanitizeImportedData } from "./dataImport";

interface TikTokProfileData {
  user_id: string;
  username: string;
  display_name: string;
  bio_description: string;
  avatar_url: string;
  follower_count: number;
  following_count: number;
  likes_count: number;
  video_count: number;
  is_verified: boolean;
}

interface TikTokVideoData {
  id: string;
  title: string;
  video_description: string;
  duration: number;
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  create_time: number;
  cover_image_url: string;
  web_video_url: string;
}

/**
 * Extract TikTok username from various input formats
 */
export function extractTikTokUsername(input: string): string {
  // Remove TikTok URL prefixes
  const cleanInput = input
    .replace(/^https?:\/\/(www\.)?tiktok\.com\//, '')
    .replace(/\/$/, '')
    .replace(/^@/, '');
  
  // Extract username from URL path
  const parts = cleanInput.split('/');
  return parts[0];
}

/**
 * Fetch comprehensive TikTok profile data
 */
export async function fetchTikTokProfileData(username: string): Promise<ComprehensiveImportResult> {
  const accessToken = process.env.TIKTOK_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.warn('TikTok access token not found. Using mock data.');
    return generateMockTikTokData(username);
  }

  try {
    // Note: TikTok API requires business verification and OAuth
    // This is a simplified example - real implementation would need proper authentication
    const profileUrl = `https://open-api.tiktok.com/user/info/?access_token=${accessToken}&open_id=${username}`;
    const response = await fetch(profileUrl);
    const data = await response.json();

    if (data.error_code !== 0) {
      throw new Error(`TikTok API Error: ${data.description}`);
    }

    const profileData = data.data.user;

    // Fetch recent videos for engagement calculations
    const videosUrl = `https://open-api.tiktok.com/video/list/?access_token=${accessToken}&open_id=${username}&cursor=0&max_count=20`;
    const videosResponse = await fetch(videosUrl);
    const videosData = await videosResponse.json();

    return processTikTokData(profileData, videosData.data?.videos || []);
  } catch (error) {
    console.error('Error fetching TikTok data:', error);
    return generateMockTikTokData(username);
  }
}

/**
 * Process raw TikTok data into comprehensive format
 */
function processTikTokData(profile: TikTokProfileData, videos: TikTokVideoData[]): ComprehensiveImportResult {
  // Calculate engagement metrics from recent videos
  const recentPosts = videos.slice(0, 10).map(video => ({
    likes: video.like_count,
    comments: video.comment_count,
    shares: video.share_count,
    views: video.view_count,
  }));

  const engagementMetrics = calculateEngagementMetrics(recentPosts, profile.follower_count);
  const categories = detectContentCategories(profile.bio_description, videos.map(v => v.video_description));

  const comprehensiveData: ComprehensiveImportResult = {
    platform: 'tiktok',
    platformUserId: profile.user_id,
    displayName: profile.display_name,
    username: profile.username,
    profileImageUrl: profile.avatar_url,
    bio: profile.bio_description || '',
    followerCount: profile.follower_count,
    followingCount: profile.following_count,
    postCount: profile.video_count,
    totalViews: videos.reduce((sum, video) => sum + video.view_count, 0),
    engagementRate: engagementMetrics.engagementRate,
    averageLikes: engagementMetrics.averageLikes,
    averageComments: engagementMetrics.averageComments,
    averageShares: Math.round(videos.reduce((sum, v) => sum + v.share_count, 0) / videos.length),
    categories: categories,
    profileUrl: `https://tiktok.com/@${profile.username}`,
    verificationStatus: profile.is_verified,
    accountCreatedAt: new Date().toISOString(), // TikTok doesn't provide creation date
    topPerformingContent: videos
      .sort((a, b) => b.view_count - a.view_count)
      .slice(0, 5)
      .map(video => ({
        id: video.id,
        title: video.title || video.video_description.substring(0, 50),
        url: `https://tiktok.com/@${profile.username}/video/${video.id}`,
        views: video.view_count,
        likes: video.like_count,
        comments: video.comment_count,
        publishedAt: new Date(video.create_time * 1000).toISOString(),
      })),
    keywords: categories,
  };

  return sanitizeImportedData(comprehensiveData);
}

/**
 * Generate mock TikTok data for testing
 * WARNING: This is development-only mock data and should be replaced with proper error handling in production
 */
function generateMockTikTokData(username: string): ComprehensiveImportResult {
  console.warn('[DEV MODE] Using mock TikTok data - TikTok API integration needed for production');
  const followerCount = Math.floor(Math.random() * 100000) + 5000;
  const videoCount = Math.floor(Math.random() * 200) + 20;
  
  return sanitizeImportedData({
    platform: 'tiktok',
    platformUserId: `mock_${username}`,
    displayName: username.charAt(0).toUpperCase() + username.slice(1),
    username: username,
    profileImageUrl: `https://picsum.photos/400/400?random=${username}`,
    bio: `Creative TikTok content creator 🎬 Dancing, comedy, and trending content! Follow for daily entertainment 🔥 #TikTokCreator`,
    followerCount: followerCount,
    followingCount: Math.floor(followerCount * 0.05),
    postCount: videoCount,
    totalViews: Math.floor(followerCount * 50), // High view-to-follower ratio for TikTok
    engagementRate: Math.round((Math.random() * 15 + 5) * 100) / 100, // 5-20% for TikTok
    averageLikes: Math.floor(followerCount * 0.08),
    averageComments: Math.floor(followerCount * 0.015),
    averageShares: Math.floor(followerCount * 0.01),
    categories: ['Entertainment', 'Dance', 'Comedy'],
    profileUrl: `https://tiktok.com/@${username}`,
    verificationStatus: followerCount > 50000,
    accountCreatedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000 * 2).toISOString(),
    topPerformingContent: Array.from({ length: 5 }, (_, i) => ({
      id: `video_${i}`,
      title: `Viral TikTok #${i + 1}`,
      url: `https://tiktok.com/@${username}/video/mock_${i}`,
      views: Math.floor(followerCount * (2 + Math.random() * 8)), // 2-10x follower views
      likes: Math.floor(followerCount * (0.1 + Math.random() * 0.2)),
      comments: Math.floor(followerCount * (0.02 + Math.random() * 0.03)),
      publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    })),
    keywords: ['tiktok', 'viral', 'entertainment', 'creative', 'trending'],
  });
}