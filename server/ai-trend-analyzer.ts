import OpenAI from "openai";
import { storage } from "./storage.js";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface TrendAnalysisInput {
  userId: string;
  platform: string;
  timeframe: 'weekly' | 'monthly' | 'quarterly';
}

export interface TrendPrediction {
  id: string;
  platform: string;
  trend: string;
  confidence: number;
  timeframe: string;
  predictedGrowth: number;
  contentSuggestions: string[];
  hashtagRecommendations: string[];
  bestPostTimes: string[];
  targetAudience: string;
  reasoning: string;
}

export interface ContentPerformanceData {
  platform: string;
  contentType: string;
  engagement: number;
  reach: number;
  impressions: number;
  publishedAt: string;
  categories: string[];
}

export class AITrendAnalyzer {
  
  /**
   * Analyzes user's content performance and generates AI-powered trend predictions
   */
  async analyzeTrends(input: TrendAnalysisInput): Promise<TrendPrediction[]> {
    try {
      // 1. Gather user's performance data
      const userData = await this.gatherUserData(input.userId, input.platform);
      
      // 2. Get market trends context
      const marketContext = await this.getMarketContext(input.platform);
      
      // 3. Generate AI analysis
      let aiAnalysis;
      try {
        aiAnalysis = await this.generateAIAnalysis(userData, marketContext, input);
      } catch (apiError: any) {
        console.error('OpenAI API error:', apiError);
        // If quota exceeded or API unavailable, use fallback analysis
        if (apiError.code === 'insufficient_quota' || apiError.status === 429) {
          aiAnalysis = this.generateFallbackAnalysis(userData, marketContext, input);
        } else {
          throw apiError;
        }
      }
      
      // 4. Process and structure predictions
      const predictions = await this.processAIPredictions(aiAnalysis, input);
      
      // 5. Store predictions in database
      await this.storePredictions(predictions, input.userId);
      
      return predictions;
      
    } catch (error) {
      console.error('Trend analysis failed:', error);
      throw new Error('Failed to analyze trends. Please try again.');
    }
  }

  /**
   * Gathers comprehensive user performance data
   */
  private async gatherUserData(userId: string, platform: string) {
    const [
      socialAccounts,
      portfolioContent,
      milestones,
      categories,
      collaborations
    ] = await Promise.all([
      storage.getSocialAccounts(userId),
      storage.getPortfolioContent(userId, platform),
      storage.getPerformanceMilestones(userId),
      storage.getContentCategories(userId),
      storage.getBrandCollaborations(userId)
    ]);

    const platformAccount = socialAccounts.find(acc => acc.platform === platform);
    
    return {
      profile: {
        platform,
        followers: platformAccount?.followerCount || 0,
        engagement: platformAccount?.engagementRate || 0,
        verified: (platformAccount as any)?.verified || false,
        categories: categories.map(c => c.category)
      },
      content: portfolioContent.map(content => ({
        type: (content as any).contentType || 'post',
        engagement: parseFloat(content.engagementRate?.toString() || '0'),
        reach: (content as any).reach || 0,
        impressions: (content as any).impressions || 0,
        publishedAt: content.publishedAt?.toISOString(),
        category: (content as any).category || 'general',
        performance: (content as any).performance || {}
      })),
      milestones: milestones.map(m => ({
        type: m.milestoneType || 'general',
        value: (m as any).currentValue || m.threshold,
        target: (m as any).targetValue || m.threshold,
        progress: (m as any).progress || 100,
        achievedAt: m.achievedAt?.toISOString()
      })),
      collaborations: collaborations.map(c => ({
        brand: c.brandName,
        type: c.campaignType,
        reach: c.totalReach,
        engagement: c.totalEngagement,
        status: c.status
      }))
    };
  }

  /**
   * Gets current market context and trends
   */
  private async getMarketContext(platform: string) {
    // In a real implementation, this would fetch from external APIs
    // For now, we'll provide general market insights
    const marketInsights = {
      instagram: {
        trending_formats: ['Reels', 'Carousel posts', 'Stories with polls'],
        popular_categories: ['Lifestyle', 'Fashion', 'Food', 'Travel', 'Tech'],
        peak_engagement_times: ['6-9 AM', '12-2 PM', '7-9 PM'],
        trending_hashtags: ['#contentcreator', '#lifestyle', '#trending', '#viral'],
        algorithmic_preferences: ['High engagement rate', 'Quick saves', 'Comments', 'Shares']
      },
      tiktok: {
        trending_formats: ['Short videos', 'Duets', 'Trends', 'Challenges'],
        popular_categories: ['Entertainment', 'Dance', 'Comedy', 'Education', 'Lifestyle'],
        peak_engagement_times: ['6-10 AM', '7-9 PM'],
        trending_hashtags: ['#fyp', '#trending', '#viral', '#challenge'],
        algorithmic_preferences: ['Watch time', 'Completion rate', 'Engagement', 'Shares']
      },
      youtube: {
        trending_formats: ['Long-form videos', 'Shorts', 'Live streams', 'Tutorials'],
        popular_categories: ['Education', 'Entertainment', 'Gaming', 'Lifestyle', 'Tech'],
        peak_engagement_times: ['12-3 PM', '7-10 PM'],
        trending_hashtags: ['#youtube', '#tutorial', '#review', '#entertainment'],
        algorithmic_preferences: ['Watch time', 'Click-through rate', 'Engagement', 'Subscriptions']
      }
    };

    return marketInsights[platform.toLowerCase() as keyof typeof marketInsights] || marketInsights.instagram;
  }

  /**
   * Generates AI analysis using OpenAI
   */
  private async generateAIAnalysis(userData: any, marketContext: any, input: TrendAnalysisInput) {
    const prompt = `
As an expert social media trend analyst, analyze the following data and provide detailed trend predictions for ${input.platform} over the next ${input.timeframe}.

USER PROFILE:
- Platform: ${userData.profile.platform}
- Followers: ${userData.profile.followers.toLocaleString()}
- Engagement Rate: ${userData.profile.engagement}%
- Content Categories: ${userData.profile.categories.join(', ')}

RECENT CONTENT PERFORMANCE:
${userData.content.slice(0, 10).map((c: any) => 
  `- ${c.type}: ${c.engagement}% engagement, ${c.reach} reach, Category: ${c.category}`
).join('\n')}

MARKET CONTEXT:
- Trending Formats: ${marketContext.trending_formats.join(', ')}
- Popular Categories: ${marketContext.popular_categories.join(', ')}
- Peak Times: ${marketContext.peak_engagement_times.join(', ')}
- Algorithm Preferences: ${marketContext.algorithmic_preferences.join(', ')}

Please provide a JSON response with exactly this structure:
{
  "predictions": [
    {
      "trend": "Specific trend name",
      "confidence": 0.85,
      "predicted_growth": 25,
      "reasoning": "Detailed explanation of why this trend will grow",
      "content_suggestions": ["Specific content idea 1", "Specific content idea 2", "Specific content idea 3"],
      "hashtag_recommendations": ["#hashtag1", "#hashtag2", "#hashtag3"],
      "best_post_times": ["9:00 AM", "1:00 PM", "7:00 PM"],
      "target_audience": "Specific audience description"
    }
  ],
  "overall_insights": {
    "key_opportunities": ["Opportunity 1", "Opportunity 2"],
    "content_gaps": ["Gap 1", "Gap 2"],
    "optimization_tips": ["Tip 1", "Tip 2"]
  }
}

Focus on actionable, data-driven predictions that align with the user's content style and current performance patterns.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert social media trend analyst. Provide accurate, actionable trend predictions based on data analysis. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  /**
   * Processes AI predictions into structured format
   */
  private async processAIPredictions(aiAnalysis: any, input: TrendAnalysisInput): Promise<TrendPrediction[]> {
    const predictions: TrendPrediction[] = [];
    
    if (aiAnalysis.predictions && Array.isArray(aiAnalysis.predictions)) {
      for (const pred of aiAnalysis.predictions) {
        predictions.push({
          id: `trend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          platform: input.platform,
          trend: pred.trend || 'Emerging Trend',
          confidence: Math.min(Math.max(pred.confidence || 0.5, 0), 1),
          timeframe: input.timeframe,
          predictedGrowth: pred.predicted_growth || 0,
          contentSuggestions: pred.content_suggestions || [],
          hashtagRecommendations: pred.hashtag_recommendations || [],
          bestPostTimes: pred.best_post_times || [],
          targetAudience: pred.target_audience || 'General audience',
          reasoning: pred.reasoning || 'AI-generated prediction based on performance data'
        });
      }
    }

    // Ensure we have at least one prediction
    if (predictions.length === 0) {
      predictions.push({
        id: `trend_${Date.now()}_fallback`,
        platform: input.platform,
        trend: 'Content Optimization',
        confidence: 0.7,
        timeframe: input.timeframe,
        predictedGrowth: 15,
        contentSuggestions: [
          'Focus on high-engagement content formats',
          'Increase posting consistency',
          'Engage more with your audience'
        ],
        hashtagRecommendations: ['#contentcreator', '#growth', '#engagement'],
        bestPostTimes: ['9:00 AM', '1:00 PM', '7:00 PM'],
        targetAudience: 'Your current follower base',
        reasoning: 'Based on general best practices for content optimization'
      });
    }

    return predictions;
  }

  /**
   * Generates fallback analysis when OpenAI API is unavailable
   */
  private generateFallbackAnalysis(userData: any, marketContext: any, input: TrendAnalysisInput) {
    const platform = input.platform.toLowerCase();
    const timeframe = input.timeframe;
    
    // Generate realistic fallback predictions based on market context
    const fallbackPredictions = [
      {
        trend: `${marketContext.trending_formats[0]} Content`,
        confidence: 0.75,
        predicted_growth: 20,
        reasoning: `${marketContext.trending_formats[0]} continues to show strong performance on ${platform}. Based on current algorithm preferences and user engagement patterns.`,
        content_suggestions: [
          `Create ${marketContext.trending_formats[0].toLowerCase()} showcasing your expertise`,
          `Use trending audio/music in your ${marketContext.trending_formats[0].toLowerCase()}`,
          `Collaborate with other creators in ${marketContext.trending_formats[0].toLowerCase()} format`
        ],
        hashtag_recommendations: marketContext.trending_hashtags.slice(0, 3),
        best_post_times: marketContext.peak_engagement_times,
        target_audience: `Your current ${platform} audience interested in ${(userData.profile.categories || []).join(', ') || 'your content niche'}`
      },
      {
        trend: 'Engagement-Focused Content',
        confidence: 0.70,
        predicted_growth: 15,
        reasoning: `Content that drives meaningful engagement is consistently rewarded by ${platform}'s algorithm.`,
        content_suggestions: [
          'Ask questions to encourage comments',
          'Share behind-the-scenes content',
          'Create polls and interactive content'
        ],
        hashtag_recommendations: ['#engagement', '#community', '#interactive'],
        best_post_times: marketContext.peak_engagement_times,
        target_audience: 'Highly engaged followers'
      }
    ];

    return { predictions: fallbackPredictions };
  }

  /**
   * Stores predictions in database
   */
  private async storePredictions(predictions: TrendPrediction[], userId: string) {
    for (const prediction of predictions) {
      try {
        await storage.createTrendPrediction({
          userId,
          platform: prediction.platform,
          trendType: 'topic', // Default to topic type
          keyword: prediction.trend,
          confidence: prediction.confidence,
          timeframe: prediction.timeframe,
          currentVolume: 1000, // Mock current volume
          predictedVolume: Math.round(1000 * (1 + prediction.predictedGrowth / 100)),
          growthRate: prediction.predictedGrowth.toString(),
          contentSuggestions: prediction.contentSuggestions,
          trendScore: Math.round(prediction.confidence * 100),
          peakPrediction: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          recommendedAction: prediction.contentSuggestions[0] || 'Focus on content optimization'
        });
      } catch (error) {
        console.error('Failed to store prediction:', error);
      }
    }
  }

  /**
   * Gets cached trend predictions for a user
   */
  async getCachedPredictions(userId: string, platform?: string): Promise<TrendPrediction[]> {
    const predictions = await storage.getTrendPredictions(userId, platform);
    
    return predictions.map(p => ({
      id: p.id,
      platform: p.platform,
      trend: p.keyword || 'Content Optimization',
      confidence: parseFloat(p.confidence?.toString() || '0.5'),
      timeframe: p.timeframe || 'monthly',
      predictedGrowth: parseFloat(p.growthRate?.toString() || '0'),
      contentSuggestions: p.contentSuggestions || [],
      hashtagRecommendations: ['#trending', '#contentcreator', '#growth'],
      bestPostTimes: ['9:00 AM', '1:00 PM', '7:00 PM'],
      targetAudience: 'Your current follower base',
      reasoning: p.recommendedAction || 'AI-generated prediction based on performance data'
    }));
  }

  /**
   * Quick trend analysis for immediate insights
   */
  async getQuickInsights(userId: string, platform: string): Promise<{
    topTrend: string;
    confidence: number;
    quickTips: string[];
    nextAnalysis: Date;
  }> {
    try {
      const recentPredictions = await this.getCachedPredictions(userId, platform);
      
      if (recentPredictions.length > 0) {
        const topPrediction = recentPredictions.sort((a, b) => b.confidence - a.confidence)[0];
        
        return {
          topTrend: topPrediction.trend,
          confidence: topPrediction.confidence,
          quickTips: topPrediction.contentSuggestions.slice(0, 3),
          nextAnalysis: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        };
      }
      
      // Fallback insights
      return {
        topTrend: 'Content Consistency',
        confidence: 0.8,
        quickTips: [
          'Post regularly to maintain audience engagement',
          'Use trending hashtags relevant to your niche',
          'Engage with your audience through comments and stories'
        ],
        nextAnalysis: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day
      };
      
    } catch (error) {
      console.error('Failed to get quick insights:', error);
      throw new Error('Unable to generate insights');
    }
  }
}

export const aiTrendAnalyzer = new AITrendAnalyzer();