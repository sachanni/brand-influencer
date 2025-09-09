import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Star, ExternalLink, Play, Heart, MessageCircle, Share, Eye, Upload, TrendingUp, Users, BarChart3, Activity } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { InfluencerNav } from "@/components/InfluencerNav";
import { Navigation } from "@/components/layout/navigation";

export default function InfluencerPortfolio() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [showAllContent, setShowAllContent] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Fetch real portfolio content from database
  const { data: portfolioData, isLoading: portfolioLoading } = useQuery({
    queryKey: ['/api/portfolio'],
    enabled: isAuthenticated,
  });

  // Fetch brand testimonials
  const { data: testimonialsData, isLoading: testimonialsLoading } = useQuery({
    queryKey: ['/api/brand-testimonials'],
    enabled: isAuthenticated,
  });

  // Fetch brand collaborations
  const { data: collaborationsData, isLoading: collaborationsLoading } = useQuery({
    queryKey: ['/api/brand-collaborations'],
    enabled: isAuthenticated,
  });

  // Fetch cross-platform analytics
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/cross-platform-analytics'],
    enabled: isAuthenticated,
  });

  const allContent = (portfolioData as any)?.content || [];
  const testimonials = (testimonialsData as any)?.testimonials || [];
  const collaborations = (collaborationsData as any)?.collaborations || [];
  const analytics = (analyticsData as any)?.analytics || null;
  
  // Calculate average views and engagement for determining high performance
  const avgViews = allContent.reduce((sum: number, c: any) => sum + (c.views || 0), 0) / (allContent.length || 1);
  const avgEngagement = allContent.reduce((sum: number, c: any) => sum + parseFloat(c.engagementRate || '0'), 0) / (allContent.length || 1);
  
  // Mark content as high-performing if it exceeds average by 50% or has high absolute metrics
  const contentWithPerformance = allContent.map((content: any) => ({
    ...content,
    isHighPerforming: content.isHighPerforming || 
      (content.views > avgViews * 1.5) || 
      (parseFloat(content.engagementRate || '0') > avgEngagement * 1.5) ||
      (content.views > 10000) || 
      (parseFloat(content.engagementRate || '0') > 5)
  }));
  
  // Sort by performance (high-performing videos first, then by views)
  const sortedContent = [...contentWithPerformance].sort((a, b) => {
    if (a.isHighPerforming && !b.isHighPerforming) return -1;
    if (!a.isHighPerforming && b.isHighPerforming) return 1;
    return (b.views || 0) - (a.views || 0);
  });

  // Featured content - top 3 videos (high-performing or highest views)
  const featuredContent = sortedContent
    .slice(0, 3)
    .map(content => ({
      id: content.id,
      platform: content.platform,
      type: content.contentType,
      image: content.thumbnailUrl,
      caption: content.title || content.description,
      likes: content.likes || 0,
      comments: content.comments || 0,
      views: content.views || 0,
      engagement: `${content.engagementRate}%`,
      mediaUrl: content.url,
      uploadDate: content.publishedAt // Use the actual social media publish date
    }));

  // Recent content - show top 6 or all based on state
  const displayedContent = showAllContent ? sortedContent : sortedContent.slice(0, 6);

  if (isLoading || portfolioLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please log in to access your portfolio.</div>;
  }



  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <img
              src={(user as any)?.profileImageUrl || "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"}
              alt="Profile"
              className="w-16 h-16 rounded-full border-2 border-brand-teal"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{(user as any)?.firstName || 'User'} - Portfolio</h1>
              <p className="text-gray-600">{(user as any)?.bio || (user as any)?.categories?.join(' • ') || 'Content Creator'}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/profile-import">
              <Button variant="outline" className="text-brand-teal border-brand-teal hover:bg-brand-teal hover:text-white">
                <ExternalLink className="h-4 w-4 mr-2" />
                Import Social Media
              </Button>
            </Link>
            <Button className="bg-brand-teal hover:bg-brand-teal/90">
              Edit Profile
            </Button>
          </div>
        </div>

        <InfluencerNav />

        {/* Cross-Platform Analytics Dashboard */}
        {analytics && analytics.platformStats && analytics.platformStats.length > 0 && (
          <div className="space-y-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="h-6 w-6 text-brand-teal" />
              <h2 className="text-2xl font-bold text-gray-900">Cross-Platform Analytics</h2>
            </div>

            {/* Unified Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="h-8 w-8 text-brand-teal mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {(analytics.unifiedMetrics.totalFollowers || 0).toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600">Total Followers</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <Eye className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {(analytics.unifiedMetrics.totalReach || 0).toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600">Total Reach</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <Activity className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {(analytics.unifiedMetrics.totalEngagement || 0).toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600">Total Engagement</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {(analytics.unifiedMetrics.averageEngagementRate || 0).toFixed(1)}%
                  </div>
                  <p className="text-sm text-gray-600">Avg Engagement Rate</p>
                </CardContent>
              </Card>
            </div>

            {/* Platform Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Platform Performance Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.platformComparison.map((platform: any, index: number) => (
                    <div key={platform.platform} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge className={`${
                            platform.platform === 'Youtube' ? 'bg-red-500' : 
                            platform.platform === 'Instagram' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                            platform.platform === 'Tiktok' ? 'bg-black' :
                            'bg-brand-teal'
                          } text-white`}>
                            {platform.platform}
                          </Badge>
                          <span className="font-medium">{platform.performance.followersPercentage}% of total audience</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold">{platform.performance.engagementRate}% engagement</div>
                          <div className="text-xs text-gray-600">
                            {platform.performance.avgViewsPerPost.toLocaleString()} avg views
                          </div>
                        </div>
                      </div>
                      
                      {/* Visual progress bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            platform.platform === 'Youtube' ? 'bg-red-500' : 
                            platform.platform === 'Instagram' ? 'bg-purple-500' :
                            platform.platform === 'Tiktok' ? 'bg-gray-900' :
                            'bg-brand-teal'
                          }`}
                          style={{ width: `${platform.performance.followersPercentage}%` }}
                        />
                      </div>
                      
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{platform.performance.contentTypes.posts} posts</span>
                        <span>{platform.performance.contentTypes.totalInteractions.toLocaleString()} interactions</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Content Type Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Content Performance by Platform
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {analytics.contentTypePerformance.map((type: any) => (
                    <div key={type.platform} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{type.platform}</h4>
                        <Badge variant="secondary">{type.count} posts</Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Total Views:</span>
                          <span className="font-medium">{type.totalViews.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total Engagement:</span>
                          <span className="font-medium">{type.totalEngagement.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Avg Engagement Rate:</span>
                          <span className="font-medium text-brand-teal">{type.avgEngagement.toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State for Analytics */}
        {!analyticsLoading && (!analytics || !analytics.platformStats || analytics.platformStats.length === 0) && (
          <Card className="mb-8">
            <CardContent className="p-8 text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cross-Platform Analytics</h3>
              <p className="text-gray-600 mb-4">Import your social media accounts to see comprehensive analytics across all platforms.</p>
              <Link href="/profile-import">
                <Button className="bg-brand-teal hover:bg-brand-teal/90">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Social Media Data
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Featured Content */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Featured Content</CardTitle>
          </CardHeader>
          <CardContent>
            {featuredContent.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredContent.map((content) => (
                  <div key={content.id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="relative">
                      <img
                        src={content.image}
                        alt={content.type}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center group">
                        <Play className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <Badge className={`absolute top-3 left-3 text-white font-medium px-3 py-1 ${
                        content.platform === 'youtube' ? 'bg-red-500' : 
                        content.platform === 'instagram' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                        content.platform === 'tiktok' ? 'bg-black' :
                        'bg-brand-teal'
                      }`}>
                        {content.platform}
                      </Badge>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-gray-600 mb-2">Content</p>
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Heart className="h-4 w-4 text-red-500" />
                            {(Number(content.likes) || 0).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4 text-blue-500" />
                            {(Number(content.comments) || 0).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4 text-gray-500" />
                            {(Number(content.views) || 0).toLocaleString()}
                          </span>
                        </div>
                        <span className="text-brand-teal font-semibold">
                          {content.engagement}
                        </span>
                      </div>
                      {content.uploadDate && (
                        <p className="text-xs text-gray-500">
                          {new Date(content.uploadDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No featured content yet</h3>
                <p className="text-gray-600 mb-4">
                  Import your best performing content from social media to showcase it here.
                </p>
                <Link href="/profile-import">
                  <Button className="bg-brand-teal hover:bg-brand-teal/90">
                    Import Content
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Content */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Recent Content</CardTitle>
            {allContent.length > 6 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-brand-teal hover:text-brand-teal/80"
                onClick={() => setShowAllContent(!showAllContent)}
              >
                {showAllContent ? 'Show Less' : 'View All'}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {displayedContent.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {displayedContent.map((content: any, index: number) => (
                    <div key={content.id || index} className="relative group cursor-pointer">
                    <img
                      src={content.thumbnailUrl || content.image}
                      alt={content.caption || "Recent content"}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                      {content.contentType === 'video' && (
                        <Play className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-lg"></div>
                    <Badge className="absolute bottom-2 left-2 text-xs bg-black bg-opacity-70 text-white capitalize">
                      {content.platform}
                    </Badge>
                    {content.views && (
                      <div className="absolute top-2 right-2 text-xs text-white bg-black bg-opacity-70 px-2 py-1 rounded">
                        <Eye className="h-3 w-3 inline mr-1" />
                        {(content.views >= 1000) ? `${(content.views / 1000).toFixed(1)}K` : content.views}
                      </div>
                    )}
                    </div>
                  ))}
                </div>
                {allContent.length > 6 && !showAllContent && (
                  <div className="text-center pt-4">
                    <p className="text-sm text-gray-600">
                      Showing {Math.min(6, allContent.length)} of {allContent.length} videos
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Eye className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No recent content yet</h3>
                <p className="text-gray-600 mb-4">Import your social media accounts to see your recent posts here</p>
                <Link href="/profile-import">
                  <Button className="bg-brand-teal hover:bg-brand-teal/90">
                    Import Social Media
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Highlights */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Performance Highlights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-brand-teal rounded-lg p-4 text-white text-center">
                <div className="text-2xl font-bold">10.2M</div>
                <div className="text-sm opacity-90">Total Reach</div>
              </div>
              <div className="bg-green-500 rounded-lg p-4 text-white text-center">
                <div className="text-2xl font-bold">8.7%</div>
                <div className="text-sm opacity-90">Avg Engagement</div>
              </div>
              <div className="bg-purple-500 rounded-lg p-4 text-white text-center">
                <div className="text-2xl font-bold">24</div>
                <div className="text-sm opacity-90">Brand Campaigns</div>
              </div>
              <div className="bg-orange-500 rounded-lg p-4 text-white text-center">
                <div className="text-2xl font-bold">97%</div>
                <div className="text-sm opacity-90">Client Satisfaction</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Achievements */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-brand-teal rounded-full"></div>
                  <span className="font-medium">Top 5% Fashion Influencer Ranking on Instagram</span>
                </div>
                <Badge variant="secondary">Q3 2024</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium">Featured on "Influences of Impact" on YouTube</span>
                </div>
                <Badge variant="secondary">September 2024</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="font-medium">Partnership of the Year with StyleCo</span>
                </div>
                <Badge variant="secondary">August 2024</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Brand Testimonials */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Brand Testimonials</CardTitle>
            {testimonials.length > 4 && (
              <Button variant="default" size="sm" className="bg-brand-teal hover:bg-brand-teal/90">
                View All Testimonials
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {testimonialsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="mt-3 h-16 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            ) : testimonials.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {testimonials.slice(0, 4).map((testimonial: any) => (
                  <div key={testimonial.id} className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-brand-teal to-brand-teal/80 rounded-full flex items-center justify-center text-white font-bold">
                        {testimonial.brandName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-3 w-3 ${i < parseFloat(testimonial.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                            />
                          ))}
                          <span className="text-xs text-gray-500 ml-1">{testimonial.rating}</span>
                        </div>
                        <p className="text-sm text-gray-600 italic">"{testimonial.testimonialText}"</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t pt-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{testimonial.brandManagerName}</p>
                        <p className="text-xs text-gray-500">{testimonial.brandManagerTitle || 'Brand Manager'}, {testimonial.brandName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{testimonial.campaignType || 'Campaign ROI'}</p>
                        <p className="text-sm font-bold text-green-600">{testimonial.campaignRoi || testimonial.conversionRate || testimonial.salesImpact || '+240%'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No testimonials yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Complete brand collaborations to receive testimonials and reviews from partners.
                </p>
                <Button 
                  onClick={() => setShowImportModal(true)}
                  className="bg-brand-teal hover:bg-brand-teal/90"
                >
                  Add Sample Brand Data
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Brand Collaborations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Brand Collaborations</CardTitle>
          </CardHeader>
          <CardContent>
            {collaborationsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="border rounded-lg p-4 animate-pulse">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gray-200 rounded" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : collaborations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {collaborations.map((collab: any) => (
                  <div key={collab.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-3">
                      {collab.brandLogo ? (
                        <img 
                          src={collab.brandLogo} 
                          alt={collab.brandName}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-brand-teal to-brand-teal/80 rounded flex items-center justify-center text-white font-bold">
                          {collab.brandName.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{collab.brandName}</h4>
                        <p className="text-xs text-gray-600">{collab.campaignType || 'Campaign'}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                          {collab.posts > 0 && <span>{collab.posts} Posts</span>}
                          {collab.stories > 0 && <span>{collab.stories} Stories</span>}
                          {collab.reels > 0 && <span>{collab.reels} Reels</span>}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <Badge 
                        variant={collab.status === 'completed' ? 'default' : collab.status === 'ongoing' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {collab.status}
                      </Badge>
                      {collab.startDate && (
                        <span className="text-xs text-gray-500 ml-2">
                          {new Date(collab.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
            /* Check for sponsored content from imported videos */
            allContent.filter((content: any) => {
              const caption = (content.caption || '').toLowerCase();
              const brandKeywords = ['sponsored', 'ad', 'partnership', 'collab', 'brand', 'promo', '#ad', '#sponsored', 'campaign'];
              return brandKeywords.some(keyword => caption.includes(keyword));
            }).length > 0 ? (
              <div className="space-y-4">
                <div className="text-sm text-gray-600 mb-4">
                  📊 Brand partnerships detected from your imported content:
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allContent.filter((content: any) => {
                    const caption = (content.caption || '').toLowerCase();
                    const brandKeywords = ['sponsored', 'ad', 'partnership', 'collab', 'brand', 'promo', '#ad', '#sponsored', 'campaign'];
                    return brandKeywords.some(keyword => caption.includes(keyword));
                  }).slice(0, 4).map((content: any, index: number) => (
                    <div key={content.id || index} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <img
                          src={content.thumbnailUrl || content.image}
                          alt={content.caption || "Sponsored content"}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{content.caption}</h4>
                          <p className="text-xs text-gray-600 capitalize">{content.platform} • {content.contentType}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                            <span className="flex items-center">
                              <Eye className="h-3 w-3 mr-1" />
                              {(Number(content.views) || 0).toLocaleString()}
                            </span>
                            <span className="flex items-center">
                              <Heart className="h-3 w-3 mr-1" />
                              {(Number(content.likes) || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-brand-teal border-brand-teal mt-3">
                        Sponsored Content
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="text-center mt-6">
                  <p className="text-sm text-gray-600 mb-4">
                    Found {allContent.filter((content: any) => {
                      const caption = (content.caption || '').toLowerCase();
                      const brandKeywords = ['sponsored', 'ad', 'partnership', 'collab', 'brand', 'promo', '#ad', '#sponsored', 'campaign'];
                      return brandKeywords.some(keyword => caption.includes(keyword));
                    }).length} sponsored content pieces from your imported videos
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Share className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No brand collaborations yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Start creating sponsored content and brand partnerships. Your collaborations will be automatically detected and displayed here.
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <p>• Tag your sponsored content with #ad or #sponsored</p>
                  <p>• Include brand mentions and partnership details</p>
                  <p>• Track performance of your brand collaborations</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      
      {/* Import Brand Data Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Sample Brand Collaboration Data</DialogTitle>
            <DialogDescription>
              Add sample brand testimonials and collaborations to demonstrate the feature. In production, this data would come from HypeAuditor or Upfluence APIs.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Button
              onClick={async () => {
                try {
                  // Add sample testimonials
                  const sampleTestimonials = [
                    {
                      brandName: "BeautyGlow",
                      brandManagerName: "Michael Chen",
                      brandManagerTitle: "Brand Manager",
                      testimonialText: "Sophia exceeded our expectations with her authentic content and professional approach. Our campaign saw a 340% increase in engagement compared to industry standards.",
                      rating: "5.0",
                      campaignRoi: "+340%",
                      campaignType: "Campaign ROI",
                      isVerified: true
                    },
                    {
                      brandName: "StyleCouture",
                      brandManagerName: "Sarah Martinez",
                      brandManagerTitle: "Marketing Director",
                      testimonialText: "Working with Sophia was seamless. Her content quality and audience engagement rates are exceptional. We've already booked her for our next seasonal campaign.",
                      rating: "5.0",
                      conversionRate: "12.8%",
                      campaignType: "Conversion Rate",
                      isVerified: true
                    },
                    {
                      brandName: "LuxeTravel",
                      brandManagerName: "David Kim",
                      brandManagerTitle: "Creative Director",
                      testimonialText: "Sophia's creative vision aligns perfectly with luxury brands. Her aesthetic and storytelling ability helped us reach a premium audience effectively.",
                      rating: "5.0",
                      brandAwareness: "+285%",
                      campaignType: "Brand Awareness",
                      isVerified: true
                    },
                    {
                      brandName: "WellnessPlus",
                      brandManagerName: "Emma Thompson",
                      brandManagerTitle: "Partnership Manager",
                      testimonialText: "Highly professional and delivers beyond expectations. Sophia's content consistently drives sales and brand loyalty. A true partnership success story.",
                      rating: "5.0",
                      salesImpact: "+420%",
                      campaignType: "Sales Impact",
                      isVerified: true
                    }
                  ];

                  // Add sample collaborations
                  const sampleCollaborations = [
                    {
                      brandName: "BeautyGlow",
                      campaignName: "Summer Glow Campaign",
                      campaignType: "Skincare Campaign",
                      status: "completed",
                      posts: 3,
                      stories: 2,
                      reels: 1,
                      totalReach: 250000,
                      totalEngagement: 35000,
                      startDate: new Date('2023-06-01'),
                      endDate: new Date('2023-06-30')
                    },
                    {
                      brandName: "StyleCouture",
                      campaignName: "Fall Fashion Collection",
                      campaignType: "Fashion Campaign",
                      status: "completed",
                      posts: 5,
                      stories: 3,
                      reels: 2,
                      totalReach: 450000,
                      totalEngagement: 62000,
                      startDate: new Date('2023-06-01'),
                      endDate: new Date('2023-06-30')
                    }
                  ];

                  // Add testimonials
                  for (const testimonial of sampleTestimonials) {
                    await apiRequest('/api/brand-testimonials', 'POST', testimonial);
                  }

                  // Add collaborations
                  for (const collaboration of sampleCollaborations) {
                    await apiRequest('/api/brand-collaborations', 'POST', collaboration);
                  }

                  // Refresh data
                  await queryClient.invalidateQueries({ queryKey: ['/api/brand-testimonials'] });
                  await queryClient.invalidateQueries({ queryKey: ['/api/brand-collaborations'] });

                  toast({
                    title: "Success",
                    description: "Sample brand data has been added successfully!",
                  });
                  setShowImportModal(false);
                } catch (error) {
                  console.error('Error adding sample data:', error);
                  toast({
                    title: "Error",
                    description: "Failed to add sample data. Please try again.",
                    variant: "destructive",
                  });
                }
              }}
              className="w-full bg-brand-teal hover:bg-brand-teal/90"
            >
              <Upload className="h-4 w-4 mr-2" />
              Add Sample Testimonials & Collaborations
            </Button>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Integration with Analytics Tools</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• <strong>HypeAuditor:</strong> Visit <a href="https://hypeauditor.com/api" target="_blank" className="text-brand-teal underline">hypeauditor.com/api</a> to get your API key</p>
                <p>• <strong>Upfluence:</strong> Contact Upfluence support for API access</p>
                <p>• <strong>Manual Entry:</strong> You can manually add brand collaborations through the dashboard</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">How It Works</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>1. Brand testimonials showcase feedback from your brand partners</p>
                <p>2. Each testimonial displays ratings, ROI metrics, and verified status</p>
                <p>3. Brand collaborations track your partnership history and performance</p>
                <p>4. Data can be imported from HypeAuditor, Upfluence, or added manually</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}