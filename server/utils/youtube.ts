// YouTube data extraction utilities

interface YouTubeChannelData {
  channelId: string;
  title: string;
  description: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  thumbnailUrl: string;
  bannerImageUrl?: string;
  customUrl?: string;
  handle?: string;
  country?: string;
  publishedAt: string;
  defaultLanguage?: string;
  keywords?: string[];
  unsubscribedTrailer?: string;
  relatedPlaylists?: {
    uploads?: string;
    favorites?: string;
  };
}

interface YouTubeVideoStats {
  videoId: string;
  title: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string;
  thumbnailUrl: string;
}

/**
 * Extract Channel ID from various YouTube URL formats
 */
export function extractChannelId(input: string): string | null {
  const trimmed = input.trim();
  
  // Direct Channel ID (starts with UC and is 24 characters)
  if (/^UC[a-zA-Z0-9_-]{22}$/.test(trimmed)) {
    return trimmed;
  }
  
  // Channel URL patterns
  const patterns = [
    /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/user\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/@([a-zA-Z0-9_-]+)/,
    /youtu\.be\/channel\/([a-zA-Z0-9_-]+)/
  ];
  
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  // Handle @username format
  if (trimmed.startsWith('@')) {
    return trimmed.substring(1);
  }
  
  return trimmed; // Return as-is, might be a custom URL
}

/**
 * Fetch YouTube channel data using YouTube Data API v3
 */
export async function fetchYouTubeChannelData(channelId: string): Promise<YouTubeChannelData | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  
  if (!apiKey) {
    console.error('YouTube API key not configured. Cannot fetch channel data.');
    return null;
  }
  
  try {
    // Get comprehensive channel data with all available parts
    let url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails,status,brandingSettings&id=${channelId}&key=${apiKey}`;
    
    let response = await fetch(url);
    let data = await response.json();
    
    // If no results and channelId might be a custom URL, try forUsername
    if (!data.items || data.items.length === 0) {
      url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails,status,brandingSettings&forUsername=${channelId}&key=${apiKey}`;
      response = await fetch(url);
      data = await response.json();
    }

    // If still no results, try search by handle
    if (!data.items || data.items.length === 0) {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${channelId}&key=${apiKey}`;
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();
      
      if (searchData.items && searchData.items.length > 0) {
        const foundChannelId = searchData.items[0].snippet.channelId;
        url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails,status,brandingSettings&id=${foundChannelId}&key=${apiKey}`;
        response = await fetch(url);
        data = await response.json();
      }
    }
    
    if (!data.items || data.items.length === 0) {
      console.error('YouTube channel not found:', channelId);
      return null;
    }
    
    const channel = data.items[0];
    const snippet = channel.snippet;
    const statistics = channel.statistics;
    
    return {
      channelId: channel.id,
      title: snippet.title,
      description: snippet.description,
      subscriberCount: parseInt(statistics.subscriberCount || '0'),
      videoCount: parseInt(statistics.videoCount || '0'),
      viewCount: parseInt(statistics.viewCount || '0'),
      thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
      bannerImageUrl: snippet.thumbnails?.banner?.url,
      customUrl: snippet.customUrl,
      handle: snippet.customUrl?.startsWith('@') ? snippet.customUrl : undefined,
      country: snippet.country,
      publishedAt: snippet.publishedAt,
      defaultLanguage: snippet.defaultLanguage,
      keywords: snippet.keywords?.split(',').map((k: string) => k.trim()) || [],
      relatedPlaylists: channel.contentDetails?.relatedPlaylists,
    };
  } catch (error) {
    console.error('Error fetching YouTube data:', error);
    return null;
  }
}

/**
 * Fetch recent videos for engagement calculation
 */
export async function fetchRecentVideos(channelId: string, maxResults: number = 10): Promise<YouTubeVideoStats[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  
  if (!apiKey) {
    return [];
  }
  
  try {
    // Get recent uploads
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=${maxResults}&order=date&type=video&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.items) return [];
    
    const videoIds = data.items.map((item: any) => item.id.videoId).join(',');
    
    // Get video statistics
    const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${apiKey}`;
    const statsResponse = await fetch(statsUrl);
    const statsData = await statsResponse.json();
    
    return statsData.items?.map((video: any) => ({
      videoId: video.id,
      title: video.snippet.title,
      viewCount: parseInt(video.statistics.viewCount || '0'),
      likeCount: parseInt(video.statistics.likeCount || '0'),
      commentCount: parseInt(video.statistics.commentCount || '0'),
      publishedAt: video.snippet.publishedAt,
      thumbnailUrl: video.snippet.thumbnails?.medium?.url || '',
    })) || [];
  } catch (error) {
    console.error('Error fetching recent videos:', error);
    return [];
  }
}

/**
 * Calculate engagement rate from recent videos
 */
export function calculateEngagementRate(videos: YouTubeVideoStats[], subscriberCount: number): number {
  if (videos.length === 0 || subscriberCount === 0) return 0;
  
  const totalEngagement = videos.reduce((sum, video) => 
    sum + video.likeCount + video.commentCount, 0
  );
  const totalViews = videos.reduce((sum, video) => sum + video.viewCount, 0);
  
  // Engagement rate = (likes + comments) / views * 100
  const engagementRate = totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;
  return Math.round(engagementRate * 10) / 10; // Round to 1 decimal place
}

/**
 * Generate mock data when API is not available (for development)
 * WARNING: This is development-only mock data and should be replaced with proper error handling in production
 */
function generateMockYouTubeData(channelId: string): YouTubeChannelData {
  console.warn('[DEV MODE] Using mock YouTube data - YouTube API integration needed for production');
  
  // Handle the demo flow fake channel ID
  if (channelId === 'UC_mock_channel_123') {
    return {
      channelId: 'UC_mock_channel_123',
      title: 'Demo Creator Channel',
      description: 'This is a demo channel for testing the import functionality. Real channel data will be imported when you connect your actual YouTube account.',
      subscriberCount: 0, // Don't show fake numbers
      videoCount: 0,
      viewCount: 0,
      thumbnailUrl: 'https://images.unsplash.com/photo-1493612276216-ee3925520721?w=400&h=400&fit=crop&crop=face',
      bannerImageUrl: undefined,
      customUrl: undefined,
      handle: undefined,
      country: undefined,
      publishedAt: new Date().toISOString(),
      defaultLanguage: 'en',
      keywords: ['demo', 'test', 'youtube'],
      relatedPlaylists: undefined,
    };
  }
  
  // Use the actual data for the specific test channel
  if (channelId === 'UCuzTfqPzHAtogrcdEy1oo4w' || channelId.includes('THANK224') || channelId === 'Bubble_0_0') {
    return {
      channelId: 'UCuzTfqPzHAtogrcdEy1oo4w',
      title: 'Bubble_0_0',
      description: '🍪 🔥 cookie run kingdom 🔥 🍪 Welcome to my channel! I create content about cookie run kingdom, gaming tips, and fun gameplay moments. Subscribe for daily gaming content and tutorials!',
      subscriberCount: 565,
      videoCount: 638,
      viewCount: 150000,
      thumbnailUrl: 'https://yt3.ggpht.com/ytc/AIdro_kGzKvJxJpxHF8QOkb4gG-qsxrZxY4oR_Uq3JRZPQ=s88-c-k-c0x00ffffff-no-rj',
      bannerImageUrl: 'https://yt3.googleusercontent.com/banner/sample-banner.jpg',
      customUrl: '@THANK224',
      handle: '@THANK224',
      country: 'US',
      defaultLanguage: 'en',
      keywords: ['cookie run kingdom', 'gaming', 'tutorials', 'gameplay'],
      publishedAt: '2020-01-01T00:00:00Z',
    };
  }
  
  return {
    channelId: channelId,
    title: 'Sample Channel',
    description: 'Sample channel description for demonstration purposes. This channel features various content including tutorials, reviews, and entertainment.',
    subscriberCount: Math.floor(Math.random() * 50000) + 1000,
    videoCount: Math.floor(Math.random() * 500) + 50,
    viewCount: Math.floor(Math.random() * 1000000) + 100000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1494790108755-2616b2e85d64?w=400',
    bannerImageUrl: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=1200',
    customUrl: `@${channelId}`,
    handle: `@${channelId}`,
    country: 'US',
    defaultLanguage: 'en',
    keywords: ['sample', 'content', 'youtube'],
    publishedAt: '2020-01-01T00:00:00Z',
  };
}

/**
 * How to find your YouTube Channel ID guide
 */
export const CHANNEL_ID_HELP = {
  title: "How to find your YouTube Channel ID",
  steps: [
    "Go to your YouTube channel page",
    "Look at the URL - if it shows youtube.com/channel/UC..., that's your Channel ID",
    "If you see youtube.com/@username, click 'View channel' then check the URL",
    "Alternatively, go to YouTube Studio → Settings → Channel → Advanced settings",
    "Your Channel ID will be displayed there"
  ],
  example: "Channel ID format: UCZgYNmEThHQ8ouzB7C7ISBQ (starts with 'UC' and is 24 characters long)"
};